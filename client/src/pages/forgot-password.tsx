import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/signin">
              <Button variant="ghost" size="sm" className="rounded-xl" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="youremail@example.com"
              className="rounded-2xl"
              data-testid="input-email"
            />
          </div>

          <Button 
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white" 
            data-testid="button-send-reset-link"
          >
            Send Reset Link
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/signin">
              <a className="text-green-600 hover:text-green-700 font-medium" data-testid="link-signin">
                Sign in
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
