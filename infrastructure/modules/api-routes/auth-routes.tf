# =============================================================================
# Auth Routes - Explicit Route Definitions
# Phase 1: Public Routes (authorization = "NONE")
# =============================================================================
# This file defines explicit routes for authentication endpoints that were
# previously handled by the {proxy+} catch-all pattern.
# All auth routes are public (no Cognito authorizer required).

# -----------------------------------------------------------------------------
# /auth/refresh - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_refresh" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "refresh"
}

resource "aws_api_gateway_method" "auth_refresh_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_refresh" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_refresh.id
  http_method             = aws_api_gateway_method.auth_refresh_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/refresh - CORS preflight
resource "aws_api_gateway_method" "auth_refresh_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_refresh_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_refresh.id
  http_method             = aws_api_gateway_method.auth_refresh_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# -----------------------------------------------------------------------------
# /auth/logout - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_logout" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
}

resource "aws_api_gateway_method" "auth_logout_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_logout" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_logout.id
  http_method             = aws_api_gateway_method.auth_logout_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/logout - CORS preflight
resource "aws_api_gateway_method" "auth_logout_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_logout_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_logout.id
  http_method             = aws_api_gateway_method.auth_logout_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# -----------------------------------------------------------------------------
# /auth/confirm-signup - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_confirm_signup" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "confirm-signup"
}

resource "aws_api_gateway_method" "auth_confirm_signup_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_confirm_signup.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_confirm_signup" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_confirm_signup.id
  http_method             = aws_api_gateway_method.auth_confirm_signup_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/confirm-signup - CORS preflight
resource "aws_api_gateway_method" "auth_confirm_signup_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_confirm_signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_confirm_signup_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_confirm_signup.id
  http_method             = aws_api_gateway_method.auth_confirm_signup_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# -----------------------------------------------------------------------------
# /auth/forgot-password - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_forgot_password" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "forgot-password"
}

resource "aws_api_gateway_method" "auth_forgot_password_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_forgot_password.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_forgot_password" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_forgot_password.id
  http_method             = aws_api_gateway_method.auth_forgot_password_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/forgot-password - CORS preflight
resource "aws_api_gateway_method" "auth_forgot_password_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_forgot_password.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_forgot_password_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_forgot_password.id
  http_method             = aws_api_gateway_method.auth_forgot_password_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# -----------------------------------------------------------------------------
# /auth/confirm-forgot-password - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_confirm_forgot_password" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "confirm-forgot-password"
}

resource "aws_api_gateway_method" "auth_confirm_forgot_password_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_confirm_forgot_password.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_confirm_forgot_password" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_confirm_forgot_password.id
  http_method             = aws_api_gateway_method.auth_confirm_forgot_password_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/confirm-forgot-password - CORS preflight
resource "aws_api_gateway_method" "auth_confirm_forgot_password_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_confirm_forgot_password.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_confirm_forgot_password_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_confirm_forgot_password.id
  http_method             = aws_api_gateway_method.auth_confirm_forgot_password_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# -----------------------------------------------------------------------------
# /auth/me - Protected (requires auth)
# Note: This endpoint returns user info from the token, so it needs auth
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "auth_me" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "me"
}

resource "aws_api_gateway_method" "auth_me_get" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_me.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "auth_me" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_me.id
  http_method             = aws_api_gateway_method.auth_me_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# OPTIONS /auth/me - CORS preflight
resource "aws_api_gateway_method" "auth_me_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_me.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_me_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.auth_me.id
  http_method             = aws_api_gateway_method.auth_me_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}
