# Variables for GitHub Actions OIDC Role Module

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo' that can assume this role"
  type        = string
}

variable "dashboard_bucket_arns" {
  description = "ARNs of the S3 buckets for test dashboard data (both environments)"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_terraform_state_access" {
  description = "Enable access to Terraform state bucket (optional)"
  type        = bool
  default     = false
}

variable "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state (required if enable_terraform_state_access is true)"
  type        = string
  default     = ""
}

variable "terraform_lock_table_arn" {
  description = "ARN of DynamoDB table for Terraform state locking (required if enable_terraform_state_access is true)"
  type        = string
  default     = ""
}
