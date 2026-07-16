# API Gateway Routes Module
# Creates API Gateway resources, methods, and Lambda integrations
# This module configures all API routes for the Sandbox platform

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# /auth resource
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "auth"
}

# /auth/login
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

resource "aws_lambda_permission" "auth_login" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.auth_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# /auth/register
resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

resource "aws_api_gateway_method" "auth_register_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# /auth/{proxy+} - Catch-all for other auth endpoints
resource "aws_api_gateway_resource" "auth_proxy" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "auth_proxy_any" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.auth_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_proxy" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.auth_proxy.id
  http_method = aws_api_gateway_method.auth_proxy_any.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arn
}

# /me resource (for current user endpoints)
resource "aws_api_gateway_resource" "me" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "me"
}

# /me GET method (for current user profile) - Protected
resource "aws_api_gateway_method" "me_get" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.me.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "me_get" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.me.id
  http_method = aws_api_gateway_method.me_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}

# /me PUT method (for updating current user profile) - Protected
resource "aws_api_gateway_method" "me_put" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.me.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "me_put" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.me.id
  http_method = aws_api_gateway_method.me_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}

# /me OPTIONS method (CORS preflight)
resource "aws_api_gateway_method" "me_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.me.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "me_options" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.me.id
  http_method = aws_api_gateway_method.me_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}

# /me/{proxy+}
resource "aws_api_gateway_resource" "me_proxy" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.me.id
  path_part   = "{proxy+}"
}

# ANY /me/{proxy+} - Protected (catch-all for other /me/* routes)
resource "aws_api_gateway_method" "me_proxy_any" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.me_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "me_proxy" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.me_proxy.id
  http_method = aws_api_gateway_method.me_proxy_any.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}

# /me/{proxy+} OPTIONS method (CORS preflight)
resource "aws_api_gateway_method" "me_proxy_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.me_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "me_proxy_options" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.me_proxy.id
  http_method = aws_api_gateway_method.me_proxy_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.profile_lambda_invoke_arn
}

# Lambda permission for profile endpoints
resource "aws_lambda_permission" "profile" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.profile_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# /admin resource
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "admin"
}

# /admin/{proxy+}
resource "aws_api_gateway_resource" "admin_proxy" {
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "{proxy+}"
}

# ANY /admin/{proxy+} - Protected (admin routes require authentication)
resource "aws_api_gateway_method" "admin_proxy_any" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.admin_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "admin_proxy" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_proxy_any.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.admin_lambda_invoke_arn
}

# /admin/{proxy+} OPTIONS method (CORS preflight)
resource "aws_api_gateway_method" "admin_proxy_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.admin_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "admin_proxy_options" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_proxy_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.admin_lambda_invoke_arn
}

resource "aws_lambda_permission" "admin" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.admin_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}
