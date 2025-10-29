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
      <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme Mode</Label>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" data-testid="radio-theme-system" />
                <Label htmlFor="system">System Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" data-testid="radio-theme-light" />
                <Label htmlFor="light">Light Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" data-testid="radio-theme-dark" />
                <Label htmlFor="dark">Dark Mode</Label>
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
              <Label>Commission Type</Label>
              <RadioGroup value={commissionType} onValueChange={setCommissionType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" data-testid="radio-commission-percentage" />
                  <Label htmlFor="percentage">Fixed Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transaction" id="transaction" data-testid="radio-commission-transaction" />
                  <Label htmlFor="transaction">Per Transaction</Label>
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
              <Select defaultValue="inr">
                <SelectTrigger className="rounded-2xl" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="inr">INR (₹)</SelectItem>
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
