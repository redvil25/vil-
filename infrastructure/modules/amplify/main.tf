# AWS Amplify Hosting Configuration

# Amplify App - Created first, no external dependencies
resource "aws_amplify_app" "main" {
  name       = "${var.project_name}-${var.environment}"
  repository = "https://github.com/${var.github_repository}"

  access_token = var.github_access_token

  platform = "WEB_COMPUTE"

  # Environment variables at the app level (shared across all branches)
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "frontend"
    NEXT_PUBLIC_APP_NAME      = var.app_name
    _LIVE_UPDATES = jsonencode([
      {
        pkg     = "node"
        type    = "nvm"
        version = "22"
      }
    ])
  }

  tags = {
    Name        = "${var.project_name}-amplify-${var.environment}"
    Environment = var.environment
  }
}

# Amplify Branch - Depends on cognito and api-gateway outputs via variables
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.branch_name

  display_name      = var.branch_name
  enable_auto_build = false
  stage             = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
  framework         = "Next.js - SSR"

  # Environment variables specific to this branch
  environment_variables = {
    NEXT_PUBLIC_API_URL              = var.api_gateway_invoke_url
    NEXT_PUBLIC_APP_URL              = "https://${var.branch_name}.${aws_amplify_app.main.id}.amplifyapp.com"
    NEXT_PUBLIC_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    NEXT_PUBLIC_COGNITO_CLIENT_ID    = var.cognito_web_client_id
    NEXT_PUBLIC_COGNITO_DOMAIN       = var.cognito_domain
    NEXT_PUBLIC_COGNITO_REGION       = var.aws_region
    NEXT_PUBLIC_ENVIRONMENT          = var.environment
  }

  tags = {
    Name        = "${var.project_name}-amplify-${var.branch_name}-${var.environment}"
    Environment = var.environment
  }
}
