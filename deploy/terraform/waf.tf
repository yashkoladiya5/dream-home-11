resource "aws_wafv2_web_acl" "main" {
  count       = var.waf_enabled ? 1 : 0
  name        = "dream-home-11-${var.environment}-web-acl"
  description = "WAF Web ACL for DreamHome11 ${var.environment}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limiting"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateBasedRuleMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "sql-injection"
    priority = 2

    action {
      block {}
    }

    statement {
      sql_injection_match_statement {
        field_to_match {
          query_string {}
        }
        text_transformations {
          priority = 1
          type     = "URL_DECODE"
        }
        text_transformations {
          priority = 2
          type     = "HTML_ENTITY_DECODE"
        }
        text_transformations {
          priority = 3
          type     = "LOWERCASE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SQLInjectionMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "xss"
    priority = 3

    action {
      block {}
    }

    statement {
      xss_match_statement {
        field_to_match {
          query_string {}
        }
        text_transformations {
          priority = 1
          type     = "URL_DECODE"
        }
        text_transformations {
          priority = 2
          type     = "HTML_ENTITY_DECODE"
        }
        text_transformations {
          priority = 3
          type     = "LOWERCASE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "XSSMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "aws-common-rule-set"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          name = "NoUserAgent_HEADER"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "aws-admin-protection"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAdminProtectionRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSAdminProtectionMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "aws-known-bad-inputs"
    priority = 6

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSKnownBadInputsMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "DreamHome11WebACL"
    sampled_requests_enabled  = true
  }

  tags = {
    Name = "dream-home-11-${var.environment}-waf"
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count         = var.waf_enabled ? 1 : 0
  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]
  resource_arn            = aws_wafv2_web_acl.main[0].arn
}
