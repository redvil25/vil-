#!/usr/bin/env python3

"""
Deploy Staging Environment

This script deploys the staging environment to AWS. By default it runs both
Terraform (infrastructure) and Amplify (frontend). Pass 'TerraformOnly' to
deploy just the infrastructure without triggering an Amplify build.

This script:
  1. Loads secrets from infrastructure/environments/staging/.env
  2. Runs terraform init, plan, and apply
  3. Unless TerraformOnly: verifies git is clean and pushed, then triggers
     an Amplify build and polls until complete

Prerequisites:
  - AWS CLI v2 configured with valid credentials
  - Terraform initialized in infrastructure/environments/staging/
  - infrastructure/environments/staging/.env populated with secrets

Usage:
    python scripts/DeployStage.py                # Full deploy (Terraform + Amplify)
    python scripts/DeployStage.py TerraformOnly   # Infrastructure only
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parent.parent
STAGING_DIR = ROOT_DIR / "infrastructure" / "environments" / "staging"
ENV_FILE = STAGING_DIR / ".env"
POLL_INTERVAL_S = 10
BRANCH_NAME = "main"

# Loaded env vars with their original case (Windows uppercases os.environ keys,
# which breaks Terraform's case-sensitive TF_VAR_ matching).
_loaded_env: dict[str, str] = {}

# ---------------------------------------------------------------------------
# Colored output helpers (same style as RunLocal.py)
# ---------------------------------------------------------------------------

COLORS = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "cyan": "\033[36m",
}


def log(message: str, *style_keys: str) -> None:
    prefix = "".join(COLORS.get(k, "") for k in style_keys)
    print(f"{prefix}{message}{COLORS['reset']}")


def section(title: str) -> None:
    bar = "=" * 60
    log(f"\n{bar}", "bold")
    log(title, "bold", "cyan")
    log(bar, "bold")


def fail(message: str) -> None:
    log(f"ERROR: {message}", "red", "bold")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Git pre-flight checks
# ---------------------------------------------------------------------------


def verify_git_clean() -> None:
    """Ensure there are no uncommitted changes in the working directory."""
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail("Could not run 'git status'. Are you in a git repository?")

    if result.stdout.strip():
        log("  Uncommitted changes detected:", "yellow")
        for line in result.stdout.strip().splitlines()[:10]:
            log(f"    {line}", "yellow")
        if len(result.stdout.strip().splitlines()) > 10:
            log("    ... and more", "yellow")
        fail("Commit or stash your changes before deploying.")

    log("  Working directory is clean", "green")


def verify_git_pushed() -> None:
    """Ensure local commits have been pushed to the remote."""
    subprocess.run(
        ["git", "fetch", "origin", BRANCH_NAME],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=30,
    )

    result = subprocess.run(
        ["git", "rev-list", "--count", f"origin/{BRANCH_NAME}..HEAD"],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail(f"Could not compare local commits with origin/{BRANCH_NAME}.")

    unpushed = int(result.stdout.strip()) if result.stdout.strip() else 0
    if unpushed > 0:
        fail(
            f"{unpushed} local commit(s) not pushed to origin/{BRANCH_NAME}.\n"
            f"  Run: git push origin {BRANCH_NAME}"
        )

    log("  All commits pushed to remote", "green")


# ---------------------------------------------------------------------------
# .env loader
# ---------------------------------------------------------------------------


def load_env_file(path: Path) -> None:
    """Parse 'export KEY="VALUE"' lines and set them as environment variables."""
    if not path.exists():
        fail(
            f"{path.relative_to(ROOT_DIR)} not found.\n"
            "  Copy .env.example to .env and fill in your values.\n"
            "  See docs/Terraform Configuration.md, Step 2."
        )

    loaded = 0
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Strip optional 'export ' prefix
            if line.startswith("export "):
                line = line[len("export "):]
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ[key] = value
            _loaded_env[key] = value
            loaded += 1

    log(f"  Loaded {loaded} variable(s) from .env", "green")


# ---------------------------------------------------------------------------
# CLI helpers
# ---------------------------------------------------------------------------


def _build_env() -> dict[str, str]:
    """Build environment dict preserving original case for loaded variables.

    On Windows, os.environ uppercases keys. Terraform's TF_VAR_ lookup is
    case-sensitive (e.g. TF_VAR_github_access_token != TF_VAR_GITHUB_ACCESS_TOKEN),
    so we rebuild the dict with the original case from the .env file.
    """
    env: dict[str, str] = {}
    loaded_keys_upper = {k.upper() for k in _loaded_env}
    for key, value in os.environ.items():
        # Skip keys that were loaded (they may be uppercased by Windows)
        if key.upper() in loaded_keys_upper:
            continue
        env[key] = value
    # Re-add loaded vars with their original case
    env.update(_loaded_env)
    return env


def run_command(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    capture: bool = True,
) -> subprocess.CompletedProcess[str]:
    """Run a command and return the result. Exits on failure."""
    sys.stdout.flush()
    result = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        capture_output=capture,
        text=True,
        env=_build_env(),
    )
    if result.returncode != 0:
        stderr = result.stderr.strip() if result.stderr else ""
        fail(f"Command failed: {' '.join(cmd)}\n  {stderr}")
    return result


def get_terraform_output(name: str) -> str:
    """Retrieve a single Terraform output value from the staging directory."""
    result = run_command(
        ["terraform", "output", "-json", name],
        cwd=STAGING_DIR,
    )
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError:
        fail(f"Could not parse Terraform output for '{name}'.\n"
             "  Make sure you have run 'terraform apply' first.")
    if not value:
        fail(f"Terraform output '{name}' is empty.\n"
             "  Make sure you have run 'terraform apply' first.")
    return str(value)


# ---------------------------------------------------------------------------
# Amplify helpers
# ---------------------------------------------------------------------------


def start_amplify_job(app_id: str, region: str) -> dict:
    """Trigger an Amplify RELEASE build and return the job summary."""
    result = run_command([
        "aws", "amplify", "start-job",
        "--app-id", app_id,
        "--branch-name", BRANCH_NAME,
        "--job-type", "RELEASE",
        "--region", region,
    ])
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        fail("Could not parse response from 'aws amplify start-job'.")
        return {}  # unreachable, keeps type checker happy


def get_amplify_job(app_id: str, job_id: str, region: str) -> dict:
    """Get the current status of an Amplify job."""
    result = run_command([
        "aws", "amplify", "get-job",
        "--app-id", app_id,
        "--branch-name", BRANCH_NAME,
        "--job-id", job_id,
        "--region", region,
    ])
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        fail("Could not parse response from 'aws amplify get-job'.")
        return {}


TERMINAL_STATUSES = {"SUCCEED", "FAILED", "CANCELLED"}


def poll_job(app_id: str, job_id: str, region: str) -> str:
    """Poll the Amplify job until it reaches a terminal status."""
    last_status = ""
    while True:
        data = get_amplify_job(app_id, job_id, region)
        summary = data.get("job", {}).get("summary", {})
        status = summary.get("status", "UNKNOWN")

        if status != last_status:
            log(f"  Status: {status}", "cyan")
            last_status = status

        if status in TERMINAL_STATUSES:
            return status

        time.sleep(POLL_INTERVAL_S)


# ---------------------------------------------------------------------------
# Deployment commands
# ---------------------------------------------------------------------------


def deploy_terraform() -> None:
    """Run terraform init, plan, and apply in the staging directory."""
    section("Terraform Init")
    run_command(["terraform", "init"], cwd=STAGING_DIR, capture=False)

    section("Terraform Plan")
    run_command(["terraform", "plan"], cwd=STAGING_DIR, capture=False)

    section("Terraform Apply")
    log("  Terraform will prompt for confirmation before making changes.", "yellow")
    log("")
    sys.stdout.flush()
    result = subprocess.run(
        ["terraform", "apply"],
        cwd=str(STAGING_DIR),
        text=True,
        env=_build_env(),
    )
    if result.returncode != 0:
        fail("Terraform apply did not complete successfully.")

    section("Terraform Complete")
    log("  Infrastructure deployed successfully!", "bold", "green")
    log("  Run the following to see your resource values:", "cyan")
    log("    cd infrastructure/environments/staging && terraform output", "cyan")
    log("")


def deploy_amplify() -> None:
    """Trigger an Amplify build and poll until complete."""
    section("Reading Terraform Outputs")
    app_id = get_terraform_output("amplify_app_id")
    log(f"  Amplify App ID: {app_id}", "green")

    app_url = get_terraform_output("amplify_app_url")
    log(f"  Amplify URL:    {app_url}", "green")

    region = get_terraform_output("aws_region")
    log(f"  Region:         {region}", "green")

    section("Starting Amplify Build")
    response = start_amplify_job(app_id, region)
    job_summary = response.get("jobSummary", {})
    job_id = job_summary.get("jobId", "")
    if not job_id:
        fail("No jobId returned from start-job.")

    log(f"  Job ID: {job_id}", "green")
    log(f"  Polling every {POLL_INTERVAL_S}s...", "cyan")

    section("Build Progress")
    final_status = poll_job(app_id, job_id, region)

    section("Deployment Result")
    if final_status == "SUCCEED":
        log("")
        log("Build succeeded!", "bold", "green")
        log("")
        log(f"  Live URL: {app_url}", "cyan")
        log("")
    else:
        log("")
        log(f"Build finished with status: {final_status}", "bold", "red")
        log("Check the Amplify Console for details.", "yellow")
        log("")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Deploy the staging environment (infrastructure, frontend, or both).",
    )
    parser.add_argument(
        "command",
        nargs="?",
        default=None,
        choices=["TerraformOnly"],
        help="pass 'TerraformOnly' to deploy just infrastructure without Amplify",
    )
    args = parser.parse_args()

    needs_terraform = True
    needs_amplify = args.command is None

    if args.command == "TerraformOnly":
        section("Deploy Infrastructure Only (Staging)")
    else:
        section("Deploy Staging Environment")

    # Git checks are only needed for Amplify (it pulls from GitHub)
    if needs_amplify:
        section("Pre-Flight Checks")
        verify_git_clean()
        verify_git_pushed()

    section("Loading Environment Variables")
    load_env_file(ENV_FILE)

    if needs_terraform:
        deploy_terraform()

    if needs_amplify:
        deploy_amplify()


if __name__ == "__main__":
    main()
