import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

class AuthService {
  // Hash password using bcrypt
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { username, email, password, confirmPassword } = credentials;

    // Validation
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    if (username.length < 2) {
      throw new Error('Username must be at least 2 characters long');
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`)
        .single();

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password_hash: passwordHash,
          }
        ])
        .select(`
          id,
          username,
          email,
          created_at,
          updated_at,
          last_login,
          is_active
        `)
        .single();

      if (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('User with this email or username already exists');
        }
        throw new Error('Registration failed. Please try again.');
      }

      // Convert snake_case to camelCase
      const userResponse: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
        isActive: user.is_active,
      };

      return {
        user: userResponse,
        message: 'Registration successful! You can now log in.',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email/Username and password are required');
    }

    try {
      // Check if input is email or username
      const isEmail = this.isValidEmail(email);
      const searchField = isEmail ? 'email' : 'username';
      const searchValue = isEmail ? email.toLowerCase().trim() : email.trim();

      // Find user by email or username
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          password_hash,
          created_at,
          updated_at,
          last_login,
          is_active
        `)
        .eq(searchField, searchValue)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw new Error('Invalid email/username or password');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email/username or password');
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update last login:', updateError);
      }

      // Convert snake_case to camelCase and exclude password_hash
      const userResponse: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: new Date().toISOString(), // Use current time as last login
        isActive: user.is_active,
      };

      return {
        user: userResponse,
        message: 'Login successful!',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          created_at,
          updated_at,
          last_login,
          is_active
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
        isActive: user.is_active,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  isStrongPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const authService = new AuthService();