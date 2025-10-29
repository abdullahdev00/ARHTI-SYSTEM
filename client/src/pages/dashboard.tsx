import { StatCard } from "@/components/stat-card";
import { Users, AlertCircle, DollarSign, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-welcome">Welcome back, Arhti</h1>
        <p className="text-muted-foreground mt-1">{currentDate}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Farmers"
          value="48"
          icon={Users}
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          title="Pending Payments"
          value="Rs 1,24,500"
          icon={AlertCircle}
          trend={{ value: "8%", positive: false }}
        />
        <StatCard
          title="Total Commission"
          value="Rs 45,230"
          icon={DollarSign}
          trend={{ value: "15%", positive: true }}
        />
        <StatCard
          title="Charges Today"
          value="Rs 3,200"
          icon={Receipt}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start rounded-2xl" 
              onClick={() => setLocation('/purchases')}
              data-testid="button-add-purchase"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
            <Button 
              className="w-full justify-start rounded-2xl" 
              variant="outline"
              onClick={() => setLocation('/invoices')}
              data-testid="button-create-invoice"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button 
              className="w-full justify-start rounded-2xl" 
              variant="outline"
              onClick={() => setLocation('/payments')}
              data-testid="button-add-payment"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Top Farmers This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Ram Singh", crop: "Wheat", amount: "Rs 45,000" },
              { name: "Mohan Kumar", crop: "Rice", amount: "Rs 38,500" },
              { name: "Vijay Sharma", crop: "Bajra", amount: "Rs 32,000" },
            ].map((farmer, idx) => (
              <div key={idx} className="flex items-center justify-between" data-testid={`farmer-${idx}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {farmer.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.crop}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-2xl">{farmer.amount}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
