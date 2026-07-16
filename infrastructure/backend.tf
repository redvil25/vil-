# Terraform Backend Configuration
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    # TODO: Create your own S3 bucket for Terraform state and update this value
    bucket  = "mindful-ai-sandbox-state-782700525721"
    key     = "terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
    # TODO: Create your own DynamoDB table for Terraform state locking and update this value
    dynamodb_table = "mindful-ai-sandbox-state-782700525721-locks"
  }
}
