import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/lib/theme-provider";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [commissionType, setCommissionType] = useState("percentage");
  const [commissionValue, setCommissionValue] = useState("5");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold animate-fade-in-up" data-testid="text-page-title">Settings</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Theme Mode</Label>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)} className="space-y-3">
              <div className="flex items-center space-x-3 p-4 rounded-2xl border hover-elevate cursor-pointer" onClick={() => setTheme("system")}>
                <RadioGroupItem value="system" id="system" data-testid="radio-theme-system" />
                <Label htmlFor="system" className="cursor-pointer flex-1 font-medium">System Default</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-2xl border hover-elevate cursor-pointer" onClick={() => setTheme("light")}>
                <RadioGroupItem value="light" id="light" data-testid="radio-theme-light" />
                <Label htmlFor="light" className="cursor-pointer flex-1 font-medium">Light Mode</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-2xl border hover-elevate cursor-pointer" onClick={() => setTheme("dark")}>
                <RadioGroupItem value="dark" id="dark" data-testid="radio-theme-dark" />
                <Label htmlFor="dark" className="cursor-pointer flex-1 font-medium">Dark Mode</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Commission Type</Label>
              <RadioGroup value={commissionType} onValueChange={setCommissionType} className="space-y-3 mt-4">
                <div className="flex items-center space-x-3 p-4 rounded-2xl border hover-elevate cursor-pointer" onClick={() => setCommissionType("percentage")}>
                  <RadioGroupItem value="percentage" id="percentage" data-testid="radio-commission-percentage" />
                  <Label htmlFor="percentage" className="cursor-pointer flex-1 font-medium">Fixed Percentage</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-2xl border hover-elevate cursor-pointer" onClick={() => setCommissionType("transaction")}>
                  <RadioGroupItem value="transaction" id="transaction" data-testid="radio-commission-transaction" />
                  <Label htmlFor="transaction" className="cursor-pointer flex-1 font-medium">Per Transaction</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="commission">Commission Value (%)</Label>
              <Input
                id="commission"
                type="number"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="rounded-2xl"
                data-testid="input-commission-value"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currency">Currency Format</Label>
              <Select defaultValue="pkr">
                <SelectTrigger className="rounded-2xl" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="pkr">PKR (Rs)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select defaultValue="dmy">
                <SelectTrigger className="rounded-2xl" data-testid="select-date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="rounded-2xl" data-testid="button-save-settings">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
