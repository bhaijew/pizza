"use client";

/**
 * Daily Closing Executive PDF Exporter (Zero-Dependency Native PDF 1.4 Engine)
 *
 * Designed to compile seamlessly under Next.js Turbopack without any external heavy
 * dependencies (avoiding core-js / canvg module resolution issues).
 *
 * Features:
 * 1. Immediate automatic browser download of `.pdf` file
 * 2. Complete itemized order table: Order #, Exact Date & Time, Order Type & Table,
 *    Customer Name & Phone, Items Summary, Status, Amount
 * 3. Financial KPI Summary Cards (Gross Sales, Net Profit, Day Expenses, Dine-in, Takeaway)
 * 4. Multi-page pagination with repeated headers
 * 5. Dual Audit Sign-Off Blocks (Cashier / Operator & Store Manager / Owner)
 * 6. In-browser HTML Print View fallback for thermal / paper printing
 */

export interface DailyClosingReportPDFInput {
  date: string;
  shopName: string;
  currencySymbol: string;
  closedBy: string;
  totalOrders: number;
  totalSales: number;
  dineInSales: number;
  takeawaySales: number;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  totalExpenses: number;
  netProfit: number;
  isClosed: boolean;
  closingRecord?: any;
  orders: any[];
  expenses: any[];
  shiftWindow?: string;
  notes?: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

function formatOrderItemsSummary(items: any): string {
  if (!items) return "—";
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return formatOrderItemsSummary(parsed);
    } catch {
      return items.slice(0, 50);
    }
  }
  if (Array.isArray(items)) {
    return items
      .map((it) => {
        const qty = it.quantity || it.qty || 1;
        const name = it.name || it.title || "Item";
        const variant = it.selectedVariation || it.selected_variation ? ` (${it.selectedVariation || it.selected_variation})` : "";
        return `${qty}x ${name}${variant}`;
      })
      .join(", ");
  }
  return "Items";
}

function formatOrderDateTime(created_at?: string): { fullStr: string } {
  if (!created_at) return { fullStr: "—" };
  try {
    const d = new Date(created_at);
    if (isNaN(d.getTime())) return { fullStr: "—" };
    const dateStr = d.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
    });
    const timeStr = d.toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { fullStr: `${dateStr}, ${timeStr}` };
  } catch {
    return { fullStr: "—" };
  }
}

/**
 * Lightweight Standard PDF 1.4 Document Builder (A4: 595.28 x 841.89 points)
 */
class NativePdfDocument {
  pages: { stream: string; pageNumber: number }[] = [];
  currentPage: { stream: string; pageNumber: number };
  pageWidth = 595.28;
  pageHeight = 841.89;

  constructor() {
    this.currentPage = { stream: "", pageNumber: 1 };
    this.pages.push(this.currentPage);
  }

  addPage(): void {
    this.currentPage = { stream: "", pageNumber: this.pages.length + 1 };
    this.pages.push(this.currentPage);
  }

  private escapePdfString(str: string): string {
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb: [number, number, number] | null = null,
    strokeRgb: [number, number, number] | null = null,
    strokeWidth = 1
  ): void {
    let s = "q ";
    if (fillRgb) {
      s += `${fillRgb[0].toFixed(3)} ${fillRgb[1].toFixed(3)} ${fillRgb[2].toFixed(3)} rg `;
    }
    if (strokeRgb) {
      s += `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG ${strokeWidth} w `;
    }
    s += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
    if (fillRgb && strokeRgb) s += "b ";
    else if (fillRgb) s += "f ";
    else if (strokeRgb) s += "s ";
    s += "Q\n";
    this.currentPage.stream += s;
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    rgb: [number, number, number] = [0.85, 0.88, 0.92],
    width = 1
  ): void {
    this.currentPage.stream += `q ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l s Q\n`;
  }

  text(
    str: string,
    x: number,
    y: number,
    size = 8.5,
    isBold = false,
    rgb: [number, number, number] = [0.06, 0.09, 0.16]
  ): void {
    const font = isBold ? "/F2" : "/F1";
    this.currentPage.stream += `q ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg BT ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${this.escapePdfString(str)}) Tj ET Q\n`;
  }

