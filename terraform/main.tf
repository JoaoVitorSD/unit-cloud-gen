terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # These values will be filled in by the user during terraform init
    # bucket         = "unit-cloud-gen-terraform-state"
    # key            = "terraform.tfstate"
    # region         = "us-west-2"
    # dynamodb_table = "unit-cloud-gen-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "unit-cloud-gen"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Network Configuration
module "network" {
  source = "./modules/network"

  environment     = var.environment
  vpc_cidr       = var.vpc_cidr
  azs            = var.availability_zones
  public_subnets = var.public_subnet_cidrs
}

# ECS Cluster and Services
module "compute" {
  source = "./modules/compute"

  environment          = var.environment
  vpc_id              = module.network.vpc_id
  public_subnet_ids   = module.network.public_subnet_ids
  private_subnet_ids  = module.network.private_subnet_ids
  ecs_cluster_name    = var.ecs_cluster_name
  container_port      = var.container_port
  cpu                 = var.task_cpu
  memory              = var.task_memory
  desired_count       = var.desired_count
  app_image           = var.app_image
  app_image_tag       = var.app_image_tag
}

# RDS Database
module "database" {
  source = "./modules/database"

  environment         = var.environment
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  db_instance_class  = var.db_instance_class
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "file_storage" {
  bucket = "${var.environment}-unit-cloud-gen-files"

  tags = {
    Name = "${var.environment}-unit-cloud-gen-files"
  }
}

resource "aws_s3_bucket_versioning" "file_storage_versioning" {
  bucket = aws_s3_bucket.file_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "file_storage_encryption" {
  bucket = aws_s3_bucket.file_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "app_distribution" {
  enabled             = true
  is_ipv6_enabled    = true
  price_class        = "PriceClass_100"
  http_version       = "http2"
  default_root_object = "index.html"

  origin {
    domain_name = module.compute.alb_dns_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "ALB"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      headers      = ["*"]
      query_string = true
      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
} 