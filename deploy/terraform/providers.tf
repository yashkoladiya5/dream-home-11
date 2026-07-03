terraform {
  required_version = "~> 1.6"

  backend "s3" {
    key = "terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.region

  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/TerraformRole"
  }

  default_tags {
    tags = var.tags
  }
}

provider "random" {}
