# Service-Specific IAM Roles and Policies

# Note: DynamoDB Streams role is defined in lambda-roles.tf as it's a Lambda execution role

# S3 Bucket Policies for CloudFront Access
# This file contains policy documents that can be used by the S3 module

# CloudFront Origin Access Identity (OAI) Policy Document
# This will be used by the S3 module to create bucket policies
data "aws_iam_policy_document" "cloudfront_s3_access" {
  statement {
    sid    = "CloudFrontGetObject"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = length(var.s3_bucket_arns) > 0 ? ["${var.s3_bucket_arns[0]}/*"] : ["arn:aws:s3:::placeholder/*"]

    # Condition will be added by S3 module with specific CloudFront distribution
    # condition {
    #   test     = "StringEquals"
    #   variable = "AWS:SourceArn"
    #   values   = [cloudfront_distribution_arn]
    # }
  }
}

# Policy for Lambda to assume roles (if needed for cross-account access)
# Currently using trust policies defined in lambda-roles.tf

# Additional service roles can be added here as needed
# Examples:
# - EventBridge scheduler roles
# - Step Functions state machine roles
# - SNS/SQS service roles
