variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "AWS account ID for assume role"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "dream_home_11"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_multi_az" {
  description = "Enable Multi-AZ for ElastiCache"
  type        = bool
  default     = false
}

variable "redis_automatic_failover" {
  description = "Enable automatic failover for ElastiCache"
  type        = bool
  default     = false
}

variable "ecs_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "ECS task memory (MiB)"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum ECS task count for auto scaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum ECS task count for auto scaling"
  type        = number
  default     = 10
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "dreamhome11.com"
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
  default     = "api"
}

variable "admin_subdomain" {
  description = "Admin subdomain"
  type        = string
  default     = "admin"
}

variable "certificate_arn" {
  description = "ARN of the ACM SSL certificate"
  type        = string
}

variable "waf_enabled" {
  description = "Enable WAF"
  type        = bool
  default     = false
}

variable "flow_logs_retention" {
  description = "Retention days for VPC Flow Logs"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "backup_retention_days" {
  description = "Backup retention days for RDS"
  type        = number
  default     = 30
}

variable "redis_backup_retention_days" {
  description = "Backup retention days for ElastiCache"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "DreamHome11"
    ManagedBy   = "Terraform"
  }
}

variable "container_image" {
  description = "Docker image for the backend container"
  type        = string
  default     = "dreamhome11/backend:latest"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_expiration" {
  description = "JWT token expiration duration"
  type        = string
  default     = "7d"
}

variable "node_env" {
  description = "Node environment"
  type        = string
  default     = "production"
}

variable "firebase_service_account" {
  description = "Firebase service account JSON"
  type        = string
  sensitive   = true
  default     = ""
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
}
