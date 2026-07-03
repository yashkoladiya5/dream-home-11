resource "aws_db_subnet_group" "main" {
  name        = "dream-home-11-${var.environment}"
  description = "DB subnet group for DreamHome11 ${var.environment}"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "dream-home-11-${var.environment}-db-subnet-group"
  }
}

resource "aws_db_parameter_group" "main" {
  name        = "dream-home-11-${var.environment}-pg16"
  family      = "postgres16"
  description = "Custom parameter group for DreamHome11 PostgreSQL 16"

  parameter {
    name         = "shared_buffers"
    value        = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "effective_cache_size"
    value        = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "work_mem"
    value        = "65536"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "maintenance_work_mem"
    value        = "2097152"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "random_page_cost"
    value        = "1.1"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "effective_io_concurrency"
    value        = "200"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "wal_buffers"
    value        = "16384"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "max_connections"
    value        = "200"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "idle_in_transaction_session_timeout"
    value        = "300000"
    apply_method = "immediate"
  }

  parameter {
    name         = "statement_timeout"
    value        = "120000"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_min_duration_statement"
    value        = "1000"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_connections"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_disconnections"
    value        = "1"
    apply_method = "immediate"
  }

  tags = {
    Name = "dream-home-11-${var.environment}-pg16-param-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "dream-home-11-${var.environment}"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.db_multi_az
  storage_type           = "gp3"
  allocated_storage      = 100
  max_allocated_storage  = 200

  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  auto_minor_version_upgrade = true
  deletion_protection        = var.db_deletion_protection
  skip_final_snapshot        = var.environment != "prod"
  final_snapshot_identifier  = var.environment == "prod" ? "dream-home-11-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "dream-home-11-${var.environment}-rds"
  }

  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier,
    ]
  }
}
