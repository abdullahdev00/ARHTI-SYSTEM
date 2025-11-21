// Admin App Types

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  subscription_status: 'active' | 'inactive' | 'trial';
  subscription_plan?: 'monthly' | 'yearly';
  subscription_start_date?: string;
  subscription_end_date?: string;
  payment_status?: 'paid' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
  company_name?: string;
  phone_number?: string;
  business_type?: string;
  gst_number?: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_profile: UserProfile;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  pending_payments: number;
  monthly_revenue: number;
  trial_users: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}
