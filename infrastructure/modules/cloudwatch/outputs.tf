# CloudWatch Module Outputs

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = var.alarm_email != "" ? aws_sns_topic.alarms[0].arn : null
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_group_names" {
  description = "Map of CloudWatch log group names"
  value = {
    for key, name in var.lambda_function_names :
    key => "/aws/lambda/${name}"
  }
}

output "insights_query_ids" {
  description = "Map of CloudWatch Insights saved query IDs"
  value = {
    error_logs              = aws_cloudwatch_query_definition.error_logs.query_definition_id
    slow_requests           = aws_cloudwatch_query_definition.slow_requests.query_definition_id
    authentication_failures = aws_cloudwatch_query_definition.authentication_failures.query_definition_id
    api_gateway_errors      = aws_cloudwatch_query_definition.api_gateway_errors.query_definition_id
    lambda_cold_starts      = aws_cloudwatch_query_definition.lambda_cold_starts.query_definition_id
    dynamodb_throttles      = aws_cloudwatch_query_definition.dynamodb_throttles_logs.query_definition_id
  }
}

# =============================================================================
# ALARM ARNs - Grouped by Service
# Note: These outputs return null/empty when enable_alarms = false
# =============================================================================

output "lambda_alarm_arns" {
  description = "Map of Lambda-related alarm ARNs (null when alarms disabled)"
  value = var.enable_alarms ? {
    errors = {
      for key, alarm in aws_cloudwatch_metric_alarm.lambda_errors :
      key => alarm.arn
    }
    duration = {
      for key, alarm in aws_cloudwatch_metric_alarm.lambda_duration :
      key => alarm.arn
    }
    throttles = {
      for key, alarm in aws_cloudwatch_metric_alarm.lambda_throttles :
      key => alarm.arn
    }
    concurrent_executions = aws_cloudwatch_metric_alarm.lambda_concurrent_executions[0].arn
    iterator_age          = length(aws_cloudwatch_metric_alarm.lambda_iterator_age) > 0 ? aws_cloudwatch_metric_alarm.lambda_iterator_age[0].arn : null
  } : null
}

output "api_gateway_alarm_arns" {
  description = "Map of API Gateway-related alarm ARNs (null when alarms disabled)"
  value = var.enable_alarms ? {
    errors_5xx = aws_cloudwatch_metric_alarm.api_gateway_5xx[0].arn
    errors_4xx = aws_cloudwatch_metric_alarm.api_gateway_4xx[0].arn
    latency    = aws_cloudwatch_metric_alarm.api_gateway_latency[0].arn
  } : null
}

output "dynamodb_alarm_arns" {
  description = "Map of DynamoDB-related alarm ARNs (null when alarms disabled)"
  value = var.enable_alarms ? {
    user_errors     = aws_cloudwatch_metric_alarm.dynamodb_throttles[0].arn
    read_throttles  = aws_cloudwatch_metric_alarm.dynamodb_read_throttles[0].arn
    write_throttles = aws_cloudwatch_metric_alarm.dynamodb_write_throttles[0].arn
    system_errors   = aws_cloudwatch_metric_alarm.dynamodb_system_errors[0].arn
    latency         = aws_cloudwatch_metric_alarm.dynamodb_latency[0].arn
  } : null
}

output "cognito_alarm_arns" {
  description = "Map of Cognito-related alarm ARNs (null when alarms disabled)"
  value = var.enable_alarms ? {
    signin_activity         = length(aws_cloudwatch_metric_alarm.cognito_signin_failures) > 0 ? aws_cloudwatch_metric_alarm.cognito_signin_failures[0].arn : null
    token_refresh_activity  = length(aws_cloudwatch_metric_alarm.cognito_token_refresh_failures) > 0 ? aws_cloudwatch_metric_alarm.cognito_token_refresh_failures[0].arn : null
    compromised_credentials = length(aws_cloudwatch_metric_alarm.cognito_compromised_credentials) > 0 ? aws_cloudwatch_metric_alarm.cognito_compromised_credentials[0].arn : null
    account_takeover        = length(aws_cloudwatch_metric_alarm.cognito_account_takeover) > 0 ? aws_cloudwatch_metric_alarm.cognito_account_takeover[0].arn : null
  } : null
}

output "all_critical_alarm_arns" {
  description = "List of all critical severity alarm ARNs for alerting integrations (empty when alarms disabled)"
  value = var.enable_alarms ? concat(
    [for key, alarm in aws_cloudwatch_metric_alarm.lambda_errors : alarm.arn],
    [for key, alarm in aws_cloudwatch_metric_alarm.lambda_throttles : alarm.arn],
    [
      aws_cloudwatch_metric_alarm.api_gateway_5xx[0].arn,
      aws_cloudwatch_metric_alarm.dynamodb_read_throttles[0].arn,
      aws_cloudwatch_metric_alarm.dynamodb_write_throttles[0].arn,
      aws_cloudwatch_metric_alarm.dynamodb_system_errors[0].arn,
    ],
    var.cognito_user_pool_id != "" ? [
      aws_cloudwatch_metric_alarm.cognito_compromised_credentials[0].arn,
      aws_cloudwatch_metric_alarm.cognito_account_takeover[0].arn,
    ] : []
  ) : []
}

output "alarms_enabled" {
  description = "Whether CloudWatch alarms are enabled for this environment"
  value       = var.enable_alarms
}

# =============================================================================
# HEALTH CHECK OUTPUTS
# =============================================================================

output "health_check_id" {
  description = "Route 53 Health Check ID (null when health check disabled)"
  value       = var.enable_health_check ? aws_route53_health_check.api[0].id : null
}

output "health_check_alarm_arn" {
  description = "CloudWatch alarm ARN for health check (null when disabled)"
  value       = var.enable_health_check && var.enable_alarms ? aws_cloudwatch_metric_alarm.health_check[0].arn : null
}

# X-Ray outputs commented out since resources are commented out
# output "xray_sampling_rules" {
#   description = "Map of X-Ray sampling rule ARNs"
#   value = {
#     default = aws_xray_sampling_rule.default_sampling.arn
#     auth    = aws_xray_sampling_rule.high_priority_endpoints.arn
#     errors  = aws_xray_sampling_rule.error_traces.arn
#   }
# }
