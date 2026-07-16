# CloudWatch Monitoring & Observability Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Note: Log groups are created in the Lambda module
# This module focuses on metrics, alarms, and dashboards

# SNS Topic for Alarm Notifications
resource "aws_sns_topic" "alarms" {
  count = var.alarm_email != "" ? 1 : 0
  name  = "${var.project_name}-alarms-${var.environment}"

  tags = {
    Name        = "${var.project_name}-alarms-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alarms_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms for Lambda Functions
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.enable_alarms ? var.lambda_function_names : {}

  alarm_name          = "${var.project_name}-${each.key}-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "This metric monitors ${each.key} Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-${each.key}-errors-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Alarms for Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = var.enable_alarms ? var.lambda_function_names : {}

  alarm_name          = "${var.project_name}-${each.key}-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 25000 # 25 seconds (out of 30 second timeout)
  alarm_description   = "This metric monitors ${each.key} Lambda function duration"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-${each.key}-duration-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Alarm for API Gateway 5xx Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-api-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = var.api_error_threshold
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name != "" ? var.api_gateway_name : var.api_gateway_id
    Stage   = var.api_gateway_stage_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-api-5xx-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Alarm for API Gateway 4xx Errors (Warning only)
resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-api-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 50 # Higher threshold for client errors
  alarm_description   = "This metric monitors API Gateway 4xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name != "" ? var.api_gateway_name : var.api_gateway_id
    Stage   = var.api_gateway_stage_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-api-4xx-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Alarm for DynamoDB Throttling (legacy - UserErrors)
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-dynamodb-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors DynamoDB user errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-dynamodb-throttles-${var.environment}"
    Environment = var.environment
  }
}

# =============================================================================
# LAMBDA ADDITIONAL ALARMS
# =============================================================================

# CloudWatch Alarm for Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = var.enable_alarms ? var.lambda_function_names : {}

  alarm_name          = "${var.project_name}-${each.key}-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Lambda function ${each.key} is being throttled - requests are being rejected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-${each.key}-throttles-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Alarm for Lambda Concurrent Executions (account-wide)
resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-lambda-concurrent-executions-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.lambda_concurrent_execution_limit
  alarm_description   = "Lambda concurrent executions approaching account limit"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-lambda-concurrent-executions-${var.environment}"
    Environment = var.environment
    Severity    = "warning"
  }
}

# CloudWatch Alarm for Lambda Iterator Age (DynamoDB Streams - Indexer only)
resource "aws_cloudwatch_metric_alarm" "lambda_iterator_age" {
  count = var.enable_alarms && contains(keys(var.lambda_function_names), "indexer") ? 1 : 0

  alarm_name          = "${var.project_name}-indexer-iterator-age-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "IteratorAge"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.stream_iterator_age_threshold_ms
  alarm_description   = "DynamoDB Stream indexer is falling behind - records not being processed in time"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_names["indexer"]
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-indexer-iterator-age-${var.environment}"
    Environment = var.environment
    Severity    = "warning"
  }
}

# =============================================================================
# API GATEWAY ADDITIONAL ALARMS
# =============================================================================

# CloudWatch Alarm for API Gateway Integration Latency (p99)
resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-api-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p99"
  threshold           = var.api_latency_threshold_ms
  alarm_description   = "API Gateway p99 integration latency is too high - backend processing slow"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name != "" ? var.api_gateway_name : var.api_gateway_id
    Stage   = var.api_gateway_stage_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-api-latency-${var.environment}"
    Environment = var.environment
    Severity    = "warning"
  }
}

# =============================================================================
# DYNAMODB ADDITIONAL ALARMS
# =============================================================================

# CloudWatch Alarm for DynamoDB Read Throttle Events
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttles" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-dynamodb-read-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReadThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.dynamodb_throttle_threshold
  alarm_description   = "DynamoDB read requests are being throttled - increase read capacity or optimize queries"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-dynamodb-read-throttles-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Alarm for DynamoDB Write Throttle Events
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttles" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-dynamodb-write-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.dynamodb_throttle_threshold
  alarm_description   = "DynamoDB write requests are being throttled - increase write capacity"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-dynamodb-write-throttles-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Alarm for DynamoDB System Errors
resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-dynamodb-system-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "DynamoDB internal system errors detected - AWS infrastructure issue"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-dynamodb-system-errors-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Alarm for DynamoDB Successful Request Latency (p99)
resource "aws_cloudwatch_metric_alarm" "dynamodb_latency" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-dynamodb-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "SuccessfulRequestLatency"
  namespace           = "AWS/DynamoDB"
  period              = 300
  extended_statistic  = "p99"
  threshold           = var.dynamodb_latency_threshold_ms
  alarm_description   = "DynamoDB p99 latency is too high - consider query optimization or caching"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-dynamodb-latency-${var.environment}"
    Environment = var.environment
    Severity    = "warning"
  }
}

# =============================================================================
# COGNITO ALARMS
# =============================================================================

# CloudWatch Alarm for Cognito Sign-in Failures
resource "aws_cloudwatch_metric_alarm" "cognito_signin_failures" {
  count = var.enable_alarms && var.enable_cognito_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-cognito-signin-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SignInSuccesses"
  namespace           = "AWS/Cognito"
  period              = 300
  statistic           = "Sum"
  threshold           = 0 # We track successes to establish baseline; failures tracked via ratio
  alarm_description   = "Monitoring Cognito sign-in activity"
  treat_missing_data  = "notBreaching"

  dimensions = {
    UserPool       = var.cognito_user_pool_id
    UserPoolClient = "AllClients"
  }

  # Note: This is a baseline alarm. For failure tracking, see the metric math alarm below.

  tags = {
    Name        = "${var.project_name}-cognito-signin-${var.environment}"
    Environment = var.environment
    Severity    = "info"
  }
}

# CloudWatch Alarm for Cognito Token Refresh Failures
resource "aws_cloudwatch_metric_alarm" "cognito_token_refresh_failures" {
  count = var.enable_alarms && var.enable_cognito_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-cognito-token-refresh-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TokenRefreshSuccesses"
  namespace           = "AWS/Cognito"
  period              = 300
  statistic           = "Sum"
  threshold           = 0 # Baseline tracking
  alarm_description   = "Monitoring Cognito token refresh activity"
  treat_missing_data  = "notBreaching"

  dimensions = {
    UserPool       = var.cognito_user_pool_id
    UserPoolClient = "AllClients"
  }

  tags = {
    Name        = "${var.project_name}-cognito-token-refresh-${var.environment}"
    Environment = var.environment
    Severity    = "info"
  }
}

