# Staging Environment Configuration
# This file references the root modules with staging-specific variables

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}

# Provider for us-east-1 (required for ACM certificates used with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = var.common_tags
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Amplify Module - Frontend Hosting (created first, no external dependencies)
module "amplify" {
  source = "../../modules/amplify"

  environment  = var.environment
  project_name = var.project_name

  # GitHub configuration
  github_repository   = var.github_repository
  github_access_token = var.github_access_token
  branch_name         = "main"
  aws_region          = var.aws_region

  # Cognito values (branch resource waits for cognito to be created)
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_web_client_id = module.cognito.web_client_id
  cognito_domain        = module.cognito.user_pool_domain

  # API Gateway URL (branch resource waits for API gateway to be created)
  api_gateway_invoke_url = module.api_gateway.api_endpoint
}

# IAM Module - Roles and Policies
module "iam" {
  source       = "../../modules/iam"
  environment  = var.environment
  project_name = var.project_name

  # Resource ARNs for policy attachments
  dynamodb_table_arn    = module.dynamodb.table_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn
}

# Cognito Module - User Authentication
module "cognito" {
  source       = "../../modules/cognito"
  environment  = var.environment
  project_name = var.project_name

  # Google OAuth credentials (set via terraform.tfvars or environment variables)
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  # Pre Sign-up Lambda trigger for auto-confirming federated users
  pre_signup_lambda_arn = module.lambda.pre_signup_function_arn

  # Email configuration
  from_email_address     = var.from_email_address
  reply_to_email_address = var.reply_to_email_address

  # OAuth callback URLs
  callback_urls = [
    "http://localhost:3000/auth/callback",
    "https://localhost:3000/auth/callback",
    "https://main.${module.amplify.app_id}.amplifyapp.com/auth/callback",
  ]

  logout_urls = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://main.${module.amplify.app_id}.amplifyapp.com",
  ]
}

# DynamoDB Module - Data Storage
module "dynamodb" {
  source       = "../../modules/dynamodb"
  environment  = var.environment
  project_name = var.project_name

  # Protection settings for staging
  enable_deletion_protection    = true # Prevent accidental deletion via AWS Console/CLI
  enable_point_in_time_recovery = true # Enable backups for data recovery
}

# Security: Account-level S3 Block Public Access (Security Plan Item #4)
# Prevents any bucket in the account from being accidentally made public.
# All buckets use CloudFront OAC or IAM-based access, so this has no functional impact.
resource "aws_s3_account_public_access_block" "account" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Dashboard Bucket Module - E2E Test Dashboard Data
module "dashboard_bucket" {
  source       = "../../modules/dashboard-bucket"
  environment  = var.environment
  project_name = var.project_name
  common_tags  = var.common_tags
}

# CloudFront Distribution for Dashboard Bucket
# Provides secure access to test dashboard data via CloudFront OAC
# This replaces direct public S3 access to resolve Security Hub S3.2 finding

# Origin Access Control (OAC) for secure S3 access
resource "aws_cloudfront_origin_access_control" "dashboard" {
  name                              = "${var.project_name}-dashboard-oac-${var.environment}"
  description                       = "OAC for ${var.project_name} test dashboard bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Cache Policy optimized for test dashboard data (short TTL for freshness)
resource "aws_cloudfront_cache_policy" "dashboard" {
  name        = "${var.project_name}-dashboard-cache-${var.environment}"
  comment     = "Cache policy for test dashboard data (short TTL)"
  default_ttl = 300 # 5 minutes
  max_ttl     = 300 # 5 minutes
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# CloudFront Distribution for Dashboard
resource "aws_cloudfront_distribution" "dashboard" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} test dashboard CDN (${var.environment})"
  default_root_object = ""
  price_class         = "PriceClass_100" # North America + Europe only
  http_version        = "http2and3"

  # S3 Origin with OAC
  origin {
    domain_name              = module.dashboard_bucket.bucket_regional_domain_name
    origin_id                = "S3-${module.dashboard_bucket.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.dashboard.id
  }

  # Default cache behavior for all objects
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${module.dashboard_bucket.bucket_name}"

    cache_policy_id = aws_cloudfront_cache_policy.dashboard.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # No geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Default CloudFront certificate (*.cloudfront.net)
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.project_name}-dashboard-cdn-${var.environment}"
    Environment = var.environment
    Purpose     = "CDN for E2E test dashboard data"
  }
}

