# API Routes Module Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "api_gateway_id" {
  description = "API Gateway REST API ID"
  type        = string
}

variable "api_gateway_root_resource_id" {
  description = "API Gateway root resource ID"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "API Gateway execution ARN for Lambda permissions"
  type        = string
}

variable "cognito_authorizer_id" {
  description = "Cognito authorizer ID"
  type        = string
}

# Lambda Function ARNs and Names
variable "auth_lambda_invoke_arn" {
  description = "Auth Lambda function invoke ARN"
  type        = string
}

variable "auth_lambda_function_name" {
  description = "Auth Lambda function name"
  type        = string
}

variable "admin_lambda_invoke_arn" {
  description = "Admin Lambda function invoke ARN"
  type        = string
}

variable "admin_lambda_function_name" {
  description = "Admin Lambda function name"
  type        = string
}

variable "profile_lambda_invoke_arn" {
  description = "Profile Lambda function invoke ARN"
  type        = string
}

variable "profile_lambda_function_name" {
  description = "Profile Lambda function name"
  type        = string
}
