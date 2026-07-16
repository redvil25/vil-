# Route 53 Health Check for API Uptime Monitoring
#
# Monitors the /health endpoint and triggers CloudWatch alarms on failure.
# Cost: ~$0.50/month per health check

# =============================================================================
# ROUTE 53 HEALTH CHECK
# =============================================================================

resource "aws_route53_health_check" "api" {
  count = var.enable_health_check ? 1 : 0

  fqdn              = var.health_check_fqdn
  port              = 443
  type              = "HTTPS"
  resource_path     = var.health_check_path
  failure_threshold = var.health_check_failure_threshold
  request_interval  = var.health_check_interval

  # Regions to check from (using default AWS health checker regions)
  # Using 3 regions provides good coverage without excessive cost
  regions = var.health_check_regions

  tags = {
    Name        = "${var.project_name}-api-health-${var.environment}"
    Environment = var.environment
  }
}

# =============================================================================
# CLOUDWATCH ALARM FOR HEALTH CHECK
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "health_check" {
  count = var.enable_health_check && var.enable_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-api-health-check-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "API health check failed - ${var.health_check_fqdn}${var.health_check_path} is not responding"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.api[0].id
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []
  ok_actions    = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "${var.project_name}-api-health-alarm-${var.environment}"
    Environment = var.environment
    Severity    = "critical"
  }
}