# Override S3 dashboard bucket policy to use CloudFront OAC
resource "aws_s3_bucket_policy" "dashboard_cloudfront" {
  bucket = module.dashboard_bucket.bucket_name
  policy = data.aws_iam_policy_document.dashboard_cloudfront_policy.json
}

data "aws_iam_policy_document" "dashboard_cloudfront_policy" {
  # Enforce TLS for all requests
  statement {
    sid    = "EnforceTLS"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      module.dashboard_bucket.bucket_arn,
      "${module.dashboard_bucket.bucket_arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Allow CloudFront OAC to read all objects
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${module.dashboard_bucket.bucket_arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.dashboard.arn]
    }
  }
}

# Update S3 public access block to restrict public access (CloudFront handles access)
resource "aws_s3_bucket_public_access_block" "dashboard_cloudfront" {
  bucket = module.dashboard_bucket.bucket_name

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# GitHub Actions OIDC Role - Allow GitHub Actions to upload dashboard data
module "github_actions_role" {
  source      = "../../modules/github-actions-role"
  common_tags = var.common_tags

  github_repository = var.github_repository
  dashboard_bucket_arns = [
    module.dashboard_bucket.bucket_arn,
  ]
}

# Lambda Module - Business Logic
module "lambda" {
  source = "../../modules/lambda"

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

  # Authentication mode
  auth_mode = "cognito"

  # CORS - Include localhost for local frontend testing against staging backend
  allowed_origins = "https://main.${module.amplify.app_id}.amplifyapp.com,http://localhost:3000"

  # Reserved concurrency - removed for student/new accounts with default Lambda limits.
  # Before going to production, add these back to isolate functions and prevent
  # concurrency exhaustion:
  #   auth_reserved_concurrency       = 50
  #   profile_reserved_concurrency    = 25
  #   admin_reserved_concurrency      = 15
  #   pre_signup_reserved_concurrency = 15
}

# API Gateway Module - REST API
module "api_gateway" {
  source = "../../modules/api-gateway"

  environment  = var.environment
  project_name = var.project_name

  # Cognito
  cognito_user_pool_arn = module.cognito.user_pool_arn

  # IAM
  api_gateway_cloudwatch_role_arn = module.iam.api_gateway_cloudwatch_role_arn

  # Environment-specific settings
  log_level = "INFO" # Staging uses INFO level logging

  # CORS - Include localhost for local frontend testing against staging backend
  allowed_origins = ["https://main.${module.amplify.app_id}.amplifyapp.com", "http://localhost:3000"]

  # Security: Enable API Gateway rate limiting (usage plans)
  enable_rate_limiting = true

  # Routes dependency - wait for all API routes to be created before deploying
  routes_ready = module.api_routes.routes_ready
}

# API Routes Module - Connect API Gateway to Lambda
module "api_routes" {
  source = "../../modules/api-routes"

  environment  = var.environment
  project_name = var.project_name

  # API Gateway
  api_gateway_id               = module.api_gateway.api_id
  api_gateway_root_resource_id = module.api_gateway.root_resource_id
  api_gateway_execution_arn    = module.api_gateway.api_execution_arn
  cognito_authorizer_id        = module.api_gateway.authorizer_id

  # Auth Lambda
  auth_lambda_invoke_arn    = module.lambda.auth_invoke_arn
  auth_lambda_function_name = module.lambda.auth_function_name

  # Admin Lambda
  admin_lambda_invoke_arn    = module.lambda.admin_invoke_arn
  admin_lambda_function_name = module.lambda.admin_function_name

  # Profile Lambda
  profile_lambda_invoke_arn    = module.lambda.profile_invoke_arn
  profile_lambda_function_name = module.lambda.profile_function_name
}

# CloudWatch Module - Monitoring and Logging
module "cloudwatch" {
  source = "../../modules/cloudwatch"

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
  api_gateway_name       = module.api_gateway.api_name
  api_gateway_stage_name = module.api_gateway.stage_name

  # DynamoDB
  dynamodb_table_name = module.dynamodb.table_name

  # Cognito - for authentication monitoring
  cognito_user_pool_id = module.cognito.user_pool_id

  # Alarm notifications
  alarm_email = var.alarm_email

  # Enable all alarms for staging
  enable_alarms = true
}
