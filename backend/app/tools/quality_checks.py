import math
from typing import Dict, Any, List, Tuple
import pandas as pd
from app.schemas.schemas import DimensionScore, Finding, QualityDashboardData

class QualityAuditor:
    """
    Performs data quality audit across the 5 core dimensions:
    - Completeness
    - Uniqueness
    - Validity
    - Consistency
    - Timeliness
    """
    def __init__(self, dataframes: Dict[str, pd.DataFrame]):
        self.dataframes = dataframes

    def audit(self) -> QualityDashboardData:
        file_scores: Dict[str, DimensionScore] = {}
        all_findings: List[Finding] = []
        finding_id_seq = 1

        for filename, df in self.dataframes.items():
            findings_for_file: List[Finding] = []
            
            # --- 1. COMPLETENESS ---
            total_cells = df.size
            null_cells = df.isnull().sum().sum() + (df == "").sum().sum()
            completeness_rate = max(0.0, 1.0 - (null_cells / max(total_cells, 1)))
            completeness_score = round(completeness_rate * 100, 1)

            # Check specific critical columns
            for col in df.columns:
                null_mask = df[col].isnull() | (df[col] == "")
                null_count = int(null_mask.sum())
                if null_count > 0:
                    sample_indices = [str(idx) for idx in df[null_mask].index[:5]]
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="HIGH" if ("id" in col.lower() or "amount" in col.lower() or "revenue" in col.lower()) else "MEDIUM",
                        file=filename,
                        check_name=f"Null Values in '{col}'",
                        dimension="Completeness",
                        message=f"Found {null_count} missing or empty values in column '{col}'.",
                        affected_rows_count=null_count,
                        sample_row_ids=sample_indices,
                        suggested_fix=f"Populate missing '{col}' from upstream audit logs or default to fallback values."
                    ))
                    finding_id_seq += 1

            # --- 2. UNIQUENESS ---
            id_col = self._detect_id_col(df)
            uniqueness_score = 100.0
            if id_col:
                dup_mask = df.duplicated(subset=[id_col], keep=False)
                dup_count = int(dup_mask.sum())
                if dup_count > 0:
                    dup_rate = dup_count / len(df)
                    uniqueness_score = round(max(0.0, (1.0 - dup_rate) * 100), 1)
                    sample_ids = [str(val) for val in df[dup_mask][id_col].head(5)]
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="CRITICAL",
                        file=filename,
                        check_name=f"Duplicate Primary Key '{id_col}'",
                        dimension="Uniqueness",
                        message=f"Detected {dup_count} duplicate rows sharing identical '{id_col}'.",
                        affected_rows_count=dup_count,
                        sample_row_ids=sample_ids,
                        suggested_fix=f"Deduplicate by keeping the earliest transaction timestamp or reconcile retry events."
                    ))
                    finding_id_seq += 1

            # --- 3. VALIDITY ---
            validity_issues = 0
            # A: Negative amounts
            numeric_cols = [c for c in df.columns if "amount" in c.lower() or "revenue" in c.lower()]
            for ncol in numeric_cols:
                # Convert to numeric safely
                s_num = pd.to_numeric(df[ncol], errors="coerce")
                neg_mask = s_num < 0
                neg_count = int(neg_mask.sum())
                if neg_count > 0:
                    validity_issues += neg_count
                    sample_ids = [str(idx) for idx in df[neg_mask].index[:5]]
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="HIGH",
                        file=filename,
                        check_name=f"Negative Values in '{ncol}'",
                        dimension="Validity",
                        message=f"Detected {neg_count} negative entries in '{ncol}'.",
                        affected_rows_count=neg_count,
                        sample_row_ids=sample_ids,
                        suggested_fix=f"Verify whether negative amounts represent returns/adjustments or entry errors."
                    ))
                    finding_id_seq += 1

            # B: Date format validity
            date_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower()]
            for dcol in date_cols:
                s_dates = pd.to_datetime(df[dcol], errors="coerce")
                invalid_dates_mask = s_dates.isnull() & df[dcol].notnull() & (df[dcol] != "")
                invalid_date_count = int(invalid_dates_mask.sum())
                if invalid_date_count > 0:
                    validity_issues += invalid_date_count
                    sample_ids = [str(val) for val in df[invalid_dates_mask][dcol].head(5)]
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="MEDIUM",
                        file=filename,
                        check_name=f"Malformed Date in '{dcol}'",
                        dimension="Validity",
                        message=f"Detected {invalid_date_count} records with unparseable date formats.",
                        affected_rows_count=invalid_date_count,
                        sample_row_ids=sample_ids,
                        suggested_fix=f"Standardize date strings to ISO-8601 (YYYY-MM-DD HH:MM:SS)."
                    ))
                    finding_id_seq += 1

            validity_score = round(max(0.0, (1.0 - (validity_issues / max(len(df), 1))) * 100), 1)

            # --- 4. CONSISTENCY ---
            consistency_issues = 0
            if "tax_amount" in df.columns and "amount" in df.columns:
                amt = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
                tax = pd.to_numeric(df["tax_amount"], errors="coerce").fillna(0)
                expected_tax = amt * 0.08
                tax_mismatch = (tax > 0) & ((tax - expected_tax).abs() > 1.0)
                mismatch_count = int(tax_mismatch.sum())
                if mismatch_count > 0:
                    consistency_issues += mismatch_count
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="LOW",
                        file=filename,
                        check_name="Tax Rate Consistency (8%)",
                        dimension="Consistency",
                        message=f"Detected {mismatch_count} rows where tax calculation deviates from standard 8% rate.",
                        affected_rows_count=mismatch_count,
                        sample_row_ids=[str(i) for i in df[tax_mismatch].index[:5]],
                        suggested_fix="Check if special tax exemptions or localized municipal tax rules were applied."
                    ))
                    finding_id_seq += 1

            if "currency" in df.columns:
                curr_counts = df["currency"].value_counts()
                if len(curr_counts) > 1:
                    minority_curr = curr_counts.index[1]
                    curr_mask = df["currency"] == minority_curr
                    c_count = int(curr_mask.sum())
                    consistency_issues += c_count
                    findings_for_file.append(Finding(
                        id=f"FND-{finding_id_seq}",
                        severity="HIGH",
                        file=filename,
                        check_name="Cross-Currency Inconsistency",
                        dimension="Consistency",
                        message=f"Found {c_count} rows with foreign currency '{minority_curr}' instead of base USD.",
                        affected_rows_count=c_count,
                        sample_row_ids=[str(i) for i in df[curr_mask].index[:5]],
                        suggested_fix="Convert foreign currency amounts using end-of-day spot exchange rates."
                    ))
                    finding_id_seq += 1

            consistency_score = round(max(0.0, (1.0 - (consistency_issues / max(len(df), 1))) * 100), 1)

            # --- 5. TIMELINESS ---
            timeliness_score = 98.0
            for dcol in date_cols:
                parsed = pd.to_datetime(df[dcol], errors="coerce").dropna()
                if len(parsed) > 0:
                    future_dates = parsed > pd.Timestamp("2024-12-31")
                    if future_dates.sum() > 0:
                        timeliness_score -= 10.0
                        findings_for_file.append(Finding(
                            id=f"FND-{finding_id_seq}",
                            severity="MEDIUM",
                            file=filename,
                            check_name="Out-of-Period Future Dates",
                            dimension="Timeliness",
                            message=f"Found {int(future_dates.sum())} dates posted beyond expected accounting period.",
                            affected_rows_count=int(future_dates.sum()),
                            sample_row_ids=[str(i) for i in parsed[future_dates].index[:5]],
                            suggested_fix="Review future-dated postings and reclassify to appropriate fiscal quarter."
                        ))
                        finding_id_seq += 1

            overall_score = round((completeness_score + uniqueness_score + validity_score + consistency_score + timeliness_score) / 5.0, 1)

            file_scores[filename] = DimensionScore(
                completeness=completeness_score,
                uniqueness=uniqueness_score,
                validity=validity_score,
                consistency=consistency_score,
                timeliness=timeliness_score,
                overall=overall_score
            )
            all_findings.extend(findings_for_file)

        avg_overall = round(sum(s.overall for s in file_scores.values()) / max(len(file_scores), 1), 1)
        return QualityDashboardData(
            file_scores=file_scores,
            overall_score=avg_overall,
            findings=all_findings
        )

    def _detect_id_col(self, df: pd.DataFrame) -> str:
        for c in df.columns:
            if c.lower() in ["transaction_id", "reference_id", "id", "order_id", "charge_id"]:
                return c
        return df.columns[0] if len(df.columns) > 0 else ""
