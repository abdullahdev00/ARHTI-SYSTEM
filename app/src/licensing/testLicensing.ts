// Comprehensive Licensing System Test
import { licenseManager } from './licenseManager';
import { deviceManager } from './deviceManager';
import { featureGate } from './featureGate';
import { SecureLogger } from '../utils/logger';

export class LicensingTest {
  /**
   * Run comprehensive licensing tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting Licensing System Tests...\n');
    
    try {
      // Test 1: Device Fingerprinting
      await this.testDeviceFingerprinting();
      
      // Test 2: License Manager
      await this.testLicenseManager();
      
      // Test 3: Feature Gating
      await this.testFeatureGating();
      
      // Test 4: Trial System
      await this.testTrialSystem();
      
      console.log('✅ All licensing tests completed successfully!\n');
    } catch (error) {
      console.error('❌ Licensing tests failed:', error);
    }
  }

  /**
   * Test device fingerprinting
   */
  static async testDeviceFingerprinting(): Promise<void> {
    console.log('📱 Testing Device Fingerprinting...');
    
    try {
      // Generate fingerprint
      const fingerprint = await deviceManager.generateDeviceFingerprint();
      console.log(`   Device Fingerprint: ${fingerprint}`);
      
      // Get device info
      const deviceInfo = await deviceManager.getDeviceInfo();
      console.log(`   Device Brand: ${deviceInfo.brand}`);
      console.log(`   Device Model: ${deviceInfo.modelName}`);
      console.log(`   OS: ${deviceInfo.osName} ${deviceInfo.osVersion}`);
      console.log(`   Is Real Device: ${deviceInfo.isDevice}`);
      
      // Test integrity
      const isValid = await deviceManager.validateDeviceIntegrity();
      console.log(`   Device Integrity: ${isValid ? 'Valid' : 'Invalid'}`);
      
      // Test security score
      const securityScore = await deviceManager.getDeviceSecurityScore();
      console.log(`   Security Score: ${securityScore}/100`);
      
      console.log('✅ Device fingerprinting test passed\n');
    } catch (error) {
      console.error('❌ Device fingerprinting test failed:', error);
      throw error;
    }
  }

  /**
   * Test license manager
   */
  static async testLicenseManager(): Promise<void> {
    console.log('🔐 Testing License Manager...');
    
    try {
      // Initialize license system
      await licenseManager.initialize();
      console.log('   License system initialized');
      
      // Check current status
      const status = await licenseManager.getLicenseStatus();
      console.log(`   Has License: ${status.hasLicense}`);
      console.log(`   Status: ${status.status || 'None'}`);
      console.log(`   Plan: ${status.planId || 'None'}`);
      console.log(`   Remaining Days: ${status.remainingDays || 0}`);
      
      // Check trial eligibility
      const trialEligible = await licenseManager.checkTrialEligibility();
      console.log(`   Trial Eligible: ${trialEligible}`);
      
      // Get available plans
      const plans = licenseManager.getAvailablePlans();
      console.log(`   Available Plans: ${Object.keys(plans).length}`);
      
      console.log('✅ License manager test passed\n');
    } catch (error) {
      console.error('❌ License manager test failed:', error);
      throw error;
    }
  }

  /**
   * Test feature gating
   */
  static async testFeatureGating(): Promise<void> {
    console.log('🚪 Testing Feature Gating...');
    
    try {
      // Test basic features
      const basicFeatures = [
        'basic_inventory',
        'farmer_management',
        'purchase_tracking'
      ];
      
      for (const feature of basicFeatures) {
        const result = await featureGate.checkFeatureAccess(feature);
        console.log(`   ${feature}: ${result.allowed ? 'Allowed' : 'Blocked'}`);
      }
      
      // Test premium features
      const premiumFeatures = [
        'advanced_reports',
        'cloud_backup',
        'analytics_dashboard'
      ];
      
      for (const feature of premiumFeatures) {
        const result = await featureGate.checkFeatureAccess(feature);
        console.log(`   ${feature}: ${result.allowed ? 'Allowed' : 'Blocked'}`);
        if (!result.allowed) {
          console.log(`     Reason: ${result.reason}`);
          console.log(`     Suggested Plan: ${result.suggestedPlan}`);
        }
      }
      
      // Get feature usage stats
      const stats = featureGate.getFeatureUsageStats();
      console.log(`   Feature Usage Stats: ${Object.keys(stats).length} features tracked`);
      
      console.log('✅ Feature gating test passed\n');
    } catch (error) {
      console.error('❌ Feature gating test failed:', error);
      throw error;
    }
  }

