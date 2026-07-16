# Lambda Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool (for Lambda trigger permissions)"
  type        = string
  default     = ""
}

variable "enable_cognito_trigger" {
  description = "Enable Cognito pre-signup Lambda trigger permission. Must be known at plan time (use a literal, not a module output)."
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Log level for Lambda functions (DEBUG, INFO, WARN, ERROR)"
  type        = string
  default     = "INFO"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "nodejs22.x"
}

variable "lambda_memory" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for API Lambda functions (seconds)"
  type        = number
  default     = 30
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = ""
}

variable "enable_provisioned_concurrency" {
  description = "Enable provisioned concurrency for critical Lambda functions"
  type        = bool
  default     = false
}

variable "auth_provisioned_concurrency" {
  description = "Number of provisioned concurrent executions for auth Lambda"
  type        = number
  default     = 1
}

variable "auth_mode" {
  description = "Authentication mode: 'local' for mock auth, 'cognito' for AWS Cognito"
  type        = string
  default     = "cognito"
}

# =============================================================================
# Reserved Concurrency Settings
# Set to -1 (default) for unreserved, or a positive integer to reserve capacity.
# Protects against concurrency exhaustion attacks across Lambda functions.
# =============================================================================

variable "auth_reserved_concurrency" {
  description = "Reserved concurrent executions for auth Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "admin_reserved_concurrency" {
  description = "Reserved concurrent executions for admin Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "profile_reserved_concurrency" {
  description = "Reserved concurrent executions for profile Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "pre_signup_reserved_concurrency" {
  description = "Reserved concurrent executions for pre-signup Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}
