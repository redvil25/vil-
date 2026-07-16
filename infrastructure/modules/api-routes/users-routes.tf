# =============================================================================
# Users Routes - Explicit Route Definitions
# Phase 1: Public Routes (authorization = "NONE")
# =============================================================================
# This file defines explicit routes for public user profile endpoints.

# -----------------------------------------------------------------------------
# /users resource
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "users" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "users"
}

# -----------------------------------------------------------------------------
# /users/{userId} - Public
# -----------------------------------------------------------------------------
resource "aws_api_gateway_resource" "user" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{userId}"
}

# GET /users/{userId} - Public (get any user's public profile)
resource "aws_api_gateway_method" "user_get" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.user.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_integration" "user_get" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.user.id
  http_method             = aws_api_gateway_method.user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn

  request_parameters = {
    "integration.request.path.userId" = "method.request.path.userId"
  }
}

# OPTIONS /users/{userId} - CORS preflight
resource "aws_api_gateway_method" "user_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.user.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_options" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.user.id
  http_method             = aws_api_gateway_method.user_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}
