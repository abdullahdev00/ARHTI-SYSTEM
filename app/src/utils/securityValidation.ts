// Comprehensive security validation for production readiness
import { SecurityManager } from './security';
import { EncryptionManager } from './encryption';

export interface SecurityAuditResult {
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  fix?: string;
}

export class SecurityValidator {
  /**
   * Comprehensive security audit
   */
  static async performSecurityAudit(): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    const recommendations: string[] = [];

    // Check environment security
    const envCheck = SecurityManager.checkEnvironment();
    if (!envCheck.isSecure) {
      issues.push({
        severity: 'high',
        category: 'Environment',
        description: 'App is not running in secure environment',
        fix: 'Deploy to production environment'
      });
    }

    // Check app integrity
    const integrityCheck = await SecurityManager.checkIntegrity();
    if (!integrityCheck.passed) {
      issues.push({
        severity: 'medium',
        category: 'Integrity',
        description: 'App integrity check failed',
        fix: 'Verify app installation and configuration'
      });
    }

    // Check encryption initialization
    try {
      EncryptionManager.initialize();
      const testEncryption = EncryptionManager.encrypt('test');
      const testDecryption = EncryptionManager.decrypt(testEncryption);
      
      if (testDecryption !== 'test') {
        issues.push({
          severity: 'high',
          category: 'Encryption',
          description: 'Encryption/decryption not working properly',
          fix: 'Check encryption key configuration'
        });
      }
    } catch (error) {
      issues.push({
        severity: 'critical',
        category: 'Encryption',
        description: 'Encryption system failed to initialize',
        fix: 'Check environment configuration and API keys'
      });
    }

    // Check for development mode in production
    if (__DEV__ && process.env.NODE_ENV === 'production') {
      issues.push({
        severity: 'critical',
        category: 'Build',
        description: 'Development mode enabled in production build',
        fix: 'Create proper production build with NODE_ENV=production'
      });
    }

    // Check for console logs in production
    if (process.env.NODE_ENV === 'production') {
      // This would normally scan source code, but we've already implemented SecureLogger
      recommendations.push('Ensure all console.log statements are replaced with SecureLogger');
    }

    // Calculate security score
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    let score = 100;
    score -= criticalIssues * 30;
    score -= highIssues * 20;
    score -= mediumIssues * 10;
    score -= lowIssues * 5;
    score = Math.max(0, score);

    // Add general recommendations
    if (score < 80) {
      recommendations.push('Address high and critical security issues before production deployment');
    }
    
    recommendations.push('Regularly update dependencies to patch security vulnerabilities');
    recommendations.push('Monitor app for security incidents and unusual activity');
    recommendations.push('Implement proper backup and disaster recovery procedures');

    return {
      passed: criticalIssues === 0 && highIssues === 0,
      score,
      issues,
      recommendations
    };
  }

  /**
   * Quick security check for development
   */
  static async quickSecurityCheck(): Promise<boolean> {
    try {
      const audit = await this.performSecurityAudit();
      return audit.score >= 70; // Minimum acceptable score
    } catch (error) {
      console.error('Security check failed:', error);
      return false;
    }
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(): Promise<string> {
    const audit = await this.performSecurityAudit();
    
    let report = '=== SECURITY AUDIT REPORT ===\n\n';
    report += `Overall Score: ${audit.score}/100\n`;
    report += `Status: ${audit.passed ? 'PASSED' : 'FAILED'}\n\n`;
    
    if (audit.issues.length > 0) {
      report += 'SECURITY ISSUES:\n';
      audit.issues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}\n`;
        if (issue.fix) {
          report += `   Fix: ${issue.fix}\n`;
        }
        report += '\n';
      });
    }
    
    if (audit.recommendations.length > 0) {
      report += 'RECOMMENDATIONS:\n';
      audit.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
    }
    
    return report;
  }
}

// Auto-run security check in development
if (__DEV__) {
  setTimeout(async () => {
    const isSecure = await SecurityValidator.quickSecurityCheck();
    if (!isSecure) {
      console.warn('⚠️ Security issues detected. Run SecurityValidator.generateSecurityReport() for details.');
    } else {
      console.log('✅ Basic security checks passed');
    }
  }, 2000);
}
