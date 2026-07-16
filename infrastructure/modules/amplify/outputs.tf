# Amplify Module Outputs

output "app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.main.id
}

output "app_arn" {
  description = "Amplify App ARN"
  value       = aws_amplify_app.main.arn
}

output "default_domain" {
  description = "Amplify default domain (e.g., d1abc2def3.amplifyapp.com)"
  value       = aws_amplify_app.main.default_domain
}

output "branch_name" {
  description = "Deployed branch name"
  value       = aws_amplify_branch.main.branch_name
}

output "app_url" {
  description = "Full URL of the deployed application"
  value       = "https://${var.branch_name}.${aws_amplify_app.main.id}.amplifyapp.com"
}
