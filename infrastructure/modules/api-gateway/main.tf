# API Gateway REST API Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Sandbox REST API for ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # Enable binary media types if needed (for file uploads)
  binary_media_types = [
    "multipart/form-data",
    "application/octet-stream"
  ]

  tags = {
    Name        = "${var.project_name}-api-${var.environment}"
    Environment = var.environment
  }
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${var.project_name}-cognito-authorizer-${var.environment}"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
  identity_source = "method.request.header.Authorization"

  # Cache authorizer responses for 5 minutes
  authorizer_result_ttl_in_seconds = 300
}

# API Gateway Account (for CloudWatch Logs)
# This is a regional singleton - only one per AWS account per region.
# Set create_api_gateway_account = false if another environment already manages this.
resource "aws_api_gateway_account" "main" {
  count               = var.create_api_gateway_account ? 1 : 0
  cloudwatch_role_arn = var.api_gateway_cloudwatch_role_arn
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Force new deployment on any API change
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.main.body,
      aws_api_gateway_rest_api.main.root_resource_id,
      var.routes_ready, # Wait for all route integrations to be ready
      timestamp()
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_rest_api.main,
    aws_api_gateway_authorizer.cognito,
    aws_api_gateway_integration.health_mock
  ]
}

# Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  # X-Ray Tracing
  xray_tracing_enabled = var.xray_tracing_enabled

  # Access Logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      ip                      = "$context.identity.sourceIp"
      caller                  = "$context.identity.caller"
      user                    = "$context.identity.user"
      requestTime             = "$context.requestTime"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      status                  = "$context.status"
      protocol                = "$context.protocol"
      responseLength          = "$context.responseLength"
      errorMessage            = "$context.error.message"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  # Stage Variables
  variables = {
    environment = var.environment
  }

  tags = {
    Name        = "${var.project_name}-api-${var.environment}"
    Environment = var.environment
  }

  depends_on = [
    aws_cloudwatch_log_group.api_gateway,
    aws_api_gateway_account.main
  ]
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-api-logs-${var.environment}"
    Environment = var.environment
  }
}

# Method Settings (Logging and Metrics)
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    # Logging
    logging_level      = var.log_level
    data_trace_enabled = var.environment == "dev" ? true : false
    metrics_enabled    = var.metrics_enabled

    # Throttling
    throttling_rate_limit  = var.rate_limit
    throttling_burst_limit = var.burst_limit

    # Caching (disabled for MVP)
    caching_enabled = false
  }
}

# CORS Configuration
# Note: CORS headers are primarily handled in Lambda function responses
# to support dynamic origin validation. These gateway responses provide
# fallback CORS headers for error responses (4xx/5xx) from API Gateway itself.
#
# Security: The wildcard '*' is used here only for gateway error responses.
# Lambda functions MUST implement proper origin validation by:
# 1. Checking the 'Origin' header against allowed_origins list
# 2. Only returning that specific origin in Access-Control-Allow-Origin
# 3. Never using '*' with credentials
#
# For production, configure allowed_origins in your environment variables.

locals {
  # Use the first allowed origin as default, or '*' for dev/local testing
  # Lambda functions should handle origin validation dynamically
  default_cors_origin = length(var.allowed_origins) > 0 ? "'${var.allowed_origins[0]}'" : "'*'"
}

resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    # Lambda functions should validate and return the specific origin
    "gatewayresponse.header.Access-Control-Allow-Origin"      = local.default_cors_origin
    "gatewayresponse.header.Access-Control-Allow-Headers"     = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "gatewayresponse.header.Access-Control-Allow-Methods"     = "'GET,POST,PUT,DELETE,OPTIONS'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = var.environment == "prod" ? "'true'" : "'false'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    # Lambda functions should validate and return the specific origin
    "gatewayresponse.header.Access-Control-Allow-Origin"      = local.default_cors_origin
    "gatewayresponse.header.Access-Control-Allow-Headers"     = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "gatewayresponse.header.Access-Control-Allow-Methods"     = "'GET,POST,PUT,DELETE,OPTIONS'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = var.environment == "prod" ? "'true'" : "'false'"
  }
}

# Health Check Endpoint (placeholder for Phase 1)
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_mock" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = aws_api_gateway_method_response.health_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  response_templates = {
    "application/json" = "{\"status\": \"healthy\", \"environment\": \"${var.environment}\"}"
  }
}

# Request Validators
resource "aws_api_gateway_request_validator" "body_validator" {
  name                        = "${var.project_name}-body-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = false
}

resource "aws_api_gateway_request_validator" "params_validator" {
  name                        = "${var.project_name}-params-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = false
  validate_request_parameters = true
}

resource "aws_api_gateway_request_validator" "all_validator" {
  name                        = "${var.project_name}-all-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# Usage Plans are defined in rate-limiting.tf
