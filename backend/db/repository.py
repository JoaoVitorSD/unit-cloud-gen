import json
import uuid
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

from .connection import get_db_connection, return_db_connection


def save_problem_result(
    problem_name: Optional[str],
    leetcode_link: Optional[str],
    rank: Optional[str],
    problem_type: Optional[str],
    definition: Optional[str],
    code: str,
    test_code: str,
    quality_score: Optional[float],
    coverage_estimate: Optional[float],
    actual_coverage: Optional[float],
    tests_total: int,
    tests_passed: int,
    tests_failed: int,
    execution_time: float,
    evaluation_time: float,
    generation_tokens: int,
    generation_cost: float,
    evaluation_tokens: int,
    evaluation_cost: float,
    test_details: Optional[list],
    execution_error: Optional[str],
    coverage_error: Optional[str],
) -> Dict[str, Any]:
    """Save problem result to database."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        test_details_json = json.dumps(test_details) if test_details else None

        insert_sql = """
        INSERT INTO problem_results (
            problem_name, leetcode_link, rank, problem_type, definition,
            code, test_code,
            quality_score, coverage_estimate, actual_coverage,
            tests_total, tests_passed, tests_failed,
            execution_time, evaluation_time,
            generation_tokens, generation_cost, evaluation_tokens, evaluation_cost,
            test_details,
            execution_error, coverage_error
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s,
            %s, %s, %s, %s,
            %s::jsonb,
            %s, %s
        ) RETURNING id, created_at;
        """

        cursor.execute(
            insert_sql,
            (
                problem_name,
                leetcode_link,
                rank,
                problem_type,
                definition,
                code,
                test_code,
                quality_score,
                coverage_estimate,
                actual_coverage,
                tests_total,
                tests_passed,
                tests_failed,
                execution_time,
                evaluation_time,
                generation_tokens,
                generation_cost,
                evaluation_tokens,
                evaluation_cost,
                test_details_json,
                execution_error,
                coverage_error,
            ),
        )

        result = cursor.fetchone()
        conn.commit()

        return {"id": str(result[0]), "created_at": str(result[1]), "success": True}

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error saving problem result: {e}")
        return {"success": False, "error": str(e)}
    finally:
        if conn:
            return_db_connection(conn)

