# Dream Home 11 - Terraform Infrastructure

Terraform configuration for deploying Dream Home 11 to AWS using ECS Fargate, RDS PostgreSQL, ElastiCache Redis, and CloudFront CDN.

## Architecture

- **VPC**: 3 public + 3 private subnets across 3 AZs
- **Compute**: ECS Fargate tasks behind ALB with auto scaling
- **Database**: RDS PostgreSQL 16 with Multi-AZ (prod)
- **Cache**: ElastiCache Redis 7 with replication (prod)
- **CDN**: CloudFront for static asset delivery
- **Storage**: S3 buckets + EFS for uploads
- **Security**: WAF, Secrets Manager, VPC endpoints

## Prerequisites

1. AWS account with appropriate permissions
2. Existing Route53 hosted zone for the domain
3. ACM SSL certificate in `us-east-1` (for CloudFront)
4. Terraform ~> 1.6 installed
5. AWS CLI configured with appropriate credentials

## Directory Structure

```
deploy/terraform/
├── providers.tf          # AWS provider + Terraform backend config
├── variables.tf          # All input variables
├── outputs.tf            # All output values
├── vpc.tf                # VPC, subnets, NAT, route tables, flow logs
├── security-groups.tf    # Security groups for ALB, ECS, RDS, Redis
├── rds.tf                # PostgreSQL RDS instance
├── elasticache.tf        # Redis ElastiCache
├── ecs.tf                # ECS cluster, task definition, service
├── alb.tf                # ALB, listeners, target group
├── route53.tf            # DNS records
├── cloudfront.tf         # CloudFront CDN distribution
├── s3.tf                 # S3 buckets
├── iam.tf                # IAM roles and policies
├── secretsmanager.tf     # Secrets Manager
├── waf.tf                # WAF web ACL
├── cloudwatch.tf         # CloudWatch logs, alarms, dashboard
├── environments/
│   ├── dev/
│   │   ├── main.tf       # Dev environment (module + backend)
│   │   └── variables.tf  # Dev-specific variables
│   └── prod/
│       ├── main.tf       # Prod environment (module + backend)
│       └── variables.tf  # Prod-specific variables
└── README.md
```

## Required Variables

| Variable | Description | Example |
|---|---|---|
| `account_id` | AWS account ID | `123456789012` |
| `certificate_arn` | ACM SSL certificate ARN | `arn:aws:acm:us-east-1:...` |
| `db_password` | Database master password | (sensitive) |
| `jwt_secret` | JWT signing secret | (sensitive) |
| `container_image` | Backend Docker image | `dreamhome11/backend:latest` |
| `firebase_service_account` | Firebase SA JSON | (sensitive, optional) |

## Usage

### Initialize Terraform

```bash
# Dev environment
terraform init -backend-config=environments/dev/backend.tfvars \
  -reconfigure environments/dev

# Production environment
terraform init -backend-config=environments/prod/backend.tfvars \
  -reconfigure environments/prod
```

### Plan

```bash
# Dev
terraform plan -var-file=environments/dev/terraform.tfvars

# Production
terraform plan -var-file=environments/prod/terraform.tfvars
```

### Apply

```bash
# Dev
terraform apply -var-file=environments/dev/terraform.tfvars

# Production
terraform apply -var-file=environments/prod/terraform.tfvars
```

### Destroy

```bash
# Dev
terraform destroy -var-file=environments/dev/terraform.tfvars

# Production
terraform destroy -var-file=environments/prod/terraform.tfvars
```

## Notes

- Deletion protection is enabled for prod RDS
- RDS `skip_final_snapshot` is `false` for prod (final snapshot created)
- S3 bucket names are globally unique - adjust if needed
- WAF is only enabled in production
- NAT Gateway: single in dev, one per AZ in prod
- EFS is used for persistent upload storage across tasks
- Service auto scaling targets 70% CPU utilization
- Deployment circuit breaker with rollback on failure
- All sensitive values use Secrets Manager with auto rotation
