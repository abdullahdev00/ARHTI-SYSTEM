import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Check } from "lucide-react";

export default function Plan() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("1000");
  const [referralCode, setReferralCode] = useState("");

  const plans = [
    {
      id: "1000",
      name: "Monthly Plan",
      price: "1,000",
      period: "month",
      features: ["All features included", "24/7 Support", "Unlimited farmers", "Invoice generation"]
    },
    {
      id: "10000",
      name: "Yearly Plan",
      price: "10,000",
      period: "year",
      savings: "17% savings",
      features: ["All features included", "24/7 Priority Support", "Unlimited farmers", "Invoice generation", "Advanced analytics"]
    }
  ];

  const handleProceed = () => {
    // Navigate to checkout or next step
    console.log("Selected plan:", selectedPlan);
    console.log("Referral code:", referralCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-4xl rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Choose Your Plan</CardTitle>
          <CardDescription className="text-base">
            Select the plan that works best for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-green-600 bg-green-50 dark:bg-green-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                data-testid={`plan-card-${plan.id}`}
              >
                {/* Hidden radio input for accessibility */}
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlan === plan.id}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="sr-only"
                  data-testid={`radio-plan-${plan.id}`}
                />
                
                {/* Selected indicator */}
                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.savings && (
                      <span className="text-sm text-green-600 font-medium">{plan.savings}</span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Rs {plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              placeholder="Enter referral code"
              className="rounded-2xl"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              data-testid="input-referral-code"
            />
            {referralCode && (
              <p className="text-sm text-green-600 font-medium" data-testid="text-discount">
                ✓ Rs 500 discount applied!
              </p>
            )}
          </div>

          {/* Total */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Plan Total</span>
              <span className="font-bold">
                Rs {selectedPlan === "1000" ? "1,000" : "10,000"}
              </span>
            </div>
            {referralCode && (
              <>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Referral Discount</span>
                  <span className="text-sm font-medium">- Rs 500</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-between items-center">
                  <span className="font-bold">Final Amount</span>
                  <span className="font-bold text-lg text-green-600">
                    Rs {selectedPlan === "1000" ? "500" : "9,500"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceed}
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg py-6"
            data-testid="button-proceed-checkout"
          >
            Proceed to Checkout
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              onClick={() => setLocation("/signin")}
              className="text-green-600 hover:text-green-700 font-medium cursor-pointer"
              data-testid="link-signin"
            >
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
