import io
import calendar
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_

from backend.database import get_db
from backend.models import AdminUser, Customer, PaymentRecord, PaymentTransaction
from backend.schemas import (
    DashboardStatsResponse,
    MonthlyReportResponse,
    StatusCount,
    MonthlyCollectionItem,
    YearlyComparisonItem,
    CustomerPaymentComparison
)
from backend.auth import get_current_admin
from backend.routers.record_routes import format_record_response
from backend.services.pdf_service import generate_monthly_report_pdf
from backend.services.excel_service import generate_records_excel

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    current_year = year or datetime.now().year
    records_query = db.query(PaymentRecord)

    if year:
        records_query = records_query.filter(extract('year', PaymentRecord.entry_date) == year)
        if month:
            records_query = records_query.filter(extract('month', PaymentRecord.entry_date) == month)

    records = records_query.all()

    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_amount_to_pay = sum(r.amount_to_pay for r in records)
    total_amount_received = sum(r.amount_paid for r in records)
    total_pending_amount = sum(r.remaining_balance for r in records)

    paid_percentage = round((total_amount_received / total_amount_to_pay * 100), 1) if total_amount_to_pay > 0 else 0.0
    pending_percentage = round((total_pending_amount / total_amount_to_pay * 100), 1) if total_amount_to_pay > 0 else 0.0

    # Status counts & totals
    status_map = {
        "Paid": {"count": 0, "amount": 0.0},
        "Partially Paid": {"count": 0, "amount": 0.0},
        "Pending": {"count": 0, "amount": 0.0},
        "Overdue": {"count": 0, "amount": 0.0},
    }
    for r in records:
        st = r.status if r.status in status_map else "Pending"
        status_map[st]["count"] += 1
        status_map[st]["amount"] += r.amount_to_pay

    status_counts = []
    total_recs = len(records)
    for st, data in status_map.items():
        pct = round((data["count"] / total_recs * 100), 1) if total_recs > 0 else 0.0
        status_counts.append(StatusCount(
            status=st,
            count=data["count"],
            total_amount=data["amount"],
            percentage=pct
        ))

    # Monthly collections Jan - Dec of selected year
    monthly_collections = []
    for m_num in range(1, 13):
        m_recs = db.query(PaymentRecord).filter(
            extract('year', PaymentRecord.entry_date) == current_year,
            extract('month', PaymentRecord.entry_date) == m_num
        ).all()
        collected = sum(r.amount_paid for r in m_recs)
        loan_given = sum(r.amount_to_pay for r in m_recs)
        monthly_collections.append(MonthlyCollectionItem(
            month=MONTH_NAMES[m_num - 1],
            month_num=m_num,
            collected=round(collected, 2),
            loan_given=round(loan_given, 2)
        ))

    # Recent 6 records
    recent_records_raw = (
        db.query(PaymentRecord)
        .order_by(PaymentRecord.entry_date.desc(), PaymentRecord.id.desc())
        .limit(6)
        .all()
    )
    recent_records = [format_record_response(r) for r in recent_records_raw]

    return DashboardStatsResponse(
        total_customers=total_customers,
        total_amount_to_pay=round(total_amount_to_pay, 2),
        total_amount_received=round(total_amount_received, 2),
        total_pending_amount=round(total_pending_amount, 2),
        paid_percentage=paid_percentage,
        pending_percentage=pending_percentage,
        status_counts=status_counts,
        monthly_collections=monthly_collections,
        recent_records=recent_records
    )

