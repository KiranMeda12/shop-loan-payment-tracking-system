# Shop Loan & Payment Tracking Management System

A modern, responsive, full-stack financial web application built for shop owners to manage customer loan amounts, payment records, uploaded payment slips, and monthly financial analytics.

---

## 🚀 Key Features

### 1. Dashboard Overview
- **6 Key Performance Cards**:
  - Total Customers
  - Total Credit Given (₹)
  - Total Amount Received (₹)
  - Total Pending Amount (₹)
  - Recovery Rate (%)
  - Pending Rate (%)
- **Interactive Charts**:
  - Overall Payment Status Doughnut Chart (Paid vs Partially Paid vs Pending vs Overdue)
  - Monthly Collection & Loan Bar Chart (Jan - Dec)
  - Paid vs Pending Visual Progress Comparison
- **Live Filtering**: Filter by Year and Month.
- **Recent Customer Payment Records**: Quick actions to view details, record partial payments, and inspect slips.

### 2. Streamlined "Add New Customer / Payment Entry"
- Strictly contains **ONLY** the 4 essential fields:
  1. Customer Name *(required)*
  2. Phone Number *(required)*
  3. Amount to Pay (₹) *(required)*
  4. Upload Payment Slip *(JPG, PNG, or PDF)*
- **Automatically Generated Fields**:
  - Unique Record ID (e.g., `REC-202610-0001`)
  - Entry Date and Time
  - Initial Payment Status (`Pending`)
- Prevents accidental repeated double-clicks and duplicate records.

### 3. Customer Payment Records Management
- Professional data table displaying: Record ID, Date (DD-MM-YYYY), Customer Name, Phone, Amount to Pay, Amount Paid, Balance Due, Payment Slip, Payment Status, Actions.
- **Actions**:
  - **View Details**: Opens Customer Profile with full history and printable statement.
  - **View or Download Slip**: Preview images or embedded PDFs with direct download option.
  - **Edit Record**: Modify customer details, amounts, or notes.
  - **Delete Record**: Safe deletion with modal confirmation.
  - **Mark as Fully Paid**: 1-click full payment confirmation.
  - **Record Partial Payment**: Modal to input amount received, payment date, method (Cash, UPI, Bank Transfer), and notes.
- Statuses color-coded:
  - 🟢 **Paid** (Green)
  - 🔵 **Partially Paid** (Sky Blue)
  - 🟠 **Pending** (Orange)
  - 🔴 **Overdue** (Red)

### 4. Customer History & Account Ledgers
- Aggregated financial ledger for each customer (Total Credit, Total Paid, Outstanding Balance).
- Complete chronological transaction history with dates, receipt numbers, and payment modes.
- Gallery of all uploaded payment slips.
- **Printable Customer Payment Statement** with shop owner signature block.
- **One-click Customer Statement PDF download**.

### 5. Dedicated Monthly Reports & Analytics
- Select Month, Year, or Custom Date Range.
- **8 Metric Summary Cards**:
  1. Total Amount Due
  2. Total Amount Collected
  3. Total Pending Amount
  4. Number of Customers
  5. Fully Paid Records
  6. Partially Paid Records
  7. Pending Records
  8. Overdue Records
- **5 Interactive Recharts Charts**:
  1. Payment Status Doughnut Chart
  2. Monthly Collection Bar Chart (January to December)
  3. Yearly Collection Comparison Chart
  4. Payment Recovery Percentage Chart
  5. Customer Payment Comparison Chart (Top customer balances)

### 6. Exports & Database Backup
- **Download Monthly Reports as PDF**: Generated on the backend with ReportLab with professional table styling and shop headers.
- **Export Customer Records to Excel**: Generated with openpyxl with formatted numbers, headers, and totals.
- **1-Click Database Backup Manager**: Generates complete SQL/JSON backup of the MySQL database with download link and archive history.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS v4
  - Recharts (Interactive SVG Charts)
  - Lucide React Icons
  - Axios HTTP Client with JWT interceptors
- **Backend**:
  - Python FastAPI
  - SQLAlchemy ORM
  - MySQL 8.0 (Database: `shop_credit_db`)
  - PyMySQL Driver (UTF-8 MB4)
  - ReportLab (PDF generation)
  - OpenPyXL (Excel generation)
  - PyJWT & Bcrypt (Authentication & Security)
- **Database**:
  - MySQL 8.0 running locally on port 3306.

---

## 🔐 Default Admin Credentials

- **URL**: [http://localhost:5173](http://localhost:5173)
- **Username**: `admin`
- **Password**: `admin123`

---

## 🏃‍♂️ How to Run

### Method 1: Using the 1-Click Batch File
Double-click `start_app.bat` in the project root. It will start both backend and frontend servers and open your browser automatically.

### Method 2: Manual Start
**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
