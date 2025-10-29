import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceData {
  id: string;
  farmer: string;
  crop: string;
  quantity: string;
  rate: string;
  purchaseTotal: number;
  charges: Array<{ title: string; amount: number }>;
  totalCharges: number;
  grandTotal: number;
  date: string;
}

export interface BusinessData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  address: string;
  registrationNo: string;
}

const defaultBusinessData: BusinessData = {
  fullName: "Muhammad Ali",
  email: "muhammad.ali@business.pk",
  phone: "+92 300 1234567",
  businessName: "Ali Trading Company",
  address: "Mandi Road, Muzaffargarh, Punjab",
  registrationNo: "REG-2024-001",
};

export function generatePurchaseInvoice(
  data: InvoiceData,
  action: "download" | "print" = "download",
  businessData: BusinessData = defaultBusinessData
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  const primaryColor: [number, number, number] = [37, 99, 235];
  const textColor: [number, number, number] = [30, 41, 59];
  const mutedColor: [number, number, number] = [100, 116, 139];
  const borderColor: [number, number, number] = [226, 232, 240];

  let yPosition = margin;

  doc.setFontSize(22);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(businessData.businessName, margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(businessData.fullName, margin, yPosition);
  
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(businessData.email, margin, yPosition);
  
  yPosition += 5;
  doc.text(businessData.phone, margin, yPosition);
  
  yPosition += 6;
  doc.text(businessData.address, margin, yPosition);
  
  yPosition += 5;
  doc.text(`Registration: ${businessData.registrationNo}`, margin, yPosition);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('INVOICE', pageWidth - margin, margin, { align: 'right' });

  yPosition += 12;
  doc.setLineWidth(0.5);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 10;

  const invoiceNumber = `RBZFBV-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
  const invoiceDate = new Date(data.date);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const leftColumnX = margin;
  const rightColumnX = pageWidth / 2 + 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Bill to:', leftColumnX, yPosition);
  
  yPosition += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(data.farmer, leftColumnX, yPosition);
  
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Pakistan', leftColumnX, yPosition);

  const rightYStart = yPosition - 10;
  let rightY = rightYStart;
  
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Invoice number', rightColumnX, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(invoiceNumber, pageWidth - margin, rightY, { align: 'right' });
  
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Invoice date', rightColumnX, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(
    invoiceDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }),
    pageWidth - margin,
    rightY,
    { align: 'right' }
  );
  
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Due date', rightColumnX, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(
    dueDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }),
    pageWidth - margin,
    rightY,
    { align: 'right' }
  );
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Amount due', rightColumnX, rightY);
  doc.text(`Rs ${data.grandTotal.toLocaleString()}`, pageWidth - margin, rightY, { align: 'right' });

  yPosition = Math.max(yPosition, rightY) + 10;

  const tableData: any[][] = [
    [
      data.crop + '\n' + `${invoiceDate.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      data.quantity,
      `Rs ${parseFloat(data.rate).toLocaleString()}`,
      `Rs ${data.purchaseTotal.toLocaleString()}`
    ]
  ];

  data.charges.forEach(charge => {
    tableData.push([
      { 
        content: `Discount - ${charge.title}`,
        colSpan: 3,
        styles: { fontStyle: 'italic' as const }
      },
      '',
      '',
      `Rs ${charge.amount.toLocaleString()}`
    ]);
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 4,
    },
    headStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      textColor: mutedColor,
      fillColor: [255, 255, 255],
      lineWidth: { bottom: 0.5 },
      lineColor: borderColor,
    },
    bodyStyles: {
      lineWidth: { bottom: 0.3 },
      lineColor: borderColor,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: margin, right: margin }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Subtotal', totalsX, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Rs ${data.purchaseTotal.toLocaleString()}`, pageWidth - margin, yPosition, { align: 'right' });

  if (data.totalCharges > 0) {
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Total Charges', totalsX, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Rs ${data.totalCharges.toLocaleString()}`, pageWidth - margin, yPosition, { align: 'right' });
  }

  yPosition += 8;
  doc.setLineWidth(0.3);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(totalsX, yPosition - 2, pageWidth - margin, yPosition - 2);
  
  yPosition += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Amount due', totalsX, yPosition);
  doc.text(`Rs ${data.grandTotal.toLocaleString()}`, pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Memo:', margin, yPosition);
  
  yPosition += 6;
  doc.setLineWidth(0.3);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  const footerY = pageHeight - 25;
  doc.setLineWidth(0.3);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`${businessData.businessName} - POS System`, pageWidth / 2, footerY + 6, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contact: ${businessData.email} | ${businessData.phone}`, pageWidth / 2, footerY + 11, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text('Powered by Mandi Management System', pageWidth / 2, footerY + 15, { align: 'center' });

  const filename = `Invoice_${invoiceNumber}_${data.farmer.replace(/\s+/g, '_')}.pdf`;
  
  if (action === "print") {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(pdfUrl);
      };
    } else {
      URL.revokeObjectURL(pdfUrl);
    }
  } else {
    doc.save(filename);
  }
}
