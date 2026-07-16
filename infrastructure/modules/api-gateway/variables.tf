# API Gateway Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorizer"
  type        = string
}

variable "api_gateway_cloudwatch_role_arn" {
  description = "ARN of the IAM role for API Gateway CloudWatch logging"
  type        = string
}

variable "rate_limit" {
  description = "API Gateway rate limit (requests per second)"
  type        = number
  default     = 1000
}

variable "burst_limit" {
  description = "API Gateway burst limit (requests)"
  type        = number
  default     = 2000
}

variable "log_level" {
  description = "CloudWatch Logs logging level (INFO or ERROR)"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["INFO", "ERROR", "OFF"], var.log_level)
    error_message = "Log level must be INFO, ERROR, or OFF."
  }
}

variable "xray_tracing_enabled" {
  description = "Enable X-Ray tracing for API Gateway"
  type        = bool
  default     = true
}

variable "metrics_enabled" {
  description = "Enable detailed CloudWatch metrics"
  type        = bool
  default     = true
}

variable "allowed_origins" {
  description = "List of allowed CORS origins for the API"
  type        = list(string)
  default     = []
}

variable "enable_rate_limiting" {
  description = "Enable API Gateway usage plans for rate limiting"
  type        = bool
  default     = false
}

variable "anonymous_daily_limit" {
  description = "Daily request quota for anonymous users"
  type        = number
  default     = 100
}

variable "anonymous_burst_limit" {
  description = "Burst limit for anonymous users (requests/second)"
  type        = number
  default     = 5
}

variable "anonymous_rate_limit" {
  description = "Sustained rate limit for anonymous users (requests/second)"
  type        = number
  default     = 2
}

variable "authenticated_daily_limit" {
  description = "Daily request quota for authenticated users"
  type        = number
  default     = 1000
}

variable "authenticated_burst_limit" {
  description = "Burst limit for authenticated users (requests/second)"
  type        = number
  default     = 10
}

variable "authenticated_rate_limit" {
  description = "Sustained rate limit for authenticated users (requests/second)"
  type        = number
  default     = 5
}

variable "routes_ready" {
  description = "Hash of all route integrations to trigger deployment when routes change"
  type        = string
  default     = ""
}

# Custom Domain Configuration (optional)
variable "custom_domain_name" {
  description = "Custom domain name for the API (e.g., api.example.com). Leave empty to skip custom domain setup."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for the custom domain. Required if custom_domain_name is provided."
  type        = string
  default     = ""
}

variable "create_api_gateway_account" {
  description = "Whether to create the API Gateway account settings. Set to false if another environment already manages this regional singleton."
  type        = bool
  default     = true
}
