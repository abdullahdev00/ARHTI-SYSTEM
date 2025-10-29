import { useRoute } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Printer, Download } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function InvoicePreview() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id || "INV-001";

  // Mock data - would come from backend in real app
  const invoice = {
    id: invoiceId,
    date: "2024-10-27",
    farmer: {
      name: "Ram Singh",
      phone: "03001234567",
      address: "Village Kot Addu, Muzaffargarh, Punjab",
    },
    items: [
      { crop: "Wheat", quantity: 500, rate: 25, total: 12500 },
      { crop: "Rice", quantity: 200, rate: 35, total: 7000 },
    ],
    subtotal: 19500,
    commission: 975,
    charges: 500,
    netPayable: 18025,
    status: "paid",
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.id}`,
        text: `Invoice for ${invoice.farmer.name}`,
        url: window.location.href,
      });
    } else {
      console.log("Share functionality triggered");
    }
  };

  const handleDownload = () => {
    console.log("Download PDF triggered");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 z-50 bg-background border-b backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon" className="rounded-2xl" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                className="rounded-2xl"
                onClick={handlePrint}
                data-testid="button-print"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up print:p-0">
        <Card className="rounded-2xl shadow-xl print:shadow-none print:rounded-none transition-all duration-300 print:max-w-none print:w-[8.5in] print:min-h-[11in] print:mx-auto" id="invoice-content">
          <CardHeader className="border-b pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Invoice</h1>
                <p className="text-lg font-medium text-primary">{invoice.id}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Date: {new Date(invoice.date).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-lg mb-2">Arhti Business</h2>
                <p className="text-sm text-muted-foreground">Mandi System</p>
                <p className="text-sm text-muted-foreground">Punjab, Pakistan</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-3">Billed To:</h3>
              <div className="bg-muted p-4 rounded-2xl">
                <p className="font-medium text-lg">{invoice.farmer.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{invoice.farmer.phone}</p>
                <p className="text-sm text-muted-foreground">{invoice.farmer.address}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Items</h3>
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">Crop</th>
                      <th className="text-right p-4 font-semibold">Quantity (kg)</th>
                      <th className="text-right p-4 font-semibold">Rate/kg</th>
                      <th className="text-right p-4 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-4 font-medium">{item.crop}</td>
                        <td className="p-4 text-right">{item.quantity.toLocaleString()}</td>
                        <td className="p-4 text-right">{item.rate.toLocaleString()}</td>
                        <td className="p-4 text-right font-medium">
                          PKR {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">PKR {invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission (5%):</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -PKR {invoice.commission.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Charges:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -PKR {invoice.charges.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold">Net Payable:</span>
                  <span className="text-2xl font-bold text-primary">
                    PKR {invoice.netPayable.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Badge
                    variant={invoice.status === "paid" ? "default" : "secondary"}
                    className="rounded-2xl text-sm px-4 py-1"
                  >
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Thank you for your business!
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This is a computer-generated invoice and does not require a signature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
