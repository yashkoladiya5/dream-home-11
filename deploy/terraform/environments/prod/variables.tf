variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM SSL certificate"
  type        = string
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "firebase_service_account" {
  description = "Firebase service account JSON"
  type        = string
  sensitive   = true
  default     = ""
}

variable "container_image" {
  description = "Docker image for the backend"
  type        = string
  default     = "dreamhome11/backend:latest"
}
