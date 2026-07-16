# Lambda Execution Role and Policies

# Base Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name               = "${var.project_name}-lambda-execution-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.project_name}-lambda-execution-${var.environment}"
    Environment = var.environment
  }
}

# Trust policy for Lambda to assume the role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Attach AWS managed policy for basic Lambda execution (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach AWS managed policy for X-Ray tracing
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Custom policy for DynamoDB access
resource "aws_iam_policy" "lambda_dynamodb" {
  name        = "${var.project_name}-lambda-dynamodb-${var.environment}"
  description = "Allow Lambda functions to access DynamoDB"
  policy      = data.aws_iam_policy_document.lambda_dynamodb.json
}

data "aws_iam_policy_document" "lambda_dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:DescribeTable"
    ]
    # Scoped to specific DynamoDB table ARN passed via variable
    # /index/* pattern required to access all GSIs on the table
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*"
    ]
  }
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

# Custom policy for S3 access
resource "aws_iam_policy" "lambda_s3" {
  name        = "${var.project_name}-lambda-s3-${var.environment}"
  description = "Allow Lambda functions to access S3 buckets"
  policy      = data.aws_iam_policy_document.lambda_s3.json
}

data "aws_iam_policy_document" "lambda_s3" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    # Scoped to specific S3 bucket ARNs passed via variable
    # /* pattern required to access all objects within the buckets
    # When ARN is "*" (wildcard), skip appending "/*" to avoid invalid "*/*"
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = flatten([
      var.s3_bucket_arns,
      [for arn in var.s3_bucket_arns : "${arn}/*" if arn != "*"]
    ])
  }
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

# Custom policy for Cognito access
resource "aws_iam_policy" "lambda_cognito" {
  name        = "${var.project_name}-lambda-cognito-${var.environment}"
  description = "Allow Lambda functions to interact with Cognito"
  policy      = data.aws_iam_policy_document.lambda_cognito.json
}

data "aws_iam_policy_document" "lambda_cognito" {
  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminResetUserPassword",
      "cognito-idp:ListUsers",
      "cognito-idp:ListGroups"
    ]
    # Scoped to specific Cognito User Pool ARN passed via variable
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = [var.cognito_user_pool_arn]
  }
}

resource "aws_iam_role_policy_attachment" "lambda_cognito" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_cognito.arn
}

# DynamoDB Stream Lambda Role (separate role for indexing Lambda)
resource "aws_iam_role" "dynamodb_stream_lambda" {
  name               = "${var.project_name}-dynamodb-stream-lambda-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.project_name}-dynamodb-stream-lambda-${var.environment}"
    Environment = var.environment
  }
}

# Attach basic execution policy for Stream Lambda
resource "aws_iam_role_policy_attachment" "stream_lambda_basic_execution" {
  role       = aws_iam_role.dynamodb_stream_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach X-Ray policy for Stream Lambda
resource "aws_iam_role_policy_attachment" "stream_lambda_xray" {
  role       = aws_iam_role.dynamodb_stream_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Custom policy for DynamoDB Streams
resource "aws_iam_policy" "dynamodb_stream" {
  name        = "${var.project_name}-dynamodb-stream-${var.environment}"
  description = "Allow Lambda to read from DynamoDB Streams"
  policy      = data.aws_iam_policy_document.dynamodb_stream.json
}

data "aws_iam_policy_document" "dynamodb_stream" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ]
    # DynamoDB Streams require wildcard - stream ARNs are dynamically generated with timestamps
    # Already scoped to specific table, this is AWS best practice
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = ["${var.dynamodb_table_arn}/stream/*"]
  }
}

resource "aws_iam_role_policy_attachment" "dynamodb_stream" {
  role       = aws_iam_role.dynamodb_stream_lambda.name
  policy_arn = aws_iam_policy.dynamodb_stream.arn
}

# --- CloudWatch Metrics ---

data "aws_iam_policy_document" "lambda_cloudwatch_metrics" {
  statement {
    effect  = "Allow"
    actions = ["cloudwatch:PutMetricData"]
    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_cloudwatch_metrics" {
  name        = "${var.project_name}-lambda-cloudwatch-metrics-${var.environment}"
  description = "Allow Lambda functions to publish custom CloudWatch metrics"
  policy      = data.aws_iam_policy_document.lambda_cloudwatch_metrics.json
}

resource "aws_iam_role_policy_attachment" "lambda_cloudwatch_metrics" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_metrics.arn
}
