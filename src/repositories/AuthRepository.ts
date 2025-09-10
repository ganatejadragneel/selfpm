/**
 * AuthRepository - Specialized repository for Authentication operations
 * Following SRP: Single responsibility for auth data access
 */

import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User | null;
  error: Error | null;
}

export interface ProfileResult {
  profile: UserProfile | null;
  error: Error | null;
}

export class AuthRepository {
  private client = supabase;

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile in mapping table
      if (data.user) {
        await this.createUserProfile(data.user);
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResult> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      
      if (error) throw error;

      return {
        user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) throw error;

      return {
        session,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  }

  /**
   * Create user profile in mapping table
   */
  private async createUserProfile(user: User): Promise<ProfileResult> {
    try {
      // Check if profile already exists
      const { data: existing } = await this.client
        .from('user_email_mapping')
        .select('*')
        .eq('new_user_id', user.id)
        .single();

      if (existing) {
        return {
          profile: this.mapToUserProfile(existing),
          error: null,
        };
      }

      // Create new profile
      const { data, error } = await this.client
        .from('user_email_mapping')
        .insert({
          new_user_id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        profile: this.mapToUserProfile(data),
        error: null,
      };
    } catch (error) {
      return {
        profile: null,
        error: error as Error,
      };
    }
  }

  /**
   * Get user profile from mapping table
   */
  async getUserProfile(userId: string): Promise<ProfileResult> {
    try {
      const { data, error } = await this.client
        .from('user_email_mapping')
        .select('*')
        .eq('new_user_id', userId)
        .single();

      if (error) throw error;

      return {
        profile: this.mapToUserProfile(data),
        error: null,
      };
    } catch (error) {
      return {
        profile: null,
        error: error as Error,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<ProfileResult> {
    try {
      const { data, error } = await this.client
        .from('user_email_mapping')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('new_user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        profile: this.mapToUserProfile(data),
        error: null,
      };
    } catch (error) {
      return {
        profile: null,
        error: error as Error,
      };
    }
  }

  /**
   * Check if user exists by email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const { data } = await this.client
        .from('user_email_mapping')
        .select('id')
        .eq('email', email)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, token: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }

  /**
   * Map database record to UserProfile
   */
  private mapToUserProfile(data: any): UserProfile {
    if (!data) return data;

    return {
      id: data.new_user_id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
    };
  }
}