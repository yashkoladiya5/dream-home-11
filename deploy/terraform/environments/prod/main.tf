module "dream_home_11" {
  source = "../../"

  environment                = "prod"
  region                     = "us-east-1"
  account_id                 = var.account_id
  domain_name                = "dreamhome11.com"
  api_subdomain              = "api"
  admin_subdomain            = "admin"
  certificate_arn            = var.certificate_arn
  db_password                = var.db_password
  jwt_secret                 = var.jwt_secret
  firebase_service_account   = var.firebase_service_account

  vpc_cidr          = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  db_instance_class     = "db.t3.large"
  db_multi_az           = true
  db_deletion_protection = true

  redis_node_type          = "cache.t3.medium"
  redis_num_cache_nodes     = 2
  redis_multi_az           = true
  redis_automatic_failover = true

  ecs_cpu            = 1024
  ecs_memory         = 2048
  ecs_desired_count  = 3
  ecs_min_capacity   = 3
  ecs_max_capacity   = 15

  container_image = var.container_image
  node_env        = "production"
  log_level       = "info"

  waf_enabled            = true
  flow_logs_retention    = 30
  log_retention_days     = 30
  backup_retention_days  = 30
  redis_backup_retention_days = 7

  tags = {
    Environment = "prod"
    Project     = "DreamHome11"
    ManagedBy   = "Terraform"
  }
}

terraform {
  required_version = "~> 1.6"

  backend "s3" {
    bucket = "dream-home-11-prod-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"

    dynamodb_table = "dream-home-11-prod-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/TerraformRole"
  }

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "DreamHome11"
      ManagedBy   = "Terraform"
    }
  }
}
