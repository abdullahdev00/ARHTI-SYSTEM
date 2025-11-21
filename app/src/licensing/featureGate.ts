// Feature Gating System with UI Integration
import React from 'react';
import { Alert } from 'react-native';
import { licenseManager } from './licenseManager';
import { FEATURE_PERMISSIONS, SUBSCRIPTION_PLANS } from './types';
import { SecureLogger } from '../utils/logger';

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  suggestedPlan?: string;
}

export class FeatureGate {
  private static instance: FeatureGate;
  private featureUsageCache: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): FeatureGate {
    if (!FeatureGate.instance) {
      FeatureGate.instance = new FeatureGate();
    }
    return FeatureGate.instance;
  }

  /**
   * Check if user can access a feature
   */
  async checkFeatureAccess(featureId: string): Promise<FeatureGateResult> {
    try {
      // In development mode, allow all features
      if (__DEV__) {
        SecureLogger.debug(`Development mode: Allowing feature ${featureId}`);
        return { allowed: true };
      }

      // Get feature permission info
      const featurePermission = FEATURE_PERMISSIONS[featureId.toUpperCase()];
      
      if (!featurePermission) {
        SecureLogger.warn(`Unknown feature requested: ${featureId}`);
        return {
          allowed: false,
          reason: 'Unknown feature'
        };
      }

      // Check license
      const canAccess = await licenseManager.canAccessFeature(featureId);
      
      if (canAccess) {
        // Track feature usage
        this.trackFeatureUsage(featureId);
        
        return { allowed: true };
      }

      // Get current license status
      const licenseStatus = await licenseManager.getLicenseStatus();
      
      // Determine suggested upgrade plan
      const suggestedPlan = this.getSuggestedPlan(featureId, licenseStatus.planId);
      
      return {
        allowed: false,
        reason: this.getAccessDeniedReason(licenseStatus),
        upgradeRequired: true,
        suggestedPlan
      };
    } catch (error) {
      SecureLogger.error(`Feature gate check failed for: ${featureId}`);
      return {
        allowed: false,
        reason: 'Feature check failed'
      };
    }
  }

  /**
   * Show upgrade dialog for blocked feature
   */
  async showUpgradeDialog(featureId: string, onUpgrade?: () => void): Promise<void> {
    try {
      const featurePermission = FEATURE_PERMISSIONS[featureId.toUpperCase()];
      const gateResult = await this.checkFeatureAccess(featureId);
      
      if (gateResult.allowed) {
        return; // Feature is already accessible
      }

      const featureName = featurePermission?.name || 'Premium Feature';
      const suggestedPlan = gateResult.suggestedPlan ? 
        SUBSCRIPTION_PLANS[gateResult.suggestedPlan] : 
        SUBSCRIPTION_PLANS.BASIC_MONTHLY;

      Alert.alert(
        '🔒 Premium Feature',
        `${featureName} is available in ${suggestedPlan.displayName} plan.\n\n` +
        `Upgrade now for ₨${suggestedPlan.price}/${suggestedPlan.duration === 30 ? 'month' : 'year'} ` +
        `to unlock this and other premium features.`,
        [
          {
            text: 'Maybe Later',
            style: 'cancel'
          },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: onUpgrade
          }
        ]
      );
    } catch (error) {
      SecureLogger.error('Failed to show upgrade dialog');
    }
  }

  /**
   * Show trial expired dialog
   */
  async showTrialExpiredDialog(onUpgrade?: () => void): Promise<void> {
    Alert.alert(
      '⏰ Trial Expired',
      'Your 7-day free trial has ended. Upgrade to continue using all features.\n\n' +
      '✅ Full inventory management\n' +
      '✅ Advanced reports\n' +
      '✅ Cloud backup\n' +
      '✅ And much more!',
      [
        {
          text: 'Continue with Limited Features',
          style: 'cancel'
        },
        {
          text: 'Upgrade Now',
          style: 'default',
          onPress: onUpgrade
        }
      ]
    );
  }

  /**
   * Get feature usage statistics
   */
  getFeatureUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const [featureId, count] of this.featureUsageCache.entries()) {
      stats[featureId] = count;
    }
    
    return stats;
  }

  /**
   * Check multiple features at once
   */
  async checkMultipleFeatures(featureIds: string[]): Promise<Record<string, FeatureGateResult>> {
    const results: Record<string, FeatureGateResult> = {};
    
    for (const featureId of featureIds) {
      results[featureId] = await this.checkFeatureAccess(featureId);
    }
    
    return results;
  }

  /**
   * Get features available in current plan
   */
  async getAvailableFeatures(): Promise<string[]> {
    try {
      const licenseStatus = await licenseManager.getLicenseStatus();
      
      if (!licenseStatus.hasLicense || !licenseStatus.planId) {
        return []; // No features available without license
      }

      const plan = SUBSCRIPTION_PLANS[licenseStatus.planId];
      return plan?.features || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get locked features (not available in current plan)
   */
  async getLockedFeatures(): Promise<string[]> {
    try {
      const availableFeatures = await this.getAvailableFeatures();
      const allFeatures = Object.keys(FEATURE_PERMISSIONS).map(key => 
        FEATURE_PERMISSIONS[key].featureId
      );
      
      return allFeatures.filter(feature => !availableFeatures.includes(feature));
    } catch (error) {
      return [];
    }
  }

  /**
   * Track feature usage
   */
  private trackFeatureUsage(featureId: string): void {
    const currentCount = this.featureUsageCache.get(featureId) || 0;
    this.featureUsageCache.set(featureId, currentCount + 1);
  }

  /**
   * Get suggested upgrade plan for a feature
   */
  private getSuggestedPlan(featureId: string, currentPlanId?: string): string {
    const featurePermission = FEATURE_PERMISSIONS[featureId.toUpperCase()];
    
    if (!featurePermission) {
      return 'basic_monthly';
    }

    // Find the cheapest plan that includes this feature
    const availablePlans = featurePermission.requiredPlan;
    
    // If user has no plan or trial, suggest basic
    if (!currentPlanId || currentPlanId === 'free_trial') {
      return availablePlans.includes('basic_monthly') ? 'basic_monthly' : 'premium_yearly';
    }

    // If user has basic but needs premium feature, suggest premium
    if (currentPlanId === 'basic_monthly' && availablePlans.includes('premium_yearly')) {
      return 'premium_yearly';
    }

    return 'basic_monthly';
  }

  /**
   * Get access denied reason
   */
  private getAccessDeniedReason(licenseStatus: any): string {
    if (!licenseStatus.hasLicense) {
      return 'No active license';
    }

    if (licenseStatus.isExpired) {
      return 'License expired';
    }

    if (licenseStatus.status === 'trial') {
      return 'Feature not available in trial';
    }

    return 'Upgrade required';
  }
}

/**
 * React Hook for feature gating
 */
export const useFeatureGate = (featureId: string) => {
  const [canAccess, setCanAccess] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [gateResult, setGateResult] = React.useState<FeatureGateResult | null>(null);

  const featureGate = FeatureGate.getInstance();

  React.useEffect(() => {
    checkAccess();
  }, [featureId]);

  const checkAccess = async () => {
    setIsLoading(true);
    try {
      const result = await featureGate.checkFeatureAccess(featureId);
      setGateResult(result);
      setCanAccess(result.allowed);
    } catch (error) {
      setCanAccess(false);
      setGateResult({ allowed: false, reason: 'Check failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const showUpgradeDialog = (onUpgrade?: () => void) => {
    featureGate.showUpgradeDialog(featureId, onUpgrade);
  };

  return {
    canAccess,
    isLoading,
    gateResult,
    checkAccess,
    showUpgradeDialog
  };
};

/**
 * Higher-Order Component for feature gating
 */
export const withFeatureGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureId: string,
  fallbackComponent?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { canAccess, isLoading } = useFeatureGate(featureId);

    if (isLoading) {
      return null; // Or loading component
    }

    if (!canAccess) {
      const FallbackComponent = fallbackComponent;
      return FallbackComponent ? React.createElement(FallbackComponent, props) : null;
    }

    return React.createElement(WrappedComponent, props);
  };
};

// Export singleton instance
export const featureGate = FeatureGate.getInstance();
