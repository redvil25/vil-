# Main Terraform Configuration
# This file orchestrates all infrastructure modules

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# IAM Module - Roles and Policies
module "iam" {
  source       = "./modules/iam"
  environment  = var.environment
  project_name = var.project_name

  # Resource ARNs for policy attachments
  dynamodb_table_arn    = module.dynamodb.table_arn
  s3_bucket_arns        = []
  cognito_user_pool_arn = module.cognito.user_pool_arn
}

# Cognito Module - User Authentication
module "cognito" {
  source       = "./modules/cognito"
  environment  = var.environment
  project_name = var.project_name
}

# DynamoDB Module - Data Storage
module "dynamodb" {
  source       = "./modules/dynamodb"
  environment  = var.environment
  project_name = var.project_name
}

# Lambda Module - Business Logic
module "lambda" {
  source = "./modules/lambda"

  environment  = var.environment
  project_name = var.project_name

  # IAM Roles
  lambda_execution_role_arn = module.iam.lambda_execution_role_arn

  # DynamoDB
  dynamodb_table_name = module.dynamodb.table_name

  # Cognito
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_client_id     = module.cognito.web_client_id
  cognito_user_pool_arn = module.cognito.user_pool_arn
}

# API Gateway Module - REST API
module "api_gateway" {
  source = "./modules/api-gateway"

  environment  = var.environment
  project_name = var.project_name

  # Cognito
  cognito_user_pool_arn = module.cognito.user_pool_arn

  # IAM
  api_gateway_cloudwatch_role_arn = module.iam.api_gateway_cloudwatch_role_arn

  # Environment-specific settings
  log_level = var.environment == "prod" ? "ERROR" : "INFO"
}

# CloudWatch Module - Monitoring and Logging
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment  = var.environment
  project_name = var.project_name

  # Lambda
  lambda_function_names = {
    auth    = module.lambda.auth_function_name
    admin   = module.lambda.admin_function_name
    profile = module.lambda.profile_function_name
  }

  # API Gateway
  api_gateway_id         = module.api_gateway.api_id
  api_gateway_stage_name = module.api_gateway.stage_name
  api_gateway_name       = module.api_gateway.api_name

  # DynamoDB
  dynamodb_table_name = module.dynamodb.table_name

  # Cognito for authentication monitoring
  cognito_user_pool_id = module.cognito.user_pool_id
}
