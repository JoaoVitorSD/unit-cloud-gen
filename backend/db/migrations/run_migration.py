import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def run_migration():
    """Create the problem_results table if it doesn't exist."""
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "unitcloudgen")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_port = os.getenv("DB_PORT", "5432")

    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port,
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS problem_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            problem_name TEXT,
            leetcode_link TEXT,
            rank TEXT,
            problem_type TEXT,
            definition TEXT,
            
            code TEXT NOT NULL,
            test_code TEXT NOT NULL,
            
            quality_score FLOAT,
            coverage_estimate FLOAT,
            actual_coverage FLOAT,
            
            tests_total INTEGER DEFAULT 0,
            tests_passed INTEGER DEFAULT 0,
            tests_failed INTEGER DEFAULT 0,
            
            execution_time FLOAT DEFAULT 0.0,
            evaluation_time FLOAT DEFAULT 0.0,
            
            generation_tokens INTEGER DEFAULT 0,
            generation_cost FLOAT DEFAULT 0.0,
            evaluation_tokens INTEGER DEFAULT 0,
            evaluation_cost FLOAT DEFAULT 0.0,
            
            test_details JSONB,
            
            execution_error TEXT,
            coverage_error TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_problem_results_created_at ON problem_results(created_at);
        CREATE INDEX IF NOT EXISTS idx_problem_results_problem_name ON problem_results(problem_name);
        CREATE INDEX IF NOT EXISTS idx_problem_results_rank ON problem_results(rank);
        """

        cursor.execute(create_table_sql)
        print("Migration completed: problem_results table created/verified")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"Migration error: {e}")
        raise


if __name__ == "__main__":
    run_migration()

