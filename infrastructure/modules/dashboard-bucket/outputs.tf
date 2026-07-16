output "bucket_name" {
  description = "Name of the dashboard S3 bucket"
  value       = aws_s3_bucket.dashboard.id
}

output "bucket_arn" {
  description = "ARN of the dashboard S3 bucket"
  value       = aws_s3_bucket.dashboard.arn
}

output "bucket_url" {
  description = "URL of the dashboard S3 bucket (S3 direct - use CloudFront URL for public access)"
  value       = "https://${aws_s3_bucket.dashboard.bucket}.s3.${aws_s3_bucket.dashboard.region}.amazonaws.com"
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the bucket (for CloudFront origin)"
  value       = aws_s3_bucket.dashboard.bucket_regional_domain_name
}

output "test_history_url" {
  description = "URL of the test-history.json file (S3 direct - use CloudFront URL for public access)"
  value       = "https://${aws_s3_bucket.dashboard.bucket}.s3.${aws_s3_bucket.dashboard.region}.amazonaws.com/test-history.json"
}