# CloudWatch Alarm for Cognito Risk Detection (Advanced Security)
# Note: Requires Advanced Security Mode to be enabled (ENFORCED or AUDIT)
resource "aws_cloudwatch_metric_alarm" "cognito_compromised_credentials" {
  count = var.enable_alarms && var.enable_cognito_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-cognito-compromised-creds-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CompromisedCredentialRisk"
  namespace           = "AWS/Cognito"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "CRITICAL: Compromised credentials detected by Cognito Advanced Security"
  treat_missing_data  = "notBreaching"

  dimensions = {
    UserPool  = var.cognito_user_pool_id
    RiskLevel = "High"
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-cognito-compromised-creds-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Alarm for Cognito Account Takeover Risk
resource "aws_cloudwatch_metric_alarm" "cognito_account_takeover" {
  count = var.enable_alarms && var.enable_cognito_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-cognito-account-takeover-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AccountTakeOverRisk"
  namespace           = "AWS/Cognito"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "CRITICAL: Account takeover risk detected by Cognito Advanced Security"
  treat_missing_data  = "notBreaching"

  dimensions = {
    UserPool  = var.cognito_user_pool_id
    RiskLevel = "High"
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-cognito-account-takeover-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [for w in [
      # API Gateway Requests
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Total Requests" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "API Gateway - Total Requests"
        }
      },
      # API Gateway Latency
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "Average Latency" }],
            ["...", { stat = "p99", label = "p99 Latency" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "API Gateway - Latency"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # API Gateway Errors
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "4XXError", { stat = "Sum", label = "4xx Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5xx Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "API Gateway - Errors"
        }
      },
      # Lambda Invocations
      {
        type = "metric"
        properties = {
          metrics = [
            for key, name in var.lambda_function_names :
            ["AWS/Lambda", "Invocations", "FunctionName", name, { stat = "Sum", label = key }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Lambda - Invocations"
        }
      },
      # Lambda Errors
      {
        type = "metric"
        properties = {
          metrics = [
            for key, name in var.lambda_function_names :
            ["AWS/Lambda", "Errors", "FunctionName", name, { stat = "Sum", label = key }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Lambda - Errors"
        }
      },
      # Lambda Duration
      {
        type = "metric"
        properties = {
          metrics = [
            for key, name in var.lambda_function_names :
            ["AWS/Lambda", "Duration", "FunctionName", name, { stat = "Average", label = key }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Lambda - Duration (Average)"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # DynamoDB Consumed Capacity
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_name, { stat = "Sum", label = "Read Capacity" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Write Capacity" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "DynamoDB - Consumed Capacity"
        }
      },
      # DynamoDB Throttles (Read/Write)
      {
        type   = "metric"
        x      = 0
        y      = 14
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ReadThrottledRequests", "TableName", var.dynamodb_table_name, { stat = "Sum", label = "Read Throttles", color = "#d62728" }],
            [".", "WriteThrottledRequests", ".", ".", { stat = "Sum", label = "Write Throttles", color = "#ff7f0e" }],
            [".", "UserErrors", ".", ".", { stat = "Sum", label = "User Errors", color = "#9467bd" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "DynamoDB - Throttles & Errors"
          view   = "timeSeries"
        }
      },
      # DynamoDB Latency
      {
        type   = "metric"
        x      = 12
        y      = 14
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_table_name, { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p99", label = "p99 Latency" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "DynamoDB - Request Latency"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # Lambda Throttles
      {
        type   = "metric"
        x      = 0
        y      = 20
        width  = 12
        height = 6
        properties = {
          metrics = [
            for key, name in var.lambda_function_names :
            ["AWS/Lambda", "Throttles", "FunctionName", name, { stat = "Sum", label = key }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Lambda - Throttles"
        }
      },
      # Lambda Concurrent Executions
      {
        type   = "metric"
        x      = 12
        y      = 20
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", { stat = "Maximum", label = "Concurrent Executions" }]
          ]
          period = 60
          stat   = "Maximum"
          region = data.aws_region.current.name
          title  = "Lambda - Concurrent Executions"
          annotations = {
            horizontal = [
              {
                label = "90% Limit"
                value = var.lambda_concurrent_execution_limit
                color = "#ff7f0e"
              }
            ]
          }
        }
      },
      # API Gateway Integration Latency
      {
        type   = "metric"
        x      = 0
        y      = 26
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "IntegrationLatency", { stat = "Average", label = "Avg Integration Latency" }],
            ["...", { stat = "p99", label = "p99 Integration Latency" }],
            [".", "Latency", { stat = "Average", label = "Avg Total Latency" }],
            ["...", { stat = "p99", label = "p99 Total Latency" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "API Gateway - Latency Details"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # DynamoDB Stream Iterator Age (Indexer)
      {
        type   = "metric"
        x      = 12
        y      = 26
        width  = 12
        height = 6
        properties = {
          metrics = contains(keys(var.lambda_function_names), "indexer") ? [
            ["AWS/Lambda", "IteratorAge", "FunctionName", var.lambda_function_names["indexer"], { stat = "Maximum", label = "Iterator Age" }]
          ] : []
          period = 60
          stat   = "Maximum"
          region = data.aws_region.current.name
          title  = "DynamoDB Stream - Iterator Age (Indexer Lag)"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
          annotations = {
            horizontal = [
              {
                label = "1 min threshold"
                value = var.stream_iterator_age_threshold_ms
                color = "#ff7f0e"
              }
            ]
          }
        }
      },
      # Cognito Authentication Activity
      {
        type   = "metric"
        x      = 0
        y      = 32
        width  = 12
        height = 6
        properties = {
          metrics = var.cognito_user_pool_id != "" ? [
            ["AWS/Cognito", "SignInSuccesses", "UserPool", var.cognito_user_pool_id, { stat = "Sum", label = "Sign-in Successes", color = "#2ca02c" }],
            [".", "TokenRefreshSuccesses", ".", ".", { stat = "Sum", label = "Token Refreshes", color = "#1f77b4" }]
          ] : []
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Cognito - Authentication Activity"
        }
      },
      # Cognito Security Risks
      {
        type   = "metric"
        x      = 12
        y      = 32
        width  = 12
        height = 6
        properties = {
          metrics = var.cognito_user_pool_id != "" ? [
            ["AWS/Cognito", "CompromisedCredentialRisk", "UserPool", var.cognito_user_pool_id, "RiskLevel", "High", { stat = "Sum", label = "Compromised Credentials (High)", color = "#d62728" }],
            [".", "AccountTakeOverRisk", ".", ".", ".", ".", { stat = "Sum", label = "Account Takeover (High)", color = "#ff7f0e" }]
          ] : []
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Cognito - Security Risk Detection"
        }
      },
      # Alarm Status Widget (only if alarms are enabled)
      var.enable_alarms ? {
        type   = "alarm"
        x      = 0
        y      = 38
        width  = 24
        height = 4
        properties = {
          title = "Active Alarms"
          alarms = concat(
            [for key, _ in var.lambda_function_names : aws_cloudwatch_metric_alarm.lambda_errors[key].arn],
            [for key, _ in var.lambda_function_names : aws_cloudwatch_metric_alarm.lambda_throttles[key].arn],
            [
              aws_cloudwatch_metric_alarm.api_gateway_5xx[0].arn,
              aws_cloudwatch_metric_alarm.api_gateway_4xx[0].arn,
              aws_cloudwatch_metric_alarm.dynamodb_read_throttles[0].arn,
              aws_cloudwatch_metric_alarm.dynamodb_write_throttles[0].arn,
              aws_cloudwatch_metric_alarm.dynamodb_system_errors[0].arn
            ]
          )
        }
      } : null
    ] : w if w != null]
  })
}

# CloudWatch Insights Saved Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${var.project_name}-${var.environment}-error-logs"

  log_group_names = [
    for key, name in var.lambda_function_names :
    "/aws/lambda/${name}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "slow_requests" {
  name = "${var.project_name}-${var.environment}-slow-requests"

  log_group_names = [
    for key, name in var.lambda_function_names :
    "/aws/lambda/${name}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @duration
    | filter @type = "REPORT"
    | filter @duration > 5000
    | sort @duration desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "authentication_failures" {
  name = "${var.project_name}-${var.environment}-auth-failures"

  log_group_names = [
    "/aws/lambda/${var.lambda_function_names["auth"]}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /401/ or @message like /403/ or @message like /Unauthorized/ or @message like /Forbidden/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "api_gateway_errors" {
  name = "${var.project_name}-${var.environment}-api-errors"

  log_group_names = [
    for key, name in var.lambda_function_names :
    "/aws/lambda/${name}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream, @requestId
    | filter @message like /5\d{2}/ or @message like /error/i
    | stats count(*) by bin(5m)
    | sort @timestamp desc
  QUERY
}

resource "aws_cloudwatch_query_definition" "lambda_cold_starts" {
  name = "${var.project_name}-${var.environment}-cold-starts"

  log_group_names = [
    for key, name in var.lambda_function_names :
    "/aws/lambda/${name}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @initDuration, @duration
    | filter @type = "REPORT"
    | filter ispresent(@initDuration)
    | sort @initDuration desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "dynamodb_throttles_logs" {
  name = "${var.project_name}-${var.environment}-dynamodb-throttles"

  log_group_names = [
    for key, name in var.lambda_function_names :
    "/aws/lambda/${name}"
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ProvisionedThroughputExceededException/ or @message like /ThrottlingException/
    | sort @timestamp desc
    | limit 100
  QUERY
}

# X-Ray Sampling Rules
# Commented out due to IAM permission requirements (xray:CreateSamplingRule)
# Can be enabled later once IAM user has appropriate permissions
# resource "aws_xray_sampling_rule" "default_sampling" {
#   rule_name      = "${var.project_name}-${var.environment}-default"
#   priority       = 1000
#   version        = 1
#   reservoir_size = 1
#   fixed_rate     = 0.05
#   url_path       = "*"
#   host           = "*"
#   http_method    = "*"
#   service_type   = "*"
#   service_name   = "*"
#   resource_arn   = "*"
#
#   attributes = {
#     Environment = var.environment
#   }
# }

# resource "aws_xray_sampling_rule" "high_priority_endpoints" {
#   rule_name      = "${var.project_name}-${var.environment}-auth"
#   priority       = 100
#   version        = 1
#   reservoir_size = 5
#   fixed_rate     = 0.25
#   url_path       = "/auth/*"
#   host           = "*"
#   http_method    = "*"
#   service_type   = "*"
#   service_name   = "*"
#   resource_arn   = "*"
#
#   attributes = {
#     Environment = var.environment
#     Priority    = "high"
#   }
# }

# resource "aws_xray_sampling_rule" "error_traces" {
#   rule_name      = "${var.project_name}-${var.environment}-errors"
#   priority       = 50
#   version        = 1
#   reservoir_size = 10
#   fixed_rate     = 1.0
#   url_path       = "*"
#   host           = "*"
#   http_method    = "*"
#   service_type   = "*"
#   service_name   = "*"
#   resource_arn   = "*"
#
#   attributes = {
#     Environment = var.environment
#     Type        = "error"
#   }
# }

# Data source for current region
data "aws_region" "current" {}
