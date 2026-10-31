from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    shop_name = Column(String(200), default="Shop Credit & Loan Management")
    shop_phone = Column(String(50), default="+91 98765 43210")
    shop_address = Column(String(300), default="Main Bazaar, Commercial Street")
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    phone = Column(String(50), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    records = relationship("PaymentRecord", back_populates="customer", cascade="all, delete-orphan")

class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    amount_to_pay = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    remaining_balance = Column(Float, default=0.0)
    slip_filename = Column(String(255), nullable=True)
    slip_original_name = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending", index=True) # "Pending", "Partially Paid", "Paid", "Overdue"
    entry_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="records")
    transactions = relationship("PaymentTransaction", back_populates="record", cascade="all, delete-orphan", order_by="desc(PaymentTransaction.payment_date)")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("payment_records.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String(50), default="Cash") # "Cash", "UPI", "Bank Transfer", "Cheque"
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    record = relationship("PaymentRecord", back_populates="transactions")

class BackupLog(Base):
    __tablename__ = "backup_logs"

    id = Column(Integer, primary_key=True, index=True)
    backup_time = Column(DateTime, default=datetime.utcnow)
    file_name = Column(String(255), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    record_count = Column(Integer, default=0)
