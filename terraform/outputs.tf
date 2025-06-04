output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.compute.alb_dns_name
}

output "cloudfront_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.app_distribution.domain_name
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for file storage"
  value       = aws_s3_bucket.file_storage.bucket
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = var.ecs_cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.compute.ecs_service_name
} 