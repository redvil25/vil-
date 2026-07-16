# CloudWatch Module

This module manages CloudWatch logging, metrics, and alarms.

## Resources Created

- Log groups for each Lambda function
- Custom metrics namespace: `Sandbox/[env]`
- Alarms:
  - Lambda errors (> 10 errors/5min)
  - API Gateway 5xx errors (> 5 errors/5min)
  - DynamoDB throttling
- CloudWatch dashboards for monitoring
- SNS topics for alarm notifications

## Configuration

- Log retention: 30 days (dev), 90 days (prod)
- Log encryption enabled
- X-Ray sampling: 100% (dev), 5% (prod)

## Usage

```hcl
module "cloudwatch" {
  source       = "./modules/cloudwatch"
  environment  = var.environment
  project_name = var.project_name
  lambda_functions = module.lambda.function_arns
}
```

## Outputs

- `log_group_names` - Map of CloudWatch log group names
- `dashboard_url` - CloudWatch dashboard URL
