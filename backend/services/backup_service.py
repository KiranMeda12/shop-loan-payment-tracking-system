import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Customer, PaymentRecord, PaymentTransaction, BackupLog, AdminUser

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
if is_vercel:
    BACKUP_DIR = "/tmp/backups"
else:
    BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def create_database_backup(db: Session) -> dict:
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"shop_credit_backup_{timestamp_str}.json"
    file_path = os.path.join(BACKUP_DIR, file_name)

    customers = db.query(Customer).all()
    records = db.query(PaymentRecord).all()
    txs = db.query(PaymentTransaction).all()
    admin = db.query(AdminUser).first()

    data = {
        "metadata": {
            "app": "Shop Loan & Payment Tracking Management System",
            "version": "1.0",
            "backup_date": datetime.utcnow().isoformat(),
            "customer_count": len(customers),
            "record_count": len(records),
            "transaction_count": len(txs),
        },
        "shop_profile": {
            "shop_name": admin.shop_name if admin else "Shop Credit Store",
            "shop_phone": admin.shop_phone if admin else "",
            "shop_address": admin.shop_address if admin else "",
        },
        "customers": [
            {
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in customers
        ],
        "payment_records": [
            {
                "id": r.id,
                "record_id": r.record_id,
                "customer_id": r.customer_id,
                "amount_to_pay": r.amount_to_pay,
                "amount_paid": r.amount_paid,
                "remaining_balance": r.remaining_balance,
                "slip_filename": r.slip_filename,
                "slip_original_name": r.slip_original_name,
                "status": r.status,
                "entry_date": r.entry_date.isoformat() if r.entry_date else None,
                "due_date": r.due_date.isoformat() if r.due_date else None,
                "notes": r.notes,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
        "payment_transactions": [
            {
                "id": t.id,
                "record_id": t.record_id,
                "amount": t.amount,
                "payment_date": t.payment_date.isoformat() if t.payment_date else None,
                "payment_method": t.payment_method,
                "notes": t.notes,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in txs
        ]
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    size_kb = round(os.path.getsize(file_path) / 1024, 2)
    backup_log = BackupLog(
        backup_time=datetime.utcnow(),
        file_name=file_name,
        file_size_kb=size_kb,
        record_count=len(records)
    )
    db.add(backup_log)
    db.commit()
    db.refresh(backup_log)

    return {
        "id": backup_log.id,
        "file_name": file_name,
        "file_size_kb": size_kb,
        "record_count": len(records),
        "backup_time": backup_log.backup_time.isoformat(),
        "file_path": file_path
    }
