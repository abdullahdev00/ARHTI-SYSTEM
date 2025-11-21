// Comprehensive Licensing Types & Configuration
export interface License {
  id: string;
  userId: string;
  planId: string;
  deviceFingerprint: string;
  status: LicenseStatus;
  createdAt: number;
  expiresAt: number;
  lastValidated: number;
  features: string[];
  deviceLimit: number;
  currentDevices: string[];
  metadata: LicenseMetadata;
}

export interface LicenseMetadata {
  paymentMethod?: string;
  transactionId?: string;
  purchaseDate: number;
  autoRenew: boolean;
  trialUsed: boolean;
  upgradeHistory: UpgradeRecord[];
}

export interface UpgradeRecord {
  fromPlan: string;
  toPlan: string;
  date: number;
  reason: string;
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  duration: number; // days
  price: number; // PKR
  currency: string;
  features: string[];
  deviceLimit: number;
  priority: number;
  isPopular?: boolean;
  trialDays?: number;
  discountPercentage?: number;
}

export interface FeaturePermission {
  featureId: string;
  name: string;
  description: string;
  requiredPlan: string[];
  isCore: boolean;
  category: FeatureCategory;
}

export enum FeatureCategory {
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  BACKUP = 'backup',
  ANALYTICS = 'analytics',
  SUPPORT = 'support',
  INTEGRATION = 'integration'
}

export interface LicenseValidationResult {
  isValid: boolean;
  license?: License;
  error?: string;
  remainingDays?: number;
  needsRenewal?: boolean;
  canUseFeature?: boolean;
}

export interface DeviceBinding {
  deviceFingerprint: string;
  licenseId: string;
  boundAt: number;
  lastSeen: number;
  deviceInfo: {
    brand?: string;
    model?: string;
    os?: string;
    version?: string;
  };
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE_TRIAL: {
    id: 'free_trial',
    name: 'free_trial',
    displayName: 'Free 7-Day Trial',
    description: 'Full access to all premium features - No credit card required',
    duration: 7,
    price: 0,
    currency: 'PKR',
    features: [
      'full_inventory',
      'advanced_reports',
      'cloud_backup',
      'farmer_management',
      'purchase_tracking',
      'invoice_generation',
      'payment_tracking',
      'analytics_dashboard',
      'priority_support'
    ],
    deviceLimit: 1,
    priority: 1,
    trialDays: 7,
    isPopular: true
  },

  BASIC_MONTHLY: {
    id: 'basic_monthly',
    name: 'basic_monthly', 
    displayName: 'Basic Monthly',
    description: 'Essential features for small businesses',
    duration: 30,
    price: 999,
    currency: 'PKR',
    features: [
      'full_inventory',
      'advanced_reports',
      'cloud_backup',
      'farmer_management',
      'purchase_tracking',
      'invoice_generation',
      'payment_tracking'
    ],
    deviceLimit: 1,
    priority: 2
  },

  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    name: 'premium_yearly',
    displayName: 'Premium Yearly',
    description: 'All features with multi-device support',
    duration: 365,
    price: 9999,
    currency: 'PKR',
    features: [
      'full_inventory',
      'advanced_reports',
      'cloud_backup',
      'farmer_management', 
      'purchase_tracking',
      'invoice_generation',
      'payment_tracking',
      'analytics_dashboard',
      'export_data',
      'priority_support',
      'multiple_backups',
      'advanced_filters'
    ],
    deviceLimit: 3,
    priority: 3,
    isPopular: true,
    discountPercentage: 17 // Compared to 12 months of basic
  }
};