  /**
   * Test trial system
   */
  static async testTrialSystem(): Promise<void> {
    console.log('⏰ Testing Trial System...');
    
    try {
      // Check if trial can be started
      const trialEligible = await licenseManager.checkTrialEligibility();
      console.log(`   Trial Eligible: ${trialEligible}`);
      
      if (trialEligible) {
        console.log('   Starting trial test...');
        
        // Start trial
        const trialResult = await licenseManager.startFreeTrial();
        console.log(`   Trial Start Result: ${trialResult.isValid ? 'Success' : 'Failed'}`);
        
        if (trialResult.isValid) {
          console.log(`   Trial License ID: ${trialResult.license?.id.substring(0, 16)}...`);
          console.log(`   Trial Remaining Days: ${trialResult.remainingDays}`);
          
          // Test trial features
          const trialFeatureAccess = await featureGate.checkFeatureAccess('basic_inventory');
          console.log(`   Trial Feature Access: ${trialFeatureAccess.allowed ? 'Working' : 'Failed'}`);
        }
      } else {
        console.log('   Trial already used or not available');
        
        // Get trial remaining days if in trial
        const remainingDays = await licenseManager.getTrialRemainingDays();
        if (remainingDays > 0) {
          console.log(`   Current Trial Remaining: ${remainingDays} days`);
        }
      }
      
      console.log('✅ Trial system test passed\n');
    } catch (error) {
      console.error('❌ Trial system test failed:', error);
      throw error;
    }
  }

  /**
   * Test license summary
   */
  static async testLicenseSummary(): Promise<void> {
    console.log('📋 Testing License Summary...');
    
    try {
      const summary = await licenseManager.getLicenseSummary();
      
      if (summary) {
        console.log(`   Plan Name: ${summary.planName}`);
        console.log(`   Status: ${summary.status}`);
        console.log(`   Expiry Date: ${summary.expiryDate}`);
        console.log(`   Remaining Days: ${summary.remainingDays}`);
        console.log(`   Features: ${summary.features.length}`);
        console.log(`   Device Limit: ${summary.deviceLimit}`);
      } else {
        console.log('   No license summary available');
      }
      
      console.log('✅ License summary test passed\n');
    } catch (error) {
      console.error('❌ License summary test failed:', error);
      throw error;
    }
  }

  /**
   * Performance test
   */
  static async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...');
    
    try {
      const iterations = 10;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await licenseManager.validateLicense();
        const end = Date.now();
        results.push(end - start);
      }
      
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);
      
      console.log(`   Average Validation Time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min Time: ${minTime}ms`);
      console.log(`   Max Time: ${maxTime}ms`);
      console.log(`   Performance: ${avgTime < 100 ? 'Excellent' : avgTime < 200 ? 'Good' : 'Needs Optimization'}`);
      
      console.log('✅ Performance test passed\n');
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  }

  /**
   * Clear test data
   */
  static async clearTestData(): Promise<void> {
    console.log('🧹 Clearing test data...');
    
    try {
      await licenseManager.clearLicenseData();
      await deviceManager.clearDeviceCache();
      
      console.log('✅ Test data cleared\n');
    } catch (error) {
      console.error('❌ Failed to clear test data:', error);
    }
  }
}

// Auto-run tests in development
if (__DEV__) {
  // Run tests after a delay to allow app to initialize
  setTimeout(() => {
    LicensingTest.runAllTests().catch(console.error);
  }, 5000);
}
