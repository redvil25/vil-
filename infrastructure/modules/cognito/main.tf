# Cognito User Pool Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data source for current AWS region
data "aws_region" "current" {}

# Main User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users-${var.environment}"

  # Username Configuration - Use email as username
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # User Attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 5
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Custom attribute for user role (redundant with groups, but useful for JWT claims)
  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  # Custom attribute for user ID (maps to DynamoDB UserId)
  schema {
    name                = "userId"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 128
    }
  }

  # Custom attribute for username (display name)
  schema {
    name                = "username"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 30
    }
  }

  # Password Policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Email Configuration
  email_configuration {
    email_sending_account  = var.ses_email_arn != "" ? "DEVELOPER" : "COGNITO_DEFAULT"
    source_arn             = var.ses_email_arn != "" ? var.ses_email_arn : null
    from_email_address     = var.ses_email_arn != "" ? var.from_email_address : null
    reply_to_email_address = var.reply_to_email_address != "" ? var.reply_to_email_address : null
  }

  # Email Verification Message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Verify your account"
    email_message        = "Thank you for signing up! Your verification code is {####}"
  }

  # Account Recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # MFA Configuration (optional for MVP)
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  # User Pool Add-ons (only enable for prod to avoid Plus tier costs in non-prod)
  dynamic "user_pool_add_ons" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      advanced_security_mode = "ENFORCED"
    }
  }

  # Lambda Triggers (conditionally configured)
  dynamic "lambda_config" {
    for_each = var.pre_signup_lambda_arn != "" ? [1] : []
    content {
      pre_sign_up = var.pre_signup_lambda_arn
    }
  }

  # Deletion Protection
  deletion_protection = var.environment == "prod" ? "ACTIVE" : "INACTIVE"

  tags = {
    Name        = "${var.project_name}-users-${var.environment}"
    Environment = var.environment
  }
}

# User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Google Identity Provider (conditionally created if credentials are provided)
# Not enabled for class purposes. Students may configure this later by providing
# google_client_id and google_client_secret -- see https://console.cloud.google.com/apis/credentials
resource "aws_cognito_identity_provider" "google" {
  count         = var.google_client_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "email profile openid"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

# App Client for Web Application (SPA)
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-web-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth Configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = var.google_client_id != "" ? ["COGNITO", "Google"] : ["COGNITO"]

  # Ensure Google IdP is created before the client references it
  depends_on = [aws_cognito_identity_provider.google]

  # Token Validity
  access_token_validity  = 15 # 15 minutes
  id_token_validity      = 15 # 15 minutes
  refresh_token_validity = 7  # 7 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "name",
    "custom:role",
    "custom:userId",
    "custom:username"
  ]

  write_attributes = [
    "email",
    "name"
  ]

  # Security settings
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  # No client secret for public SPA client
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# App Client for Admin Operations (with secret)
resource "aws_cognito_user_pool_client" "admin" {
  name         = "${var.project_name}-admin-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth Configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  # Token Validity
  access_token_validity  = 60 # 60 minutes for admin operations
  id_token_validity      = 60
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "name",
    "custom:role",
    "custom:userId",
    "custom:username"
  ]

  write_attributes = [
    "email",
    "name",
    "custom:role"
  ]

  # Security settings
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  # Generate client secret for confidential client
  generate_secret = true

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]
}

# User Groups
resource "aws_cognito_user_group" "users" {
  name         = "Users"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular users"
  precedence   = 3
}

resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrators with full access to curate and manage content"
  precedence   = 1
}
