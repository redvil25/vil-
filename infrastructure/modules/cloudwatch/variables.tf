# CloudWatch Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "lambda_function_names" {
  description = "Map of Lambda function names"
  type        = map(string)
}

variable "api_gateway_id" {
  description = "API Gateway REST API ID"
  type        = string
}

variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

variable "lambda_error_threshold" {
  description = "Threshold for Lambda error alarms"
  type        = number
  default     = 10
}

variable "api_error_threshold" {
  description = "Threshold for API Gateway 5xx error alarms"
  type        = number
  default     = 5
}

# Additional variables for comprehensive monitoring

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for monitoring"
  type        = string
  default     = ""
}

variable "enable_cognito_monitoring" {
  description = "Enable Cognito-specific CloudWatch alarms. Must be known at plan time (use a literal, not a module output)."
  type        = bool
  default     = true
}

variable "lambda_concurrent_execution_limit" {
  description = "Lambda concurrent execution limit for alarms (percentage threshold)"
  type        = number
  default     = 900 # Default account limit is 1000, alert at 90%
}

variable "lambda_throttle_threshold" {
  description = "Threshold for Lambda throttle alarms"
  type        = number
  default     = 1
}

variable "lambda_cold_start_threshold_ms" {
  description = "Threshold for Lambda cold start duration in milliseconds"
  type        = number
  default     = 5000
}

variable "dynamodb_throttle_threshold" {
  description = "Threshold for DynamoDB throttle alarms"
  type        = number
  default     = 1
}

variable "dynamodb_latency_threshold_ms" {
  description = "Threshold for DynamoDB latency alarms in milliseconds (p99)"
  type        = number
  default     = 100
}

variable "api_latency_threshold_ms" {
  description = "Threshold for API Gateway integration latency in milliseconds (p99)"
  type        = number
  default     = 10000
}

variable "cognito_signin_failure_threshold" {
  description = "Threshold for Cognito sign-in failure alarms"
  type        = number
  default     = 50
}

variable "stream_iterator_age_threshold_ms" {
  description = "Threshold for DynamoDB Streams iterator age in milliseconds"
  type        = number
  default     = 60000 # 1 minute
}

variable "api_gateway_name" {
  description = "API Gateway REST API name (for metrics dimensions)"
  type        = string
  default     = ""
}

variable "enable_alarms" {
  description = "Enable CloudWatch alarms. Set to false for dev environments to save costs."
  type        = bool
  default     = true
}

# =============================================================================
# ROUTE 53 HEALTH CHECK VARIABLES
# =============================================================================

variable "enable_health_check" {
  description = "Enable Route 53 health check for API uptime monitoring. Cost: ~$0.50/month"
  type        = bool
  default     = false
}

variable "health_check_fqdn" {
  description = "Fully qualified domain name to health check (e.g., api.example.com)"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "Path to health check endpoint (e.g., /health or /staging/health)"
  type        = string
  default     = "/health"
}

variable "health_check_failure_threshold" {
  description = "Number of consecutive health check failures before triggering alarm"
  type        = number
  default     = 3
}

variable "health_check_interval" {
  description = "Seconds between health checks (10 or 30)"
  type        = number
  default     = 30
}

variable "health_check_regions" {
  description = "AWS regions from which to perform health checks"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1"]
}
