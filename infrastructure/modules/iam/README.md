# IAM Module

This module manages IAM roles and policies for the Sandbox application.

## Resources Created

- Lambda execution roles
- API Gateway roles
- DynamoDB access policies
- S3 access policies
- Cognito access policies

## Usage

```hcl
module "iam" {
  source       = "./modules/iam"
  environment  = var.environment
  project_name = var.project_name
}
```

## Outputs

- `lambda_execution_role_arn` - ARN of the Lambda execution role
- `api_gateway_role_arn` - ARN of the API Gateway role