@router.get("/monthly-analytics", response_model=MonthlyReportResponse)
def get_monthly_analytics(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    selected_year = year or datetime.now().year
    records_query = db.query(PaymentRecord)

    if start_date and end_date:
        try:
            s_dt = datetime.fromisoformat(start_date.split("T")[0])
            e_dt = datetime.fromisoformat(end_date.split("T")[0]).replace(hour=23, minute=59, second=59)
            records_query = records_query.filter(PaymentRecord.entry_date >= s_dt, PaymentRecord.entry_date <= e_dt)
        except Exception:
            pass
    elif year:
        records_query = records_query.filter(extract('year', PaymentRecord.entry_date) == year)
        if month:
            records_query = records_query.filter(extract('month', PaymentRecord.entry_date) == month)

    records = records_query.all()

    total_due = sum(r.amount_to_pay for r in records)
    total_collected = sum(r.amount_paid for r in records)
    total_pending = sum(r.remaining_balance for r in records)

    cust_ids = set(r.customer_id for r in records)
    total_customers = len(cust_ids)

    fully_paid_count = sum(1 for r in records if r.status == "Paid")
    partially_paid_count = sum(1 for r in records if r.status == "Partially Paid")
    pending_count = sum(1 for r in records if r.status == "Pending")
    overdue_count = sum(1 for r in records if r.status == "Overdue")

    collection_pct = round((total_collected / total_due * 100), 1) if total_due > 0 else 0.0
    outstanding_pct = round((total_pending / total_due * 100), 1) if total_due > 0 else 0.0

    # Doughnut Chart Data
    total_recs = len(records)
    doughnut = [
        {
            "name": "Paid",
            "value": fully_paid_count,
            "amount": sum(r.amount_paid for r in records if r.status == "Paid"),
            "percentage": round((fully_paid_count / total_recs * 100), 1) if total_recs > 0 else 0.0,
            "color": "#16a34a"
        },
        {
            "name": "Partially Paid",
            "value": partially_paid_count,
            "amount": sum(r.amount_paid for r in records if r.status == "Partially Paid"),
            "percentage": round((partially_paid_count / total_recs * 100), 1) if total_recs > 0 else 0.0,
            "color": "#0284c7"
        },
        {
            "name": "Pending",
            "value": pending_count,
            "amount": sum(r.remaining_balance for r in records if r.status == "Pending"),
            "percentage": round((pending_count / total_recs * 100), 1) if total_recs > 0 else 0.0,
            "color": "#ea580c"
        },
        {
            "name": "Overdue",
            "value": overdue_count,
            "amount": sum(r.remaining_balance for r in records if r.status == "Overdue"),
            "percentage": round((overdue_count / total_recs * 100), 1) if total_recs > 0 else 0.0,
            "color": "#dc2626"
        }
    ]

    # Monthly Collection Bar Chart Jan to Dec
    monthly_collection_chart = []
    for m_num in range(1, 13):
        m_recs = db.query(PaymentRecord).filter(
            extract('year', PaymentRecord.entry_date) == selected_year,
            extract('month', PaymentRecord.entry_date) == m_num
        ).all()
        collected = sum(r.amount_paid for r in m_recs)
        loan_given = sum(r.amount_to_pay for r in m_recs)
        monthly_collection_chart.append(MonthlyCollectionItem(
            month=MONTH_NAMES[m_num - 1],
            month_num=m_num,
            collected=round(collected, 2),
            loan_given=round(loan_given, 2)
        ))

    # Yearly Collection Chart
    current_yr = datetime.now().year
    years_to_compare = [current_yr - 2, current_yr - 1, current_yr]
    yearly_chart = []
    for y in years_to_compare:
        y_recs = db.query(PaymentRecord).filter(extract('year', PaymentRecord.entry_date) == y).all()
        y_coll = sum(r.amount_paid for r in y_recs)
        y_due = sum(r.amount_to_pay for r in y_recs)
        yearly_chart.append(YearlyComparisonItem(
            year=y,
            collected=round(y_coll, 2),
            due=round(y_due, 2)
        ))

    # Customer Payment Comparison (Top 10 customers by loan/payment activity)
    customer_stats = {}
    for r in records:
        c_id = r.customer_id
        if c_id not in customer_stats:
            customer_stats[c_id] = {
                "name": r.customer.name if r.customer else "Unknown",
                "phone": r.customer.phone if r.customer else "",
                "amount_to_pay": 0.0,
                "amount_paid": 0.0,
                "remaining_balance": 0.0
            }
        customer_stats[c_id]["amount_to_pay"] += r.amount_to_pay
        customer_stats[c_id]["amount_paid"] += r.amount_paid
        customer_stats[c_id]["remaining_balance"] += r.remaining_balance

    sorted_custs = sorted(customer_stats.values(), key=lambda x: x["amount_to_pay"], reverse=True)[:10]
    top_customer_payments = [
        CustomerPaymentComparison(
            customer_name=c["name"],
            phone=c["phone"],
            amount_to_pay=round(c["amount_to_pay"], 2),
            amount_paid=round(c["amount_paid"], 2),
            remaining_balance=round(c["remaining_balance"], 2)
        )
        for c in sorted_custs
    ]

    return MonthlyReportResponse(
        month=month,
        year=selected_year,
        total_due=round(total_due, 2),
        total_collected=round(total_collected, 2),
        total_pending=round(total_pending, 2),
        total_customers=total_customers,
        fully_paid_count=fully_paid_count,
        partially_paid_count=partially_paid_count,
        pending_count=pending_count,
        overdue_count=overdue_count,
        payment_status_doughnut=doughnut,
        monthly_collection_chart=monthly_collection_chart,
        yearly_collection_chart=yearly_chart,
        collection_percentage=collection_pct,
        outstanding_percentage=outstanding_pct,
        top_customer_payments=top_customer_payments
    )

@router.get("/monthly-pdf")
def download_monthly_pdf(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    selected_year = year or datetime.now().year
    records_query = db.query(PaymentRecord).filter(extract('year', PaymentRecord.entry_date) == selected_year)
    if month:
        records_query = records_query.filter(extract('month', PaymentRecord.entry_date) == month)

    records = records_query.order_by(PaymentRecord.entry_date.desc()).all()

    total_due = sum(r.amount_to_pay for r in records)
    total_collected = sum(r.amount_paid for r in records)
    total_pending = sum(r.remaining_balance for r in records)

    collection_pct = round((total_collected / total_due * 100), 1) if total_due > 0 else 0.0

    summary = {
        "total_due": total_due,
        "total_collected": total_collected,
        "total_pending": total_pending,
        "collection_percentage": collection_pct,
        "fully_paid_count": sum(1 for r in records if r.status == "Paid"),
        "partially_paid_count": sum(1 for r in records if r.status == "Partially Paid"),
        "pending_count": sum(1 for r in records if r.status == "Pending"),
        "overdue_count": sum(1 for r in records if r.status == "Overdue")
    }

    records_data = []
    for r in records:
        records_data.append({
            "record_id": r.record_id,
            "date_formatted": r.entry_date.strftime("%d-%m-%Y"),
            "customer_name": r.customer.name if r.customer else "Unknown",
            "customer_phone": r.customer.phone if r.customer else "",
            "amount_to_pay": r.amount_to_pay,
            "amount_paid": r.amount_paid,
            "remaining_balance": r.remaining_balance,
            "status": r.status
        })

    admin = db.query(AdminUser).first()
    shop_info = {
        "shop_name": admin.shop_name if admin else "Shop Credit Store",
        "shop_phone": admin.shop_phone if admin else "",
        "shop_address": admin.shop_address if admin else "",
    }

    month_name = FULL_MONTH_NAMES[month - 1] if month and 1 <= month <= 12 else ""
    pdf_buffer = generate_monthly_report_pdf(summary, records_data, shop_info, month_name, selected_year)

    filename = f"Financial_Report_{month_name or 'Year'}_{selected_year}.pdf"
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/excel")
def download_excel(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    query = db.query(PaymentRecord).join(Customer)
    if year:
        query = query.filter(extract('year', PaymentRecord.entry_date) == year)
        if month:
            query = query.filter(extract('month', PaymentRecord.entry_date) == month)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(PaymentRecord.status == status_filter)

    records = query.order_by(PaymentRecord.entry_date.desc()).all()

    records_data = []
    for r in records:
        records_data.append({
            "record_id": r.record_id,
            "date_formatted": r.entry_date.strftime("%d-%m-%Y"),
            "customer_name": r.customer.name if r.customer else "Unknown",
            "customer_phone": r.customer.phone if r.customer else "",
            "amount_to_pay": r.amount_to_pay,
            "amount_paid": r.amount_paid,
            "remaining_balance": r.remaining_balance,
            "status": r.status,
            "slip_filename": r.slip_filename,
            "notes": r.notes
        })

    title = f"Report_{year or 'All'}"
    if month and 1 <= month <= 12:
        title += f"_{MONTH_NAMES[month - 1]}"

    excel_buffer = generate_records_excel(records_data, title=title)
    filename = f"Shop_Credit_Records_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"

    return Response(
        content=excel_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
