# Terraform Variables for Staging Environment

variable "environment" {
  description = "Environment name (staging)"
  type        = string
  default     = "staging"
  validation {
    condition     = var.environment == "staging"
    error_message = "Environment must be staging for this configuration."
  }
}

variable "project_name" {
  description = "Your project name used for resource naming"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Project     = "Sandbox"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Google OAuth Configuration
# Set these via terraform.tfvars or TF_VAR_google_client_id environment variable
variable "google_client_id" {
  description = "Google OAuth Client ID for social login"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for social login"
  type        = string
  default     = ""
  sensitive   = true
}

# GitHub Repository
variable "github_repository" {
  description = "GitHub repository in 'owner/repo' format for OIDC role trust policy"
  type        = string
  default     = ""
}

# CloudWatch Alarm Notifications
variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

# GitHub Access Token for Amplify
# Set via environment variable: export TF_VAR_github_access_token="ghp_..."
# See infrastructure/environments/staging/.env.example
variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository (requires 'repo' scope)"
  type        = string
  sensitive   = true

  validation {
    condition     = var.github_access_token != ""
    error_message = "github_access_token is required. Run 'source .env' to load your secrets before running Terraform."
  }
}

# Email Customization
variable "from_email_address" {
  description = "Sender email address for Cognito emails"
  type        = string
  default     = "noreply@example.com"
}

variable "reply_to_email_address" {
  description = "Reply-to email address for Cognito emails"
  type        = string
  default     = "support@example.com"
}
