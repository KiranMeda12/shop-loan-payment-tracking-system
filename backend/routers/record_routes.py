import os
import uuid
import re
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database import get_db
from backend.models import AdminUser, Customer, PaymentRecord, PaymentTransaction
from backend.schemas import PaymentRecordResponse, TransactionResponse, PartialPaymentRequest, MarkPaidRequest, PaymentRecordUpdate
from backend.auth import get_current_admin

router = APIRouter(prefix="/api/records", tags=["Payment Records"])

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
if is_vercel:
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}

def generate_record_id(db: Session) -> str:
    now = datetime.now()
    prefix = f"REC-{now.strftime('%Y%m')}"
    # find highest sequence for current month
    last_record = (
        db.query(PaymentRecord)
        .filter(PaymentRecord.record_id.like(f"{prefix}-%"))
        .order_by(desc(PaymentRecord.id))
        .first()
    )
    if last_record and last_record.record_id:
        try:
            last_seq = int(last_record.record_id.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}-{new_seq:04d}"

def format_record_response(record: PaymentRecord, base_url: str = "") -> dict:
    txs = [
        TransactionResponse(
            id=t.id,
            record_id=t.record_id,
            amount=t.amount,
            payment_date=t.payment_date,
            payment_method=t.payment_method,
            notes=t.notes,
            created_at=t.created_at
        )
        for t in sorted(record.transactions, key=lambda x: x.payment_date, reverse=True)
    ]
    slip_url = f"/uploads/{record.slip_filename}" if record.slip_filename else None
    return {
        "id": record.id,
        "record_id": record.record_id,
        "customer_id": record.customer_id,
        "customer_name": record.customer.name if record.customer else "Unknown",
        "customer_phone": record.customer.phone if record.customer else "Unknown",
        "amount_to_pay": record.amount_to_pay,
        "amount_paid": record.amount_paid,
        "remaining_balance": record.remaining_balance,
        "slip_filename": record.slip_filename,
        "slip_original_name": record.slip_original_name,
        "slip_url": slip_url,
        "status": record.status,
        "entry_date": record.entry_date,
        "due_date": record.due_date,
        "notes": record.notes,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "transactions": txs
    }

