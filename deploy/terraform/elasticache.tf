resource "aws_elasticache_subnet_group" "main" {
  name        = "dream-home-11-${var.environment}"
  description = "ElastiCache subnet group for DreamHome11 ${var.environment}"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "dream-home-11-${var.environment}-redis-subnet-group"
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name        = "dream-home-11-${var.environment}-redis7"
  family      = "redis7"
  description = "Custom parameter group for DreamHome11 Redis 7"

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  parameter {
    name  = "activedefrag"
    value = "yes"
  }

  parameter {
    name  = "lfu-log-factor"
    value = "10"
  }

  parameter {
    name  = "lfu-decay-time"
    value = "1"
  }

  tags = {
    Name = "dream-home-11-${var.environment}-redis7-param-group"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "dream-home-11-${var.environment}"
  replication_group_description = "Redis replication group for DreamHome11 ${var.environment}"

  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_multi_az ? var.redis_num_cache_nodes + 1 : var.redis_num_cache_nodes
  port                 = 6379

  parameter_group_name  = aws_elasticache_parameter_group.main.name
  subnet_group_name     = aws_elasticache_subnet_group.main.name
  security_group_ids    = [aws_security_group.redis.id]

  multi_az_enabled              = var.redis_multi_az
  automatic_failover_enabled    = var.redis_automatic_failover

  engine           = "redis"
  engine_version   = "7.1"

  maintenance_window                 = "sun:05:00-sun:06:00"
  snapshot_retention_limit           = var.redis_backup_retention_days
  snapshot_window                    = "04:00-05:00"

  auto_minor_version_upgrade = true

  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true

  tags = {
    Name = "dream-home-11-${var.environment}-redis"
  }
}
