resource "aws_dynamodb_table" "terraform_locks" {
  name         = "dream-home-11-${var.environment}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "dream-home-11-${var.environment}-terraform-locks"
  }
}
