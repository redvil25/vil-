# API Routes Module Outputs

output "auth_resource_id" {
  description = "Auth resource ID"
  value       = aws_api_gateway_resource.auth.id
}

output "admin_resource_id" {
  description = "Admin resource ID"
  value       = aws_api_gateway_resource.admin.id
}

output "me_resource_id" {
  description = "Me resource ID"
  value       = aws_api_gateway_resource.me.id
}

# Deployment dependency - forces API Gateway deployment to wait for all routes
output "routes_ready" {
  description = "Indicates that all API routes, methods, and integrations are ready"
  value = sha1(join("", [
    # Auth routes
    aws_api_gateway_integration.auth_login.id,
    aws_api_gateway_integration.auth_register.id,
    aws_api_gateway_integration.auth_proxy.id,

    # Me routes
    aws_api_gateway_integration.me_get.id,
    aws_api_gateway_integration.me_options.id,
    aws_api_gateway_integration.me_proxy.id,
    aws_api_gateway_integration.me_proxy_options.id,

    # Admin routes
    aws_api_gateway_integration.admin_proxy.id,
    aws_api_gateway_integration.admin_proxy_options.id,

    # Users routes
    aws_api_gateway_integration.user_get.id,
    aws_api_gateway_integration.user_options.id,
  ]))
}
