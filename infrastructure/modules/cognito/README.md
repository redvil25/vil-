# Cognito Module

This module manages Amazon Cognito User Pools for authentication.

## Resources Created

- Cognito User Pool
- User Pool Domain
- App Clients (web, admin)
- User Groups (Readers, Writers, Admins)

## Configuration

- Email-based authentication
- Password policy: 8+ chars, uppercase, lowercase, numbers
- Token expiration: 15 min access, 7 days refresh
- Email verification required

## Usage

```hcl
module "cognito" {
  source       = "./modules/cognito"
  environment  = var.environment
  project_name = var.project_name
}
```

## Outputs

- `user_pool_id` - Cognito User Pool ID
- `user_pool_arn` - Cognito User Pool ARN
- `app_client_id` - App Client ID
