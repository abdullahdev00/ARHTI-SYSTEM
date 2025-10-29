import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: "Jan", purchases: 245000, commission: 12250, charges: 8500 },
  { month: "Feb", purchases: 312000, commission: 15600, charges: 10200 },
  { month: "Mar", purchases: 278000, commission: 13900, charges: 9100 },
  { month: "Apr", purchases: 356000, commission: 17800, charges: 11500 },
  { month: "May", purchases: 402000, commission: 20100, charges: 13200 },
  { month: "Jun", purchases: 389000, commission: 19450, charges: 12800 },
];

const cropData = [
  { crop: "Wheat", amount: 850000, percentage: 35 },
  { crop: "Rice", amount: 650000, percentage: 27 },
  { crop: "Bajra", amount: 550000, percentage: 22 },
  { crop: "Cotton", amount: 400000, percentage: 16 },
];

const chargesData = [
  { type: "Labor", amount: 42000, percentage: 50 },
  { type: "Transport", amount: 28000, percentage: 33 },
  { type: "Miscellaneous", amount: 15000, percentage: 17 },
];

const paymentStatusData = [
  { status: "Paid", value: 65, amount: 1625000 },
  { status: "Pending", value: 25, amount: 625000 },
  { status: "Overdue", value: 10, amount: 250000 },
];

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
};

const PIE_COLORS = [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Comprehensive Reports</h1>
          <p className="text-muted-foreground mt-1">Detailed analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl" data-testid="button-export-pdf">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="rounded-2xl" data-testid="button-export-excel">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total Purchases</CardDescription>
            <CardTitle className="text-3xl">Rs 24.5L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total Commission</CardDescription>
            <CardTitle className="text-3xl">Rs 1.2L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8.3% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total Charges</CardDescription>
            <CardTitle className="text-3xl">Rs 85K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-red-500" />
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle className="text-3xl text-primary">Rs 37.5K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +15.7% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Purchases Trend */}
      <Card className="rounded-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle>Monthly Purchases Trend</CardTitle>
          <CardDescription>Last 6 months purchase activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px"
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="purchases" 
                stroke={COLORS.primary} 
                strokeWidth={2} 
                name="Purchases (Rs)"
                dot={{ fill: COLORS.primary, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commission & Charges Analysis */}
      <Card className="rounded-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle>Commission & Charges Analysis</CardTitle>
          <CardDescription>Monthly commission earned vs charges incurred</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px"
                }} 
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="commission" 
                stackId="1"
                stroke={COLORS.chart1} 
                fill={COLORS.chart1}
                fillOpacity={0.6}
                name="Commission (Rs)"
              />
              <Area 
                type="monotone" 
                dataKey="charges" 
                stackId="2"
                stroke={COLORS.chart2} 
                fill={COLORS.chart2}
                fillOpacity={0.6}
                name="Charges (Rs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Crop Performance */}
        <Card className="rounded-2xl animate-fade-in-up">
          <CardHeader>
            <CardTitle>Crop Performance</CardTitle>
            <CardDescription>Total purchases by crop type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cropData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="crop" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px"
                  }} 
                />
                <Bar dataKey="amount" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Amount (Rs)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charges Breakdown */}
        <Card className="rounded-2xl animate-fade-in-up">
          <CardHeader>
            <CardTitle>Charges Breakdown</CardTitle>
            <CardDescription>Distribution of charges by type</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chargesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {chargesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Overview */}
      <Card className="rounded-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle>Payment Status Overview</CardTitle>
          <CardDescription>Current payment status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, value }) => `${status}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-4">
              {paymentStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="font-medium">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rs {(item.amount / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
