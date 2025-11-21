// Payment and Pricing Types for ARHTI System

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  duration_months: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentAccount {
  id: string;
  account_name: string;
  account_number?: string;
  iban_number?: string;
  bank_name: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_account_id: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired';
  
  // User payment details
  user_bank_name?: string;
  user_account_number?: string;
  user_account_name?: string;
  transaction_reference?: string;
  payment_date?: string;
  
  // Admin verification
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  expires_at: string;
  
  // Related data (populated via joins)
  plan?: PricingPlan;
  payment_account?: PaymentAccount;
}

export interface PaymentSubmissionData {
  user_bank_name: string;
  user_account_number: string;
  user_account_name: string;
  transaction_reference?: string;
  payment_date: string;
}

export type PaymentStatus = 'trial' | 'payment_pending' | 'payment_submitted' | 'active' | 'expired' | 'suspended';

// Extended UserProfile interface to include payment status
export interface UserProfileWithPayment {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  subscription_status: 'active' | 'inactive' | 'trial';
  subscription_plan: 'monthly' | 'yearly' | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  payment_status: PaymentStatus;
  current_payment_request_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Extended profile information
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone_number?: string;
  business_type?: string;
  gst_number?: string;
  profile_picture?: string;
}

// API Response types
export interface PricingPlansResponse {
  data: PricingPlan[] | null;
  error: any;
}

export interface PaymentAccountsResponse {
  data: PaymentAccount[] | null;
  error: any;
}

export interface PaymentRequestResponse {
  data: PaymentRequest | null;
  error: any;
}

export interface CreatePaymentRequestData {
  plan_id: string;
  amount: number;
  payment_account_id: string;
}

export interface UpdatePaymentRequestData {
  user_bank_name: string;
  user_account_number: string;
  user_account_name: string;
  transaction_reference?: string;
  payment_date: string;
  status: 'submitted';
}

// All types are already exported above with their interface declarations
