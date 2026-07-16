# Networking Module

This module manages VPC and networking resources (if needed).

## Resources Created

Currently, this module is a placeholder as the MVP uses serverless services that don't require custom VPC configuration.

Future resources may include:
- VPC for Lambda functions
- Private subnets
- NAT Gateways
- VPC Endpoints for AWS services

## Usage

```hcl
module "networking" {
  source       = "./modules/networking"
  environment  = var.environment
  project_name = var.project_name
}
```

## Notes

For MVP, Lambda functions run in the default VPC. This module will be populated when VPC isolation is required.
