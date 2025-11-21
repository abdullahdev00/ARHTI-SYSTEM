import { supabase } from '../config/supabase';

export interface SubscriptionDetails {
  userId: string;
  planId: string;
  planName: string;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentRequestId: string;
}

export class SubscriptionService {
  /**
   * Calculate subscription end date based on plan duration
   */
  static calculateSubscriptionEndDate(startDate: Date, durationMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }

  /**
   * Create user profile if it doesn't exist
   */
  static async ensureUserProfileExists(userId: string, email?: string): Promise<void> {
    try {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        console.log('Creating missing user profile for:', userId);
        
        // Create basic user profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: userId,
            name: 'User', // Default name
            email: email || 'user@example.com', // Default email
            email_verified: false,
            subscription_status: 'trial',
            subscription_plan: null,
            subscription_start_date: null,
            subscription_end_date: null,
            payment_status: 'trial',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (createError) {
          console.error('Error creating user profile:', createError);
          throw createError;
        }

        console.log('User profile created successfully for:', userId);
      }
    } catch (error) {
      console.error('Error ensuring user profile exists:', error);
      throw error;
    }
  }

  /**
   * Activate user subscription after payment verification
   */
  static async activateSubscription(subscriptionDetails: SubscriptionDetails): Promise<void> {
    const { userId, planId, startDate, endDate, paymentRequestId } = subscriptionDetails;

    console.log('Activating subscription:', {
      userId,
      planId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentRequestId
    });

    // Ensure user profile exists before updating
    await SubscriptionService.ensureUserProfileExists(userId);

    console.log('About to update user_profiles table with data:', {
      subscription_status: 'active',
      payment_status: 'active',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
    });

    // Update user profile with subscription details
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        payment_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Database error details:', profileError);
      throw new Error(`Failed to activate subscription: ${profileError.message}`);
    }

    console.log('Subscription activated successfully for user:', userId);
  }

  /**
   * Deactivate user subscription after payment rejection
   */
  static async deactivateSubscription(userId: string): Promise<void> {
    console.log('Deactivating subscription for user:', userId);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        payment_status: 'payment_required',
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to deactivate subscription: ${profileError.message}`);
    }

    console.log('Subscription deactivated successfully for user:', userId);
  }

  /**
   * Check if subscription is expired
   */
  static isSubscriptionExpired(endDate: string): boolean {
    const now = new Date();
    const expiry = new Date(endDate);
    return now > expiry;
  }

  /**
   * Get days remaining in subscription
   */
  static getDaysRemaining(endDate: string): number {
    const now = new Date();
    const expiry = new Date(endDate);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Format subscription status for display
   */
  static formatSubscriptionStatus(
    subscriptionStatus: string,
    paymentStatus: string,
    endDate?: string
  ): { status: string; color: string; description: string } {
    if (subscriptionStatus === 'active' && paymentStatus === 'active') {
      if (endDate && this.isSubscriptionExpired(endDate)) {
        return {
          status: 'Expired',
          color: '#ef4444',
          description: 'Subscription has expired'
        };
      }
      
      const daysRemaining = endDate ? this.getDaysRemaining(endDate) : 0;
      if (daysRemaining <= 7) {
        return {
          status: 'Expiring Soon',
          color: '#f59e0b',
          description: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
        };
      }
      
      return {
        status: 'Active',
        color: '#10b981',
        description: `${daysRemaining} days remaining`
      };
    }

    if (paymentStatus === 'payment_pending') {
      return {
        status: 'Payment Pending',
        color: '#3b82f6',
        description: 'Waiting for payment verification'
      };
    }

    return {
      status: 'Inactive',
      color: '#6b7280',
      description: 'Payment required to activate'
    };
  }

  /**
   * Update payment request with admin action
   */
  static async updatePaymentRequest(
    requestId: string,
    status: 'verified' | 'rejected',
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<void> {
    console.log('Updating payment request:', { requestId, status, rejectionReason });
    
    const updateData: any = {
      status,
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    console.log('About to update payment_requests table with data:', updateData);

    const { error } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Payment request update error:', error);
      throw new Error(`Failed to update payment request: ${error.message}`);
    }

    console.log('Payment request updated successfully');
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  static async getSubscriptionStats(): Promise<{
    activeSubscriptions: number;
    expiringSubscriptions: number;
    expiredSubscriptions: number;
    pendingPayments: number;
  }> {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Get all user profiles with subscription data
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('subscription_status, payment_status, subscription_end_date')
        .not('subscription_end_date', 'is', null);

      if (error) {
        throw error;
      }

      let activeSubscriptions = 0;
      let expiringSubscriptions = 0;
      let expiredSubscriptions = 0;
      let pendingPayments = 0;

      profiles?.forEach(profile => {
        if (profile.payment_status === 'payment_pending') {
          pendingPayments++;
        } else if (profile.subscription_status === 'active' && profile.subscription_end_date) {
          const endDate = new Date(profile.subscription_end_date);
          
          if (now > endDate) {
            expiredSubscriptions++;
          } else if (endDate <= sevenDaysFromNow) {
            expiringSubscriptions++;
          } else {
            activeSubscriptions++;
          }
        }
      });

      return {
        activeSubscriptions,
        expiringSubscriptions,
        expiredSubscriptions,
        pendingPayments
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return {
        activeSubscriptions: 0,
        expiringSubscriptions: 0,
        expiredSubscriptions: 0,
        pendingPayments: 0
      };
    }
  }
}

export default SubscriptionService;
