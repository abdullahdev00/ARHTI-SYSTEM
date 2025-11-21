/**
 * Invoice PDF Generator
 * Uses the same design as InvoicePreviewScreen
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    partnerName: string;
    partnerPhone: string;
    businessName?: string;
    businessPhone?: string;
    businessAddress?: string;
    items: Array<{
        itemName: string;
        totalBags: number;
        totalQuantity: number;
        totalValue: number;
        variants: Array<{
            weight_kg: number;
            quantity: number;
            rate_per_bag: number;
        }>;
    }>;
    totalBags: number;
    totalQuantity: number;
    totalValue: number;
    charges?: Array<{
        name: string;
        type: 'fixed' | 'percentage';
        value: number;
    }>;
    chargesAmount?: number;
    finalTotal?: number;
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    paidAmount: number;
    remainingAmount: number;
    transactionType: 'buy' | 'sell';
}

export const generateInvoicePDF = async (invoiceData: InvoiceData, shouldPrint: boolean = true) => {
    try {
        const htmlContent = generateInvoiceHTML(invoiceData);

        if (shouldPrint) {
            // Print directly
            await Print.printAsync({
                html: htmlContent,
                printerUrl: undefined, // Uses default printer
            });
        } else {
            // Save to file and share
            const pdf = await Print.printToFileAsync({
                html: htmlContent,
            });

            if (pdf.uri) {
                await Sharing.shareAsync(pdf.uri);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        throw error;
    }
};

const generateInvoiceHTML = (data: InvoiceData): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const transactionTitle = data.transactionType === 'buy' ? 'Purchase Receipt' : 'Sales Receipt';
    const partnerLabel = data.transactionType === 'buy' ? 'Bill To' : 'Bill To';

    const itemsHTML = data.items
        .map(
            (item) => `
        <tr>
            <td>
                <strong>${item.itemName}</strong><br>
                <small>${item.variants[0]?.weight_kg || 40}kg per bag</small>
            </td>
            <td class="qty-col">${item.totalBags}</td>
            <td class="qty-col">${item.variants[0]?.weight_kg || 40}kg</td>
            <td class="qty-col">${item.totalQuantity}kg</td>
            <td class="rate-col">Rs ${(item.totalValue / item.totalBags).toLocaleString('en-IN')}</td>
            <td class="amount-col">Rs ${item.totalValue.toLocaleString('en-IN')}</td>
        </tr>
    `
        )
        .join('');

    const paymentStatusBg =
        data.paymentStatus === 'paid' ? '#d4edda' : data.paymentStatus === 'unpaid' ? '#f8d7da' : '#fff3cd';
    const paymentStatusColor =
        data.paymentStatus === 'paid' ? '#155724' : data.paymentStatus === 'unpaid' ? '#721c24' : '#856404';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice ${data.invoiceNumber}</title>
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    color: #000; 
                    line-height: 1.5;
                    font-size: 14px;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #000;
                }
                .business-info {
                    flex: 1;
                }
                .business-name {
                    font-size: 22px;
                    font-weight: bold;
                    color: #000;
                    margin-bottom: 5px;
                }
                .business-details {
                    font-size: 13px;
                    color: #333;
                    line-height: 1.4;
                }
                .invoice-title {
                    font-size: 28px;
                    font-weight: bold;
                    color: #000;
                    text-align: right;
                }
                .main-content {
                    margin-bottom: 20px;
                }
                .invoice-details {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .bill-to, .invoice-info {
                    width: 48%;
                }
                .bill-to {
                    padding-right: 20px;
                }
                .invoice-info {
                    text-align: right;
                    padding-left: 20px;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                    margin-bottom: 8px;
                }
                .customer-info {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #333;
                }
                .detail-line {
                    margin-top: 5px;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 25px 0;
                    font-size: 13px;
                }
                .items-table th {
                    background-color: #f8f9fa;
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 13px;
                }
                .items-table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    font-size: 13px;
                }
                .items-table .qty-col {
                    text-align: center;
                    width: 80px;
                }
                .items-table .rate-col,
                .items-table .amount-col {
                    text-align: right;
                    width: 100px;
                }
                .totals-section {
                    margin-left: auto;
                    width: 250px;
                    margin-top: 15px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 11px;
                }
                .total-line.subtotal {
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                }
                .total-line.final {
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    font-weight: bold;
                    font-size: 12px;
                    padding: 8px 0;
                    margin-top: 5px;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 10px;
                    color: #666;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .status-badge {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 9px;
                    font-weight: bold;
                    text-transform: uppercase;
                    background-color: ${paymentStatusBg};
                    color: ${paymentStatusColor};
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="business-info">
                        <div class="business-name">${data.businessName || 'Business'}</div>
                        <div class="business-details">
                            ${data.businessPhone || ''}<br>
                            ${data.businessAddress || ''}
                        </div>
                    </div>
                    <div class="invoice-title">${transactionTitle}</div>
                </div>

                <div class="main-content">
                    <div class="invoice-details">
                        <div class="bill-to">
                            <div class="section-title"><strong>${partnerLabel}</strong></div>
                            <div class="customer-info">
                                <div><strong>${data.partnerName}</strong></div>
                                <div>${data.partnerPhone}</div>
                            </div>
                        </div>
                        <div class="invoice-info">
                            <div class="detail-line"><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
                            <div class="detail-line"><strong>Date:</strong> ${currentDate}</div>
                            <div class="detail-line"><strong>Status:</strong> <span class="status-badge">${data.paymentStatus}</span></div>
                        </div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="qty-col">Bags</th>
                            <th class="qty-col">Weight/Bag</th>
                            <th class="qty-col">Total Weight</th>
                            <th class="rate-col">Rate/Bag</th>
                            <th class="amount-col">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="totals-section">
                    <div class="total-line subtotal">
                        <span>Subtotal</span>
                        <span>Rs ${data.totalValue.toLocaleString('en-IN')}</span>
                    </div>
                    ${data.chargesAmount && data.chargesAmount > 0 ? `
                    <div class="total-line">
                        <span>Charges</span>
                        <span>Rs ${data.chargesAmount.toLocaleString('en-IN')}</span>
                    </div>
                    ` : ''}
                    <div class="total-line final">
                        <span>Amount due</span>
                        <span>Rs ${(data.finalTotal || data.totalValue).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="total-line" style="margin-top: 8px;">
                        <span>Paid</span>
                        <span>Rs ${data.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="total-line">
                        <span>Remaining</span>
                        <span>Rs ${data.remainingAmount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString('en-IN')} | Made with love by Arthi System</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
