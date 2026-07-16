# IAM Module Main Configuration

# This module creates all IAM roles and policies for the Sandbox application
#
# Resources created:
# - Lambda execution roles (general and DynamoDB Stream-specific)
# - API Gateway CloudWatch logging role
# - IAM policies for DynamoDB, S3, and Cognito access
# - Service-specific roles and policies
#
# The module follows the principle of least privilege, granting only
# necessary permissions for each service to function.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# All role and policy definitions are in separate files:
# - lambda-roles.tf: Lambda execution roles and policies
# - api-gateway-roles.tf: API Gateway roles
# - service-roles.tf: Other service-specific roles