  build(): Uint8Array {
    const header = "%PDF-1.4\n";
    const objects: string[] = [];
    const offsets: number[] = [];
    let curOffset = header.length;

    const totalPages = this.pages.length;
    const pageObjNums: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      pageObjNums.push(5 + i * 2);
    }

    const addObj = (str: string) => {
      offsets.push(curOffset);
      const full = `${offsets.length} 0 obj\n${str}\nendobj\n`;
      objects.push(full);
      curOffset += full.length;
    };

    // Obj 1: Catalog
    addObj("<< /Type /Catalog /Pages 2 0 R >>");
    // Obj 2: Pages
    addObj(`<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${totalPages} >>`);
    // Obj 3: Font Regular (Helvetica)
    addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    // Obj 4: Font Bold (Helvetica-Bold)
    addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    // Add each page & stream
    for (let i = 0; i < totalPages; i++) {
      const p = this.pages[i];
      const streamNum = 6 + i * 2;
      const streamBytes = p.stream.length;

      // Page obj
      addObj(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${streamNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`
      );
      // Stream obj
      addObj(`<< /Length ${streamBytes} >>\nstream\n${p.stream}endstream`);
    }

    // Build xref & trailer
    const startXref = curOffset;
    let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
    for (let i = 0; i < offsets.length; i++) {
      xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }

    const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    const fullPdf = header + objects.join("") + xref + trailer;

    // Convert string to Uint8Array binary
    const buf = new Uint8Array(fullPdf.length);
    for (let i = 0; i < fullPdf.length; i++) {
      buf[i] = fullPdf.charCodeAt(i) & 0xff;
    }
    return buf;
  }
}

/**
 * 1. AUTOMATIC PDF FILE DOWNLOAD (ZERO-DEPENDENCY)
 * Builds native PDF 1.4 document and triggers direct browser file download.
 */
export function exportDailyClosingPDF(report: DailyClosingReportPDFInput): void {
  if (typeof window === "undefined") return;

  const pdf = new NativePdfDocument();
  const curr = report.currencySymbol || "Rs.";
  const shopName = report.shopName || "Pizza Store";
  const safeShop = sanitizeFileName(shopName);
  const fileName = `Z-Report-${safeShop}-${report.date}.pdf`;

  const drawHeaderOnPage = (pageNum: number) => {
    // Header Slate Banner
    pdf.rect(30, 750, 535, 62, [0.06, 0.09, 0.16]);

    // Store Title
    pdf.text(shopName.toUpperCase(), 45, 788, 16, true, [1, 1, 1]);
    pdf.text(
      `OFFICIAL DAILY REGISTER RECONCILIATION & AUDIT Z-REPORT (Page ${pageNum})`,
      45,
      772,
      8.5,
      false,
      [0.8, 0.85, 0.9]
    );
    pdf.text(
      `Date: ${report.date} | Shift: ${report.shiftWindow || "Full Operational Window"} | Operator: ${report.closedBy || "Admin / Staff"}`,
      45,
      758,
      8,
      false,
      [0.65, 0.75, 0.85]
    );

    // Status Badge
    const isClosed = report.isClosed;
    const badgeRgb: [number, number, number] = isClosed ? [0.02, 0.59, 0.41] : [0.85, 0.47, 0.02];
    pdf.rect(450, 772, 105, 20, badgeRgb);
    pdf.text(isClosed ? "REGISTER CLOSED" : "PRE-CLOSING AUDIT", 462, 785, 7.5, true, [1, 1, 1]);
  };

  // Draw Page 1 Header
  drawHeaderOnPage(1);

  // ─── FINANCIAL KPI CARDS ─────────────────────────────────────────
  // Gross Sales
  pdf.rect(30, 680, 170, 50, [0.97, 0.98, 0.99], [0.88, 0.91, 0.94]);
  pdf.text(`GROSS SALES (${report.totalOrders} Orders)`, 40, 715, 7.5, true, [0.4, 0.45, 0.55]);
  pdf.text(`${curr} ${Number(report.totalSales).toLocaleString()}`, 40, 695, 13, true, [0.06, 0.09, 0.16]);

  // Net Cash / Profit
  const isNetPos = report.netProfit >= 0;
  const netBg: [number, number, number] = isNetPos ? [0.94, 0.99, 0.96] : [0.99, 0.95, 0.95];
  const netBorder: [number, number, number] = isNetPos ? [0.73, 0.97, 0.82] : [0.99, 0.79, 0.79];
  const netText: [number, number, number] = isNetPos ? [0.08, 0.4, 0.2] : [0.7, 0.1, 0.1];
  pdf.rect(212, 680, 170, 50, netBg, netBorder);
  pdf.text("NET CASH / PROFIT", 222, 715, 7.5, true, netText);
  pdf.text(`${curr} ${Number(report.netProfit).toLocaleString()}`, 222, 695, 13, true, netText);

  // Day Expenses
  pdf.rect(395, 680, 170, 50, [0.99, 0.95, 0.95], [0.99, 0.79, 0.79]);
  pdf.text("TOTAL DAY EXPENSES", 405, 715, 7.5, true, [0.7, 0.1, 0.1]);
  pdf.text(`-${curr} ${Number(report.totalExpenses).toLocaleString()}`, 405, 695, 13, true, [0.7, 0.1, 0.1]);

  // Sub-cards: Dine-In vs Takeaway
  pdf.rect(30, 642, 260, 26, [0.94, 0.98, 1], [0.73, 0.9, 0.99]);
  pdf.text(
    `Dine-In Sales: ${curr} ${Number(report.dineInSales).toLocaleString()} (${report.dineInOrdersCount} Orders)`,
    40,
    654,
    8,
    true,
    [0.01, 0.41, 0.63]
  );

  pdf.rect(305, 642, 260, 26, [0.96, 0.95, 1], [0.87, 0.84, 0.99]);
  pdf.text(
    `Takeaway / Delivery: ${curr} ${Number(report.takeawaySales).toLocaleString()} (${report.takeawayOrdersCount} Orders)`,
    315,
    654,
    8,
    true,
    [0.43, 0.16, 0.85]
  );

  // ─── COMPLETE ITEMIZED ORDERS TABLE ─────────────────────────────
  let y = 608;

  const drawOrderTableHeader = (curY: number) => {
    pdf.rect(30, curY, 535, 18, [0.91, 0.93, 0.96]);
    pdf.text("ORDER #", 36, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("DATE & TIME", 90, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("TYPE / TABLE", 175, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("CUSTOMER", 255, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("ITEMS SUMMARY", 345, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("STATUS", 475, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
    pdf.text("TOTAL", 528, curY + 6, 7.5, true, [0.2, 0.25, 0.35]);
  };

  drawOrderTableHeader(y);
  y -= 18;

  const ordersList = report.orders || [];
  if (ordersList.length === 0) {
    pdf.text("No orders recorded during this operational window.", 40, y + 6, 8, false, [0.5, 0.55, 0.6]);
    y -= 20;
  } else {
    ordersList.forEach((o, idx) => {
      // Check for page break (margin bottom = 120 points)
      if (y < 120) {
        pdf.addPage();
        drawHeaderOnPage(pdf.pages.length);
        y = 700;
        drawOrderTableHeader(y);
        y -= 18;
      }

      const isDine = o.order_type === "dine_in" || !!o.table_number || o.notes?.includes("[DINE-IN:");
      const typeLabel = isDine ? `Dine-in (T-${o.table_number || "—"})` : o.order_type === "delivery" ? "Delivery" : "Takeaway";
      const { fullStr } = formatOrderDateTime(o.created_at);
      const custName = (o.customer_name || "Guest").slice(0, 16);
      const itemsText = formatOrderItemsSummary(o.items).slice(0, 28);
      const isCancelled = o.status === "cancelled";

      // Alternate row backgrounds
      if (idx % 2 === 1) {
        pdf.rect(30, y - 3, 535, 16, [0.98, 0.98, 0.99]);
      }

      pdf.text(`#${o.order_number || o.id}`, 36, y + 4, 7.5, !isCancelled);
      pdf.text(fullStr, 90, y + 4, 7, false, [0.35, 0.4, 0.45]);
      pdf.text(typeLabel, 175, y + 4, 7.5, false);
      pdf.text(custName, 255, y + 4, 7.5, false);
      pdf.text(itemsText, 345, y + 4, 7, false, [0.3, 0.35, 0.4]);

      // Status
      const statusRgb: [number, number, number] = isCancelled
        ? [0.85, 0.15, 0.15]
        : o.status === "delivered" || o.status === "completed"
        ? [0.08, 0.4, 0.2]
        : [0.8, 0.5, 0.05];
      pdf.text((o.status || "COMP").toUpperCase().slice(0, 8), 475, y + 4, 7, true, statusRgb);

      // Total
      pdf.text(`${curr} ${Number(o.total || 0).toLocaleString()}`, 525, y + 4, 7.5, true);

      pdf.line(30, y - 3, 565, y - 3, [0.9, 0.92, 0.95], 0.5);
      y -= 16;
    });
  }

