# API Gateway Custom Domain Configuration
# This file configures a custom domain name for the API Gateway
# Only created when custom_domain_name variable is provided

# Custom Domain Name (only created if domain_name is provided)
resource "aws_api_gateway_domain_name" "custom" {
  count = var.custom_domain_name != "" ? 1 : 0

  domain_name              = var.custom_domain_name
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  security_policy = "TLS_1_2"

  tags = {
    Name        = "${var.project_name}-api-domain-${var.environment}"
    Environment = var.environment
  }
}

# Base Path Mapping - Maps the custom domain to the API stage
resource "aws_api_gateway_base_path_mapping" "custom" {
  count = var.custom_domain_name != "" ? 1 : 0

  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.custom[0].domain_name

  # No base path - API is at root of custom domain
  # e.g., https://api.example.com/resources instead of https://api.example.com/v1/resources
}
