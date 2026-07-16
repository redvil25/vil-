# Cognito Module Outputs

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Cognito User Pool endpoint"
  value       = aws_cognito_user_pool.main.endpoint
}

output "web_client_id" {
  description = "App Client ID for web application"
  value       = aws_cognito_user_pool_client.web.id
}


output "admin_client_id" {
  description = "App Client ID for admin operations"
  value       = aws_cognito_user_pool_client.admin.id
}

output "admin_client_secret" {
  description = "App Client Secret for admin operations"
  value       = aws_cognito_user_pool_client.admin.client_secret
  sensitive   = true
}

output "user_pool_domain" {
  description = "Cognito User Pool domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "hosted_ui_domain" {
  description = "Full Cognito Hosted UI domain URL for OAuth flows"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "users_group_name" {
  description = "Name of the Users user group"
  value       = aws_cognito_user_group.users.name
}

output "admins_group_name" {
  description = "Name of the Admins user group"
  value       = aws_cognito_user_group.admins.name
}
