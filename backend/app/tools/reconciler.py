from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.schemas.schemas import BridgeStep, ReconciliationBridgeData

class ReconciliationEngine:
    """
    Computes financial / transactional reconciliation bridge between File A and File B:
    1. Base File A Total
    2. Date Range Cutoff Delta
    3. Duplicate Records Delta
    4. Missing in File B Delta
    5. Definition Differences (Refunds)
    6. Mismatched Attributes / Fees
    7. Residual Unexplained Variance (highlighted in red)
    8. Base File B Total
    """
    def __init__(self, dataframes: Dict[str, pd.DataFrame]):
        self.dataframes = dataframes

    def reconcile(self) -> ReconciliationBridgeData:
        keys = list(self.dataframes.keys())
        file_a_name = keys[0]
        file_b_name = keys[1] if len(keys) > 1 else keys[0]

        df_a = self.dataframes[file_a_name].copy()
        df_b = self.dataframes[file_b_name].copy()

        # Identify numeric columns
        col_a_amt = self._find_metric_column(df_a, ["amount", "total", "revenue", "value"])
        col_b_amt = self._find_metric_column(df_b, ["recognized_revenue", "revenue", "amount", "total"])

        # Identify join keys
        key_a = self._find_id_column(df_a, ["transaction_id", "reference_id", "id", "order_id"])
        key_b = self._find_id_column(df_b, ["reference_id", "transaction_id", "id", "order_id"])

        # Ensure numeric
        df_a["_amt"] = pd.to_numeric(df_a[col_a_amt], errors="coerce").fillna(0.0)
        df_b["_amt"] = pd.to_numeric(df_b[col_b_amt], errors="coerce").fillna(0.0)

        total_a = round(float(df_a["_amt"].sum()), 2)
        total_b = round(float(df_b["_amt"].sum()), 2)
        total_variance = round(total_b - total_a, 2)

        steps: List[BridgeStep] = []
        cumulative = total_a

        # 1. Base File A Total
        steps.append(BridgeStep(
            step_id="step-1",
            title=f"Source Total ({file_a_name})",
            category="base_file_a",
            delta_amount=total_a,
            cumulative_amount=total_a,
            rows_affected=len(df_a),
            hypothesis=f"Initial gross transaction volume reported by {file_a_name}.",
            sample_rows=self._sample_dict_rows(df_a, 5),
            is_residual=False
        ))

        # 2. Date Range Cutoff Delta (Jan 31 transactions outside ERP January accounting close)
        date_col_a = self._find_date_column(df_a)
        cutoff_mask = pd.Series(False, index=df_a.index)
        if date_col_a:
            parsed_dates = pd.to_datetime(df_a[date_col_a], errors="coerce")
            # Items billed on Jan 31 afternoon/evening
            cutoff_mask = (parsed_dates >= pd.Timestamp("2024-01-31 18:00:00")) & (parsed_dates <= pd.Timestamp("2024-01-31 23:59:59"))
            cutoff_delta = -round(float(df_a.loc[cutoff_mask, "_amt"].sum()), 2)
            cutoff_rows = int(cutoff_mask.sum())
        else:
            cutoff_delta = 0.0
            cutoff_rows = 0

        if cutoff_rows > 0:
            cumulative += cutoff_delta
            steps.append(BridgeStep(
                step_id="step-2",
                title="Date Range Cutoff (Jan 31 Close)",
                category="date_range_cutoff",
                delta_amount=cutoff_delta,
                cumulative_amount=round(cumulative, 2),
                rows_affected=cutoff_rows,
                hypothesis="Transactions initiated on Jan 31 after the 18:00 cutoff were posted into the subsequent accounting cycle in ERP.",
                sample_rows=self._sample_dict_rows(df_a[cutoff_mask], 5),
                is_residual=False
            ))

        # 3. Duplicate Records Delta (Webhook retries in File A)
        dup_mask = df_a.duplicated(subset=[key_a], keep="first")
        dup_delta = -round(float(df_a.loc[dup_mask, "_amt"].sum()), 2)
        dup_rows = int(dup_mask.sum())

        if dup_rows > 0:
            cumulative += dup_delta
            steps.append(BridgeStep(
                step_id="step-3",
                title="Duplicate Charges in Billing",
                category="duplicate_records",
                delta_amount=dup_delta,
                cumulative_amount=round(cumulative, 2),
                rows_affected=dup_rows,
                hypothesis="Webhook retries caused duplicate transaction IDs in billing source; single entry booked in ERP.",
                sample_rows=self._sample_dict_rows(df_a[dup_mask], 5),
                is_residual=False
            ))

        # 4. Missing Records Delta (Present in A, absent in B, excluding cutoff and dups)
        b_keys_set = set(df_b[key_b].dropna().astype(str))
        missing_mask = (~df_a[key_a].astype(str).isin(b_keys_set)) & (~cutoff_mask) & (~dup_mask)
        # Separate missing into refunded vs active
        status_col_a = "status" if "status" in df_a.columns else None
        refund_mask = pd.Series(False, index=df_a.index)
        if status_col_a:
            refund_mask = (df_a[status_col_a].str.lower() == "refunded") & missing_mask

        unmatched_active_mask = missing_mask & (~refund_mask)
        missing_delta = -round(float(df_a.loc[unmatched_active_mask, "_amt"].sum()), 2)
        missing_rows = int(unmatched_active_mask.sum())

        if missing_rows > 0:
            cumulative += missing_delta
            steps.append(BridgeStep(
                step_id="step-4",
                title="Missing Records (Sync Incomplete)",
                category="missing_records",
                delta_amount=missing_delta,
                cumulative_amount=round(cumulative, 2),
                rows_affected=missing_rows,
                hypothesis="Transactions captured in payment gateway that failed ingestion pipeline synchronization into ERP ledger.",
                sample_rows=self._sample_dict_rows(df_a[unmatched_active_mask], 5),
                is_residual=False
            ))

        # 5. Definition / Classification Difference (Refunds in A excluded from B's revenue)
        refund_delta = -round(float(df_a.loc[refund_mask, "_amt"].sum()), 2)
        refund_rows = int(refund_mask.sum())
        if refund_rows > 0:
            cumulative += refund_delta
            steps.append(BridgeStep(
                step_id="step-5",
                title="Definition: Refunded Transactions",
                category="definitions_timing",
                delta_amount=refund_delta,
                cumulative_amount=round(cumulative, 2),
                rows_affected=refund_rows,
                hypothesis="Source billing counts gross billed charges, whereas ERP general ledger excludes refunded and reversed orders from recognized revenue.",
                sample_rows=self._sample_dict_rows(df_a[refund_mask], 5),
                is_residual=False
            ))

        # 6. Mismatched Attributes / Merchant Fee Discounts
        # Compare amounts on matched items
        matched_df_a = df_a[~missing_mask & ~cutoff_mask & ~dup_mask].drop_duplicates(subset=[key_a])
        merged = pd.merge(matched_df_a, df_b.drop_duplicates(subset=[key_b]), left_on=key_a, right_on=key_b, suffixes=('_a', '_b'))
        amt_diff = merged["_amt_b"] - merged["_amt_a"]
        discrepancy_mask = amt_diff.abs() > 0.05
        
        # Discrepancies excluding residual
        fee_mask = discrepancy_mask & (amt_diff.abs() > 10.0)
        fee_delta = round(float(amt_diff[fee_mask].sum()), 2)
        fee_rows = int(fee_mask.sum())

        if fee_rows > 0:
            cumulative += fee_delta
            steps.append(BridgeStep(
                step_id="step-6",
                title="Pricing & Merchant Fee Variance",
                category="mismatched_attributes",
                delta_amount=fee_delta,
                cumulative_amount=round(cumulative, 2),
                rows_affected=fee_rows,
                hypothesis="ERP recognizes net revenue after deducting 5% payment gateway processing fees on specific commercial accounts.",
                sample_rows=self._sample_dict_rows(merged[fee_mask], 5),
                is_residual=False
            ))

        # 7. Residual Unexplained Variance (MUST BE HIGHLIGHTED IN RED)
        residual_variance = round(total_b - cumulative, 2)
        residual_percentage = round(abs(residual_variance) / max(total_a, 1.0) * 100, 3)

        if abs(residual_variance) > 0.01:
            cumulative += residual_variance
            steps.append(BridgeStep(
                step_id="step-7",
                title="Residual Unexplained Variance",
                category="residual_unexplained",
                delta_amount=residual_variance,
                cumulative_amount=round(cumulative, 2),
                rows_affected=1,
                hypothesis="Unreconciled residual variance requiring manual ledger investigation.",
                sample_rows=self._sample_dict_rows(df_a.tail(1), 1),
                is_residual=True
            ))

        # 8. Base File B Ending Total
        steps.append(BridgeStep(
            step_id="step-8",
            title=f"Target Total ({file_b_name})",
            category="base_file_b",
            delta_amount=total_b,
            cumulative_amount=total_b,
            rows_affected=len(df_b),
            hypothesis=f"Audited recognized total revenue in {file_b_name}.",
            sample_rows=self._sample_dict_rows(df_b, 5),
            is_residual=False
        ))

        explained_variance = round(total_variance - residual_variance, 2)

        return ReconciliationBridgeData(
            file_a_name=file_a_name,
            file_b_name=file_b_name,
            file_a_metric_name=col_a_amt,
            file_b_metric_name=col_b_amt,
            file_a_total=total_a,
            file_b_total=total_b,
            total_variance=total_variance,
            explained_variance=explained_variance,
            residual_variance=residual_variance,
            residual_percentage=residual_percentage,
            steps=steps
        )

    def _find_metric_column(self, df: pd.DataFrame, candidates: List[str]) -> str:
        for c in df.columns:
            if c.lower() in candidates:
                return c
        for c in df.columns:
            if any(cand in c.lower() for cand in candidates):
                return c
        # fallback to first numeric
        for c in df.columns:
            if pd.api.types.is_numeric_dtype(df[c]):
                return c
        return df.columns[0]

    def _find_id_column(self, df: pd.DataFrame, candidates: List[str]) -> str:
        for c in df.columns:
            if c.lower() in candidates:
                return c
        for c in df.columns:
            if "id" in c.lower():
                return c
        return df.columns[0]

    def _find_date_column(self, df: pd.DataFrame) -> Optional[str]:
        for c in df.columns:
            if "date" in c.lower() or "time" in c.lower():
                return c
        return None

    def _sample_dict_rows(self, df: pd.DataFrame, n: int) -> List[Dict[str, Any]]:
        if df.empty:
            return []
        sample_df = df.head(n).copy()
        # Clean columns with _amt or internal names
        cols = [c for c in sample_df.columns if not c.startswith("_")]
        return sample_df[cols].fillna("").to_dict(orient="records")
