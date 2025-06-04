import boto3
from fastapi import UploadFile
import magic
import os
from typing import Optional
from datetime import datetime, timedelta
import uuid

class StorageService:
    def __init__(self, s3_client, bucket_name: str):
        """Initialize the storage service with S3 client and bucket name"""
        self.s3_client = s3_client
        self.bucket_name = bucket_name

    async def upload_file(self, file: UploadFile) -> str:
        """
        Upload a file to S3 and return its URL
        """
        try:
            # Generate a unique file name
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Read file content
            content = await file.read()
            
            # Detect file type
            file_type = magic.from_buffer(content, mime=True)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_filename,
                Body=content,
                ContentType=file_type
            )
            
            # Generate a presigned URL that expires in 1 hour
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': unique_filename
                },
                ExpiresIn=3600
            )
            
            return url
            
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    async def get_file_content(self, file_url: str) -> Optional[str]:
        """
        Get the content of a file from S3
        """
        try:
            # Extract the key from the URL
            key = file_url.split('/')[-1].split('?')[0]
            
            # Get the object from S3
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            # Read the content
            content = response['Body'].read().decode('utf-8')
            return content
            
        except Exception as e:
            raise Exception(f"Error getting file content: {str(e)}")

    async def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from S3
        """
        try:
            # Extract the key from the URL
            key = file_url.split('/')[-1].split('?')[0]
            
            # Delete the object from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            return True
            
        except Exception as e:
            raise Exception(f"Error deleting file: {str(e)}")

    def get_file_type(self, content: bytes) -> str:
        """
        Get the MIME type of a file
        """
        return magic.from_buffer(content, mime=True)

    def is_allowed_file_type(self, content: bytes, allowed_types: list) -> bool:
        """
        Check if a file type is allowed
        """
        file_type = self.get_file_type(content)
        return file_type in allowed_types 