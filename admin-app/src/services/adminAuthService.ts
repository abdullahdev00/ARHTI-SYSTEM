import { supabase } from '../config/supabase';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'moderator';
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminLoginResponse {
  admin_user: AdminUser;
  session_token: string;
  expires_at: string;
}

export class AdminAuthService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static currentSessionToken: string | null = null;
  private static currentAdminUser: AdminUser | null = null;

  // Generate session token (React Native compatible)
  private static generateSessionToken(): string {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = Date.now().toString(36);
    return `admin_${randomPart}_${timePart}`;
  }

  // Hash password (simple for development)
  private static async hashPassword(password: string): Promise<string> {
    console.warn('Using simple password hashing - NOT secure for production');
    return 'hashed_' + password;
  }

  // Verify password
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.warn('Using simple password verification - NOT secure for production');
    return hash === 'hashed_' + password;
  }

  // Admin login
  static async login(credentials: AdminLoginCredentials): Promise<AdminLoginResponse> {
    try {
      const { data: adminUser, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single();

      if (userError || !adminUser) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await this.verifyPassword(credentials.password, adminUser.password_hash);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .insert([{
          admin_user_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: null,
          user_agent: 'React Native App',
        }])
        .select()
        .single();

      if (sessionError) {
        throw new Error('Failed to create session');
      }

      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      this.currentSessionToken = sessionToken;
      this.currentAdminUser = adminUser as AdminUser;

      return {
        admin_user: adminUser as AdminUser,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      };
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  // Admin logout
  static async logout(): Promise<void> {
    try {
      const sessionToken = this.currentSessionToken;
      
      if (sessionToken) {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }

      this.currentSessionToken = null;
      this.currentAdminUser = null;
    } catch (error) {
      console.error('Admin logout error:', error);
      this.currentSessionToken = null;
      this.currentAdminUser = null;
    }
  }

  // Get current admin
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      if (this.currentAdminUser && this.currentSessionToken) {
        return this.currentAdminUser;
      }
      
      const sessionToken = this.currentSessionToken;
      
      if (!sessionToken) {
        return null;
      }

      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_user:admin_users(*)
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        this.currentSessionToken = null;
        this.currentAdminUser = null;
        return null;
      }

      return session.admin_user as AdminUser;
    } catch (error) {
      console.error('Get current admin error:', error);
      return null;
    }
  }

  // Check authentication
  static async isAuthenticated(): Promise<boolean> {
    const admin = await this.getCurrentAdmin();
    return admin !== null;
  }

  // Create admin user (signup)
  static async createAdminUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'moderator';
    permissions?: Record<string, boolean>;
  }): Promise<AdminUser> {
    try {
      const passwordHash = await this.hashPassword(userData.password);

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .insert([{
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role: userData.role,
          permissions: userData.permissions || this.getDefaultPermissions(userData.role),
          created_by: null,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }

      return adminUser as AdminUser;
    } catch (error) {
      console.error('Create admin user error:', error);
      throw error;
    }
  }

  // Check permissions
  static hasPermission(admin: AdminUser, permission: string): boolean {
    if (admin.role === 'super_admin') {
      return true;
    }
    return admin.permissions[permission] === true;
  }

  // Get default permissions
  static getDefaultPermissions(role: 'admin' | 'moderator' | 'super_admin'): Record<string, boolean> {
    switch (role) {
      case 'super_admin':
        return {
          manage_users: true,
          manage_payments: true,
          manage_plans: true,
          view_analytics: true,
          manage_admins: true,
        };
      case 'admin':
        return {
          manage_payments: true,
          verify_payments: true,
          reject_payments: true,
          view_users: true,
          view_analytics: true,
        };
      case 'moderator':
        return {
          verify_payments: true,
          view_users: true,
        };
      default:
        return {};
    }
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    try {
      await supabase
        .from('admin_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Clean expired sessions error:', error);
    }
  }
}
