"""
Demo data generator for Data Analyst Agent.
Generates two realistic enterprise transaction datasets:
1. File A: billing_stripe_transactions.csv (Source Billing / Gateway)
2. File B: erp_general_ledger_revenues.csv (ERP / Accounting Ledger)

Injected Discrepancy Dimensions:
- Date range cutoff difference
- Duplicate entries in File A
- Missing entries in File B
- Definition difference (Refunds included in A, excluded in B)
- Currency/fee attribute mismatch
- Residual unexplained variance
- Quality anomalies: nulls, invalid format, out-of-range dates
"""

import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_datasets(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    base_date = datetime(2024, 1, 1)
    customers = [
        ("CUST-101", "Acme Corporation", "NA"),
        ("CUST-102", "Globex Global", "EMEA"),
        ("CUST-103", "Soylent Industries", "NA"),
        ("CUST-104", "Initech Software", "APAC"),
        ("CUST-105", "Umbrella Bio", "NA"),
        ("CUST-106", "Hooli Tech", "NA"),
        ("CUST-107", "Massive Dynamic", "EMEA"),
        ("CUST-108", "Stark Logistics", "NA"),
        ("CUST-109", "Wayne Enterprises", "EMEA"),
        ("CUST-110", "Cyberdyne Systems", "APAC"),
    ]

    file_a_rows = []
    file_b_rows = []

    tx_counter = 1000

    # 1. Base clean matching transactions (800 rows)
    for _ in range(800):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        day_offset = random.randint(1, 28)
        tx_date = base_date + timedelta(days=day_offset, hours=random.randint(8, 18), minutes=random.randint(0, 59))
        amount = round(random.uniform(250.0, 4500.0), 2)
        payment_method = random.choice(["credit_card", "bank_transfer", "ach"])
        tax = round(amount * 0.08, 2)

        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": payment_method,
            "tax_amount": tax,
        })

        file_b_rows.append({
            "reference_id": tx_id,
            "account_id": f"GL-4000-{random.randint(10, 20)}",
            "client_id": cust_id,
            "posting_date": tx_date.strftime("%Y-%m-%d"),
            "recognized_revenue": amount,
            "currency": "USD",
            "status": "posted",
            "region": region,
        })

    # 2. Date Range Cutoff Discrepancy (billed Jan 31 in A, posted Feb 02 in B -> outside Jan accounting close)
    for _ in range(25):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        tx_date = datetime(2024, 1, 31, random.randint(19, 23), random.randint(0, 59))
        amount = round(random.uniform(800.0, 2500.0), 2)

        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": "credit_card",
            "tax_amount": round(amount * 0.08, 2),
        })
        # Not in File B for January closed period!

    # 3. Duplicate Records in File A (Webhook double-charge/retry)
    for _ in range(6):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        tx_date = base_date + timedelta(days=random.randint(5, 20))
        amount = round(random.uniform(500.0, 1800.0), 2)

        # First instance in A
        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": "credit_card",
            "tax_amount": round(amount * 0.08, 2),
        })
        # Duplicate instance in A (exact duplicate transaction_id)
        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": (tx_date + timedelta(seconds=12)).strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": "credit_card",
            "tax_amount": round(amount * 0.08, 2),
        })
        # Only posted once in File B
        file_b_rows.append({
            "reference_id": tx_id,
            "account_id": "GL-4000-15",
            "client_id": cust_id,
            "posting_date": tx_date.strftime("%Y-%m-%d"),
            "recognized_revenue": amount,
            "currency": "USD",
            "status": "posted",
            "region": region,
        })

    # 4. Missing Records in File B (Sync pipeline failure)
    for _ in range(18):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        tx_date = base_date + timedelta(days=random.randint(2, 25))
        amount = round(random.uniform(1000.0, 3200.0), 2)

        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": "ach",
            "tax_amount": round(amount * 0.08, 2),
        })
        # Missing from File B entirely!

    # 5. Definition difference: Refunded transactions in A excluded from B's revenue
    for _ in range(12):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        tx_date = base_date + timedelta(days=random.randint(3, 20))
        amount = round(random.uniform(600.0, 2200.0), 2)

        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "currency": "USD",
            "status": "refunded",
            "payment_method": "credit_card",
            "tax_amount": round(amount * 0.08, 2),
        })
        # Excluded from File B recognized revenue

    # 6. Mismatch in Amount (Discounts/Fee deduction difference)
    for _ in range(10):
        tx_counter += 1
        tx_id = f"TXN-{tx_counter}"
        cust_id, cust_name, region = random.choice(customers)
        tx_date = base_date + timedelta(days=random.randint(4, 26))
        gross_amount = round(random.uniform(1200.0, 3500.0), 2)
        net_amount = round(gross_amount * 0.95, 2) # 5% merchant fee deducted in ERP

        file_a_rows.append({
            "transaction_id": tx_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": gross_amount,
            "currency": "USD",
            "status": "paid",
            "payment_method": "credit_card",
            "tax_amount": round(gross_amount * 0.08, 2),
        })

        file_b_rows.append({
            "reference_id": tx_id,
            "account_id": "GL-4000-12",
            "client_id": cust_id,
            "posting_date": tx_date.strftime("%Y-%m-%d"),
            "recognized_revenue": net_amount,
            "currency": "USD",
            "status": "posted",
            "region": region,
        })

    # 7. Unexplained Residual Difference (small unexplained discrepancy)
    tx_counter += 1
    residual_tx_id = f"TXN-{tx_counter}"
    cust_id, cust_name, region = customers[0]
    file_a_rows.append({
        "transaction_id": residual_tx_id,
        "customer_id": cust_id,
        "customer_name": cust_name,
        "transaction_date": "2024-01-15 14:22:10",
        "amount": 1420.50,
        "currency": "USD",
        "status": "paid",
        "payment_method": "credit_card",
        "tax_amount": 113.64,
    })
    file_b_rows.append({
        "reference_id": residual_tx_id,
        "account_id": "GL-4000-99",
        "client_id": cust_id,
        "posting_date": "2024-01-15",
        "recognized_revenue": 1280.00,  # $140.50 residual gap
        "currency": "USD",
        "status": "posted",
        "region": region,
    })

    # 8. Injected Quality Audit Issues (Nulls, format violations)
    # File A: 4 null customer IDs, 2 invalid negative amounts
    file_a_rows[10]["customer_id"] = None
    file_a_rows[25]["customer_name"] = None
    file_a_rows[40]["customer_id"] = ""
    file_a_rows[55]["amount"] = -45.00  # invalid negative
    file_a_rows[70]["transaction_date"] = "2024/99/99"  # invalid date format

    # File B: 3 null account_ids, 1 currency mismatch
    file_b_rows[15]["account_id"] = None
    file_b_rows[30]["account_id"] = ""
    file_b_rows[45]["currency"] = "EUR"  # cross-file currency inconsistency

    df_a = pd.DataFrame(file_a_rows)
    df_b = pd.DataFrame(file_b_rows)

    path_a = os.path.join(output_dir, "billing_stripe_transactions.csv")
    path_b = os.path.join(output_dir, "erp_general_ledger_revenues.csv")

    df_a.to_csv(path_a, index=False)
    df_b.to_csv(path_b, index=False)

    print(f"Generated File A: {path_a} ({len(df_a)} rows, total amount: ${df_a['amount'].sum():,.2f})")
    print(f"Generated File B: {path_b} ({len(df_b)} rows, total revenue: ${df_b['recognized_revenue'].sum():,.2f})")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    examples_dir = os.path.abspath(os.path.join(current_dir, "..", "examples"))
    generate_datasets(examples_dir)
