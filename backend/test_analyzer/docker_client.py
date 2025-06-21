"""
Docker client utility for test analyzer containers.
Provides functions to build, run, and manage Docker containers for test analysis.
"""

import json
import logging
import os
import re
import shlex
import subprocess
import tempfile
import uuid
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class DockerClient:
    """Docker client for managing test analyzer containers."""
    
    def __init__(self):
        self.images = {
            "python": "test-analyzer-python:latest",
            "javascript": "test-analyzer-javascript:latest"
        }
        self.last_container_name = None
        self.last_temp_dir = None
    
    def check_docker_available(self) -> bool:
        """Check if Docker is available and running."""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            return False
    
    def check_image_exists(self, image_name: str) -> bool:
        """Check if a Docker image exists."""
        try:
            result = subprocess.run(
                ["docker", "image", "inspect", image_name],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            return False
    
    def build_image(self, dockerfile_path: str, image_name: str) -> bool:
        """Build a Docker image from a Dockerfile."""
        try:
            logger.info(f"Building Docker image: {image_name}")
            result = subprocess.run(
                ["docker", "build", "-t", image_name, "."],
                cwd=dockerfile_path,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout for building
            )
            
            if result.returncode == 0:
                logger.info(f"Successfully built Docker image: {image_name}")
                return True
            else:
                logger.error(f"Failed to build Docker image {image_name}: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"Timeout building Docker image: {image_name}")
            return False
        except Exception as e:
            logger.error(f"Error building Docker image {image_name}: {str(e)}")
            return False
    
    def run_container(self, image_name: str, source_code: str, test_code: str) -> Tuple[int, str, str]:
        """
        Run a Docker container with source and test code using volumes.
        Container will be kept running after execution.
        
        Args:
            image_name: Name of the Docker image to run
            source_code: Source code content
            test_code: Test code content
            
        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        try:
            # Create temporary directory for volume mounting
            temp_dir = tempfile.mkdtemp()
            
            # Write source and test code to temporary files
            source_file = os.path.join(temp_dir, "source")
            test_file = os.path.join(temp_dir, "test")
            
            # Determine file extensions based on image
            if "javascript" in image_name:
                source_file += ".js"
                test_file += ".js"
            else:  # python
                source_file += ".py"
                test_file += ".py"
            
            with open(source_file, 'w', encoding='utf-8') as f:
                f.write(source_code)
            
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(test_code)
            
            # Generate a unique container name
            container_name = f"test-analyzer-{uuid.uuid4().hex[:8]}"
            
            # Build the Docker command with volume mount (no --rm flag, add -d for detached)
            docker_cmd = [
                "docker", "run",  "-d", "--name", container_name,
                "-v", f"{temp_dir}:/app/workspace",
                "-w", "/app/workspace",
                image_name,
                source_code,
                test_code
            ]
            
            logger.info(f"Running Docker container: {image_name} with name: {container_name}")
            
            # Run the Docker container in detached mode
            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout for Docker operations
            )

            if result.returncode != 0:
                logger.error(f"Failed to start Docker container: {result.stderr}")
                return result.returncode, result.stdout, result.stderr

            # Wait for the container to complete and get logs
            logger.info(f"Waiting for container {container_name} to complete...")
            
            # Wait for container to finish
            wait_result = subprocess.run(
                ["docker", "wait", container_name],
                capture_output=True,
                text=True,
                timeout=120  # 2 minutes timeout for container execution
            )
            
            if wait_result.returncode == 0:
                return_code = int(wait_result.stdout.strip())
            else:
                return_code = -1
            
            # Get container logs
            logs_result = subprocess.run(
                ["docker", "logs", container_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            stdout = logs_result.stdout
            stderr = logs_result.stderr
            
            logger.info(f"Docker container {container_name} completed with return code: {return_code}")
            logger.info(f"Container stdout: {stdout}")
            logger.info(f"Container stderr: {stderr}")
            
            # Note: Container is kept running, not removed
            logger.info(f"Container {container_name} is still running. Use stop_container() to stop it.")
            
            # Store container info for later cleanup
            self.last_container_name = container_name
            self.last_temp_dir = temp_dir
            
            return return_code, stdout, stderr
            
        except subprocess.TimeoutExpired:
            logger.error(f"Docker container timed out: {image_name}")
            return -1, "", "Docker container timed out after 60 seconds"
        except Exception as e:
            logger.error(f"Error running Docker container {image_name}: {str(e)}")
            return -1, "", f"Error running Docker container: {str(e)}"
    
    def stop_container(self, container_name: Optional[str] = None) -> bool:
        """
        Stop and remove a Docker container.
        
        Args:
            container_name: Name of the container to stop. If None, stops the last created container.
            
        Returns:
            True if container was stopped successfully, False otherwise
        """
        try:
            if container_name is None:
                container_name = getattr(self, 'last_container_name', None)
                if container_name is None:
                    logger.warning("No container name provided and no last container found")
                    return False
            
            logger.info(f"Stopping Docker container: {container_name}")
            
            # Stop the container
            stop_result = subprocess.run(
                ["docker", "stop", container_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if stop_result.returncode != 0:
                logger.error(f"Failed to stop container {container_name}: {stop_result.stderr}")
                return False
            
            # Remove the container
            rm_result = subprocess.run(
                ["docker", "rm", container_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if rm_result.returncode != 0:
                logger.error(f"Failed to remove container {container_name}: {rm_result.stderr}")
                return False
            
            logger.info(f"Successfully stopped and removed container: {container_name}")
            
            # Clean up temp directory if it exists
            temp_dir = getattr(self, 'last_temp_dir', None)
            if temp_dir and os.path.exists(temp_dir):
                try:
                    import shutil
                    shutil.rmtree(temp_dir)
                    logger.info(f"Cleaned up temp directory: {temp_dir}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temp directory: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error stopping container {container_name}: {str(e)}")
            return False
    
    def list_running_containers(self) -> list:
        """
        List all running test analyzer containers.
        
        Returns:
            List of container names
        """
        try:
            result = subprocess.run(
                ["docker", "ps", "--filter", "name=test-analyzer-", "--format", "{{.Names}}"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                containers = [name.strip() for name in result.stdout.split('\n') if name.strip()]
                return containers
            else:
                logger.error(f"Failed to list containers: {result.stderr}")
                return []
                
        except Exception as e:
            logger.error(f"Error listing containers: {str(e)}")
            return []
    
    def ensure_image_available(self, language: str) -> bool:
        """
        Ensure that the Docker image for the specified language is available.
        If not, attempt to build it.
        
        Args:
            language: Language name ("python" or "javascript")
            
        Returns:
            True if image is available, False otherwise
        """
        if language not in self.images:
            logger.error(f"Unsupported language: {language}")
            return False
        
        image_name = self.images[language]
        
        # Check if image already exists
        if self.check_image_exists(image_name):
            logger.info(f"Docker image already exists: {image_name}")
            return True
        
        # Try to build the image using absolute path
        # Get the current directory of this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        dockerfile_path = os.path.join(current_dir, "docker", language)
        
        if not os.path.exists(dockerfile_path):
            logger.error(f"Dockerfile path does not exist: {dockerfile_path}")
            return False
        
        return self.build_image(dockerfile_path, image_name)
    
    def cleanup_images(self) -> None:
        """Clean up test analyzer Docker images and containers."""
        # First, stop and remove all running test analyzer containers
        self.cleanup_containers()
        
        # Then remove the images
        for language, image_name in self.images.items():
            try:
                logger.info(f"Removing Docker image: {image_name}")
                subprocess.run(
                    ["docker", "rmi", image_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            except Exception as e:
                logger.warning(f"Failed to remove Docker image {image_name}: {str(e)}")
    
    def cleanup_containers(self) -> None:
        """Stop and remove all running test analyzer containers."""
        try:
            # Get all running test analyzer containers
            containers = self.list_running_containers()
            
            if not containers:
                logger.info("No running test analyzer containers found")
                return
            
            logger.info(f"Found {len(containers)} running test analyzer containers")
            
            # Stop and remove each container
            for container_name in containers:
                logger.info(f"Stopping and removing container: {container_name}")
                
                # Stop the container
                stop_result = subprocess.run(
                    ["docker", "stop", container_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if stop_result.returncode != 0:
                    logger.warning(f"Failed to stop container {container_name}: {stop_result.stderr}")
                    continue
                
                # Remove the container
                rm_result = subprocess.run(
                    ["docker", "rm", container_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if rm_result.returncode != 0:
                    logger.warning(f"Failed to remove container {container_name}: {rm_result.stderr}")
                else:
                    logger.info(f"Successfully removed container: {container_name}")
                    
        except Exception as e:
            logger.error(f"Error cleaning up containers: {str(e)}")
    
    def get_container_status(self, container_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get the status of a Docker container.
        
        Args:
            container_name: Name of the container to check. If None, checks the last created container.
            
        Returns:
            Dictionary with container status information
        """
        try:
            if container_name is None:
                container_name = getattr(self, 'last_container_name', None)
                if container_name is None:
                    return {"error": "No container name provided and no last container found"}
            
            result = subprocess.run(
                ["docker", "inspect", container_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {"error": f"Failed to inspect container: {result.stderr}"}
            
            container_info = json.loads(result.stdout)
            if not container_info:
                return {"error": "Container not found"}
            
            info = container_info[0]
            return {
                "name": info.get("Name", "").lstrip("/"),
                "status": info.get("State", {}).get("Status", "unknown"),
                "running": info.get("State", {}).get("Running", False),
                "exit_code": info.get("State", {}).get("ExitCode", None),
                "started_at": info.get("State", {}).get("StartedAt", ""),
                "finished_at": info.get("State", {}).get("FinishedAt", "")
            }
            
        except Exception as e:
            return {"error": f"Error getting container status: {str(e)}"}


# Global Docker client instance
docker_client = DockerClient() 