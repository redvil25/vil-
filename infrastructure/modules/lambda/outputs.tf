# Lambda Module Outputs

output "auth_function_arn" {
  description = "ARN of the auth Lambda function"
  value       = aws_lambda_function.auth.arn
}

output "auth_function_name" {
  description = "Name of the auth Lambda function"
  value       = aws_lambda_function.auth.function_name
}

output "auth_invoke_arn" {
  description = "Invoke ARN of the auth Lambda function"
  value       = aws_lambda_function.auth.invoke_arn
}

output "admin_function_arn" {
  description = "ARN of the admin Lambda function"
  value       = aws_lambda_function.admin.arn
}

output "admin_function_name" {
  description = "Name of the admin Lambda function"
  value       = aws_lambda_function.admin.function_name
}

output "admin_invoke_arn" {
  description = "Invoke ARN of the admin Lambda function"
  value       = aws_lambda_function.admin.invoke_arn
}

output "profile_function_arn" {
  description = "ARN of the profile Lambda function"
  value       = aws_lambda_function.profile.arn
}

output "profile_function_name" {
  description = "Name of the profile Lambda function"
  value       = aws_lambda_function.profile.function_name
}

output "profile_invoke_arn" {
  description = "Invoke ARN of the profile Lambda function"
  value       = aws_lambda_function.profile.invoke_arn
}

output "pre_signup_function_arn" {
  description = "ARN of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.arn
}

output "pre_signup_function_name" {
  description = "Name of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.function_name
}

output "pre_signup_invoke_arn" {
  description = "Invoke ARN of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.invoke_arn
}

output "all_function_arns" {
  description = "Map of all Lambda function ARNs"
  value = {
    auth       = aws_lambda_function.auth.arn
    admin      = aws_lambda_function.admin.arn
    profile    = aws_lambda_function.profile.arn
    pre_signup = aws_lambda_function.pre_signup.arn
  }
}

output "all_invoke_arns" {
  description = "Map of all Lambda function invoke ARNs"
  value = {
    auth       = aws_lambda_function.auth.invoke_arn
    admin      = aws_lambda_function.admin.invoke_arn
    profile    = aws_lambda_function.profile.invoke_arn
    pre_signup = aws_lambda_function.pre_signup.invoke_arn
  }
}
