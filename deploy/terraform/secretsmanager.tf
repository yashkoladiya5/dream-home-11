resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "dream-home-11-${var.environment}/db-credentials"
  description = "Database credentials for DreamHome11 ${var.environment}"

  rotation_rules {
    automatically_after_days = 30
  }

  tags = {
    Name = "dream-home-11-${var.environment}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.main.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "dream-home-11-${var.environment}/jwt-secret"
  description = "JWT signing secret for DreamHome11 ${var.environment}"

  rotation_rules {
    automatically_after_days = 90
  }

  tags = {
    Name = "dream-home-11-${var.environment}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "firebase" {
  count       = var.firebase_service_account != "" ? 1 : 0
  name        = "dream-home-11-${var.environment}/firebase-service-account"
  description = "Firebase service account for DreamHome11 ${var.environment}"

  tags = {
    Name = "dream-home-11-${var.environment}-firebase-sa"
  }
}

resource "aws_secretsmanager_secret_version" "firebase" {
  count     = var.firebase_service_account != "" ? 1 : 0
  secret_id = aws_secretsmanager_secret.firebase[0].id
  secret_string = var.firebase_service_account
}

resource "aws_lambda_function" "secretsmanager_rotation" {
  filename         = "${path.module}/lambda/rotation.zip"
  function_name    = "dream-home-11-${var.environment}-sm-rotation"
  role             = aws_iam_role.secretsmanager_rotation.arn
  handler          = "rotation.lambda_handler"
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.region}.amazonaws.com"
    }
  }

  tags = {
    Name = "dream-home-11-${var.environment}-sm-rotation"
  }
}

resource "aws_lambda_permission" "secretsmanager_rotation_db" {
  statement_id  = "AllowSecretsManagerInvokeDB"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secretsmanager_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
  source_arn    = aws_secretsmanager_secret.db_credentials.arn
}

resource "aws_lambda_permission" "secretsmanager_rotation_jwt" {
  statement_id  = "AllowSecretsManagerInvokeJWT"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secretsmanager_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
  source_arn    = aws_secretsmanager_secret.jwt_secret.arn
}
