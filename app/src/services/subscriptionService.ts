import { supabase } from '../config/supabase';

// New subscription interface for the separated table
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: 'active' | 'inactive' | 'trial' | 'expired' | 'suspended';
  plan_type: 'monthly' | 'yearly' | null;
  start_date: string | null;
  end_date: string | null;
  payment_status: 'trial' | 'payment_pending' | 'payment_submitted' | 'active' | 'expired' | 'suspended';
  auto_renew: boolean;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: any;
  user_profile?: any;
}

export interface CreateSubscriptionData {
  user_id: string;
  plan_id: string;
  plan_type: 'monthly' | 'yearly';
  auto_renew?: boolean;
}

export interface UpdateSubscriptionData {
  status?: 'active' | 'inactive' | 'trial' | 'expired' | 'suspended';
  plan_id?: string;
  plan_type?: 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  payment_status?: 'trial' | 'payment_pending' | 'payment_submitted' | 'active' | 'expired' | 'suspended';
  auto_renew?: boolean;
  trial_end_date?: string;
}

export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_plans(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data as Subscription | null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription for user
   */
  static async createSubscription(subscriptionData: CreateSubscriptionData): Promise<Subscription> {
    try {
      const now = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          ...subscriptionData,
          status: 'trial',
          payment_status: 'trial',
          trial_end_date: trialEndDate.toISOString(),
          auto_renew: subscriptionData.auto_renew ?? true,
        }])
        .select(`
          *,
          pricing_plans(*)
        `)
        .single();

      if (error) throw error;
      return data as Subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string, 
    updateData: UpdateSubscriptionData
  ): Promise<Subscription> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select(`
          *,
          pricing_plans(*)
        `)
        .single();

      if (error) throw error;
      return data as Subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Activate subscription after payment verification
   */
  static async activateSubscription(
    userId: string,
    planId: string,
    durationMonths: number
  ): Promise<Subscription> {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Check if user has existing subscription
      const existingSubscription = await this.getUserSubscription(userId);

      if (existingSubscription) {
        // Update existing subscription
        return await this.updateSubscription(existingSubscription.id, {
          status: 'active',
          payment_status: 'active',
          plan_id: planId,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        });
      } else {
        // Create new subscription
        const subscription = await this.createSubscription({
          user_id: userId,
          plan_id: planId,
          plan_type: durationMonths === 12 ? 'yearly' : 'monthly',
        });

        // Activate it
        return await this.updateSubscription(subscription.id, {
          status: 'active',
          payment_status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  /**
   * Deactivate subscription
   */
  static async deactivateSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (subscription) {
        await this.updateSubscription(subscription.id, {
          status: 'inactive',
          payment_status: 'expired',
        });
      }
    } catch (error) {
      console.error('Error deactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;
      
      const now = new Date();
      const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
      
      return subscription.status === 'active' && 
             subscription.payment_status === 'active' &&
             (endDate ? endDate > now : false);
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Get all subscriptions (admin only)
   */
  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<{
    activeSubscriptions: number;
    trialSubscriptions: number;
    expiredSubscriptions: number;
    totalRevenue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          status,
          payment_status,
          pricing_plans(original_price, discounted_price)
        `);

      if (error) throw error;

      let activeSubscriptions = 0;
      let trialSubscriptions = 0;
      let expiredSubscriptions = 0;
      let totalRevenue = 0;

      data?.forEach(sub => {
        if (sub.status === 'active' && sub.payment_status === 'active') {
          activeSubscriptions++;
          const plan = (sub as any).pricing_plans;
          totalRevenue += plan?.discounted_price || plan?.original_price || 0;
        } else if (sub.status === 'trial') {
          trialSubscriptions++;
        } else if (sub.status === 'expired' || sub.status === 'inactive') {
          expiredSubscriptions++;
        }
      });

      return {
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  /**
   * Calculate subscription end date
   */
  static calculateSubscriptionEndDate(startDate: Date, durationMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }
}
