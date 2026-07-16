# IAM Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for policy attachment"
  type        = string
  default     = "*"
}

variable "s3_bucket_arns" {
  description = "List of S3 bucket ARNs for policy attachment"
  type        = list(string)
  default     = ["*"]
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  type        = string
  default     = "*"
}

