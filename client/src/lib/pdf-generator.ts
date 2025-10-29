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
  printMode: "color" | "bw" = "color",
  businessData: BusinessData = defaultBusinessData
): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print the invoice');
    return;
  }

  const invoiceNumber = `RBZFBV-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
  const invoiceDate = new Date(data.date);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const isColorMode = printMode === "color";
  const primaryColor = isColorMode ? "#2563eb" : "#000000";
  const textColor = isColorMode ? "#1e293b" : "#000000";
  const mutedColor = isColorMode ? "#64748b" : "#666666";
  const borderColor = isColorMode ? "#e2e8f0" : "#cccccc";
  const bgColor = isColorMode ? "#f8fafc" : "#ffffff";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Invoice - ${data.id}</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
          color: ${textColor};
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
        }

        .company-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: ${textColor};
          margin-bottom: 12px;
        }

        .company-info p {
          font-size: 12px;
          color: ${mutedColor};
          line-height: 1.6;
        }

        .invoice-title {
          text-align: right;
        }

        .invoice-title h2 {
          font-size: 32px;
          font-weight: 700;
          color: ${mutedColor};
        }

        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }

        .bill-to h3 {
          font-size: 12px;
          font-weight: 600;
          color: ${mutedColor};
          margin-bottom: 8px;
        }

        .bill-to p {
          font-size: 12px;
          line-height: 1.6;
        }

        .bill-to .name {
          font-weight: 600;
          color: ${textColor};
        }

        .bill-to .details {
          color: ${mutedColor};
        }

        .invoice-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .meta-row .label {
          color: ${mutedColor};
        }

        .meta-row .value {
          font-weight: 500;
          color: ${textColor};
        }

        .meta-row.highlight .label {
          font-weight: 600;
          color: ${textColor};
        }

        .meta-row.highlight .value {
          font-weight: 700;
        }

        .items-table {
          width: 100%;
          margin-bottom: 30px;
          border-collapse: collapse;
        }

        .items-table thead th {
          text-align: left;
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 600;
          color: ${mutedColor};
          border-bottom: 2px solid ${borderColor};
        }

        .items-table thead th.align-right {
          text-align: right;
        }

        .items-table tbody td {
          padding: 16px 8px;
          font-size: 12px;
          border-bottom: 1px solid ${borderColor};
        }

        .items-table tbody td.align-right {
          text-align: right;
        }

        .items-table .description {
          font-weight: 500;
          color: ${textColor};
        }

        .items-table .date-range {
          font-size: 11px;
          color: ${mutedColor};
          margin-top: 4px;
        }

        .charge-row td {
          padding: 8px 8px 8px 32px !important;
          font-size: 11px;
          color: ${mutedColor};
        }

        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals {
          width: 320px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 12px;
        }

        .total-row.border-top {
          border-top: 1px solid ${borderColor};
          margin-top: 8px;
          padding-top: 12px;
        }

        .total-row .label {
          color: ${mutedColor};
        }

        .total-row .value {
          font-weight: 500;
          color: ${textColor};
        }

        .total-row.highlight {
          font-weight: 700;
        }

        .total-row.highlight .label {
          color: ${textColor};
        }

        .memo-section {
          margin-bottom: 60px;
        }

        .memo-section h3 {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: ${textColor};
        }

        .memo-line {
          border-bottom: 1px solid ${borderColor};
          min-height: 60px;
        }

        .footer {
          margin-top: 80px;
          padding-top: 20px;
          border-top: 1px solid ${borderColor};
          text-align: center;
        }

        .watermark {
          color: ${mutedColor};
          font-size: 11px;
          line-height: 1.8;
        }

        .watermark .business-name {
          font-weight: 600;
          font-size: 12px;
        }

        .watermark .powered-by {
          font-size: 10px;
          margin-top: 4px;
        }

        @media print {
          body {
            background: white;
          }
          .invoice-container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${businessData.businessName}</h1>
            <p style="font-weight: 500; margin-bottom: 4px;">${businessData.fullName}</p>
            <p>${businessData.email}</p>
            <p>${businessData.phone}</p>
            <p style="margin-top: 8px;">${businessData.address}</p>
            <p>Registration: ${businessData.registrationNo}</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
          </div>
        </div>

        <div class="invoice-details">
          <div class="bill-to">
            <h3>Bill to:</h3>
            <p class="name">${data.farmer}</p>
            <p class="details">Pakistan</p>
          </div>

          <div class="invoice-meta">
            <div class="meta-row">
              <span class="label">Invoice number</span>
              <span class="value">${invoiceNumber}</span>
            </div>
            <div class="meta-row">
              <span class="label">Invoice date</span>
              <span class="value">${invoiceDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div class="meta-row">
              <span class="label">Due date</span>
              <span class="value">${dueDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div class="meta-row highlight">
              <span class="label">Amount due</span>
              <span class="value">Rs ${data.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="align-right">Quantity</th>
              <th class="align-right">Rate</th>
              <th class="align-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="description">${data.crop}</div>
                <div class="date-range">${invoiceDate.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </td>
              <td class="align-right">${data.quantity}</td>
              <td class="align-right">Rs ${parseFloat(data.rate).toLocaleString()}</td>
              <td class="align-right">Rs ${data.purchaseTotal.toLocaleString()}</td>
            </tr>
            ${data.charges.map(charge => `
              <tr class="charge-row">
                <td colspan="3">Discount - ${charge.title}</td>
                <td class="align-right">Rs ${charge.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals">
            <div class="total-row">
              <span class="label">Subtotal</span>
              <span class="value">Rs ${data.purchaseTotal.toLocaleString()}</span>
            </div>
            ${data.totalCharges > 0 ? `
              <div class="total-row">
                <span class="label">Total Charges</span>
                <span class="value">Rs ${data.totalCharges.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row border-top highlight">
              <span class="label">Amount due</span>
              <span class="value">Rs ${data.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="memo-section">
          <h3>Memo:</h3>
          <div class="memo-line"></div>
        </div>

        <div class="footer">
          <div class="watermark">
            <p class="business-name">${businessData.businessName} - POS System</p>
            <p>Contact: ${businessData.email} | ${businessData.phone}</p>
            <p class="powered-by">Powered by Mandi Management System</p>
          </div>
        </div>
      </div>

      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 250);
        };

        window.onafterprint = () => {
          setTimeout(() => {
            window.close();
          }, 100);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
