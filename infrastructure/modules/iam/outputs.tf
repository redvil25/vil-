# IAM Module Outputs

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "api_gateway_cloudwatch_role_arn" {
  description = "ARN of the API Gateway CloudWatch role"
  value       = aws_iam_role.api_gateway_cloudwatch.arn
}

output "dynamodb_stream_role_arn" {
  description = "ARN of the DynamoDB Stream Lambda role"
  value       = aws_iam_role.dynamodb_stream_lambda.arn
}

output "dynamodb_stream_role_name" {
  description = "Name of the DynamoDB Stream Lambda role"
  value       = aws_iam_role.dynamodb_stream_lambda.name
}
