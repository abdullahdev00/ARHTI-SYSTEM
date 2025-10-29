import { StatCard } from "@/components/stat-card";
import { Users, AlertCircle, DollarSign, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const recentActivities = [
    { id: 1, text: "Received PKR 10,000 from Factory A", time: "2h ago", type: "payment" },
    { id: 2, text: "Added purchase from Ram Singh - 500kg Wheat", time: "5h ago", type: "purchase" },
    { id: 3, text: "Created invoice #INV-001 for PKR 25,000", time: "1d ago", type: "invoice" },
    { id: 4, text: "New farmer added: Mohan Kumar", time: "2d ago", type: "farmer" },
  ];

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
          value="PKR 1,24,500"
          icon={AlertCircle}
          trend={{ value: "8%", positive: false }}
        />
        <StatCard
          title="Total Commission"
          value="PKR 45,230"
          icon={DollarSign}
          trend={{ value: "15%", positive: true }}
        />
        <StatCard
          title="Charges Today"
          value="PKR 3,200"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${activity.id}`}>
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start rounded-2xl" data-testid="button-add-purchase">
                <Plus className="mr-2 h-4 w-4" />
                Add Purchase
              </Button>
              <Button className="w-full justify-start rounded-2xl" variant="outline" data-testid="button-create-invoice">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start rounded-2xl" variant="outline" data-testid="button-add-payment">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Top Farmers This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Ram Singh", crop: "Wheat", amount: "PKR 45,000" },
              { name: "Mohan Kumar", crop: "Rice", amount: "PKR 38,500" },
              { name: "Vijay Sharma", crop: "Bajra", amount: "PKR 32,000" },
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
