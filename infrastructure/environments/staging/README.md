# Mindful AI Sandbox Staging Environment

This directory contains Terraform configuration for the Mindful AI Sandbox staging environment.

## Overview

The staging environment is used for:
- Pre-production testing
- UAT (User Acceptance Testing)
- Integration testing
- Performance testing
- Security audits

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **AWS Permissions**: Admin or appropriate IAM permissions
4. **S3 Backend**: State bucket `your-terraform-state-bucket` must exist
5. **DynamoDB Lock Table**: Table `sandbox-terraform-locks` must exist

## Directory Structure

```
staging/
├── main.tf           # Main infrastructure configuration
├── backend.tf        # S3 backend configuration
├── variables.tf      # Variable definitions
├── terraform.tfvars  # Variable values
├── outputs.tf        # Output values
└── README.md         # This file
```

## Deployment

### Manual Deployment

```bash
# Navigate to staging directory
cd infrastructure/environments/staging

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply changes (with approval)
terraform apply

# Or apply without prompts (use with caution)
terraform apply -auto-approve
```

### Automated Deployment (GitHub Actions)

Staging deploys automatically when:
- Pull request merged to `main` branch
- Manual workflow dispatch

See `.github/workflows/deploy-staging.yml` for configuration.

## Environment Variables

### Required Variables

- `environment`: "staging" (default)
- `project_name`: "sandbox" (default)
- `aws_region`: "us-west-2" (default)

### AWS Resources Created

- **Cognito User Pool**: User authentication
- **DynamoDB Table**: Data storage (sandbox-staging)
- **Lambda Functions**: API handler
- **API Gateway**: REST API with custom domain
- **CloudWatch**: Log groups, alarms, dashboards
- **IAM Roles**: Lambda execution, API Gateway, DynamoDB streams

## Outputs

After deployment, Terraform outputs:

```bash
# View all outputs
terraform output

# View specific output
terraform output api_gateway_invoke_url

# Get JSON output
terraform output -json
```

## Important Outputs

- **API Gateway URL**: Base URL for API requests
- **Cognito User Pool ID**: For frontend configuration
- **Cognito Web Client ID**: For frontend configuration
- **DynamoDB Table Name**: For backend configuration

## Configuration for Frontend

After deployment, update frontend environment variables:

```bash
# In frontend/.env.staging
NEXT_PUBLIC_API_URL=<api_gateway_invoke_url>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<cognito_user_pool_id>
NEXT_PUBLIC_COGNITO_WEB_CLIENT_ID=<cognito_web_client_id>
NEXT_PUBLIC_AWS_REGION=us-west-2
```

## Destruction

**⚠️ WARNING**: This will permanently delete all staging resources and data!

```bash
# Destroy all resources (requires confirmation)
terraform destroy

# Destroy without prompts (use with extreme caution)
terraform destroy -auto-approve
```

## State Management

### Remote State

- **Bucket**: `your-terraform-state-bucket`
- **Key**: `staging/terraform.tfstate`
- **Region**: `us-west-2`
- **Encryption**: Enabled
- **Locking**: DynamoDB table `sandbox-terraform-locks`

### State Commands

```bash
# List resources in state
terraform state list

# Show specific resource
terraform state show module.dynamodb.aws_dynamodb_table.main

# Pull current state
terraform state pull

# Refresh state
terraform refresh
```

## Troubleshooting

### Common Issues

#### Issue: "Error acquiring state lock"

**Cause**: Previous Terraform operation didn't release lock

**Solution**:
```bash
# Check DynamoDB for locks
aws dynamodb scan --table-name sandbox-terraform-locks

# Force unlock (use lock ID from error message)
terraform force-unlock <LOCK_ID>
```

#### Issue: "Backend configuration changed"

**Cause**: Backend configuration was modified

**Solution**:
```bash
# Reinitialize with backend migration
terraform init -reconfigure

# Or migrate state
terraform init -migrate-state
```

#### Issue: "Resource already exists"

**Cause**: Resource exists but not in state (manual creation, failed previous run)

**Solution**:
```bash
# Import existing resource
terraform import module.dynamodb.aws_dynamodb_table.main sandbox-staging

# Or destroy and recreate
terraform destroy -target=module.dynamodb.aws_dynamodb_table.main
terraform apply
```

## Maintenance

### Updating Resources

```bash
# Plan changes
terraform plan -out=tfplan

# Review plan
terraform show tfplan

# Apply planned changes
terraform apply tfplan
```

### Upgrading Terraform Version

```bash
# Upgrade providers
terraform init -upgrade

# Update lock file
terraform providers lock
```

## Security

### Sensitive Outputs

Some outputs are marked `sensitive`:
- Cognito Web Client ID
- Database credentials (if applicable)

View with:
```bash
terraform output -raw cognito_web_client_id
```

### Secrets

Never commit:
- `.terraform/` directory
- `*.tfstate` files
- `*.tfstate.backup` files
- `.terraform.lock.hcl` (committed but can be regenerated)

## Cost Estimation

Estimated monthly cost for staging (on-demand):
- DynamoDB: ~$5
- Lambda: ~$5 (under free tier with moderate usage)
- API Gateway: ~$3.50 (1M requests)
- S3: ~$1
- CloudWatch: ~$3
- Cognito: Free (under 50K MAUs)

**Total**: ~$17.50/month (may vary with usage)

Use AWS Cost Explorer for actual costs.

## Support

For issues or questions:
- Check [Terraform troubleshooting docs](https://www.terraform.io/docs/language/index.html)
- Review AWS service limits
- Contact DevOps team
- Create GitHub issue

## References

- [Main Infrastructure README](../../README.md)
- [Terraform Modules](../../modules/)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
