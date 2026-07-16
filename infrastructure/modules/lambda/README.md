# Lambda Module

This module manages AWS Lambda functions for the Sandbox backend.

## Resources Created

- Lambda functions:
  - `sandbox-api-[env]` - API handler
- Lambda layers for shared dependencies
- Lambda execution roles (via IAM module)

## Configuration

- Runtime: Node.js 20.x
- Memory: 512MB (adjustable)
- Timeout: 30s (API), 5min (background)
- X-Ray tracing enabled

## Usage

```hcl
module "lambda" {
  source             = "./modules/lambda"
  environment        = var.environment
  project_name       = var.project_name
  dynamodb_table_name = module.dynamodb.table_name
  cognito_user_pool_id = module.cognito.user_pool_id
}
```

## Outputs

- `function_arns` - Map of Lambda function ARNs
