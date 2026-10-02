import jsPDF from 'jspdf';

// ── Fallback company info if DB fetch fails ──
const FALLBACK_COMPANY = {
  legal_name: 'Mahalaxmi Krushi Prakriya Udyog',
  gstin: '27XXXXXXXXXXX',
  pan: 'XXXXXXXXXX',
  address_line1: 'A/p. Gavase',
  address_line2: 'Tal. Ajara, Dist. Kolhapur',
  city: 'Kolhapur',
  pincode: '416505',
  state: 'Maharashtra',
  state_code: '27',
  phone: '7774982725 / 9168843668',
  email: 'info@mahalaxmichips.com',
  bank_name: 'Bank Name',
  bank_account: 'Account Number',
  bank_ifsc: 'IFSC',
  bank_branch: 'Branch',
};

// ── Number to words (Indian system) ──
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }

  if (num === 0) return 'Zero';
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = inWords(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + inWords(paise) + ' Paise';
  return result + ' Only';
}

// ── Date formatter ──
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Main invoice generator ──
export function generateInvoice(order, items = [], company = null, buyer = null) {
  const co = company || FALLBACK_COMPANY;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ═══════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════
  doc.setFillColor(20, 81, 62);
  doc.rect(0, 0, pageWidth, 6, 'F');
  y = 16;

  doc.setTextColor(15, 15, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 107, 107);
  doc.text('(Issued under Rule 46 of CGST Rules, 2017)', pageWidth / 2, y + 4, { align: 'center' });

  y += 12;

  // ── Seller / Buyer box ──
  const boxHeight = 34;
  doc.setDrawColor(15, 15, 15);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, boxHeight);

  // Vertical divider
  const midX = margin + contentWidth / 2;
  doc.line(midX, y, midX, y + boxHeight);

  // Seller info (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 81, 62);
  doc.text('SELLER', margin + 2, y + 5);

  doc.setTextColor(15, 15, 15);
  doc.setFontSize(10);
  doc.text(co.legal_name, margin + 2, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${co.address_line1}, ${co.address_line2}`, margin + 2, y + 14.5);
  doc.text(`${co.city} - ${co.pincode}, ${co.state}`, margin + 2, y + 18.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${co.gstin}`, margin + 2, y + 22.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`PAN: ${co.pan}`, margin + 2, y + 26.5);
  doc.text(`Phone: ${co.phone}`, margin + 2, y + 30.5);

  // Buyer info (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 81, 62);
  doc.text('BUYER / SHIP TO', midX + 2, y + 5);

  doc.setTextColor(15, 15, 15);
  doc.setFontSize(10);
  doc.text(order.customer_name || 'Customer', midX + 2, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addressLines = doc.splitTextToSize(order.customer_address || '', contentWidth / 2 - 4);
  doc.text(addressLines.slice(0, 2), midX + 2, y + 14.5);
  doc.text(`Phone: ${order.customer_phone || ''}`, midX + 2, y + 22.5);

  const buyerGstin = order.buyer_gstin || buyer?.gstin;
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${buyerGstin || 'Unregistered'}`, midX + 2, y + 26.5);
  doc.setFont('helvetica', 'normal');
  const placeOfSupply = order.place_of_supply || 'Maharashtra';
  doc.text(`Place of Supply: ${placeOfSupply}`, midX + 2, y + 30.5);

  y += boxHeight + 4;

  // ── Invoice meta strip ──
  const metaHeight = 12;
  doc.setFillColor(245, 239, 230);
  doc.rect(margin, y, contentWidth, metaHeight, 'F');
  doc.setDrawColor(15, 15, 15);
  doc.rect(margin, y, contentWidth, metaHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 15, 15);

  const colW = contentWidth / 4;
  doc.text('INVOICE NO', margin + 2, y + 4);
  doc.text('INVOICE DATE', margin + colW + 2, y + 4);
  doc.text('ORDER CODE', margin + colW * 2 + 2, y + 4);
  doc.text('PAYMENT', margin + colW * 3 + 2, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(order.invoice_number || 'Pending', margin + 2, y + 9);
  doc.text(fmtDate(order.created_at), margin + colW + 2, y + 9);
  doc.text(order.order_code || '—', margin + colW * 2 + 2, y + 9);
  doc.text(order.payment_mode || 'Advance', margin + colW * 3 + 2, y + 9);

  // Vertical dividers in meta
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + colW, y, margin + colW, y + metaHeight);
  doc.line(margin + colW * 2, y, margin + colW * 2, y + metaHeight);
  doc.line(margin + colW * 3, y, margin + colW * 3, y + metaHeight);

  y += metaHeight + 4;

  // ═══════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════
  const cols = {
    sn: { x: margin, w: 10 },
    desc: { x: margin + 10, w: 68 },
    hsn: { x: margin + 78, w: 18 },
    qty: { x: margin + 96, w: 14 },
    unit: { x: margin + 110, w: 16 },
    rate: { x: margin + 126, w: 22 },
    gst: { x: margin + 148, w: 12 },
    total: { x: margin + 160, w: contentWidth - 160 },
  };

  // Table header
  const headerHeight = 8;
  doc.setFillColor(20, 81, 62);
  doc.rect(margin, y, contentWidth, headerHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('S.N', cols.sn.x + 1, y + 5);
  doc.text('DESCRIPTION', cols.desc.x + 1, y + 5);
  doc.text('HSN', cols.hsn.x + 1, y + 5);
  doc.text('QTY', cols.qty.x + 1, y + 5);
  doc.text('PACK', cols.unit.x + 1, y + 5);
  doc.text('RATE', cols.rate.x + 1, y + 5);
  doc.text('GST%', cols.gst.x + 1, y + 5);
  doc.text('AMOUNT', cols.total.x + 1, y + 5);

  y += headerHeight;

  // ── Rows ──
  doc.setTextColor(15, 15, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let subtotal = 0;
  let gstAmount = 0;
  let taxableValue = 0;
  const rowHeight = 9;

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 247);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    const name = item.products?.name || 'Product';
    const pack = `${item.pack_size_kg || 1}kg`;
    const qty = item.quantity;
    const rate = Number(item.price_at_time);
    const lineTotal = qty * rate;
    const gstRate = item.gst_percent || 5;
    const lineGst = (lineTotal * gstRate) / (100 + gstRate); // inclusive

    subtotal += lineTotal;
    gstAmount += lineGst;
    taxableValue += lineTotal - lineGst;

    doc.text(String(idx + 1), cols.sn.x + 2, y + 6);
    doc.text(name, cols.desc.x + 1, y + 6);
    doc.text(item.hsn_code || '2005', cols.hsn.x + 1, y + 6);
    doc.text(String(qty), cols.qty.x + 2, y + 6);
    doc.text(pack, cols.unit.x + 1, y + 6);
    doc.text(rate.toFixed(2), cols.rate.x + 1, y + 6);
    doc.text(String(gstRate), cols.gst.x + 2, y + 6);
    doc.text(lineTotal.toFixed(2), cols.total.x + 1, y + 6);

    y += rowHeight;
  });

  // Bottom border
  doc.setDrawColor(15, 15, 15);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  // ═══════════════════════════════════════════
  // TOTALS SECTION
  // ═══════════════════════════════════════════
  y += 4;
  const totalsLeftX = margin;
  const totalsRightX = margin + contentWidth * 0.55;

  // ── LEFT: Amount in words + bank details ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AMOUNT IN WORDS', totalsLeftX, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const words = numberToWords(subtotal);
  const wordsLines = doc.splitTextToSize(words, contentWidth * 0.5);
  doc.text(wordsLines, totalsLeftX, y + 9);
  let leftY = y + 9 + wordsLines.length * 3.5 + 4;

  if (co.bank_name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BANK DETAILS', totalsLeftX, leftY);
    doc.setFont('helvetica', 'normal');
    leftY += 4;
    doc.text(`Bank: ${co.bank_name}`, totalsLeftX, leftY); leftY += 3.5;
    doc.text(`A/c: ${co.bank_account}`, totalsLeftX, leftY); leftY += 3.5;
    doc.text(`IFSC: ${co.bank_ifsc}`, totalsLeftX, leftY); leftY += 3.5;
    doc.text(`Branch: ${co.bank_branch}`, totalsLeftX, leftY);
  }

  // ── RIGHT: Tax breakdown ──
  const labelW = 32;
  const valueW = 24;
  const totalsWidth = labelW + valueW;
  const totalsX = margin + contentWidth - totalsWidth;

  let totY = y;
  const rowH = 6;

  function addTotalRow(label, value, bold = false, big = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(big ? 9 : 8);
    if (bold) {
      doc.setFillColor(245, 239, 230);
      doc.rect(totalsX, totY, totalsWidth, rowH + (big ? 2 : 0), 'F');
      doc.rect(totalsX, totY, totalsWidth, rowH + (big ? 2 : 0));
    }
    doc.text(label, totalsX + 2, totY + (big ? 5.5 : 4));
    doc.text(value, totalsX + totalsWidth - 2, totY + (big ? 5.5 : 4), { align: 'right' });
    totY += rowH + (big ? 2 : 0);
  }

  addTotalRow('Taxable Value', taxableValue.toFixed(2));
  addTotalRow('CGST (2.5%)', (gstAmount / 2).toFixed(2));
  addTotalRow('SGST (2.5%)', (gstAmount / 2).toFixed(2));
  addTotalRow('TOTAL GST', gstAmount.toFixed(2));
  addTotalRow('GRAND TOTAL', `Rs. ${subtotal.toFixed(2)}`, true, true);

  // Move Y below whichever is longer
  y = Math.max(leftY + 4, totY + 4);

  // ═══════════════════════════════════════════
  // DISPATCH + FOOTER
  // ═══════════════════════════════════════════
  const dispatch = order.transporter_name || order.transporter_lr;
  if (dispatch) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DISPATCH DETAILS', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (order.transporter_name) {
      doc.text(`Transporter: ${order.transporter_name}`, margin, y);
      y += 3.5;
    }
    if (order.transporter_lr) {
      doc.text(`LR Number: ${order.transporter_lr}`, margin, y);
      y += 3.5;
    }
    if (order.dispatched_at) {
      doc.text(`Dispatched On: ${fmtDate(order.dispatched_at)}`, margin, y);
      y += 3.5;
    }
    y += 2;
  }

  // Footer
  doc.setDrawColor(15, 15, 15);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 107, 107);
  doc.text('Goods once sold will not be taken back. Subject to Kolhapur jurisdiction.', margin, y);
  y += 4;
  doc.text('This is a computer-generated invoice. Signature not required.', margin, y);

  // Signatory block (right)
  const sigY = y - 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 15, 15);
  doc.text('For Mahalaxmi Krushi Prakriya Udyog', pageWidth - margin, sigY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signatory', pageWidth - margin, sigY + 12, { align: 'right' });

  // Save
  const filename = `${order.invoice_number || order.order_code || 'invoice'}.pdf`;
  doc.save(filename);
}