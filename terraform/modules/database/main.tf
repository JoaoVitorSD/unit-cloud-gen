resource "aws_security_group" "rds" {
  name        = "${var.environment}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_tasks_security_group_id]
  }

  tags = {
    Name = "${var.environment}-rds-sg"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.environment}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier           = "${var.environment}-db"
  engine              = "postgres"
  engine_version      = "14.7"
  instance_class      = var.db_instance_class
  allocated_storage   = 20
  storage_type        = "gp2"
  storage_encrypted   = true

  db_name             = var.db_name
  username            = var.db_username
  password            = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  multi_az               = false
  publicly_accessible    = false
  skip_final_snapshot    = true

  tags = {
    Name = "${var.environment}-db"
  }
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.environment}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors RDS CPU utilization"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.environment}-rds-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${var.environment}-rds-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "1000000000"  # 1GB in bytes
  alarm_description  = "This metric monitors RDS free storage space"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.environment}-rds-storage-alarm"
  }
} 