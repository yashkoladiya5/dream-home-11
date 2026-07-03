resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/dream-home-11-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "dream-home-11-${var.environment}-ecs-logs"
  }
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/dream-home-11-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "dream-home-11-${var.environment}-alb-logs"
  }
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/dream-home-11-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "dream-home-11-${var.environment}-rds-logs"
  }
}

resource "aws_cloudwatch_log_group" "waf" {
  count             = var.waf_enabled ? 1 : 0
  name              = "/aws/waf/dream-home-11-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "dream-home-11-${var.environment}-waf-logs"
  }
}

resource "aws_cloudwatch_log_group" "secretsmanager" {
  name              = "/aws/lambda/dream-home-11-${var.environment}-sm-rotation"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "dream-home-11-${var.environment}-sm-rotation-logs"
  }
}

resource "aws_sns_topic" "alarms" {
  name = "dream-home-11-${var.environment}-alarms"

  tags = {
    Name = "dream-home-11-${var.environment}-alarms"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "dream-home-11-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization above 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  tags = {
    Name = "dream-home-11-${var.environment}-ecs-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  alarm_name          = "dream-home-11-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS memory utilization above 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  tags = {
    Name = "dream-home-11-${var.environment}-ecs-memory-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "dream-home-11-${var.environment}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx error count above threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.main.arn_suffix
  }

  tags = {
    Name = "dream-home-11-${var.environment}-alb-5xx-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "dream-home-11-${var.environment}-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 150
  alarm_description   = "RDS database connections above 150"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "dream-home-11-${var.environment}-db-connections-alarm"
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "DreamHome11-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x    = 0
        y    = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            ["AWS/ECS", "MemoryUtilization", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ECS CPU & Memory"
        }
      },
      {
        type = "metric"
        x    = 12
        y    = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ALB Requests & Latency"
        }
      },
      {
        type = "metric"
        x    = 0
        y    = 6
        width = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            ["AWS/RDS", "FreeableMemory", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        x    = 8
        y    = 6
        width = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            ["AWS/ElastiCache", "FreeableMemory", { stat = "Average" }],
            ["AWS/ElastiCache", "CurrConnections", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Redis Metrics"
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 6
        width = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "HTTP Status Codes"
        }
      },
    ]
  })

  tags = {
    Name = "dream-home-11-${var.environment}-dashboard"
  }
}
