import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_records_excel(records: list, title: str = "Customer Payment Records") -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Records"

    # Title Banner
    ws.merge_cells('A1:J1')
    title_cell = ws['A1']
    title_cell.value = f"SHOP LOAN & CREDIT MANAGEMENT — {title.upper()}"
    title_cell.font = Font(name="Calibri", size=15, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 36

    headers = [
        "Record ID",
        "Date",
        "Customer Name",
        "Phone Number",
        "Amount to Pay (Rs.)",
        "Amount Paid (Rs.)",
        "Balance Remaining (Rs.)",
        "Payment Status",
        "Slip Attached",
        "Notes"
    ]

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    ws.append([]) # row 2 empty spacer
    ws.row_dimensions[2].height = 10

    # Header Row at row 3
    ws.append(headers)
    ws.row_dimensions[3].height = 24
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    # Data Rows
    row_idx = 4
    total_due = 0.0
    total_paid = 0.0
    total_balance = 0.0

    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

    for rec in records:
        amount_to_pay = float(rec.get('amount_to_pay', 0))
        amount_paid = float(rec.get('amount_paid', 0))
        remaining_balance = float(rec.get('remaining_balance', 0))

        total_due += amount_to_pay
        total_paid += amount_paid
        total_balance += remaining_balance

        row_data = [
            rec.get('record_id', ''),
            rec.get('date_formatted', ''),
            rec.get('customer_name', ''),
            rec.get('customer_phone', ''),
            amount_to_pay,
            amount_paid,
            remaining_balance,
            rec.get('status', ''),
            "Yes" if rec.get('slip_filename') else "No",
            rec.get('notes', '') or ''
        ]
        ws.append(row_data)
        ws.row_dimensions[row_idx].height = 20

        # Style data cells
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.border = thin_border
            if row_idx % 2 == 0:
                cell.fill = zebra_fill

            # Alignments & formats
            if col_idx in [1, 2, 8, 9]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in [5, 6, 7]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.number_format = '#,##0.00'
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

            # Color status
            if col_idx == 8:
                status = str(cell.value)
                if status == 'Paid':
                    cell.font = Font(name="Calibri", bold=True, color="16A34A")
                elif status == 'Partially Paid':
                    cell.font = Font(name="Calibri", bold=True, color="0284C7")
                elif status == 'Overdue':
                    cell.font = Font(name="Calibri", bold=True, color="DC2626")
                else:
                    cell.font = Font(name="Calibri", bold=True, color="EA580C")

        row_idx += 1

    # Total Summary Row
    summary_fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    summary_font = Font(name="Calibri", size=11, bold=True, color="0F172A")
    ws.append([
        "TOTALS",
        "",
        f"{len(records)} Records",
        "",
        total_due,
        total_paid,
        total_balance,
        "",
        "",
        ""
    ])
    ws.row_dimensions[row_idx].height = 24
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=row_idx, column=col_idx)
        cell.font = summary_font
        cell.fill = summary_fill
        cell.border = thin_border
        if col_idx in [5, 6, 7]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '#,##0.00'
        else:
            cell.alignment = Alignment(horizontal="center", vertical="center")

    # Auto column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            if len(val) > max_len:
                max_len = len(val)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
    ws.column_dimensions['A'].width = 16
    ws.column_dimensions['C'].width = 22
    ws.column_dimensions['D'].width = 16
    ws.column_dimensions['E'].width = 18
    ws.column_dimensions['F'].width = 18
    ws.column_dimensions['G'].width = 18

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
