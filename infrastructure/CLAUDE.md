 NOTE:  Any Terraform Apply operation MUST be explicitly approved by the user before you execute the command. 
 
  ## Terraform Commands

  **IMPORTANT:** This project uses environment-specific Terraform configurations. Always run Terraform from the correct
  directory.

  ### Staging Environment
  The staging infrastructure is managed from `infrastructure/environments/staging/`, NOT from the root `infrastructure/`
  directory.

  ```bash
  # Navigate to staging environment (REQUIRED - do not run from infrastructure/ root)
  cd infrastructure/environments/staging

  # Initialize (first time or after provider changes)
  terraform init

  # Plan changes (always do this first)
  terraform plan -out=tfplan

  # Apply changes
  terraform apply tfplan

  # Or plan and apply in one step (interactive)
  terraform plan
  terraform apply

  Directory Structure

  infrastructure/
  ├── backend.tf              # Root state (terraform.tfstate) - DO NOT USE FOR STAGING
  ├── environments/
  │   └── staging/
  │       ├── backend.tf      # Staging state (staging/terraform.tfstate) - USE THIS
  │       ├── main.tf         # Staging module configuration
  │       └── variables.tf    # Staging variables
  └── modules/                # Shared modules (referenced by environments)

  Common Mistakes to Avoid

  - WRONG: cd infrastructure && terraform plan - This uses the wrong state file
  - RIGHT: cd infrastructure/environments/staging && terraform plan - Uses staging state

  State Files

  - Root: s3://your-terraform-state-bucket/terraform.tfstate
  - Staging: s3://your-terraform-state-bucket/staging/terraform.tfstate