  // ─── DUAL AUDIT SIGN-OFF BLOCKS (BOTTOM OF PAGE) ────────────────
  const signY = 65;
  pdf.line(30, signY + 30, 565, signY + 30, [0.8, 0.85, 0.9], 1);

  pdf.text(`Closing Operator Sign-off (${report.closedBy || "Staff / Cashier"})`, 35, signY + 18, 7.5, true);
  pdf.line(35, signY + 4, 250, signY + 4, [0.3, 0.35, 0.4], 1);
  pdf.text("Physical Cash Counted & Register Reconciliation Verified", 35, signY - 6, 6.5, false, [0.5, 0.55, 0.6]);

  pdf.text("Store Manager / Owner Audit Acceptance", 320, signY + 18, 7.5, true);
  pdf.line(320, signY + 4, 535, signY + 4, [0.3, 0.35, 0.4], 1);
  pdf.text("Final Ledger Audit Approved & Safe Deposit Confirmed", 320, signY - 6, 6.5, false, [0.5, 0.55, 0.6]);

  // Build binary buffer
  const binaryData = pdf.build();

  // Trigger immediate browser download
  const blob = new Blob([binaryData as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 2. PRINT / FULL-SCREEN VIEW (HTML FALLBACK)
 * Opens an in-browser printable A4 view with complete modern CSS styling.
 */
export function openDailyClosingPrintView(report: DailyClosingReportPDFInput): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=960,height=1000");
  if (!printWindow) {
    alert("Please allow pop-ups to open the print view.");
    return;
  }

  const curr = report.currencySymbol || "Rs.";
  const shopName = report.shopName || "Pizza Store";
  const formattedDate = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const ordersRows =
    report.orders && report.orders.length > 0
      ? report.orders
          .map((o) => {
            const { fullStr } = formatOrderDateTime(o.created_at);
            const isDine = o.order_type === "dine_in" || !!o.table_number || o.notes?.includes("[DINE-IN:");
            const typeLabel = isDine ? `🍽️ Dine-in (T-${o.table_number || "—"})` : o.order_type === "delivery" ? "🛵 Delivery" : "📦 Takeaway";
            const items = formatOrderItemsSummary(o.items);
            const isCancelled = o.status === "cancelled";
            return `
            <tr style="${isCancelled ? "opacity: 0.5; text-decoration: line-through;" : ""}">
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; font-size: 11px;">#${o.order_number || o.id}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b; white-space: nowrap;">${fullStr}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">${typeLabel}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.customer_name || "Guest"}${o.customer_phone ? ` <span style="color:#64748b; font-size:9px;">(${o.customer_phone})</span>` : ""}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155;">${items}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; font-weight: 700; color: ${isCancelled ? "#dc2626" : "#059669"};">${o.status}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-weight: 800; text-align: right; font-size: 11px;">${curr} ${Number(o.total || 0).toLocaleString()}</td>
            </tr>
          `;
          })
          .join("")
      : `<tr><td colspan="7" style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">No orders found in this operational window.</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Z-Report - ${shopName} - ${report.date}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
    .header-card { background: #0f172a; color: white; border-radius: 5px; padding: 20px 24px; margin-bottom: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 12px 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-align: left; color: #475569; text-transform: uppercase; border-bottom: 1.5px solid #cbd5e1; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 18px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 9px 18px; background: #059669; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
      🖨️ Print Report
    </button>
  </div>

  <div class="header-card">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 900; letter-spacing: -0.02em;">${shopName.toUpperCase()}</h1>
        <div style="font-size: 12px; color: #94a3b8; font-weight: 600;">DAILY REGISTER RECONCILIATION AUDIT (Z-REPORT)</div>
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Date: ${report.date} (${formattedDate}) • Shift: ${report.shiftWindow || "Full Day"}</div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; background: ${report.isClosed ? "#059669" : "#d97706"};">
          ${report.isClosed ? "REGISTER CLOSED" : "PRE-CLOSING AUDIT"}
        </span>
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 6px;">Closed By: <strong>${report.closedBy || "Admin"}</strong></div>
      </div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Gross Total Sales</div>
      <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px;">${curr} ${Number(report.totalSales).toLocaleString()}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${report.totalOrders} Completed Orders</div>
    </div>
    <div class="kpi-card" style="background: ${report.netProfit >= 0 ? "#f0fdf4" : "#fef2f2"}; border-color: ${report.netProfit >= 0 ? "#bbf7d0" : "#fecaca"};">
      <div style="font-size: 11px; color: ${report.netProfit >= 0 ? "#15803d" : "#b91c1c"}; font-weight: 700; text-transform: uppercase;">Net Cash / Profit</div>
      <div style="font-size: 20px; font-weight: 900; color: ${report.netProfit >= 0 ? "#15803d" : "#b91c1c"}; margin-top: 4px;">${curr} ${Number(report.netProfit).toLocaleString()}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">After all expense deductions</div>
    </div>
    <div class="kpi-card" style="background: #fef2f2; border-color: #fecaca;">
      <div style="font-size: 11px; color: #b91c1c; font-weight: 700; text-transform: uppercase;">Day Expenses</div>
      <div style="font-size: 20px; font-weight: 900; color: #b91c1c; margin-top: 4px;">-${curr} ${Number(report.totalExpenses).toLocaleString()}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${report.expenses?.length || 0} Expense items</div>
    </div>
  </div>

  <div style="margin-top: 20px;">
    <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 8px; text-transform: uppercase;">
      Complete Orders Audit (${report.orders?.length || 0} Orders)
    </h2>
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Date &amp; Time</th>
          <th>Type / Table</th>
          <th>Customer</th>
          <th>Items Summary</th>
          <th>Status</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${ordersRows}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 36px; padding-top: 20px; border-top: 1.5px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
    <div>
      <div style="font-size: 11px; font-weight: 800; margin-bottom: 30px;">
        Closing Operator Sign-off (${report.closedBy || "Staff / Cashier"})
      </div>
      <div style="border-bottom: 1px solid #475569; width: 85%;"></div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Physical Cash Counted &amp; Register Reconciliation Verified</div>
    </div>
    <div>
      <div style="font-size: 11px; font-weight: 800; margin-bottom: 30px;">
        Store Manager / Owner Audit Acceptance
      </div>
      <div style="border-bottom: 1px solid #475569; width: 85%;"></div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Audit Verified &amp; Ledger Archival Confirmed</div>
    </div>
  </div>

  <div style="margin-top: 24px; text-align: center; font-size: 9px; color: #94a3b8;">
    Official Z-Report generated by ${shopName} POS • Powered by Pizza System Live Terminal
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
