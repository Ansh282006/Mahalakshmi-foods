import jsPDF from 'jspdf';

const BRAND = 'MAHALAXMI KRUSHI PRAKRIYA UDYOG';
const CONTACT_LINE_1 = 'Phone: 7774982725 / 9168843668';
const CONTACT_LINE_2 = 'A/p. Gavase, Tal. Ajara, Dist. Kolhapur, Maharashtra 416505';
const FSSAI = 'FSSAI: 21519267000110';

export function generateInvoice(order, items = []) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // HEADER
  doc.setFillColor(46, 125, 50);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BRAND, pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', pageWidth / 2, 23, { align: 'center' });

  y = 40;

  // BUSINESS INFO
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.text(CONTACT_LINE_1, pageWidth - margin, y, { align: 'right' });
  doc.text(CONTACT_LINE_2, pageWidth - margin, y + 4, { align: 'right' });
  doc.text(FSSAI, pageWidth - margin, y + 8, { align: 'right' });

  // INVOICE DETAILS
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 35, 50);
  doc.text('Invoice Details', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;

  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.text(`Invoice No: ${order.order_code || 'N/A'}`, margin, y);
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, y, { align: 'right' });

  y += 12;

  // CUSTOMER INFO
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 10;

  doc.text(order.customer_name || 'Customer', margin, y);
  y += 5;
  doc.text(`Phone: ${order.customer_phone || ''}`, margin, y);
  y += 5;

  const address = order.customer_address || '';
  const wrappedAddress = doc.splitTextToSize(address, pageWidth - margin * 2);
  doc.text(wrappedAddress, margin, y);
  y += wrappedAddress.length * 5 + 8;

  // TABLE HEADER
  const tableTop = y;
  const colItem = margin;
  const colQty = pageWidth - margin - 60;
  const colPrice = pageWidth - margin - 35;
  const colTotal = pageWidth - margin;

  doc.setFillColor(46, 125, 50);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', colItem + 3, y + 5.5);
  doc.text('Qty', colQty, y + 5.5, { align: 'center' });
  doc.text('Price', colPrice, y + 5.5, { align: 'right' });
  doc.text('Total', colTotal - 3, y + 5.5, { align: 'right' });

  y += 8;

  // TABLE ROWS
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let rowIndex = 0;
  let subtotal = 0;

  items.forEach((item) => {
    const itemName = item.products?.name || 'Product';
    const itemWeight = item.products?.weight || '';
    const qty = item.quantity;
    const price = Number(item.price_at_time);
    const lineTotal = qty * price;
    subtotal += lineTotal;

    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 253, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    }

    doc.text(`${itemName} (${itemWeight})`, colItem + 3, y + 5.5);
    doc.text(String(qty), colQty, y + 5.5, { align: 'center' });
    doc.text(`Rs. ${price.toFixed(2)}`, colPrice, y + 5.5, { align: 'right' });
    doc.text(`Rs. ${lineTotal.toFixed(2)}`, colTotal - 3, y + 5.5, { align: 'right' });

    y += 8;
    rowIndex += 1;
  });

  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, tableTop, pageWidth - margin * 2, y - tableTop);

  // TOTALS
  y += 4;

  const discount = Number(order.discount_amount) || 0;
  const finalTotal = Number(order.total_amount);
  const totalsX = pageWidth - margin - 60;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, y + 4);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, colTotal - 3, y + 4, { align: 'right' });
  y += 6;

  if (discount > 0) {
    doc.setTextColor(46, 125, 50);
    doc.text('Discount:', totalsX, y + 4);
    doc.text(`- Rs. ${discount.toFixed(2)}`, colTotal - 3, y + 4, { align: 'right' });
    y += 6;
    doc.setTextColor(40, 40, 40);
  }

  doc.setFillColor(46, 125, 50);
  doc.rect(totalsX - 5, y + 2, pageWidth - margin - totalsX + 5, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX, y + 8.5);
  doc.text(`Rs. ${finalTotal.toFixed(2)}`, colTotal - 3, y + 8.5, { align: 'right' });

  y += 22;

  // PAYMENT
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Payment Method:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Cash on Delivery', margin + 32, y);

  y += 8;

  // FOOTER
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing Mahalaxmi Chips!', pageWidth / 2, y, { align: 'center' });
  doc.text('For any queries, WhatsApp us at +91 77749 82725', pageWidth / 2, y + 4, { align: 'center' });

  const filename = `${order.order_code || 'invoice'}.pdf`;
  doc.save(filename);
}
