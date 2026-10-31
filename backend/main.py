import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.database import engine, Base, get_db
from backend.models import AdminUser, Customer, PaymentRecord, PaymentTransaction
from backend.auth import hash_password
from backend.routers import auth_routes, record_routes, customer_routes, report_routes, backup_routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shop Loan & Payment Tracking System API",
    description="Backend API for customer loan amounts, payment records, slips, and monthly reports",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_routes.router)
app.include_router(record_routes.router)
app.include_router(customer_routes.router)
app.include_router(report_routes.router)
app.include_router(backup_routes.router)

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        # Check and seed default admin user
        admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
        if not admin:
            admin = AdminUser(
                username="admin",
                password_hash=hash_password("admin123"),
                shop_name="Sri Balaji Supermarket & Provisions",
                shop_phone="+91 98450 12345",
                shop_address="#45, Gandhi Market Road, Bangalore, Karnataka - 560002"
            )
            db.add(admin)
            db.commit()
            print("Default admin created: username='admin', password='admin123'")
    finally:
        db.close()

# Quick utility to seed demo data if explicitly requested by shop owner
@app.post("/api/seed-demo-data")
def seed_demo_data(db: Session = Depends(get_db)):
    # Check if records already exist
    existing = db.query(Customer).count()
    if existing > 0:
        return {"message": "Database already contains customer records. Demo seeding skipped.", "count": existing}

    sample_customers = [
        {"name": "Ramesh Kumar Sharma", "phone": "9876543210"},
        {"name": "Priya Sundaram", "phone": "9823456789"},
        {"name": "Anil Verma", "phone": "9712345678"},
        {"name": "Kavitha Reddy", "phone": "9654321987"},
        {"name": "Mohammad Irfan", "phone": "9543210987"},
        {"name": "Deepak Patel", "phone": "9432109876"},
    ]

    now = datetime.now()
    created_custs = []
    for c_data in sample_customers:
        c = Customer(name=c_data["name"], phone=c_data["phone"])
        db.add(c)
        db.commit()
        db.refresh(c)
        created_custs.append(c)

    # Add records for each with realistic statuses
    records_info = [
        # Customer 0: Ramesh - Fully Paid
        {"cust_idx": 0, "amount": 12500.0, "paid": 12500.0, "status": "Paid", "days_ago": 20, "tx": [12500.0]},
        # Customer 1: Priya - Partially Paid
        {"cust_idx": 1, "amount": 8000.0, "paid": 3500.0, "status": "Partially Paid", "days_ago": 15, "tx": [3500.0]},
        # Customer 2: Anil - Pending
        {"cust_idx": 2, "amount": 15000.0, "paid": 0.0, "status": "Pending", "days_ago": 8, "tx": []},
        # Customer 3: Kavitha - Overdue
        {"cust_idx": 3, "amount": 9500.0, "paid": 2000.0, "status": "Overdue", "days_ago": 45, "due_days_ago": 10, "tx": [2000.0]},
        # Customer 4: Irfan - Fully Paid
        {"cust_idx": 4, "amount": 6200.0, "paid": 6200.0, "status": "Paid", "days_ago": 12, "tx": [3000.0, 3200.0]},
        # Customer 5: Deepak - Partially Paid
        {"cust_idx": 5, "amount": 18400.0, "paid": 9000.0, "status": "Partially Paid", "days_ago": 5, "tx": [9000.0]},
    ]

    for idx, r_data in enumerate(records_info):
        c = created_custs[r_data["cust_idx"]]
        entry_dt = now - timedelta(days=r_data["days_ago"])
        due_dt = now - timedelta(days=r_data.get("due_days_ago", -15))
        rec_id = f"REC-{entry_dt.strftime('%Y%m')}-{idx+1:04d}"
        amount = r_data["amount"]
        paid = r_data["paid"]
        balance = amount - paid

        rec = PaymentRecord(
            record_id=rec_id,
            customer_id=c.id,
            amount_to_pay=amount,
            amount_paid=paid,
            remaining_balance=balance,
            status=r_data["status"],
            entry_date=entry_dt,
            due_date=due_dt,
            notes=f"Credit account ledger #{idx+101}"
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        for tx_amt in r_data["tx"]:
            tx = PaymentTransaction(
                record_id=rec.id,
                amount=tx_amt,
                payment_date=entry_dt + timedelta(days=2),
                payment_method="UPI" if tx_amt > 5000 else "Cash",
                notes="Receipt verified"
            )
            db.add(tx)
        db.commit()

    return {"message": "Demo sample records seeded successfully!", "customers": len(created_custs), "records": len(records_info)}

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Shop Loan & Payment Tracking Management System",
        "timestamp": datetime.utcnow().isoformat()
    }
