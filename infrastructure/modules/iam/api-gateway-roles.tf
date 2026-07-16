# API Gateway IAM Roles and Policies

# Data sources for constructing ARNs
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# CloudWatch Logs Role for API Gateway
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name               = "${var.project_name}-api-gateway-cloudwatch-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.api_gateway_assume_role.json

  tags = {
    Name        = "${var.project_name}-api-gateway-cloudwatch-${var.environment}"
    Environment = var.environment
  }
}

# Trust policy for API Gateway to assume the role
data "aws_iam_policy_document" "api_gateway_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Custom policy for API Gateway CloudWatch Logs
resource "aws_iam_policy" "api_gateway_cloudwatch" {
  name        = "${var.project_name}-api-gateway-cloudwatch-${var.environment}"
  description = "Allow API Gateway to write logs to CloudWatch"
  policy      = data.aws_iam_policy_document.api_gateway_cloudwatch.json
}

data "aws_iam_policy_document" "api_gateway_cloudwatch" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    # API Gateway Account is a regional singleton that validates role permissions
    # at assignment time. AWS requires broad log resource access for this role.
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*",
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*:log-stream:*"
    ]
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = aws_iam_policy.api_gateway_cloudwatch.arn
}

# Note: API Gateway doesn't need a separate role to invoke Lambda
# Lambda resource-based policies will grant API Gateway invoke permissions
# This is configured in the Lambda module or API Gateway module
