# API Gateway Module

This module manages the REST API Gateway for Sandbox.

## Resources Created

- REST API: `sandbox-api-[env]`
- Cognito authorizer
- API Gateway stages (dev/staging/prod)
- CORS configuration
- CloudWatch logging
- Request/response validation

## Configuration

- Throttling: 1000 req/s rate, 2000 burst
- Authorization: Cognito JWT
- Logging level: INFO (dev), ERROR (prod)
- X-Ray tracing enabled

## Usage

```hcl
module "api_gateway" {
  source             = "./modules/api-gateway"
  environment        = var.environment
  project_name       = var.project_name
  cognito_user_pool_arn = module.cognito.user_pool_arn
  lambda_invoke_arns = module.lambda.function_arns
}
```

## Outputs

- `api_id` - API Gateway ID
- `api_endpoint` - API Gateway invoke URL
- `authorizer_id` - Cognito authorizer ID
