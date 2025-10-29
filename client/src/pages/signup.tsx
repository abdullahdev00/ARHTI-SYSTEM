import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Chrome } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phone: "",
    address: "",
    registrationNo: "",
    referralCode: "",
    plan: "monthly"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup form data:", formData);
  };

  const handleGoogleSignup = () => {
    console.log("Continue with Google");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-2xl rounded-2xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-primary-foreground">A</span>
          </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join Arhti Business - Mandi Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full rounded-2xl h-12 text-base font-medium"
            onClick={handleGoogleSignup}
            data-testid="button-google-signup"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Muhammad Ali"
                  className="rounded-2xl"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  data-testid="input-full-name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+92 300 1234567"
                  className="rounded-2xl"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Ali Trading Company"
                className="rounded-2xl"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                data-testid="input-business-name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ali@business.pk"
                className="rounded-2xl"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-2xl"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-2xl"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  data-testid="input-confirm-password"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Business Address *</Label>
              <Input
                id="address"
                placeholder="Mandi Road, Muzaffargarh, Punjab"
                className="rounded-2xl"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="input-address"
                required
              />
            </div>

            <div>
              <Label htmlFor="registrationNo">Registration Number *</Label>
              <Input
                id="registrationNo"
                placeholder="REG-2024-001"
                className="rounded-2xl"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                data-testid="input-registration-no"
                required
              />
            </div>

            <div>
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                placeholder="Enter referral code for Rs 500 discount"
                className="rounded-2xl"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                data-testid="input-referral-code"
              />
              {formData.referralCode && (
                <p className="text-sm text-green-600 mt-1">✓ Rs 500 discount will be applied</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Select Plan *</Label>
              <RadioGroup value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className={`cursor-pointer transition-all ${formData.plan === 'monthly' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                        <div className="flex-1">
                          <Label htmlFor="monthly" className="cursor-pointer font-semibold text-base">
                            Monthly Plan
                          </Label>
                          <div className="mt-2">
                            <span className="text-2xl font-bold">Rs 1,000</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Billed monthly</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${formData.plan === 'yearly' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="yearly" id="yearly" data-testid="radio-yearly" />
                        <div className="flex-1">
                          <Label htmlFor="yearly" className="cursor-pointer font-semibold text-base flex items-center gap-2">
                            Yearly Plan
                            <Badge variant="secondary" className="rounded-full">Save 17%</Badge>
                          </Label>
                          <div className="mt-2">
                            <span className="text-2xl font-bold">Rs 10,000</span>
                            <span className="text-muted-foreground">/year</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Rs 833/month when billed annually</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-4 space-y-3">
              <Button type="submit" className="w-full rounded-2xl h-12 text-base font-medium" data-testid="button-signup">
                Create Account & Subscribe
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLocation('/signin')}
                  className="text-primary font-medium hover:underline"
                  data-testid="link-signin"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
