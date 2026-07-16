# DynamoDB Module

This module manages DynamoDB tables for the Sandbox application.

## Resources Created

- Single table: `sandbox-[env]`
- DynamoDB Streams for indexing

## Table Schema

- Partition Key: `PK` (String)
- Sort Key: `SK` (String)
- Billing Mode: On-demand
- Encryption: AWS managed keys

## Usage

```hcl
module "dynamodb" {
  source       = "./modules/dynamodb"
  environment  = var.environment
  project_name = var.project_name
}
```

## Outputs

- `table_name` - DynamoDB table name
- `table_arn` - DynamoDB table ARN
- `stream_arn` - DynamoDB Streams ARN
