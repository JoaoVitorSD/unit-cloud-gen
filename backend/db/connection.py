import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from typing import Optional

_db_pool: Optional[pool.ThreadedConnectionPool] = None


def get_db_pool() -> pool.ThreadedConnectionPool:
    """Get or create database connection pool."""
    global _db_pool
    
    if _db_pool is None:
        db_host = os.getenv("DB_HOST", "localhost")
        db_name = os.getenv("DB_NAME", "unitcloudgen")
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "postgres")
        db_port = os.getenv("DB_PORT", "5432")
        
        _db_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port,
        )
    
    return _db_pool


def get_db_connection():
    """Get a database connection from the pool."""
    pool = get_db_pool()
    return pool.getconn()


def return_db_connection(conn):
    """Return a database connection to the pool."""
    pool = get_db_pool()
    pool.putconn(conn)


def close_db_pool():
    """Close all connections in the pool."""
    global _db_pool
    if _db_pool:
        _db_pool.closeall()
        _db_pool = None

