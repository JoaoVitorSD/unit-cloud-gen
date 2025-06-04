# Unit Cloud Gen

A modern web application that leverages LLMs to generate code based on user input files. Built with React (Vite) and Python FastAPI.

## Project Structure

```
.
├── terraform/               # Infrastructure as Code
│   ├── main.tf             # Main Terraform configuration
│   ├── variables.tf        # Variable definitions
│   ├── outputs.tf          # Output definitions
│   └── modules/            # Terraform modules
│       ├── network/        # Network infrastructure
│       ├── compute/        # Compute resources
│       └── database/       # Database resources
├── frontend/               # React (Vite) frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── backend/               # Python FastAPI backend
│   ├── app/              # Application code
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile        # Backend container definition
└── docker-compose.yml    # Local development setup
```

## Prerequisites

- Terraform >= 1.0.0
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose
- Node.js >= 16.x
- Python >= 3.9

## Getting Started

1. Clone the repository
2. Configure AWS credentials
3. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   ```
4. Review the deployment plan:
   ```bash
   terraform plan
   ```
5. Apply the infrastructure:
   ```bash
   terraform apply
   ```

## Local Development

1. Start the development environment:
   ```bash
   docker-compose up
   ```
2. Frontend will be available at: http://localhost:5173
3. Backend API will be available at: http://localhost:8000

## Features

- Modern React frontend with Vite
- FastAPI backend with async support
- LLM integration for code generation
- File upload and processing
- Infrastructure as Code with Terraform
- Containerized deployment
- Scalable cloud architecture

## Infrastructure

The application is deployed on AWS using the following services:

- Amazon ECS for container orchestration
- Amazon RDS for database
- Amazon S3 for file storage
- Amazon CloudFront for content delivery
- Amazon Route 53 for DNS management
- AWS Certificate Manager for SSL/TLS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
