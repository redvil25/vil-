/**
 * S3 bucket for E2E test dashboard data
 * Stores test-history.json file that is fetched by the dashboard
 */

resource "aws_s3_bucket" "dashboard" {
  bucket = "${var.project_name}-test-dashboard-${var.environment}"

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project_name}-test-dashboard-${var.environment}"
      Purpose     = "E2E Test Dashboard Data"
      Environment = var.environment
    }
  )
}

# Enable versioning to keep history
resource "aws_s3_bucket_versioning" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access at bucket level
# Note: Actual values are overridden in staging/main.tf to enable CloudFront OAC access
resource "aws_s3_bucket_public_access_block" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Note: Bucket policy is defined in staging/main.tf to allow CloudFront OAC access

# CORS configuration to allow dashboard to fetch JSON
resource "aws_s3_bucket_cors_configuration" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = [
      "https://*.amplifyapp.com",
      "http://localhost:3000"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle rule to clean up old versions and files
resource "aws_s3_bucket_lifecycle_configuration" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "delete-old-run-files"
    status = "Enabled"

    filter {
      prefix = "runs/"
    }

    expiration {
      days = 30
    }
  }
}