// Feature Permissions Configuration
export const FEATURE_PERMISSIONS: Record<string, FeaturePermission> = {
  // Core Features (Available in trial)
  BASIC_INVENTORY: {
    featureId: 'basic_inventory',
    name: 'Basic Inventory',
    description: 'Add and view stock items',
    requiredPlan: ['free_trial', 'basic_monthly', 'premium_yearly'],
    isCore: true,
    category: FeatureCategory.INVENTORY
  },

  FARMER_MANAGEMENT: {
    featureId: 'farmer_management',
    name: 'Farmer Management',
    description: 'Manage farmer profiles and contacts',
    requiredPlan: ['free_trial', 'basic_monthly', 'premium_yearly'],
    isCore: true,
    category: FeatureCategory.INVENTORY
  },

  PURCHASE_TRACKING: {
    featureId: 'purchase_tracking',
    name: 'Purchase Tracking',
    description: 'Track purchases and transactions',
    requiredPlan: ['free_trial', 'basic_monthly', 'premium_yearly'],
    isCore: true,
    category: FeatureCategory.INVENTORY
  },

  // Premium Features
  FULL_INVENTORY: {
    featureId: 'full_inventory',
    name: 'Full Inventory Management',
    description: 'Advanced inventory with categories and variants',
    requiredPlan: ['basic_monthly', 'premium_yearly'],
    isCore: false,
    category: FeatureCategory.INVENTORY
  },

  ADVANCED_REPORTS: {
    featureId: 'advanced_reports',
    name: 'Advanced Reports',
    description: 'Detailed business reports and insights',
    requiredPlan: ['basic_monthly', 'premium_yearly'],
    isCore: false,
    category: FeatureCategory.REPORTS
  },

  CLOUD_BACKUP: {
    featureId: 'cloud_backup',
    name: 'Cloud Backup',
    description: 'Automatic cloud backup to Google Drive',
    requiredPlan: ['basic_monthly', 'premium_yearly'],
    isCore: false,
    category: FeatureCategory.BACKUP
  },

  INVOICE_GENERATION: {
    featureId: 'invoice_generation',
    name: 'Invoice Generation',
    description: 'Generate and print professional invoices',
    requiredPlan: ['basic_monthly', 'premium_yearly'],
    isCore: false,
    category: FeatureCategory.REPORTS
  },

  PAYMENT_TRACKING: {
    featureId: 'payment_tracking',
    name: 'Payment Tracking',
    description: 'Track payments and outstanding balances',
    requiredPlan: ['basic_monthly', 'premium_yearly'],
    isCore: false,
    category: FeatureCategory.INVENTORY
  },

  // Premium-Only Features
  ANALYTICS_DASHBOARD: {
    featureId: 'analytics_dashboard',
    name: 'Analytics Dashboard',
    description: 'Business analytics and trends',
    requiredPlan: ['premium_yearly'],
    isCore: false,
    category: FeatureCategory.ANALYTICS
  },

  EXPORT_DATA: {
    featureId: 'export_data',
    name: 'Data Export',
    description: 'Export data to Excel and other formats',
    requiredPlan: ['premium_yearly'],
    isCore: false,
    category: FeatureCategory.REPORTS
  },

  PRIORITY_SUPPORT: {
    featureId: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    requiredPlan: ['premium_yearly'],
    isCore: false,
    category: FeatureCategory.SUPPORT
  },

  MULTIPLE_BACKUPS: {
    featureId: 'multiple_backups',
    name: 'Multiple Backups',
    description: 'Multiple backup locations and schedules',
    requiredPlan: ['premium_yearly'],
    isCore: false,
    category: FeatureCategory.BACKUP
  },

  ADVANCED_FILTERS: {
    featureId: 'advanced_filters',
    name: 'Advanced Filters',
    description: 'Advanced search and filtering options',
    requiredPlan: ['premium_yearly'],
    isCore: false,
    category: FeatureCategory.INVENTORY
  }
};

// License Configuration
export const LICENSE_CONFIG = {
  // Trial settings
  TRIAL_DURATION_DAYS: 7,
  TRIAL_GRACE_PERIOD_HOURS: 24,
  
  // Validation settings
  VALIDATION_INTERVAL_HOURS: 24,
  OFFLINE_GRACE_PERIOD_HOURS: 72,
  
  // Security settings
  MAX_DEVICE_CHANGES_PER_MONTH: 2,
  DEVICE_BINDING_COOLDOWN_HOURS: 24,
  
  // Storage keys
  STORAGE_KEYS: {
    LICENSE: 'user_license',
    DEVICE_BINDING: 'device_binding',
    TRIAL_START: 'trial_start_date',
    LAST_VALIDATION: 'last_license_validation',
    FEATURE_USAGE: 'feature_usage_stats'
  }
};
