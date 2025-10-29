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

export function generatePurchaseInvoice(data: InvoiceData): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print the invoice');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Invoice - ${data.id}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        body {
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          margin: 0;
          color: #2563eb;
          font-size: 32px;
        }
        
        .header p {
          margin: 10px 0 0 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .detail-group {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
        }
        
        .detail-group h3 {
          margin: 0 0 10px 0;
          color: #2563eb;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .label {
          color: #64748b;
          font-weight: 500;
        }
        
        .value {
          font-weight: 600;
          color: #1e293b;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th {
          background: #2563eb;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .charges-section {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .charges-section h3 {
          margin: 0 0 15px 0;
          color: #92400e;
          font-size: 16px;
        }
        
        .charge-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .charge-item:last-child {
          margin-bottom: 0;
        }
        
        .totals {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 15px;
        }
        
        .total-row:last-child {
          border-top: 2px solid #2563eb;
          padding-top: 12px;
          margin-top: 12px;
          margin-bottom: 0;
        }
        
        .total-row.grand-total {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        
        .signature {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        
        .signature-box {
          flex: 1;
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #64748b;
          margin-top: 60px;
          padding-top: 10px;
          color: #64748b;
          font-size: 13px;
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Arhti Business</h1>
        <p>Mandi Management System</p>
      </div>
      
      <div class="invoice-details">
        <div class="detail-group">
          <h3>Invoice Information</h3>
          <div class="detail-row">
            <span class="label">Invoice ID:</span>
            <span class="value">${data.id}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">${new Date(data.date).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
        
        <div class="detail-group">
          <h3>Farmer Details</h3>
          <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">${data.farmer}</span>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Quantity</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.crop}</td>
            <td style="text-align: right;">${data.quantity} bags</td>
            <td style="text-align: right;">Rs ${parseFloat(data.rate).toLocaleString()}</td>
            <td style="text-align: right;">Rs ${data.purchaseTotal.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      
      ${data.charges.length > 0 ? `
        <div class="charges-section">
          <h3>Applied Charges</h3>
          ${data.charges.map(charge => `
            <div class="charge-item">
              <span>${charge.title}</span>
              <span>Rs ${charge.amount.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="totals">
        <div class="total-row">
          <span>Purchase Amount:</span>
          <span>Rs ${data.purchaseTotal.toLocaleString()}</span>
        </div>
        ${data.totalCharges > 0 ? `
          <div class="total-row">
            <span>Total Charges:</span>
            <span>Rs ${data.totalCharges.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>Grand Total:</span>
          <span>Rs ${data.grandTotal.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="signature">
        <div class="signature-box">
          <div class="signature-line">Farmer Signature</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Authorized Signature</div>
        </div>
      </div>
      
      <div class="footer">
        <p>This is a computer generated invoice from Arhti Business Management System</p>
        <p>Printed on ${new Date().toLocaleString('en-IN')}</p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        ">Print Invoice</button>
        <button onclick="window.close()" style="
          background: #64748b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-left: 10px;
        ">Close</button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.focus();
  };
}
