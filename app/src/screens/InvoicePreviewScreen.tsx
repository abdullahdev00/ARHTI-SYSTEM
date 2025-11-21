import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useColorScheme, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../config/supabase';
import { generateInvoicePDF, InvoiceData } from '../utils/invoicePdfGenerator';
import { transactionsStore } from '../services/buyFlowSyncManager';
import { partnersStore } from '../stores/newSyncedStores';
// import * as FileSystem from 'expo-file-system';

interface InvoiceItem {
  id: string;
  cropName: string;
  quantity: number; // Total quantity in kg
  bagQuantity: number; // Number of bags
  weightPerBag: number; // Weight per bag in kg
  ratePerBag: number; // Rate per bag (from stock)
  total: number; // bagQuantity × ratePerBag
  transactionType?: string; // 'stock_buy', 'stock_sell'
}

interface Invoice {
  id: string;
  invoiceNumber: string;

  // User/Business Details
  userId: string;
  userName: string;
  userPhone: string;
  businessName: string;
  businessAddress: string;

  // Transaction Details
  transactionType: 'stock_buy' | 'stock_sell' | 'payment_received' | 'payment_sent' | 'other';

  // Customer/Farmer Details
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;

  items: InvoiceItem[];
  subtotal: number;
  charges: { name: string; amount: number; type: 'fixed' | 'percentage' }[];
  totalCharges: number;
  grandTotal: number;
  status: 'paid' | 'unpaid' | 'partial';
  createdDate: string;
  dueDate: string;
}

const InvoicePreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = false; // Light mode only
  const { userProfile } = useAuth();
  // const { getInvoiceItems } = useSimpleHybrid(); // Commented out to fix error

  // Function to load actual invoice items from database
  const loadInvoiceItemsFromDB = async (transactionId: string, transactionItems: any): Promise<InvoiceItem[]> => {
    try {
      // ✅ Transaction items are already stored in the transaction object
      // No need to fetch from invoice_items table - data is embedded in transaction.items
      if (!transactionItems || transactionItems.length === 0) {
        return [];
      }

      // ✅ Transform transaction items to InvoiceItem format
      const items: InvoiceItem[] = transactionItems.map((item: any, index: number) => {
        const totalValue = item.total_value || 0;
        const totalBags = item.total_bags || 0;
        const ratePerBag = totalBags > 0 ? totalValue / totalBags : 0;

        return {
          id: `${index}`,
          cropName: item.item_name,
          quantity: item.total_quantity || 0,
          bagQuantity: totalBags,
          weightPerBag: item.total_quantity && totalBags ? item.total_quantity / totalBags : 40,
          ratePerBag: ratePerBag,
          total: totalValue,
          transactionType: 'stock_buy',
        };
      });

      return items;

    } catch (error) {
      console.error('❌ Error loading invoice items from DB:', error);
      return [];
    }
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintingLocked, setIsPrintingLocked] = useState(false); // Prevent concurrent print requests

  // Get transaction ID from route params
  const transactionId = (route.params as any)?.invoiceId;

  // Load transaction and invoice items from database
  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ✅ Try to fetch from Legend State first (local-first)
        let transaction = transactionsStore[transactionId]?.peek();

        // If not in local store, fetch from Supabase
        if (!transaction) {
          const { data, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

          if (transError) throw transError;
          transaction = data;
        }

        if (!transaction) {
          throw new Error('Transaction not found');
        }

        // ✅ Fetch partner info from Legend State (local-first)
        let partner = partnersStore[transaction.partner_id]?.peek();

        // Fallback to Supabase if not in local store
        if (!partner) {
          const { data } = await supabase
            .from('partners')
            .select('*')
            .eq('id', transaction.partner_id)
            .single();
          partner = data;
        }

        // ✅ Combine transaction with partner info
        const enrichedTransaction = {
          ...transaction,
          partner_name: partner?.name || 'Unknown Partner',
          partner_phone: partner?.phone || '',
          partner_address: partner?.address || '',
        };

        // Debug logs removed for performance

        // ⚠️ If charges are missing from Supabase, use remaining_amount as final_total
        if (!enrichedTransaction.charges_amount && !enrichedTransaction.final_total) {
          // For old transactions without charges, final_total = remaining_amount (when unpaid)
          // or total_value (when paid)
          if (enrichedTransaction.payment_status === 'unpaid') {
            enrichedTransaction.final_total = enrichedTransaction.remaining_amount;
            enrichedTransaction.charges_amount = enrichedTransaction.remaining_amount - enrichedTransaction.total_value;
          } else {
            enrichedTransaction.final_total = enrichedTransaction.total_value;
            enrichedTransaction.charges_amount = 0;
          }
        }

        // ✅ Load invoice items from transaction data
        const actualItems = await loadInvoiceItemsFromDB(transactionId, transaction.items);

        // ✅ Set both states together for faster rendering
        setTransactionData(enrichedTransaction);
        setInvoiceItems(actualItems);
      } catch (error) {
        console.error('Error loading invoice data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceData();
  }, [transactionId]);

  // Create invoice with actual user profile data
  const invoice: Invoice = {
    id: transactionData?.id || '',
    invoiceNumber: `INV-${transactionData?.created_at ? new Date(transactionData.created_at).getTime() : ''}`,

    // User/Business Details from actual profile
    userId: userProfile?.id || '',
    userName: userProfile?.name || '',
    userPhone: userProfile?.phone_number || '',
    businessName: userProfile?.company_name || userProfile?.name || '',
    businessAddress: `${userProfile?.address || ''}, ${userProfile?.city || ''}, ${userProfile?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),

    // Transaction Details
    transactionType: (transactionData?.transaction_type || transactionData?.type || 'stock_buy') as any,

    // Customer/Farmer Details
    customerId: transactionData?.partner_id || '',
    customerName: transactionData?.partner_name || 'Unknown Partner',
    customerPhone: transactionData?.partner_phone || '',
    customerAddress: transactionData?.partner_address || '',

    items: invoiceItems,
    subtotal: transactionData?.total_value || 0,
    charges: (transactionData?.charges || []).map((charge: any) => ({
      name: charge.name,
      amount: charge.value,
      type: charge.type,
    })),
    totalCharges: transactionData?.charges_amount || 0,
    grandTotal: transactionData?.final_total || transactionData?.total_value || 0,
    status: transactionData?.payment_status || 'unpaid',
    createdDate: transactionData?.created_at?.split('T')[0] || '',
    dueDate: '',
  };


  // Set custom header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Use custom header
    });
  }, [navigation]);

  // Helper function to get transaction type display text
  const getTransactionTypeText = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'stock_buy':
      case 'buy':
        return 'Buy';
      case 'stock_sell':
      case 'sell':
        return 'Sales';
      case 'mixed':
        return 'Transaction';
      default:
        return 'Receipt';
    }
  };

  // Determine transaction type from invoice items
  const determineTransactionType = (items: InvoiceItem[]): string => {
    // Use the actual transaction type from invoice
    return invoice.transactionType || 'buy';
  };

  // Convert transaction type to PDF format
  const getPDFTransactionType = (type: string): 'buy' | 'sell' => {
    if (type === 'stock_buy' || type === 'buy') return 'buy';
    if (type === 'stock_sell' || type === 'sell') return 'sell';
    return 'buy'; // default
  };

  // Generate HTML content for PDF
  const generateInvoiceHTML = useCallback((invoice: Invoice) => {
    const currentDate = new Date().toLocaleDateString('en-IN');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
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
        .section-label {
          font-weight: bold;
          display: inline-block;
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
        }
        .status-paid { background-color: #d4edda; color: #155724; }
        .status-unpaid { background-color: #f8d7da; color: #721c24; }
        .status-partial { background-color: #fff3cd; color: #856404; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="business-info">
            <div class="business-name">${invoice.businessName}</div>
            <div class="business-details">
              ${invoice.userName}<br>
              ${invoice.userPhone}<br>
              ${invoice.businessAddress}
            </div>
          </div>
          <div class="invoice-title">${getTransactionTypeText(determineTransactionType(invoice.items))}</div>
        </div>

        <div class="main-content">
          <div class="invoice-details">
            <div class="bill-to">
              <div class="section-title"><strong>Bill To:</strong></div>
              <div class="customer-info">
                <div><strong>${invoice.customerName}</strong></div>
                <div>${invoice.customerPhone}</div>
                <div>${invoice.customerAddress || 'N/A'}</div>
              </div>
            </div>
            <div class="invoice-info">
              <div class="detail-line"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
              <div class="detail-line"><strong>Date:</strong> ${currentDate}</div>
              <div class="detail-line"><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></div>
            </div>
          </div>
        </div>

        ${(() => {
        const buyItems = invoice.items.filter(item => item.transactionType === 'stock_buy');
        const sellItems = invoice.items.filter(item => item.transactionType === 'stock_sell');

        let html = '';

        // Buy Items Section
        if (buyItems.length > 0) {
          html += `
              <div class="section-header">📦 Purchase Items</div>
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
                  ${buyItems.map(item => `
                    <tr>
                      <td>
                        <strong>${item.cropName}</strong><br>
                        <small>${item.weightPerBag}kg per bag</small>
                      </td>
                      <td class="qty-col">${item.bagQuantity}</td>
                      <td class="qty-col">${item.weightPerBag}kg</td>
                      <td class="qty-col">${item.quantity}kg</td>
                      <td class="rate-col">Rs ${item.ratePerBag.toLocaleString('en-IN')}</td>
                      <td class="amount-col">Rs ${item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="subtotal-row">
                    <td colspan="5"><strong>Purchase Subtotal</strong></td>
                    <td class="amount-col"><strong>Rs ${buyItems.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN')}</strong></td>
                  </tr>
                </tfoot>
              </table>
            `;
        }

        // Sell Items Section
        if (sellItems.length > 0) {
          html += `
              <div class="section-header" style="margin-top: 20px;">📤 Sales Items</div>
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
                  ${sellItems.map(item => `
                    <tr>
                      <td>
                        <strong>${item.cropName}</strong><br>
                        <small>${item.weightPerBag}kg per bag</small>
                      </td>
                      <td class="qty-col">${item.bagQuantity}</td>
                      <td class="qty-col">${item.weightPerBag}kg</td>
                      <td class="qty-col">${item.quantity}kg</td>
                      <td class="rate-col">Rs ${item.ratePerBag.toLocaleString('en-IN')}</td>
                      <td class="amount-col">Rs ${item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="subtotal-row">
                    <td colspan="5"><strong>Sales Subtotal</strong></td>
                    <td class="amount-col"><strong>Rs ${sellItems.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN')}</strong></td>
                  </tr>
                </tfoot>
              </table>
            `;
        }

        // If no separation needed (all same type), show regular table
        if (buyItems.length === 0 || sellItems.length === 0) {
          html = `
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
                  ${invoice.items.map(item => `
                    <tr>
                      <td>
                        <strong>${item.cropName}</strong><br>
                        <small>${item.weightPerBag}kg per bag</small>
                      </td>
                      <td class="qty-col">${item.bagQuantity}</td>
                      <td class="qty-col">${item.weightPerBag}kg</td>
                      <td class="qty-col">${item.quantity}kg</td>
                      <td class="rate-col">Rs ${item.ratePerBag.toLocaleString('en-IN')}</td>
                      <td class="amount-col">Rs ${item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
        }

        return html;
      })()}

        <div class="totals-section">
          <div class="total-line subtotal">
            <span>Subtotal</span>
            <span>Rs ${invoice.subtotal.toLocaleString('en-IN')}</span>
          </div>
          ${invoice.totalCharges && invoice.totalCharges > 0 ? `
          <div class="total-line">
            <span>Charges</span>
            <span>Rs ${invoice.totalCharges.toLocaleString('en-IN')}</span>
          </div>
          ` : ''}
          <div class="total-line final">
            <span>Amount due</span>
            <span>Rs ${invoice.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${currentDate} | Made with love by Arthi System</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }, [getTransactionTypeText]);


  // Print PDF using utility function
  const printPDF = useCallback(async () => {
    // Prevent concurrent print requests
    if (isPrintingLocked) {
      Alert.alert('Please Wait', 'A print request is already in progress');
      return;
    }

    try {
      setIsPrintingLocked(true);
      setIsGenerating(true);

      // Convert invoice to InvoiceData format for PDF generator
      const invoiceData: InvoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.createdDate,
        partnerName: invoice.customerName,
        partnerPhone: invoice.customerPhone,
        businessName: invoice.businessName,
        businessPhone: invoice.userPhone,
        businessAddress: invoice.businessAddress,
        items: invoice.items.map(item => ({
          itemName: item.cropName,
          totalBags: item.bagQuantity,
          totalQuantity: item.quantity,
          totalValue: item.total,
          variants: [
            {
              weight_kg: item.weightPerBag,
              quantity: item.bagQuantity,
              rate_per_bag: item.ratePerBag,
            }
          ],
        })),
        totalBags: invoice.items.reduce((sum, item) => sum + item.bagQuantity, 0),
        totalQuantity: invoice.items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: invoice.subtotal || invoice.grandTotal,
        charges: (invoice.charges || []).map(charge => ({
          name: charge.name,
          type: charge.type,
          value: charge.amount // Map 'amount' to 'value'
        })),
        chargesAmount: invoice.totalCharges || 0,
        finalTotal: invoice.grandTotal,
        paymentStatus: invoice.status,
        paidAmount: 0, // Will be calculated from payment records if needed
        remainingAmount: invoice.grandTotal,
        transactionType: getPDFTransactionType(invoice.transactionType),
      };

      // Use utility function to generate and print
      await generateInvoicePDF(invoiceData, true);
      Alert.alert('Success', 'Document sent to printer!');
    } catch (error) {
      Alert.alert('Error', 'Failed to print invoice');
      console.error('Print error:', error);
    } finally {
      setIsGenerating(false);
      setIsPrintingLocked(false);
    }
  }, [invoice, isPrintingLocked]);

  // Share PDF with auto-generation
  const sharePDF = useCallback(async () => {
    // Prevent concurrent print requests
    if (isPrintingLocked) {
      Alert.alert('Please Wait', 'A print request is already in progress');
      return;
    }

    try {
      setIsPrintingLocked(true);
      setIsGenerating(true);
      let pdfUri = generatedPdfUri;

      // Auto-generate PDF if not already generated
      if (!pdfUri) {
        const htmlContent = generateInvoiceHTML(invoice);
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        pdfUri = uri;
        setGeneratedPdfUri(uri);
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${invoice.invoiceNumber}`,
      });

      Alert.alert('Success', 'PDF shared successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF');
      console.error('Share error:', error);
    } finally {
      setIsGenerating(false);
      setIsPrintingLocked(false);
    }
  }, [generatedPdfUri, invoice, generateInvoiceHTML, isPrintingLocked]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'partial': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-IN')}`;
  };

  // Show loading screen while data is loading
  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.loadingContainer]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#000000' : '#ffffff'}
        />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Loading Invoice...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#000000' : '#ffffff'}
      />

      {/* Custom Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : '#1c1c1e'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          Invoice Preview
        </Text>

        <TouchableOpacity
          onPress={() => Alert.alert('More', 'More options')}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={isDark ? 'white' : '#1c1c1e'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Modern Business Card */}
        <View style={[styles.businessCard, isDark && styles.businessCardDark]}>
          <View style={styles.businessHeader}>
            <View style={[styles.businessIcon, { backgroundColor: '#10b981' + '20' }]}>
              <Ionicons name="business" size={24} color="#10b981" />
            </View>
            <View style={styles.businessInfo}>
              <Text style={[styles.companyName, isDark && styles.companyNameDark]} numberOfLines={2}>
                {invoice.businessName}
              </Text>
              <Text style={[styles.companyTagline, isDark && styles.companyTaglineDark]} numberOfLines={1}>
                {invoice.userName}
              </Text>
              <Text style={[styles.companyTagline, isDark && styles.companyTaglineDark]} numberOfLines={1}>
                {invoice.userPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Modern Invoice Info Card */}
        <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
          {/* Invoice Number & Status Row */}
          <View style={styles.infoHeader}>
            <View style={styles.invoiceNumberSection}>
              <Text style={[styles.invoiceNumberLabel, isDark && styles.invoiceNumberLabelDark]}>Invoice</Text>
              <Text style={[styles.invoiceNumberValue, isDark && styles.invoiceNumberValueDark]}>
                {invoice.invoiceNumber}
              </Text>
            </View>

            <View style={[styles.statusContainer, { backgroundColor: getStatusColor(invoice.status) + '15' }]}>
              <Ionicons
                name={invoice.status === 'paid' ? 'checkmark-circle' : invoice.status === 'partial' ? 'time' : 'close-circle'}
                size={16}
                color={getStatusColor(invoice.status)}
              />
              <Text style={[styles.statusLabel, { color: getStatusColor(invoice.status) }]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Date Information */}
          <View style={styles.dateSection}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, isDark && styles.dateLabelDark]}>Issue Date</Text>
                <Text style={[styles.dateValue, isDark && styles.dateValueDark]}>
                  {new Date(invoice.createdDate).toLocaleDateString('en-PK')}
                </Text>
              </View>
            </View>

            <View style={styles.dateItem}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, isDark && styles.dateLabelDark]}>Due Date</Text>
                <Text style={[styles.dateValue, isDark && styles.dateValueDark]}>
                  {new Date(invoice.dueDate).toLocaleDateString('en-PK')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Customer Card */}
        <View style={[styles.customerCard, isDark && styles.customerCardDark]}>
          <View style={styles.customerHeader}>
            <View style={styles.customerIconContainer}>
              <Ionicons name="person" size={20} color="#10b981" />
            </View>
            <Text style={[styles.customerTitle, isDark && styles.customerTitleDark]}>Customer Details</Text>
          </View>

          <View style={styles.customerContent}>
            <View style={styles.customerInfoRow}>
              <Ionicons name="person-circle" size={18} color="#6b7280" />
              <View style={styles.customerInfoText}>
                <Text style={[styles.customerLabel, isDark && styles.customerLabelDark]}>Name</Text>
                <Text style={[styles.customerValue, isDark && styles.customerValueDark]} numberOfLines={2}>
                  {invoice.customerName}
                </Text>
              </View>
            </View>

            <View style={styles.customerInfoRow}>
              <Ionicons name="call" size={18} color="#6b7280" />
              <View style={styles.customerInfoText}>
                <Text style={[styles.customerLabel, isDark && styles.customerLabelDark]}>Phone</Text>
                <Text style={[styles.customerValue, isDark && styles.customerValueDark]} numberOfLines={1}>
                  {invoice.customerPhone}
                </Text>
              </View>
            </View>

            <View style={styles.customerInfoRow}>
              <Ionicons name="receipt" size={18} color="#6b7280" />
              <View style={styles.customerInfoText}>
                <Text style={[styles.customerLabel, isDark && styles.customerLabelDark]}>Transaction Type</Text>
                <Text style={[styles.customerValue, isDark && styles.customerValueDark]} numberOfLines={1}>
                  {getTransactionTypeText(invoice.transactionType)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {invoice.items.map((item, index) => (
            <View key={item.id} style={[styles.itemCard, index === invoice.items.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.cropName}</Text>
                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
              </View>
              <Text style={styles.itemDetails}>
                {item.bagQuantity} bags × {item.weightPerBag}kg = {item.quantity}kg total
              </Text>
              <Text style={styles.itemSubDetails}>
                Rate: {formatCurrency(item.ratePerBag)}/bag ({item.weightPerBag}kg per bag)
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>

            {invoice.totalCharges && invoice.totalCharges > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Charges:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.totalCharges)}
                </Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* PDF Status */}
        {generatedPdfUri && (
          <View style={styles.pdfStatusCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.pdfStatusText}>PDF Generated Successfully!</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={printPDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="print" size={20} color="white" />
          )}
          <Text style={styles.actionButtonText}>
            {isGenerating ? 'Preparing...' : 'Print'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={sharePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="share" size={20} color="white" />
          )}
          <Text style={styles.actionButtonText}>
            {isGenerating ? 'Preparing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '600',
  },
  loadingTextDark: {
    color: 'white',
  },
  // Custom Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerDark: {
    backgroundColor: '#1c1c1e',
    borderBottomColor: '#374151',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'center',
  },
  headerTitleDark: {
    color: 'white',
  },
  // Modern Business Card Styles
  businessCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessCardDark: {
    backgroundColor: '#1c1c1e',
    shadowOpacity: 0.3,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  invoiceNumberContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  invoiceLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  invoiceLabelDark: {
    color: '#9ca3af',
  },
  // Modern Info Card Styles
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCardDark: {
    backgroundColor: '#1c1c1e',
    shadowOpacity: 0.3,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceNumberSection: {
    flex: 1,
  },
  invoiceNumberLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  invoiceNumberLabelDark: {
    color: '#9ca3af',
  },
  invoiceNumberValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  invoiceNumberValueDark: {
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateSection: {
    flexDirection: 'row',
    gap: 20,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateLabelDark: {
    color: '#9ca3af',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  dateValueDark: {
    color: 'white',
  },
  // Modern Customer Card Styles
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerCardDark: {
    backgroundColor: '#1c1c1e',
    shadowOpacity: 0.3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  customerTitleDark: {
    color: 'white',
  },
  customerContent: {
    gap: 16,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  customerInfoText: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  customerLabelDark: {
    color: '#9ca3af',
  },
  customerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    lineHeight: 20,
  },
  customerValueDark: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  invoiceHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  companyNameDark: {
    color: 'white',
  },
  companyTagline: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  companyTaglineDark: {
    color: '#9ca3af',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
  },
  invoiceTitleDark: {
    color: '#10b981',
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  itemDetails: {
    fontSize: 16,
    color: '#64748b',
  },
  itemSubDetails: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  totalsCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notesCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  notesText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  pdfStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  pdfStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButton: {
    backgroundColor: '#2563eb',
  },
  printButton: {
    backgroundColor: '#7c3aed',
  },
  shareButton: {
    backgroundColor: '#10b981',
  },
  downloadButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoicePreviewScreen;
