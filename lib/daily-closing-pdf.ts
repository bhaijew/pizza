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
  cashSales?: number;
  onlineSales?: number;
  cashOrdersCount?: number;
  onlineOrdersCount?: number;
  splitOrdersCount?: number;
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

  // ─── CALCULATE CASH & ONLINE SALES FOR PDF ───────────────────────
  let pdfCashSales = report.cashSales !== undefined ? report.cashSales : 0;
  let pdfOnlineSales = report.onlineSales !== undefined ? report.onlineSales : 0;
  let pdfCashCount = report.cashOrdersCount !== undefined ? report.cashOrdersCount : 0;
  let pdfOnlineCount = report.onlineOrdersCount !== undefined ? report.onlineOrdersCount : 0;

  if (report.cashSales === undefined && Array.isArray(report.orders)) {
    pdfCashSales = 0;
    pdfOnlineSales = 0;
    pdfCashCount = 0;
    pdfOnlineCount = 0;
    report.orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const tot = Number(o.total) || 0;
      const pm = (o.payment_method || '').toLowerCase();
      const nts = (o.notes || '').toLowerCase();
      if (pm.includes('split') || nts.includes('split')) {
        const cMatch = (o.notes || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i);
        const oMatch = (o.notes || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i);
        const c = cMatch ? parseFloat(cMatch[1]) : 0;
        const onl = oMatch ? parseFloat(oMatch[1]) : Math.max(0, tot - c);
        pdfCashSales += c;
        pdfOnlineSales += onl;
        if (c > 0) pdfCashCount++;
        if (onl > 0) pdfOnlineCount++;
      } else if (pm.includes('card') || pm.includes('online') || pm.includes('bank') || pm.includes('transfer') || nts.includes('payment: card') || nts.includes('payment: online') || nts.includes('paid via online') || nts.includes('paid via card')) {
        pdfOnlineSales += tot;
        pdfOnlineCount++;
      } else {
        pdfCashSales += tot;
        pdfCashCount++;
      }
    });
  }

  // ─── FINANCIAL KPI CARDS: 4 ROW CARDS ─────────────────────────────
  // 1. Gross Sales (Width: 125)
  pdf.rect(30, 680, 128, 50, [0.97, 0.98, 0.99], [0.88, 0.91, 0.94]);
  pdf.text(`GROSS TOTAL (${report.totalOrders})`, 36, 715, 7, true, [0.4, 0.45, 0.55]);
  pdf.text(`${curr} ${Number(report.totalSales).toLocaleString()}`, 36, 695, 11, true, [0.06, 0.09, 0.16]);

  // 2. Cash Collected (Width: 128)
  pdf.rect(165, 680, 128, 50, [0.94, 0.99, 0.96], [0.73, 0.97, 0.82]);
  pdf.text(`CASH COLLECTED (${pdfCashCount})`, 171, 715, 7, true, [0.08, 0.4, 0.2]);
  pdf.text(`${curr} ${Number(pdfCashSales).toLocaleString()}`, 171, 695, 11, true, [0.08, 0.4, 0.2]);

  // 3. Online / Digital Sales (Width: 128)
  pdf.rect(300, 680, 128, 50, [0.94, 0.98, 1], [0.73, 0.9, 0.99]);
  pdf.text(`ONLINE / CARD (${pdfOnlineCount})`, 306, 715, 7, true, [0.01, 0.41, 0.63]);
  pdf.text(`${curr} ${Number(pdfOnlineSales).toLocaleString()}`, 306, 695, 11, true, [0.01, 0.41, 0.63]);

  // 4. Day Expenses (Width: 102)
  pdf.rect(435, 680, 130, 50, [0.99, 0.95, 0.95], [0.99, 0.79, 0.79]);
  pdf.text(`EXPENSES (${report.expenses?.length || 0})`, 441, 715, 7, true, [0.7, 0.1, 0.1]);
  pdf.text(`-${curr} ${Number(report.totalExpenses).toLocaleString()}`, 441, 695, 11, true, [0.7, 0.1, 0.1]);

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

  // ─── ITEMIZED EXPENSES BREAKDOWN TABLE ──────────────────────────
  const expensesList = report.expenses || [];
  if (expensesList.length > 0) {
    if (y < 160) {
      pdf.addPage();
      drawHeaderOnPage(pdf.pages.length);
      y = 700;
    } else {
      y -= 12;
    }

    const drawExpenseTableHeader = (curY: number) => {
      pdf.rect(30, curY, 535, 18, [0.99, 0.93, 0.93]);
      pdf.text("EXPENSE ITEM / DESCRIPTION", 36, curY + 6, 7.5, true, [0.7, 0.15, 0.15]);
      pdf.text("DATE", 240, curY + 6, 7.5, true, [0.7, 0.15, 0.15]);
      pdf.text("NOTES / VENDOR / BILL #", 330, curY + 6, 7.5, true, [0.7, 0.15, 0.15]);
      pdf.text("AMOUNT", 515, curY + 6, 7.5, true, [0.7, 0.15, 0.15]);
    };

    pdf.text(
      `ITEMIZED DAY EXPENSES (${expensesList.length} Items | Total: ${curr} ${Number(report.totalExpenses || 0).toLocaleString()})`,
      30,
      y + 6,
      8.5,
      true,
      [0.7, 0.15, 0.15]
    );
    y -= 14;
    drawExpenseTableHeader(y);
    y -= 18;

    expensesList.forEach((exp, idx) => {
      if (y < 120) {
        pdf.addPage();
        drawHeaderOnPage(pdf.pages.length);
        y = 700;
        drawExpenseTableHeader(y);
        y -= 18;
      }

      if (idx % 2 === 1) {
        pdf.rect(30, y - 3, 535, 16, [0.99, 0.97, 0.97]);
      }

      const title = String(exp.title || "Expense").slice(0, 36);
      const dateStr = exp.expense_date || report.date;
      const notes = String(exp.notes || "—").slice(0, 30);
      const amtStr = `${curr} ${Number(exp.amount || 0).toLocaleString()}`;

      pdf.text(title, 36, y + 4, 7.5, true, [0.15, 0.2, 0.25]);
      pdf.text(dateStr, 240, y + 4, 7, false, [0.35, 0.4, 0.45]);
      pdf.text(notes, 330, y + 4, 7, false, [0.4, 0.45, 0.5]);
      pdf.text(amtStr, 515, y + 4, 7.5, true, [0.7, 0.1, 0.1]);

      pdf.line(30, y - 3, 565, y - 3, [0.95, 0.9, 0.9], 0.5);
      y -= 16;
    });
  }

  // ─── DUAL AUDIT SIGN-OFF BLOCKS & OFFICIAL SHOP AUDIT STAMP ──────
  const signY = 65;
  pdf.line(30, signY + 30, 565, signY + 30, [0.8, 0.85, 0.9], 1);

  pdf.text(`Closing Operator Sign-off (${report.closedBy || "Staff / Cashier"})`, 35, signY + 18, 7.5, true);
  pdf.line(35, signY + 4, 195, signY + 4, [0.3, 0.35, 0.4], 1);
  pdf.text("Physical Cash Counted & Verified", 35, signY - 6, 6.5, false, [0.5, 0.55, 0.6]);

  // OFFICIAL SHOP SEAL / STAMP (CENTERED)
  const stampX = 220;
  const stampY = signY - 8;
  const stampW = 155;
  const stampH = 38;
  pdf.rect(stampX, stampY, stampW, stampH, [0.96, 0.98, 1], [0.12, 0.25, 0.6], 1.2);
  pdf.rect(stampX + 2, stampY + 2, stampW - 4, stampH - 4, null, [0.12, 0.25, 0.6], 0.6);
  pdf.text("★ OFFICIAL REGISTER AUDIT ★", stampX + 20, stampY + 28, 6.5, true, [0.12, 0.25, 0.6]);
  const safeStampName = (shopName || "STORE").toUpperCase().slice(0, 22);
  pdf.text(safeStampName, stampX + 16, stampY + 17, 8.5, true, [0.08, 0.18, 0.48]);
  pdf.text(`VERIFIED & AUDITED • ${report.date}`, stampX + 22, stampY + 7, 6, true, [0.02, 0.45, 0.3]);

  pdf.text("Store Manager / Owner Audit Acceptance", 395, signY + 18, 7.5, true);
  pdf.line(395, signY + 4, 555, signY + 4, [0.3, 0.35, 0.4], 1);
  pdf.text("Final Ledger Audit Approved & Confirmed", 395, signY - 6, 6.5, false, [0.5, 0.55, 0.6]);

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
export 
function getOrderPaymentBadge(o: any, curr: string): string {
  const pm = (o.payment_method || '').toLowerCase();
  const notes = (o.notes || '').toLowerCase();

  if (pm.includes('split') || notes.includes('split')) {
    const cashMatch = (o.notes || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i);
    const onlineMatch = (o.notes || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i);
    const c = cashMatch ? cashMatch[1] : '?';
    const onl = onlineMatch ? onlineMatch[1] : '?';
    return `<span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe;">⚡ SPLIT (💵${c} | 💳${onl})</span>`;
  }

  if (pm.includes('already') || notes.includes('already paid')) {
    return `<span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: #fdf4ff; color: #a21caf; border: 1px solid #f0abfc;">✅ ALREADY PAID</span>`;
  }

  if (
    pm.includes('card') ||
    pm.includes('online') ||
    pm.includes('bank') ||
    pm.includes('transfer') ||
    pm.includes('easypaisa') ||
    pm.includes('jazzcash') ||
    notes.includes('payment: card') ||
    notes.includes('payment: online') ||
    notes.includes('paid via online') ||
    notes.includes('paid via card')
  ) {
    const txn = o.transaction_id || (o.notes || '').match(/TXN:\s*([^)\]|]+)/i)?.[1]?.trim() || '';
    return `<span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">💳 ONLINE${txn ? ` (${txn})` : ''}</span>`;
  }

  return `<span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">💵 CASH</span>`;
}

