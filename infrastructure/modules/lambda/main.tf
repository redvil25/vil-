# Lambda Functions Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Local variables for common configuration
locals {
  common_environment_variables = {
    ENVIRONMENT          = var.environment
    DYNAMODB_TABLE_NAME  = var.dynamodb_table_name
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    COGNITO_CLIENT_ID    = var.cognito_client_id
    LOG_LEVEL            = var.log_level
    NODE_ENV             = var.environment == "prod" ? "production" : "development"
    ALLOWED_ORIGINS      = var.allowed_origins
    AUTH_MODE            = var.auth_mode
  }
}

# Lambda Function: Auth
data "archive_file" "auth" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/bundles/auth-handler"
  output_path = "${path.module}/../../../backend/dist/bundles/auth.zip"
}

resource "aws_lambda_function" "auth" {
  filename                       = data.archive_file.auth.output_path
  function_name                  = "${var.project_name}-auth-${var.environment}"
  role                           = var.lambda_execution_role_arn
  handler                        = "index.handler"
  source_code_hash               = data.archive_file.auth.output_base64sha256
  runtime                        = var.lambda_runtime
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  publish                        = var.enable_provisioned_concurrency
  reserved_concurrent_executions = var.auth_reserved_concurrency

  environment {
    variables = local.common_environment_variables
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-auth-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for Auth Lambda
resource "aws_cloudwatch_log_group" "auth" {
  name              = "/aws/lambda/${aws_lambda_function.auth.function_name}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-auth-logs-${var.environment}"
    Environment = var.environment
  }
}

# Provisioned Concurrency for Auth Lambda (critical path)
resource "aws_lambda_provisioned_concurrency_config" "auth" {
  count                             = var.enable_provisioned_concurrency ? 1 : 0
  function_name                     = aws_lambda_function.auth.function_name
  provisioned_concurrent_executions = var.auth_provisioned_concurrency
  qualifier                         = aws_lambda_function.auth.version
}

# Lambda Function: Admin
data "archive_file" "admin" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/bundles/admin-handler"
  output_path = "${path.module}/../../../backend/dist/bundles/admin.zip"
}

resource "aws_lambda_function" "admin" {
  filename                       = data.archive_file.admin.output_path
  function_name                  = "${var.project_name}-admin-${var.environment}"
  role                           = var.lambda_execution_role_arn
  handler                        = "index.handler"
  source_code_hash               = data.archive_file.admin.output_base64sha256
  runtime                        = var.lambda_runtime
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.admin_reserved_concurrency

  environment {
    variables = local.common_environment_variables
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-admin-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for Admin Lambda
resource "aws_cloudwatch_log_group" "admin" {
  name              = "/aws/lambda/${aws_lambda_function.admin.function_name}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-admin-logs-${var.environment}"
    Environment = var.environment
  }
}

# Lambda Function: Profile
data "archive_file" "profile" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/bundles/profile-handler"
  output_path = "${path.module}/../../../backend/dist/bundles/profile.zip"
}

resource "aws_lambda_function" "profile" {
  filename                       = data.archive_file.profile.output_path
  function_name                  = "${var.project_name}-profile-${var.environment}"
  role                           = var.lambda_execution_role_arn
  handler                        = "index.handler"
  source_code_hash               = data.archive_file.profile.output_base64sha256
  runtime                        = var.lambda_runtime
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.profile_reserved_concurrency

  environment {
    variables = local.common_environment_variables
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-profile-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for Profile Lambda
resource "aws_cloudwatch_log_group" "profile" {
  name              = "/aws/lambda/${aws_lambda_function.profile.function_name}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-profile-logs-${var.environment}"
    Environment = var.environment
  }
}

# Lambda Function: Pre Sign-up (Cognito Trigger)
# This function auto-confirms federated users and creates their DynamoDB profile
data "archive_file" "pre_signup" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/bundles/pre-signup-handler"
  output_path = "${path.module}/../../../backend/dist/bundles/pre-signup.zip"
}

resource "aws_lambda_function" "pre_signup" {
  filename                       = data.archive_file.pre_signup.output_path
  function_name                  = "${var.project_name}-pre-signup-${var.environment}"
  role                           = var.lambda_execution_role_arn
  handler                        = "index.handler"
  source_code_hash               = data.archive_file.pre_signup.output_base64sha256
  runtime                        = var.lambda_runtime
  memory_size                    = 256 # Smaller memory for simple trigger
  timeout                        = 10  # Short timeout for Cognito triggers
  reserved_concurrent_executions = var.pre_signup_reserved_concurrency

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name
      LOG_LEVEL           = var.log_level
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-pre-signup-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for Pre Sign-up Lambda
resource "aws_cloudwatch_log_group" "pre_signup" {
  name              = "/aws/lambda/${aws_lambda_function.pre_signup.function_name}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-pre-signup-logs-${var.environment}"
    Environment = var.environment
  }
}

# Lambda Permission: Allow Cognito to invoke Pre Sign-up Lambda
resource "aws_lambda_permission" "cognito_pre_signup" {
  count         = var.enable_cognito_trigger ? 1 : 0
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = var.cognito_user_pool_arn
}
