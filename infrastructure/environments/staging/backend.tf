# Terraform Backend Configuration for Staging
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    bucket         = "mindful-ai-sandbox-state-782700525721" # TODO: Update with your S3 state bucket name
    key            = "staging/terraform.tfstate"   # Separate state file for staging
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "mindful-ai-sandbox-state-782700525721-locks" # TODO: Update with your DynamoDB locks table name
  }
}
