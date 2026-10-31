import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_monthly_report_pdf(summary: dict, records: list, shop_info: dict, month_name: str, year: int) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    th_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    story = []

    # Shop Header
    shop_name = shop_info.get("shop_name", "Shop Loan & Payment Management")
    shop_phone = shop_info.get("shop_phone", "")
    shop_addr = shop_info.get("shop_address", "")

    story.append(Paragraph(shop_name.upper(), title_style))
    story.append(Paragraph(f"{shop_addr} | Phone: {shop_phone}", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb'), spaceAfter=12))

    # Report Title
    period_str = f"{month_name} {year}" if month_name else f"Financial Year {year}"
    story.append(Paragraph(f"Monthly Financial Collection Report — {period_str}", h2_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%d-%m-%Y %I:%M %p')}", subtitle_style))
    story.append(Spacer(1, 12))

    # KPI Summary Cards in Table
    kpi_data = [
        [
            Paragraph("Total Amount Due", cell_style),
            Paragraph(f"Rs. {summary.get('total_due', 0):,.2f}", cell_bold),
            Paragraph("Total Collected", cell_style),
            Paragraph(f"Rs. {summary.get('total_collected', 0):,.2f}", cell_bold),
        ],
        [
            Paragraph("Total Pending", cell_style),
            Paragraph(f"Rs. {summary.get('total_pending', 0):,.2f}", cell_bold),
            Paragraph("Recovery Rate", cell_style),
            Paragraph(f"{summary.get('collection_percentage', 0):.1f}%", cell_bold),
        ],
        [
            Paragraph("Total Records", cell_style),
            Paragraph(str(len(records)), cell_bold),
            Paragraph("Fully Paid Records", cell_style),
            Paragraph(str(summary.get('fully_paid_count', 0)), cell_bold),
        ],
        [
            Paragraph("Partially Paid", cell_style),
            Paragraph(str(summary.get('partially_paid_count', 0)), cell_bold),
            Paragraph("Pending / Overdue", cell_style),
            Paragraph(f"{summary.get('pending_count', 0)} / {summary.get('overdue_count', 0)}", cell_bold),
        ]
    ]

    t_kpi = Table(kpi_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 16))

    # Records Table
    story.append(Paragraph("Detailed Records", h2_style))
    rec_headers = [
        Paragraph("Record ID", th_style),
        Paragraph("Date", th_style),
        Paragraph("Customer Name", th_style),
        Paragraph("Phone", th_style),
        Paragraph("Due (Rs.)", th_style),
        Paragraph("Paid (Rs.)", th_style),
        Paragraph("Balance (Rs.)", th_style),
        Paragraph("Status", th_style),
    ]
    table_rows = [rec_headers]

    for rec in records:
        status_color = colors.HexColor('#16a34a') if rec['status'] == 'Paid' else (
            colors.HexColor('#0284c7') if rec['status'] == 'Partially Paid' else (
                colors.HexColor('#dc2626') if rec['status'] == 'Overdue' else colors.HexColor('#ea580c')
            )
        )
        st_style = ParagraphStyle('ST', parent=cell_bold, textColor=status_color)
        table_rows.append([
            Paragraph(str(rec.get('record_id', '')), cell_style),
            Paragraph(rec.get('date_formatted', ''), cell_style),
            Paragraph(str(rec.get('customer_name', '')), cell_bold),
            Paragraph(str(rec.get('customer_phone', '')), cell_style),
            Paragraph(f"{rec.get('amount_to_pay', 0):,.2f}", cell_style),
            Paragraph(f"{rec.get('amount_paid', 0):,.2f}", cell_style),
            Paragraph(f"{rec.get('remaining_balance', 0):,.2f}", cell_style),
            Paragraph(rec.get('status', ''), st_style),
        ])

    if len(table_rows) == 1:
        table_rows.append([Paragraph("No records found for this period.", cell_style)] + [Paragraph("", cell_style)]*7)

    t_records = Table(table_rows, colWidths=[65, 60, 95, 75, 55, 55, 55, 60], repeatRows=1)
    t_records.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    story.append(t_records)
    story.append(Spacer(1, 24))

    # Footer note & signature block
    sig_data = [
        [
            Paragraph("Prepared By: Shop Owner / Cashier", cell_style),
            Paragraph("Authorized Signature & Stamp", cell_style)
        ],
        [
            Paragraph("", cell_style),
            Paragraph("\n\n___________________________", cell_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_customer_statement_pdf(customer_data: dict, records: list, shop_info: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=6
    )
    cell_style = ParagraphStyle('Cell', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#1e293b'))
    cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#0f172a'))
    th_style = ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.white)

    story = []

    # Header
    shop_name = shop_info.get("shop_name", "Shop Loan & Payment Management")
    shop_phone = shop_info.get("shop_phone", "")
    shop_addr = shop_info.get("shop_address", "")

    story.append(Paragraph(shop_name.upper(), title_style))
    story.append(Paragraph(f"{shop_addr} | Phone: {shop_phone}", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb'), spaceAfter=12))

    story.append(Paragraph("CUSTOMER ACCOUNT & PAYMENT STATEMENT", h2_style))
    story.append(Paragraph(f"Date of Statement: {datetime.now().strftime('%d-%m-%Y %I:%M %p')}", subtitle_style))
    story.append(Spacer(1, 10))

    # Customer Summary
    cust_table = [
        [
            Paragraph("Customer Name:", cell_bold),
            Paragraph(customer_data.get('name', ''), cell_style),
            Paragraph("Total Credit Given:", cell_bold),
            Paragraph(f"Rs. {customer_data.get('total_amount_to_pay', 0):,.2f}", cell_bold),
        ],
        [
            Paragraph("Phone Number:", cell_bold),
            Paragraph(customer_data.get('phone', ''), cell_style),
            Paragraph("Total Amount Received:", cell_bold),
            Paragraph(f"Rs. {customer_data.get('total_amount_paid', 0):,.2f}", cell_bold),
        ],
        [
            Paragraph("Customer Since:", cell_bold),
            Paragraph(customer_data.get('created_at_formatted', ''), cell_style),
            Paragraph("Outstanding Balance:", cell_bold),
            Paragraph(f"Rs. {customer_data.get('remaining_balance', 0):,.2f}", ParagraphStyle('Bal', parent=cell_bold, textColor=colors.HexColor('#dc2626'))),
        ]
    ]
    t_c = Table(cust_table, colWidths=[120, 140, 130, 130])
    t_c.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bfdbfe')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbeafe')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_c)
    story.append(Spacer(1, 14))

    # Entries Table
    story.append(Paragraph("Loan & Credit Records", h2_style))
    rec_headers = [
        Paragraph("Record ID", th_style),
        Paragraph("Date", th_style),
        Paragraph("Amount to Pay", th_style),
        Paragraph("Amount Paid", th_style),
        Paragraph("Balance", th_style),
        Paragraph("Status", th_style),
    ]
    rows = [rec_headers]
    for r in records:
        status_color = colors.HexColor('#16a34a') if r['status'] == 'Paid' else (
            colors.HexColor('#0284c7') if r['status'] == 'Partially Paid' else colors.HexColor('#ea580c')
        )
        rows.append([
            Paragraph(r['record_id'], cell_style),
            Paragraph(r['date_formatted'], cell_style),
            Paragraph(f"Rs. {r['amount_to_pay']:,.2f}", cell_style),
            Paragraph(f"Rs. {r['amount_paid']:,.2f}", cell_style),
            Paragraph(f"Rs. {r['remaining_balance']:,.2f}", cell_bold),
            Paragraph(r['status'], ParagraphStyle('S', parent=cell_bold, textColor=status_color)),
        ])
    t_r = Table(rows, colWidths=[85, 85, 90, 90, 90, 80])
    t_r.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_r)
    story.append(Spacer(1, 14))

    # Payment History / Transactions
    story.append(Paragraph("Payment Transactions History", h2_style))
    tx_headers = [
        Paragraph("Receipt #", th_style),
        Paragraph("Payment Date", th_style),
        Paragraph("Record Ref", th_style),
        Paragraph("Amount Paid", th_style),
        Paragraph("Method", th_style),
        Paragraph("Notes", th_style),
    ]
    t_rows = [tx_headers]
    all_txs = []
    for r in records:
        for tx in r.get('transactions', []):
            all_txs.append({
                "id": f"TXN-{tx['id']:04d}",
                "date": tx.get('date_formatted', ''),
                "record_id": r['record_id'],
                "amount": tx['amount'],
                "method": tx.get('payment_method', 'Cash'),
                "notes": tx.get('notes', '-') or '-'
            })
    all_txs.sort(key=lambda x: x['date'], reverse=True)

    if not all_txs:
        t_rows.append([Paragraph("No payment transactions recorded yet.", cell_style)] + [Paragraph("", cell_style)]*5)
    else:
        for tx in all_txs:
            t_rows.append([
                Paragraph(tx['id'], cell_style),
                Paragraph(tx['date'], cell_style),
                Paragraph(tx['record_id'], cell_style),
                Paragraph(f"Rs. {tx['amount']:,.2f}", cell_bold),
                Paragraph(tx['method'], cell_style),
                Paragraph(tx['notes'], cell_style),
            ])

    t_tx = Table(t_rows, colWidths=[75, 85, 85, 85, 80, 110])
    t_tx.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tx)
    story.append(Spacer(1, 24))

    # Signatures
    sig_data = [
        [Paragraph("Customer Signature", cell_style), Paragraph("Shop Owner / Cashier Signature", cell_style)],
        [Paragraph("\n\n________________________", cell_style), Paragraph("\n\n________________________", cell_style)]
    ]
    story.append(Table(sig_data, colWidths=[260, 260]))

    doc.build(story)
    buffer.seek(0)
    return buffer
