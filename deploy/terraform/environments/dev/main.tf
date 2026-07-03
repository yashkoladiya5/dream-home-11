module "dream_home_11" {
  source = "../../"

  environment                = "dev"
  region                     = "us-east-1"
  account_id                 = var.account_id
  domain_name                = "dreamhome11.com"
  api_subdomain              = "api.dev"
  admin_subdomain            = "admin.dev"
  certificate_arn            = var.certificate_arn
  db_password                = var.db_password
  jwt_secret                 = var.jwt_secret
  firebase_service_account   = var.firebase_service_account

  vpc_cidr          = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  db_instance_class     = "db.t3.medium"
  db_multi_az           = false
  db_deletion_protection = false

  redis_node_type          = "cache.t3.micro"
  redis_num_cache_nodes     = 1
  redis_multi_az           = false
  redis_automatic_failover = false

  ecs_cpu            = 512
  ecs_memory         = 1024
  ecs_desired_count  = 2
  ecs_min_capacity   = 2
  ecs_max_capacity   = 10

  container_image = var.container_image
  node_env        = "development"
  log_level       = "debug"

  waf_enabled            = false
  flow_logs_retention    = 7
  log_retention_days     = 7
  backup_retention_days  = 7
  redis_backup_retention_days = 3

  tags = {
    Environment = "dev"
    Project     = "DreamHome11"
    ManagedBy   = "Terraform"
  }
}

terraform {
  required_version = "~> 1.6"

  backend "s3" {
    bucket = "dream-home-11-dev-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"

    dynamodb_table = "dream-home-11-dev-terraform-locks"
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
      Environment = "dev"
      Project     = "DreamHome11"
      ManagedBy   = "Terraform"
    }
  }
}