@router.post("", response_model=PaymentRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_entry(
    customer_name: str = Form(...),
    phone_number: str = Form(...),
    amount_to_pay: float = Form(...),
    slip: Optional[UploadFile] = File(None),
    notes: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    # Validation
    name_clean = customer_name.strip()
    phone_clean = phone_number.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Customer Name is required.")
    if not phone_clean:
        raise HTTPException(status_code=400, detail="Phone Number is required.")
    if amount_to_pay <= 0:
        raise HTTPException(status_code=400, detail="Amount to Pay must be greater than 0.")

    # Deduplication check: same customer, same phone, same amount within last 30 seconds
    recent_cutoff = datetime.utcnow() - timedelta(seconds=30)
    existing_duplicate = (
        db.query(PaymentRecord)
        .join(Customer)
        .filter(
            Customer.phone == phone_clean,
            PaymentRecord.amount_to_pay == amount_to_pay,
            PaymentRecord.created_at >= recent_cutoff
        )
        .first()
    )
    if existing_duplicate:
        raise HTTPException(
            status_code=400,
            detail="Duplicate entry detected. A record with identical details was just saved."
        )

    # Link or create customer
    customer = db.query(Customer).filter(Customer.phone == phone_clean).first()
    if not customer:
        customer = Customer(name=name_clean, phone=phone_clean)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    else:
        # Update name if changed
        if customer.name != name_clean:
            customer.name = name_clean
            db.commit()

    # Handle slip upload
    saved_filename = None
    original_filename = None
    if slip and slip.filename:
        ext = os.path.splitext(slip.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Only JPG, PNG, WEBP and PDF files are permitted."
            )
        original_filename = slip.filename
        safe_name = f"{uuid.uuid4().hex[:12]}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', slip.filename)}"
        saved_filename = safe_name
        dest_path = os.path.join(UPLOAD_DIR, safe_name)
        contents = await slip.read()
        with open(dest_path, "wb") as f:
            f.write(contents)

    # Parse due date if provided
    parsed_due_date = None
    if due_date:
        try:
            parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        except Exception:
            pass

    # Automatic fields
    record_id = generate_record_id(db)
    now_dt = datetime.utcnow()

    # Status defaults to "Pending" as per requirements
    # "Do not treat an uploaded slip alone as proof that payment has been received."
    new_record = PaymentRecord(
        record_id=record_id,
        customer_id=customer.id,
        amount_to_pay=amount_to_pay,
        amount_paid=0.0,
        remaining_balance=amount_to_pay,
        slip_filename=saved_filename,
        slip_original_name=original_filename,
        status="Pending",
        entry_date=now_dt,
        due_date=parsed_due_date,
        notes=notes
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return format_record_response(new_record)

@router.get("", response_model=List[PaymentRecordResponse])
def get_payment_records(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    query = db.query(PaymentRecord).join(Customer)

    # Search filter
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PaymentRecord.record_id.ilike(s),
                Customer.name.ilike(s),
                Customer.phone.ilike(s)
            )
        )

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(PaymentRecord.status == status_filter)

    # Date filters
    if year:
        query = query.filter(PaymentRecord.entry_date >= datetime(year, 1, 1))
        if month:
            # End of month
            if month == 12:
                next_month = datetime(year + 1, 1, 1)
            else:
                next_month = datetime(year, month + 1, 1)
            query = query.filter(
                PaymentRecord.entry_date >= datetime(year, month, 1),
                PaymentRecord.entry_date < next_month
            )
        else:
            query = query.filter(PaymentRecord.entry_date < datetime(year + 1, 1, 1))

    # Order newest first
    records = query.order_by(desc(PaymentRecord.entry_date), desc(PaymentRecord.id)).all()

    # Dynamic overdue check: if remaining_balance > 0, status is Pending or Partially Paid, and due_date has passed
    today = datetime.utcnow()
    for r in records:
        if r.remaining_balance > 0 and r.due_date and r.due_date < today and r.status != "Overdue":
            r.status = "Overdue"
            db.commit()

    return [format_record_response(r) for r in records]

@router.get("/{record_id}", response_model=PaymentRecordResponse)
def get_single_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    return format_record_response(rec)

@router.put("/{record_id}", response_model=PaymentRecordResponse)
def update_payment_record(
    record_id: int,
    req: PaymentRecordUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if req.customer_name or req.customer_phone:
        cust = rec.customer
        if req.customer_name:
            cust.name = req.customer_name.strip()
        if req.customer_phone:
            cust.phone = req.customer_phone.strip()

    if req.amount_to_pay is not None and req.amount_to_pay > 0:
        rec.amount_to_pay = req.amount_to_pay
        rec.remaining_balance = max(0.0, rec.amount_to_pay - rec.amount_paid)
        # Recalculate status
        if rec.remaining_balance <= 0:
            rec.status = "Paid"
        elif rec.amount_paid > 0:
            rec.status = "Partially Paid"
        else:
            rec.status = "Pending"

    if req.due_date is not None:
        rec.due_date = req.due_date
    if req.notes is not None:
        rec.notes = req.notes

    rec.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return format_record_response(rec)

@router.post("/{record_id}/pay-full", response_model=PaymentRecordResponse)
def mark_record_as_paid(
    record_id: int,
    req: MarkPaidRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if rec.remaining_balance <= 0:
        raise HTTPException(status_code=400, detail="This record is already fully paid.")

    payment_amount = rec.remaining_balance
    tx = PaymentTransaction(
        record_id=rec.id,
        amount=payment_amount,
        payment_date=datetime.utcnow(),
        payment_method=req.payment_method or "Cash",
        notes=req.notes or "Marked fully paid"
    )
    db.add(tx)

    rec.amount_paid = rec.amount_to_pay
    rec.remaining_balance = 0.0
    rec.status = "Paid"
    rec.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rec)
    return format_record_response(rec)

@router.post("/{record_id}/partial-payment", response_model=PaymentRecordResponse)
def record_partial_payment(
    record_id: int,
    req: PartialPaymentRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if rec.remaining_balance <= 0:
        raise HTTPException(status_code=400, detail="This record is already fully paid.")

    if req.amount > rec.remaining_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (₹{req.amount:,.2f}) exceeds outstanding balance (₹{rec.remaining_balance:,.2f})."
        )

    pay_date = req.payment_date or datetime.utcnow()
    tx = PaymentTransaction(
        record_id=rec.id,
        amount=req.amount,
        payment_date=pay_date,
        payment_method=req.payment_method,
        notes=req.notes
    )
    db.add(tx)

    rec.amount_paid += req.amount
    rec.remaining_balance = max(0.0, rec.amount_to_pay - rec.amount_paid)

    if rec.remaining_balance <= 0:
        rec.status = "Paid"
    else:
        rec.status = "Partially Paid"

    rec.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return format_record_response(rec)

@router.post("/{record_id}/upload-slip", response_model=PaymentRecordResponse)
async def upload_record_slip(
    record_id: int,
    slip: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    ext = os.path.splitext(slip.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only JPG, PNG, WEBP and PDF files are allowed."
        )

    # Remove old slip if exists
    if rec.slip_filename:
        old_path = os.path.join(UPLOAD_DIR, rec.slip_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    safe_name = f"{uuid.uuid4().hex[:12]}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', slip.filename)}"
    dest_path = os.path.join(UPLOAD_DIR, safe_name)
    contents = await slip.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    rec.slip_filename = safe_name
    rec.slip_original_name = slip.filename
    rec.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return format_record_response(rec)

@router.delete("/{record_id}")
def delete_payment_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rec = db.query(PaymentRecord).filter(PaymentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if rec.slip_filename:
        slip_path = os.path.join(UPLOAD_DIR, rec.slip_filename)
        if os.path.exists(slip_path):
            try:
                os.remove(slip_path)
            except Exception:
                pass

    db.delete(rec)
    db.commit()
    return {"message": "Payment record deleted successfully", "id": record_id}
