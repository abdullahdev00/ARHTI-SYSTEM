import { supabase } from '../config/supabase';
import type {
  PricingPlan,
  PaymentAccount,
  PaymentRequest,
  CreatePaymentRequestData,
  UpdatePaymentRequestData,
  PricingPlansResponse,
  PaymentAccountsResponse,
  PaymentRequestResponse,
} from '../types/payment';

export class PaymentService {
  /**
   * Get all active pricing plans
   */
  static async getPricingPlans(): Promise<PricingPlansResponse> {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months', { ascending: true });

      return { data: data as PricingPlan[] | null, error };
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all active payment accounts
   */
  static async getPaymentAccounts(): Promise<PaymentAccountsResponse> {
    try {
      const { data, error } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      return { data: data as PaymentAccount[] | null, error };
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new payment request
   */
  static async createPaymentRequest(
    userId: string,
    requestData: CreatePaymentRequestData
  ): Promise<PaymentRequestResponse> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([
          {
            user_id: userId,
            ...requestData,
            status: 'pending',
          },
        ])
        .select(`
          *,
          plan:pricing_plans(*),
          payment_account:payment_accounts(*)
        `)
        .single();

      if (!error && data) {
        // Update user profile payment status
        await supabase
          .from('user_profiles')
          .update({
            payment_status: 'payment_pending',
            current_payment_request_id: data.id,
          })
          .eq('id', userId);
      }

      return { data: data as PaymentRequest | null, error };
    } catch (error) {
      console.error('Error creating payment request:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's current payment request
   */
  static async getCurrentPaymentRequest(userId: string): Promise<PaymentRequestResponse> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          plan:pricing_plans(*),
          payment_account:payment_accounts(*)
        `)
        .eq('user_id', userId)
        .in('status', ['pending', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { data: data as PaymentRequest | null, error };
    } catch (error) {
      console.error('Error fetching current payment request:', error);
      return { data: null, error };
    }
  }

  /**
   * Submit payment details (user has made the payment)
   */
  static async submitPaymentDetails(
    paymentRequestId: string,
    paymentData: UpdatePaymentRequestData
  ): Promise<PaymentRequestResponse> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .update({
          ...paymentData,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequestId)
        .select(`
          *,
          plan:pricing_plans(*),
          payment_account:payment_accounts(*)
        `)
        .single();

      if (!error && data) {
        // Update user profile payment status
        await supabase
          .from('user_profiles')
          .update({
            payment_status: 'payment_submitted',
          })
          .eq('id', data.user_id);
      }

      return { data: data as PaymentRequest | null, error };
    } catch (error) {
      console.error('Error submitting payment details:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has pending payment
   */
  static async hasPendingPayment(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['pending', 'submitted'])
        .limit(1);

      if (error) {
        console.error('Error checking pending payment:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking pending payment:', error);
      return false;
    }
  }

  /**
   * Get payment request by ID
   */
  static async getPaymentRequest(paymentRequestId: string): Promise<PaymentRequestResponse> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          plan:pricing_plans(*),
          payment_account:payment_accounts(*)
        `)
        .eq('id', paymentRequestId)
        .single();

      return { data: data as PaymentRequest | null, error };
    } catch (error) {
      console.error('Error fetching payment request:', error);
      return { data: null, error };
    }
  }

  /**
   * Cancel payment request (if still pending)
   */
  static async cancelPaymentRequest(paymentRequestId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequestId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (!error) {
        // Update user profile payment status back to trial
        await supabase
          .from('user_profiles')
          .update({
            payment_status: 'trial',
            current_payment_request_id: null,
          })
          .eq('id', userId);
      }

      return !error;
    } catch (error) {
      console.error('Error canceling payment request:', error);
      return false;
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  }

  /**
   * Calculate discount percentage
   */
  static calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }

  /**
   * Check if payment request is expired
   */
  static isPaymentRequestExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Get days until payment request expires
   */
  static getDaysUntilExpiry(expiresAt: string): number {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

export default PaymentService;
