# API Gateway Module Outputs

output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_arn" {
  description = "API Gateway REST API ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_endpoint" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_deployment.main.invoke_url
}

output "api_execution_arn" {
  description = "API Gateway execution ARN for Lambda permissions"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "root_resource_id" {
  description = "API Gateway root resource ID"
  value       = aws_api_gateway_rest_api.main.root_resource_id
}

output "authorizer_id" {
  description = "Cognito authorizer ID"
  value       = aws_api_gateway_authorizer.cognito.id
}

output "stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

output "stage_arn" {
  description = "API Gateway stage ARN"
  value       = aws_api_gateway_stage.main.arn
}

output "api_name" {
  description = "API Gateway REST API name"
  value       = aws_api_gateway_rest_api.main.name
}

# Custom Domain Outputs (only available when custom_domain_name is configured)
output "custom_domain_url" {
  description = "Custom domain URL for the API (e.g., https://api.example.com)"
  value       = var.custom_domain_name != "" ? "https://${var.custom_domain_name}" : null
}

output "custom_domain_regional_domain_name" {
  description = "Regional domain name for DNS CNAME/ALIAS record (points to API Gateway)"
  value       = var.custom_domain_name != "" ? aws_api_gateway_domain_name.custom[0].regional_domain_name : null
}

output "custom_domain_regional_zone_id" {
  description = "Regional hosted zone ID for Route53 alias record"
  value       = var.custom_domain_name != "" ? aws_api_gateway_domain_name.custom[0].regional_zone_id : null
}
