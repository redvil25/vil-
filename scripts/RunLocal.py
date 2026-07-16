#!/usr/bin/env python3

"""
Launch Local Development Environment

This script:
  1. Kills any processes already occupying the dev ports
  2. Ensures .env / .env.local files exist (copies from examples if needed)
  3. Starts the backend server (port 3001, AUTH_MODE=local by default)
  4. Starts the frontend server (port 3000)
  5. Keeps both running until Ctrl+C, then cleans up

Usage:
    python scripts/RunLocal.py
    python scripts/RunLocal.py --auth cognito   # use real Cognito auth
"""

import argparse
import http.client
import os
import platform
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BACKEND_PORT = 3001
FRONTEND_PORT = 3000
BACKEND_URL = f"http://localhost:{BACKEND_PORT}"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
MAX_STARTUP_WAIT_S = 60
HEALTH_CHECK_INTERVAL_S = 2

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

IS_WINDOWS = platform.system() == "Windows"

# ---------------------------------------------------------------------------
# Colored output helpers
# ---------------------------------------------------------------------------

COLORS = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
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


# ---------------------------------------------------------------------------
# Port management
# ---------------------------------------------------------------------------


def kill_port(port: int) -> None:
    """Kill whatever process is listening on *port*."""
    try:
        if IS_WINDOWS:
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    pid = line.strip().split()[-1]
                    subprocess.run(
                        ["taskkill", "/F", "/PID", pid],
                        capture_output=True
                    )
                    log(f"  Killed PID {pid} on port {port}", "yellow")
        else:
            subprocess.run(
                ["fuser", "-k", f"{port}/tcp"],
                capture_output=True
            )
    except Exception as exc:
        log(f"  Warning: could not clear port {port} - {exc}", "yellow")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


def is_server_ready(port: int) -> bool:
    try:
        conn = http.client.HTTPConnection("localhost", port, timeout=3)
        conn.request("GET", "/")
        conn.getresponse()
        conn.close()
        return True
    except Exception:
        return False


def wait_for_server(port: int, name: str) -> bool:
    log(f"{name}: waiting for server on port {port}...", "cyan")
    start = time.time()
    while time.time() - start < MAX_STARTUP_WAIT_S:
        if is_server_ready(port):
            elapsed = time.time() - start
            log(f"{name}: ready! ({elapsed:.1f}s)", "green")
            return True
        time.sleep(HEALTH_CHECK_INTERVAL_S)
    log(f"{name}: timed out after {MAX_STARTUP_WAIT_S}s", "red")
    return False


# ---------------------------------------------------------------------------
# Environment file setup
# ---------------------------------------------------------------------------


def ensure_env_file(directory: Path, target: str, example: str) -> None:
    target_path = directory / target
    example_path = directory / example
    if target_path.exists():
        log(f"  {target} already exists - using it", "green")
        return
    if example_path.exists():
        shutil.copy2(example_path, target_path)
        log(f"  Copied {example} -> {target}", "green")
    else:
        log(f"  Warning: {example} not found, skipping", "yellow")


# ---------------------------------------------------------------------------
# Process management
# ---------------------------------------------------------------------------

processes: list[subprocess.Popen] = []


def start_process(
    name: str,
    cwd: Path,
    cmd: list[str],
    color: str,
    extra_env: dict[str, str] | None = None,
) -> subprocess.Popen:
    env = {**os.environ, **(extra_env or {})}
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        shell=IS_WINDOWS,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(proc)

    import threading

    def _stream():
        assert proc.stdout is not None
        for line in proc.stdout:
            stripped = line.rstrip()
            if stripped and "ExperimentalWarning" not in stripped:
                log(f"[{name}] {stripped}", color)

    threading.Thread(target=_stream, daemon=True).start()
    return proc


def cleanup() -> None:
    section("Shutting down servers")
    for proc in processes:
        if proc.poll() is not None:
            continue
        log(f"  Stopping PID {proc.pid}...", "yellow")
        try:
            if IS_WINDOWS:
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True,
                )
            else:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception as exc:
            log(f"  Warning: {exc}", "yellow")
    log("Cleanup complete", "green")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Launch the Mindful AI Sandbox local dev environment"
    )
    parser.add_argument(
        "--auth",
        choices=["local", "cognito"],
        default="local",
        help="Authentication mode (default: local mock auth)",
    )
    args = parser.parse_args()

    section("Local Development Environment Launcher")
    log(f"Backend URL:  {BACKEND_URL}", "bold")
    log(f"Frontend URL: {FRONTEND_URL}", "bold")
    log(f"Auth Mode:    {args.auth}", "bold", "magenta")

    # -- Pre-launch cleanup --------------------------------------------------
    section("Pre-Launch Cleanup")
    log("Killing any existing servers on dev ports...", "cyan")
    kill_port(BACKEND_PORT)
    kill_port(FRONTEND_PORT)

    # -- Ensure env files exist -----------------------------------------------
    section("Checking Environment Files")
    if args.auth == "local":
        ensure_env_file(BACKEND_DIR, ".env", ".env.local.example")
    else:
        ensure_env_file(BACKEND_DIR, ".env", ".env.example")
    ensure_env_file(FRONTEND_DIR, ".env.local", ".env.local.example")

    # -- Start backend --------------------------------------------------------
    section(f"Starting Backend Server (auth={args.auth})")
    backend_cmd = ["npm", "run", "dev:local"] if args.auth == "local" else ["npm", "run", "dev"]
    start_process("Backend", BACKEND_DIR, backend_cmd, "blue")

    section("Waiting for Backend")
    if not wait_for_server(BACKEND_PORT, "Backend"):
        log("Backend failed to start. Check the logs above.", "red")
        cleanup()
        sys.exit(1)

    # -- Start frontend -------------------------------------------------------
    section("Starting Frontend Server")
    start_process("Frontend", FRONTEND_DIR, ["npm", "run", "dev"], "magenta")

    section("Waiting for Frontend")
    if not wait_for_server(FRONTEND_PORT, "Frontend"):
        log("Frontend failed to start. Check the logs above.", "red")
        cleanup()
        sys.exit(1)

    # -- Ready ----------------------------------------------------------------
    section("Environment Ready")
    log("")
    log("Both servers are running!", "bold", "green")
    log("")
    log(f"  Frontend: {FRONTEND_URL}", "cyan")
    log(f"  Backend:  {BACKEND_URL}", "cyan")
    log("")
    if args.auth == "local":
        log("Running with mock auth -- no AWS credentials needed.", "yellow")
        log("Test accounts:", "yellow")
        log("  user1@sandbox-test.com / SandboxUser1!  (User)", "yellow")
        log("  user2@sandbox-test.com / SandboxUser1!  (User)", "yellow")
        log("  admin@sandbox-test.com / SandboxAdmin1! (Admin)", "yellow")
        log("You can also register new accounts via the signup page.", "yellow")
    log("")
    log("Press Ctrl+C to stop both servers", "bold")
    log("")

    # -- Keep alive until Ctrl+C ----------------------------------------------
    try:
        while True:
            # Check if either process died unexpectedly
            for proc in processes:
                if proc.poll() is not None:
                    log(
                        f"A server process (PID {proc.pid}) exited unexpectedly "
                        f"with code {proc.returncode}",
                        "red",
                    )
                    cleanup()
                    sys.exit(1)
            time.sleep(1)
    except KeyboardInterrupt:
        log("\n\nReceived Ctrl+C, shutting down...", "yellow")
        cleanup()
        sys.exit(0)


if __name__ == "__main__":
    main()
