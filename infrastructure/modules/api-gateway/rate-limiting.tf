# API Gateway Usage Plans for Rate Limiting
# This provides basic rate limiting and throttling for the API

# Usage Plan for Anonymous Users (Limited)
resource "aws_api_gateway_usage_plan" "anonymous" {
  count = var.enable_rate_limiting ? 1 : 0

  name        = "${var.project_name}-anonymous-${var.environment}"
  description = "Rate limit for anonymous/unauthenticated users"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = var.anonymous_daily_limit # 100 requests/day
    offset = 0
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.anonymous_burst_limit # 5 requests/second burst
    rate_limit  = var.anonymous_rate_limit  # 2 requests/second sustained
  }

  tags = {
    Name        = "${var.project_name}-anonymous-usage-plan-${var.environment}"
    Environment = var.environment
  }
}

# Usage Plan for Authenticated Users (Higher limits)
resource "aws_api_gateway_usage_plan" "authenticated" {
  count = var.enable_rate_limiting ? 1 : 0

  name        = "${var.project_name}-authenticated-${var.environment}"
  description = "Rate limit for authenticated users"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = var.authenticated_daily_limit # 1000 requests/day
    offset = 0
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.authenticated_burst_limit # 10 requests/second burst
    rate_limit  = var.authenticated_rate_limit  # 5 requests/second sustained
  }

  tags = {
    Name        = "${var.project_name}-authenticated-usage-plan-${var.environment}"
    Environment = var.environment
  }
}

# Note: API Keys and UsagePlanKeys would be created dynamically by the application
# or manually for specific integrations. For Cognito-authenticated users,
# rate limiting is enforced at the API Gateway stage level via the usage plans above.
