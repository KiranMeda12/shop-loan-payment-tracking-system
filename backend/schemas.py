from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str

class ShopProfileUpdate(BaseModel):
    shop_name: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_address: Optional[str] = None
    new_password: Optional[str] = None

class UserInfoResponse(BaseModel):
    id: int
    username: str
    shop_name: str
    shop_phone: str
    shop_address: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfoResponse

# --- Transactions ---
class TransactionResponse(BaseModel):
    id: int
    record_id: int
    amount: float
    payment_date: datetime
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PartialPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount paid in rupees")
    payment_date: Optional[datetime] = None
    payment_method: str = "Cash"
    notes: Optional[str] = None

class MarkPaidRequest(BaseModel):
    payment_method: str = "Cash"
    notes: Optional[str] = None

# --- Payment Records ---
class PaymentRecordResponse(BaseModel):
    id: int
    record_id: str
    customer_id: int
    customer_name: str
    customer_phone: str
    amount_to_pay: float
    amount_paid: float
    remaining_balance: float
    slip_filename: Optional[str] = None
    slip_original_name: Optional[str] = None
    slip_url: Optional[str] = None
    status: str
    entry_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    transactions: List[TransactionResponse] = []

    class Config:
        from_attributes = True

class PaymentRecordUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    amount_to_pay: Optional[float] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

# --- Customer ---
class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    created_at: datetime
    total_amount_to_pay: float = 0.0
    total_amount_paid: float = 0.0
    remaining_balance: float = 0.0
    records_count: int = 0

    class Config:
        from_attributes = True

class CustomerDetailResponse(CustomerResponse):
    records: List[PaymentRecordResponse] = []

# --- Dashboard & Reports ---
class StatusCount(BaseModel):
    status: str
    count: int
    total_amount: float
    percentage: float

class MonthlyCollectionItem(BaseModel):
    month: str
    month_num: int
    collected: float
    loan_given: float

class YearlyComparisonItem(BaseModel):
    year: int
    collected: float
    due: float

class CustomerPaymentComparison(BaseModel):
    customer_name: str
    phone: str
    amount_to_pay: float
    amount_paid: float
    remaining_balance: float

class DashboardStatsResponse(BaseModel):
    total_customers: int
    total_amount_to_pay: float
    total_amount_received: float
    total_pending_amount: float
    paid_percentage: float
    pending_percentage: float
    status_counts: List[StatusCount]
    monthly_collections: List[MonthlyCollectionItem]
    recent_records: List[PaymentRecordResponse]

class MonthlyReportResponse(BaseModel):
    month: Optional[int] = None
    year: int
    total_due: float
    total_collected: float
    total_pending: float
    total_customers: int
    fully_paid_count: int
    partially_paid_count: int
    pending_count: int
    overdue_count: int
    payment_status_doughnut: List[dict]
    monthly_collection_chart: List[MonthlyCollectionItem]
    yearly_collection_chart: List[YearlyComparisonItem]
    collection_percentage: float
    outstanding_percentage: float
    top_customer_payments: List[CustomerPaymentComparison]
