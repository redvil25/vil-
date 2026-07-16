# Terraform Outputs for Staging Environment

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "cognito_web_client_id" {
  description = "Cognito Web Client ID"
  value       = module.cognito.web_client_id
  sensitive   = true
}

output "cognito_domain" {
  description = "Cognito Hosted UI Domain"
  value       = module.cognito.user_pool_domain
}

# DynamoDB Outputs
output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB Table ARN"
  value       = module.dynamodb.table_arn
}

# Dashboard Outputs
output "dashboard_bucket_name" {
  description = "S3 Bucket for E2E Test Dashboard Data"
  value       = module.dashboard_bucket.bucket_name
}

output "dashboard_cloudfront_domain" {
  description = "CloudFront Distribution Domain for test dashboard"
  value       = aws_cloudfront_distribution.dashboard.domain_name
}

output "dashboard_cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for test dashboard (for cache invalidation)"
  value       = aws_cloudfront_distribution.dashboard.id
}

output "dashboard_test_history_url" {
  description = "URL of the test-history.json file for dashboard (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.dashboard.domain_name}/test-history.json"
}

# GitHub Actions Outputs
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role for OIDC"
  value       = module.github_actions_role.role_arn
}

# Lambda Outputs
output "lambda_auth_function_arn" {
  description = "Auth Lambda Function ARN"
  value       = module.lambda.auth_function_arn
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = module.api_gateway.api_id
}

output "api_gateway_invoke_url" {
  description = "API Gateway Invoke URL"
  value       = module.api_gateway.api_endpoint
}

output "api_gateway_stage_name" {
  description = "API Gateway Stage Name"
  value       = module.api_gateway.stage_name
}

# CloudWatch Outputs
output "cloudwatch_log_group_names" {
  description = "CloudWatch Log Group Names"
  value = {
    auth    = "/aws/lambda/${var.project_name}-${var.environment}-auth"
    admin   = "/aws/lambda/${var.project_name}-${var.environment}-admin"
    profile = "/aws/lambda/${var.project_name}-${var.environment}-profile"
  }
}

# Amplify Outputs
output "amplify_app_id" {
  description = "Amplify App ID"
  value       = module.amplify.app_id
}

output "amplify_app_url" {
  description = "Amplify App URL"
  value       = module.amplify.app_url
}

output "amplify_default_domain" {
  description = "Amplify Default Domain"
  value       = module.amplify.default_domain
}

# Environment Info
output "environment" {
  description = "Current Environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}
