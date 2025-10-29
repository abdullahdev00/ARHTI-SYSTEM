import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Affiliate() {
  const { toast } = useToast();
  const affiliateCode = "+923001234567";
  const totalReferrals = 12;
  const totalEarnings = 6000;
  const pendingEarnings = 1500;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateCode);
    toast({
      title: "Copied!",
      description: "Affiliate code copied to clipboard",
    });
  };

  const shareAffiliate = () => {
    const message = `Join Arhti Business with my referral code ${affiliateCode} and get Rs 500 discount! I'll also get Rs 500 when you sign up.`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Arhti Business',
        text: message,
      });
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: "Copied!",
        description: "Referral message copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Affiliate Program</h1>
        <p className="text-muted-foreground mt-1">Earn Rs 500 for every successful referral</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold" data-testid="text-total-referrals">{totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-total-earnings">Rs {totalEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="text-pending-earnings">Rs {pendingEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Your Affiliate Code</CardTitle>
          <CardDescription>
            Share this code with friends and family. They get Rs 500 discount, and you get Rs 500 when they subscribe!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={affiliateCode}
              readOnly
              className="rounded-2xl font-mono text-lg font-semibold"
              data-testid="input-affiliate-code"
            />
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="rounded-2xl px-6"
              data-testid="button-copy-code"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="w-full rounded-2xl h-12"
            onClick={shareAffiliate}
            data-testid="button-share-affiliate"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Affiliate Link
          </Button>

          <div className="p-4 bg-muted/50 rounded-2xl space-y-2">
            <h4 className="font-semibold text-sm">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share your unique phone number as referral code</li>
              <li>• Your referral gets Rs 500 discount on signup</li>
              <li>• You receive Rs 500 when they subscribe</li>
              <li>• No limit on referrals - earn unlimited!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Ali Khan", date: "2 days ago", status: "Active", amount: 500 },
              { name: "Sara Ahmed", date: "1 week ago", status: "Active", amount: 500 },
              { name: "Hassan Malik", date: "2 weeks ago", status: "Pending", amount: 500 },
            ].map((referral, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl" data-testid={`referral-${idx}`}>
                <div>
                  <p className="font-medium">{referral.name}</p>
                  <p className="text-sm text-muted-foreground">{referral.date}</p>
                </div>
                <div className="text-right">
                  <Badge variant={referral.status === "Active" ? "default" : "secondary"} className="rounded-full mb-1">
                    {referral.status}
                  </Badge>
                  <p className="text-sm font-semibold text-green-600">Rs {referral.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
