locals {
  ecs_task_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_ecs_cluster" "main" {
  name = "dream-home-11-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_encryption_enabled = false
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  tags = {
    Name = "dream-home-11-${var.environment}-cluster"
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "dream-home-11"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  volume {
    name = "uploads"

    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.uploads.id
      root_directory     = "/"
      transit_encryption = "ENABLED"

      authorization_config {
        access_point_id = aws_efs_access_point.uploads.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([
    {
      name              = "dream-home-11"
      image             = var.container_image
      essential         = true
      readonlyRootFilesystem = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV",          value = var.node_env },
        { name = "PORT",              value = "3000" },
        { name = "DB_HOST",           value = aws_db_instance.main.endpoint },
        { name = "DB_PORT",           value = "5432" },
        { name = "DB_USERNAME",       value = var.db_username },
        { name = "DB_DATABASE",       value = var.db_name },
        { name = "DB_POOL_MAX",       value = "25" },
        { name = "REDIS_HOST",        value = aws_elasticache_replication_group.main.primary_endpoint_address },
        { name = "REDIS_PORT",        value = "6379" },
        { name = "JWT_EXPIRATION",    value = var.jwt_expiration },
        { name = "LOG_LEVEL",         value = var.log_level },
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_secretsmanager_secret.db_credentials.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        },
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health', r => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      linuxParameters = {
        capabilities = {
          drop = ["ALL"]
        }
      }

      mountPoints = [
        {
          sourceVolume  = "uploads"
          containerPath = "/app/uploads"
          readOnly      = false
        }
      ]

      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
    }
  ])

  tags = {
    Name = "dream-home-11-${var.environment}-task-def"
  }
}

resource "aws_ecs_service" "main" {
  name            = "dream-home-11-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "dream-home-11"
    container_port   = 3000
  }

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name = "dream-home-11-${var.environment}-service"
  }
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "dream-home-11-${var.environment}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_efs_file_system" "uploads" {
  creation_token = "dream-home-11-${var.environment}-uploads"
  encrypted      = true
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  tags = {
    Name = "dream-home-11-${var.environment}-efs-uploads"
  }
}

resource "aws_efs_access_point" "uploads" {
  file_system_id = aws_efs_file_system.uploads.id

  posix_user {
    uid = 1000
    gid = 1000
  }

  root_directory {
    path = "/uploads"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "755"
    }
  }

  tags = {
    Name = "dream-home-11-${var.environment}-efs-ap-uploads"
  }
}

resource "aws_efs_mount_target" "uploads" {
  count          = length(aws_subnet.private[*].id)
  file_system_id = aws_efs_file_system.uploads.id
  subnet_id      = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.ecs.id]
}
