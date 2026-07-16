# DynamoDB Single-Table Design for Mindful AI Sandbox

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Main DynamoDB Table
resource "aws_dynamodb_table" "main" {
  name         = "${var.project_name}-${var.environment}"
  billing_mode = var.billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  # Enable DynamoDB Streams
  stream_enabled   = true
  stream_view_type = var.stream_view_type

  # Primary Key Attributes
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI Attributes
  attribute {
    name = "CognitoSub"
    type = "S"
  }

  attribute {
    name = "Email"
    type = "S"
  }

  attribute {
    name = "Username"
    type = "S"
  }

  attribute {
    name = "EntityType"
    type = "S"
  }

  # GSI: Cognito Sub Index
  # Use case: Look up user by Cognito sub (for authentication)
  global_secondary_index {
    name            = "CognitoSubIndex"
    hash_key        = "CognitoSub"
    projection_type = "ALL"
  }

  # GSI: Email Index
  # Use case: Look up user by email
  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "Email"
    projection_type = "ALL"
  }

  # GSI: Username Index
  # Use case: Look up user by username
  global_secondary_index {
    name            = "UsernameIndex"
    hash_key        = "Username"
    projection_type = "ALL"
  }

  # GSI: Entity Type Index
  # Use case: Query all items of a specific entity type
  global_secondary_index {
    name            = "EntityTypeIndex"
    hash_key        = "EntityType"
    range_key       = "PK"
    projection_type = "ALL"
  }

  # Add your own GSIs below

  # Point-in-time Recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Encryption at rest (AWS managed key)
  server_side_encryption {
    enabled = true
  }

  # Deletion Protection
  deletion_protection_enabled = var.enable_deletion_protection

  # Time to Live (TTL) - for temporary data like sessions
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
  }
}