export function openDailyClosingPrintView(report: DailyClosingReportPDFInput): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=960,height=1000");
  if (!printWindow) {
    alert("Please allow pop-ups to open the print view.");
    return;
  }

  const curr = report.currencySymbol || "Rs.";
  const shopName = report.shopName || "Pizza Store";

  // Calculate or fallback cash and online sales
  let calculatedCashSales = report.cashSales !== undefined ? report.cashSales : 0;
  let calculatedOnlineSales = report.onlineSales !== undefined ? report.onlineSales : 0;
  let cashOrdersCount = report.cashOrdersCount !== undefined ? report.cashOrdersCount : 0;
  let onlineOrdersCount = report.onlineOrdersCount !== undefined ? report.onlineOrdersCount : 0;

  if (report.cashSales === undefined && Array.isArray(report.orders)) {
    calculatedCashSales = 0;
    calculatedOnlineSales = 0;
    cashOrdersCount = 0;
    onlineOrdersCount = 0;
    report.orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const tot = Number(o.total) || 0;
      const pm = (o.payment_method || '').toLowerCase();
      const nts = (o.notes || '').toLowerCase();
      if (pm.includes('split') || nts.includes('split')) {
        const cMatch = (o.notes || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/cash:\s*(?:rs\.?\s*)?([0-9.]+)/i);
        const oMatch = (o.notes || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i) || (o.payment_method || '').match(/online:\s*(?:rs\.?\s*)?([0-9.]+)/i);
        const c = cMatch ? parseFloat(cMatch[1]) : 0;
        const onl = oMatch ? parseFloat(oMatch[1]) : Math.max(0, tot - c);
        calculatedCashSales += c;
        calculatedOnlineSales += onl;
        if (c > 0) cashOrdersCount++;
        if (onl > 0) onlineOrdersCount++;
      } else if (pm.includes('card') || pm.includes('online') || pm.includes('bank') || pm.includes('transfer') || nts.includes('payment: card') || nts.includes('payment: online') || nts.includes('paid via online') || nts.includes('paid via card')) {
        calculatedOnlineSales += tot;
        onlineOrdersCount++;
      } else {
        calculatedCashSales += tot;
        cashOrdersCount++;
      }
    });
  }
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
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; text-align: center;">${getOrderPaymentBadge(o, curr)}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; font-weight: 700; color: ${isCancelled ? "#dc2626" : "#059669"};">${o.status}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-weight: 800; text-align: right; font-size: 11px;">${curr} ${Number(o.total || 0).toLocaleString()}</td>
            </tr>
          `;
          })
          .join("")
      : `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">No orders found in this operational window.</td></tr>`;

  const expensesRows =
    report.expenses && report.expenses.length > 0
      ? report.expenses
          .map((exp: any, i: number) => {
            return `
            <tr>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">#${i + 1}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #0f172a;">${exp.title || "Expense"}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b; font-family: monospace;">${exp.expense_date || report.date}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #475569;">${exp.notes || "—"}</td>
              <td style="padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-weight: 800; text-align: right; font-size: 11px; color: #dc2626; font-family: monospace;">${curr} ${Number(exp.amount || 0).toLocaleString()}</td>
            </tr>
          `;
          })
          .join("")
      : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; font-size: 11px;">No expenses recorded for this date.</td></tr>`;

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

  <!-- 5-Box Executive Financial Telemetry Grid: Gross, Cash, Online, Expenses, Net Profit -->
  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px;">
    <!-- 1. Gross Revenue -->
    <div class="kpi-card" style="border-top: 3.5px solid #0f172a; background: #ffffff;">
      <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">Gross Total Sales</div>
      <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px;">${curr} ${Number(report.totalSales).toLocaleString()}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${report.totalOrders} Completed Orders</div>
    </div>

    <!-- 2. Cash Collected -->
    <div class="kpi-card" style="border-top: 3.5px solid #059669; background: #f0fdf4; border-color: #bbf7d0;">
      <div style="font-size: 10px; text-transform: uppercase; color: #047857; font-weight: 800; letter-spacing: 0.5px;">💵 Cash Collected</div>
      <div style="font-size: 20px; font-weight: 900; color: #047857; margin-top: 4px;">${curr} ${Number(calculatedCashSales).toLocaleString()}</div>
      <div style="font-size: 10px; color: #059669; margin-top: 2px;">${cashOrdersCount} Cash In-Till Orders</div>
    </div>

    <!-- 3. Online / Digital Sales -->
    <div class="kpi-card" style="border-top: 3.5px solid #2563eb; background: #eff6ff; border-color: #bfdbfe;">
      <div style="font-size: 10px; text-transform: uppercase; color: #1d4ed8; font-weight: 800; letter-spacing: 0.5px;">💳 Online / Transfer</div>
      <div style="font-size: 20px; font-weight: 900; color: #1d4ed8; margin-top: 4px;">${curr} ${Number(calculatedOnlineSales).toLocaleString()}</div>
      <div style="font-size: 10px; color: #2563eb; margin-top: 2px;">${onlineOrdersCount} Bank / Digital Orders</div>
    </div>

    <!-- 4. Operational Expenses -->
    <div class="kpi-card" style="border-top: 3.5px solid #dc2626; background: #fef2f2; border-color: #fecaca;">
      <div style="font-size: 10px; text-transform: uppercase; color: #b91c1c; font-weight: 800; letter-spacing: 0.5px;">Day Expenses</div>
      <div style="font-size: 20px; font-weight: 900; color: #b91c1c; margin-top: 4px;">-${curr} ${Number(report.totalExpenses).toLocaleString()}</div>
      <div style="font-size: 10px; color: #991b1b; margin-top: 2px;">${report.expenses?.length || 0} Expense items</div>
    </div>

    <!-- 5. Net Cash / Profit -->
    <div class="kpi-card" style="border-top: 3.5px solid #7c3aed; background: #faf5ff; border-color: #e9d5ff;">
      <div style="font-size: 10px; text-transform: uppercase; color: #6d28d9; font-weight: 800; letter-spacing: 0.5px;">Net Cash / Profit</div>
      <div style="font-size: 20px; font-weight: 900; color: #6d28d9; margin-top: 4px;">${curr} ${Number(report.netProfit).toLocaleString()}</div>
      <div style="font-size: 10px; font-weight: 700; color: #7c3aed; margin-top: 2px;">Till Cash: ${curr} ${Number(Math.max(0, calculatedCashSales - report.totalExpenses)).toLocaleString()}</div>
    </div>
  </div>

  <!-- Channel Split Banner -->
  <div style="display: flex; gap: 20px; font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px 12px; margin-bottom: 16px;">
    <div><strong>🍽️ Dine-In Table Sales:</strong> ${curr} ${Number(report.dineInSales).toLocaleString()} (${report.dineInOrdersCount} Orders)</div>
    <div style="color: #cbd5e1;">|</div>
    <div><strong>📦 Takeaway &amp; Delivery:</strong> ${curr} ${Number(report.takeawaySales).toLocaleString()} (${report.takeawayOrdersCount} Orders)</div>
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
          <th style="text-align: center;">Payment Mode</th>
          <th>Status</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${ordersRows}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 24px;">
    <h2 style="font-size: 13px; font-weight: 800; color: #b91c1c; margin: 0 0 8px; text-transform: uppercase;">
      💸 Itemized Day Expenses Breakdown (${report.expenses?.length || 0} Items — Total: ${curr} ${Number(report.totalExpenses || 0).toLocaleString()})
    </h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Expense Description</th>
          <th>Date</th>
          <th>Notes / Vendor / Bill #</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${expensesRows}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 36px; padding-top: 20px; border-top: 1.5px dashed #cbd5e1; display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; align-items: center;">
    <div>
      <div style="font-size: 11px; font-weight: 800; margin-bottom: 30px;">
        Closing Operator Sign-off (${report.closedBy || "Staff / Cashier"})
      </div>
      <div style="border-bottom: 1px solid #475569; width: 85%;"></div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Physical Cash Counted &amp; Register Reconciliation Verified</div>
    </div>

    <!-- Official Shop Seal / Stamp -->
    <div style="text-align: center;">
      <div style="display: inline-block; border: 2.5px double #1e3a8a; outline: 1.5px dashed #1e3a8a; outline-offset: -5px; border-radius: 8px; padding: 10px 16px; text-align: center; color: #1e3a8a; transform: rotate(-3deg); background: rgba(30, 58, 138, 0.04); min-width: 175px;">
        <div style="font-size: 8.5px; letter-spacing: 2px;">★ ★ ★</div>
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 3px 0;">${shopName.toUpperCase()}</div>
        <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">OFFICIAL AUDIT SEAL</div>
        <div style="font-size: 9px; font-weight: 800; color: #059669; margin-top: 3px;">VERIFIED &amp; CLOSED</div>
        <div style="font-size: 8.5px; font-family: monospace; color: #64748b; margin-top: 2px;">${report.date}</div>
      </div>
    </div>

    <div>
      <div style="font-size: 11px; font-weight: 800; margin-bottom: 30px; text-align: right;">
        Store Manager / Owner Audit Acceptance
      </div>
      <div style="border-bottom: 1px solid #475569; width: 85%; margin-left: auto;"></div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px; text-align: right;">Audit Verified &amp; Ledger Archival Confirmed</div>
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
