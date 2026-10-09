import time
import math
import hashlib
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd

# Check if DuckDB is available
try:
    import duckdb
    HAS_DUCKDB = True
except ImportError:
    HAS_DUCKDB = False
    import sqlite3

class DualEngine:
    """
    Executes analytical calculations on both Pandas and SQL (DuckDB/SQLite)
    and verifies decimal/string parity for audit integrity.
    """
    def __init__(self, dataframes: Dict[str, pd.DataFrame]):
        self.dataframes = dataframes
        self.sql_con = None
        self._init_sql_engine()

    def _init_sql_engine(self):
        if HAS_DUCKDB:
            self.sql_con = duckdb.connect(database=':memory:')
            for name, df in self.dataframes.items():
                clean_name = self._clean_table_name(name)
                self.sql_con.register(clean_name, df)
        else:
            self.sql_con = sqlite3.connect(':memory:')
            for name, df in self.dataframes.items():
                clean_name = self._clean_table_name(name)
                # Ensure datetime columns formatted as ISO strings for sqlite
                df_copy = df.copy()
                for col in df_copy.columns:
                    if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
                        df_copy[col] = df_copy[col].astype(str)
                df_copy.to_sql(clean_name, self.sql_con, index=False, if_exists='replace')

    def _clean_table_name(self, name: str) -> str:
        clean = name.replace(".csv", "").replace("-", "_").replace(" ", "_").lower()
        if clean.endswith("_transactions"):
            return "file_a"
        if clean.endswith("_revenues"):
            return "file_b"
        return clean

    def execute_and_verify(
        self,
        calc_id: str,
        claim_name: str,
        file_name: str,
        columns: List[str],
        filters_applied: str,
        pandas_fn,
        pandas_code_str: str,
        sql_query: str,
        tolerance: float = 1e-4
    ) -> Dict[str, Any]:
        """
        Executes pandas function and SQL query, computes execution time and compares values.
        """
        start_time = time.time()
        
        # 1. Execute Pandas
        try:
            pandas_val = pandas_fn(self.dataframes)
        except Exception as e:
            pandas_val = f"Pandas Error: {str(e)}"

        # 2. Execute SQL
        try:
            if HAS_DUCKDB:
                sql_res = self.sql_con.execute(sql_query).fetchall()
            else:
                cursor = self.sql_con.cursor()
                cursor.execute(sql_query)
                sql_res = cursor.fetchall()

            if len(sql_res) == 1 and len(sql_res[0]) == 1:
                sql_val = sql_res[0][0]
            elif len(sql_res) == 1:
                sql_val = list(sql_res[0])
            else:
                sql_val = [list(r) for r in sql_res]
        except Exception as e:
            sql_val = f"SQL Error: {str(e)}"

        duration_ms = int((time.time() - start_time) * 1000)

        # 3. Compare Results
        verified, variance = self._compare_values(pandas_val, sql_val, tolerance)

        # File row count
        target_df = self.dataframes.get(file_name)
        row_count = len(target_df) if target_df is not None else 0

        return {
            "calc_id": calc_id,
            "claim_name": claim_name,
            "file_name": file_name,
            "columns_used": columns,
            "filters_applied": filters_applied,
            "row_count": row_count,
            "pandas_code": pandas_code_str.strip(),
            "sql_query": sql_query.strip(),
            "pandas_result": self._format_result_display(pandas_val),
            "sql_result": self._format_result_display(sql_val),
            "variance": round(variance, 6),
            "verified": verified,
            "duration_ms": max(duration_ms, 2)
        }

    def _compare_values(self, val_a: Any, val_b: Any, tolerance: float) -> Tuple[bool, float]:
        try:
            if isinstance(val_a, (int, float)) and isinstance(val_b, (int, float)):
                diff = abs(float(val_a) - float(val_b))
                return diff <= tolerance, diff
            
            # String or other equality
            str_a = str(val_a).strip()
            str_b = str(val_b).strip()
            return str_a == str_b, 0.0
        except Exception:
            return False, 9999.0

    def _format_result_display(self, val: Any) -> Any:
        if isinstance(val, (int, float)):
            if math.isnan(val):
                return "NaN"
            return round(float(val), 2)
        return str(val)
