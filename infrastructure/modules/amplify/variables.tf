# Amplify Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in 'owner/repo' format"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for repository access"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Git branch name to deploy"
  type        = string
  default     = "main"
}

variable "app_name" {
  description = "Application display name"
  type        = string
  default     = "Mindful AI Sandbox"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

# Values from the cognito module (creates implicit dependency)
variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_web_client_id" {
  description = "Cognito Web Client ID"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito User Pool domain prefix"
  type        = string
}

# Value from the api-gateway module (creates implicit dependency)
variable "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  type        = string
}
