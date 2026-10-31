from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from backend.database import get_db
from backend.models import AdminUser, Customer, PaymentRecord
from backend.schemas import CustomerResponse, CustomerDetailResponse, PaymentRecordResponse
from backend.auth import get_current_admin
from backend.routers.record_routes import format_record_response
from backend.services.pdf_service import generate_customer_statement_pdf

router = APIRouter(prefix="/api/customers", tags=["Customers"])

def compute_customer_summary(customer: Customer) -> dict:
    total_due = sum(r.amount_to_pay for r in customer.records)
    total_paid = sum(r.amount_paid for r in customer.records)
    total_balance = sum(r.remaining_balance for r in customer.records)
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "created_at": customer.created_at,
        "total_amount_to_pay": total_due,
        "total_amount_paid": total_paid,
        "remaining_balance": total_balance,
        "records_count": len(customer.records)
    }

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    query = db.query(Customer)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Customer.name.ilike(s), Customer.phone.ilike(s)))

    customers = query.order_by(Customer.name).all()
    return [compute_customer_summary(c) for c in customers]

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    summary = compute_customer_summary(customer)
    sorted_records = sorted(customer.records, key=lambda r: r.entry_date, reverse=True)
    formatted_records = [format_record_response(r) for r in sorted_records]

    return CustomerDetailResponse(
        **summary,
        records=formatted_records
    )

@router.get("/{customer_id}/statement-pdf")
def download_customer_statement_pdf(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    admin = db.query(AdminUser).first()
    shop_info = {
        "shop_name": admin.shop_name if admin else "Shop Credit Store",
        "shop_phone": admin.shop_phone if admin else "",
        "shop_address": admin.shop_address if admin else "",
    }

    summary = compute_customer_summary(customer)
    customer_data = {
        "name": customer.name,
        "phone": customer.phone,
        "total_amount_to_pay": summary["total_amount_to_pay"],
        "total_amount_paid": summary["total_amount_paid"],
        "remaining_balance": summary["remaining_balance"],
        "created_at_formatted": customer.created_at.strftime("%d-%m-%Y") if customer.created_at else ""
    }

    records_list = []
    for r in sorted(customer.records, key=lambda x: x.entry_date, reverse=True):
        tx_list = [
            {
                "id": t.id,
                "amount": t.amount,
                "payment_method": t.payment_method,
                "date_formatted": t.payment_date.strftime("%d-%m-%Y"),
                "notes": t.notes
            }
            for t in r.transactions
        ]
        records_list.append({
            "record_id": r.record_id,
            "date_formatted": r.entry_date.strftime("%d-%m-%Y"),
            "amount_to_pay": r.amount_to_pay,
            "amount_paid": r.amount_paid,
            "remaining_balance": r.remaining_balance,
            "status": r.status,
            "transactions": tx_list
        })

    pdf_buffer = generate_customer_statement_pdf(customer_data, records_list, shop_info)
    filename = f"Statement_{customer.name.replace(' ', '_')}_{customer.phone}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return {"message": "Customer and associated records deleted successfully", "id": customer_id}
