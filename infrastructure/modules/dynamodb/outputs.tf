# DynamoDB Module Outputs

output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.main.id
}

output "stream_arn" {
  description = "ARN of the DynamoDB Streams"
  value       = aws_dynamodb_table.main.stream_arn
}

output "stream_label" {
  description = "Label of the DynamoDB Streams"
  value       = aws_dynamodb_table.main.stream_label
}

output "cognito_sub_index_name" {
  description = "Name of the CognitoSub GSI"
  value       = "CognitoSubIndex"
}

output "email_index_name" {
  description = "Name of the Email GSI"
  value       = "EmailIndex"
}

output "username_index_name" {
  description = "Name of the Username GSI"
  value       = "UsernameIndex"
}

output "entity_type_index_name" {
  description = "Name of the EntityType GSI"
  value       = "EntityTypeIndex"
}
