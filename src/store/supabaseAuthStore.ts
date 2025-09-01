import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SupabaseAuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  failedAttempts: number;
  showEmailVerification: boolean;
  verificationEmail: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  
  // Migration support
  isMigratedUser: () => boolean;
  completePasswordReset: () => void;
  ensureUserInMappingTable: (user: User) => Promise<void>;
  
  // Validation helpers
  checkUsernameExists: (username: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
  resetFailedAttempts: () => void;
  showEmailVerificationModal: (email: string) => void;
  hideEmailVerificationModal: () => void;
}

// Initialize auth state listener
let authInitialized = false;

// Track users being processed to prevent duplicates
const usersBeingProcessed = new Set<string>();

export const useSupabaseAuthStore = create<SupabaseAuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  failedAttempts: 0,
  showEmailVerification: false,
  verificationEmail: null,

  signIn: async (emailOrUsername: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      let actualEmail = emailOrUsername;
      
      // Check if input is email or username
      const isEmail = emailOrUsername.includes('@');
      
      if (!isEmail) {
        // For username login, we need to map username to email
        // Check both migration table (for migrated users) and auth metadata (for new users)
        
        
        // Try to find username in mapping table (for both migrated and new users)
        let userData = null;
        let lookupError = null;
        
        // Try with both migration statuses
        try {
          const { data, error } = await supabase
            .from('user_migration_mapping')
            .select('email')
            .eq('username', emailOrUsername.trim())
            .in('migration_status', ['migrated', 'new_user'])
            .single();
          
          userData = data;
          lookupError = error;
        } catch (error) {
          console.error('Username lookup exception:', error);
          lookupError = error;
        }
        
        
        // If the lookup failed, try without the migration_status filter as a fallback
        if (lookupError && !userData) {
          try {
            const { data, error } = await supabase
              .from('user_migration_mapping')
              .select('email')
              .eq('username', emailOrUsername.trim())
              .single();
            
            userData = data;
            lookupError = error;
          } catch (error) {
            console.error('Fallback username lookup also failed:', error);
          }
        }
        
        if (lookupError || !userData) {
          console.error('All username lookup attempts failed:', lookupError);
          throw new Error('Invalid email/username or password');
        }
        
        actualEmail = userData.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password
      });

      if (error) {
        // Increment failed attempts counter
        const currentAttempts = get().failedAttempts + 1;
        set({ failedAttempts: currentAttempts });

        // Check if it's a migrated user who needs to reset password
        if (error.message?.includes('Invalid login credentials')) {
          if (currentAttempts >= 3) {
            set({ 
              loading: false, 
              error: 'Too many failed attempts. Password reset email sent. Please check your email for reset instructions.',
              user: null,
              isAuthenticated: false 
            });
            // Send password reset after 3 failed attempts
            await get().resetPassword(actualEmail);
            return;
          } else {
            set({ 
              loading: false, 
              error: `Invalid credentials. ${3 - currentAttempts} attempt(s) remaining before password reset.`,
              user: null,
              isAuthenticated: false 
            });
            return;
          }
        }
        throw error;
      }

      set({ 
        user: data.user, 
        loading: false, 
        error: null,
        isAuthenticated: true,
        failedAttempts: 0 // Reset failed attempts on successful login
      });
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.message || 'Sign in failed',
        user: null,
        isAuthenticated: false 
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    set({ loading: true, error: null });
    
    try {
      // Check for existing username and email BEFORE creating the account
      
      const [usernameExists, emailExists] = await Promise.all([
        get().checkUsernameExists(username),
        get().checkEmailExists(email)
      ]);
      
      if (usernameExists) {
        throw new Error('Username is already taken. Please choose a different username.');
      }
      
      if (emailExists) {
        throw new Error('An account with this email already exists. Please use a different email or try signing in.');
      }
      
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            created_via: 'signup_form'
          }
        }
      });

      if (error) throw error;

      // Note: User will be added to mapping table in the auth state change listener
      // after they are fully authenticated (see ensureUserInMappingTable method)

      if (data.user && !data.user.email_confirmed_at) {
        set({ 
          loading: false, 
          error: null,
          user: null,
          isAuthenticated: false 
        });
        // User needs to confirm email - show verification modal
        get().showEmailVerificationModal(email);
        return;
      }

      set({ 
        user: data.user, 
        loading: false, 
        error: null,
        isAuthenticated: !!data.user 
      });
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.message || 'Sign up failed',
        user: null,
        isAuthenticated: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null, 
        loading: false, 
        error: null,
        isAuthenticated: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Sign out failed' });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      // Validate that input is an email (contains @)
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Always use production URL for password reset emails
      // This ensures reset links work regardless of where the request originates
      const redirectUrl = `https://selfpm.vercel.app?type=recovery`;
        
      console.log('Password reset redirect URL:', redirectUrl);
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message || 'Password reset failed' });
      throw error;
    }
  },

  updatePassword: async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message || 'Password update failed' });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  resetFailedAttempts: () => {
    set({ failedAttempts: 0 });
  },

  showEmailVerificationModal: (email: string) => {
    set({ showEmailVerification: true, verificationEmail: email });
  },

  hideEmailVerificationModal: () => {
    set({ showEmailVerification: false, verificationEmail: null });
  },

  checkAuth: async () => {
    if (!authInitialized) {
      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a password recovery session
          const urlParams = new URLSearchParams(window.location.search);
          const isPasswordRecovery = urlParams.get('type') === 'recovery';
          
          if (isPasswordRecovery) {
            // Don't mark as fully authenticated for password recovery
            set({ 
              user: session.user, 
              loading: false, 
              isAuthenticated: false, // Keep false to show auth page with reset form
              error: null 
            });
          } else {
            // Check if this is a newly registered user who needs to be added to mapping table (non-blocking)
            get().ensureUserInMappingTable(session.user).catch(error => {
              console.error('ensureUserInMappingTable failed but continuing auth flow:', error);
            });
            
            set({ 
              user: session.user, 
              loading: false, 
              isAuthenticated: true,
              error: null 
            });
          }
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            loading: false, 
            isAuthenticated: false,
            error: null 
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Only set authenticated if not in password recovery mode
          const urlParams = new URLSearchParams(window.location.search);
          const isPasswordRecovery = urlParams.get('type') === 'recovery';
          
          set({ 
            user: session.user,
            isAuthenticated: !isPasswordRecovery 
          });
        } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
          // Explicitly handle password recovery event
          set({ 
            user: session.user, 
            loading: false, 
            isAuthenticated: false, // Keep false to show reset form
            error: null 
          });
        }
      });
      authInitialized = true;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        // Check if we're in password recovery mode
        const urlParams = new URLSearchParams(window.location.search);
        const isPasswordRecovery = urlParams.get('type') === 'recovery';
        
        if (!isPasswordRecovery) {
          // Ensure user is in mapping table for username login (non-blocking)
          get().ensureUserInMappingTable(session.user).catch(error => {
            console.error('ensureUserInMappingTable failed but continuing auth flow:', error);
          });
        }
        
        set({ 
          user: session.user, 
          loading: false, 
          isAuthenticated: !isPasswordRecovery, // Don't authenticate if in password recovery
          error: null 
        });
      } else {
        set({ 
          user: null, 
          loading: false, 
          isAuthenticated: false,
          error: null 
        });
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      set({ 
        user: null, 
        loading: false, 
        isAuthenticated: false,
        error: null 
      });
    }
  },

  isMigratedUser: () => {
    const user = get().user;
    return !!(user?.user_metadata?.migrated_from_custom);
  },

  // Helper method to complete password reset flow
  completePasswordReset: () => {
    // Clear URL parameters and set user as authenticated
    window.history.replaceState({}, document.title, window.location.pathname);
    set({ isAuthenticated: true });
  },

  // Helper method to ensure user exists in mapping table (for username login support)
  ensureUserInMappingTable: async (user: User) => {
    // Prevent duplicate processing of the same user
    if (usersBeingProcessed.has(user.id)) {
      console.log('⚠️ User already being processed, skipping:', user.id);
      return;
    }

    usersBeingProcessed.add(user.id);
    
    try {
      console.log('=== STARTING ensureUserInMappingTable ===');
      console.log('User object:', {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at
      });
    
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ensureUserInMappingTable timeout after 5 seconds')), 5000);
    });

    try {
      await Promise.race([
        (async () => {
          
          // First, check if the user already exists in the mapping table
          const { data: existingUser, error: checkError } = await supabase
            .from('user_migration_mapping')
            .select('id, username, migration_status')
            .eq('new_auth_id', user.id)
            .single();


          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error checking user in mapping table:', {
              code: checkError.code,
              message: checkError.message,
              details: checkError.details,
              hint: checkError.hint
            });
            return;
          }

          if (existingUser) {
            return; // User already exists
          }

          
          // Get username from user metadata
          const username = user.user_metadata?.username;
          
          if (!username) {
            console.error('No username found in user metadata. Available metadata keys:', Object.keys(user.user_metadata || {}));
            console.error('Full user_metadata:', user.user_metadata);
            return;
          }


          let insertSuccess = false;

          // Try method 1: Database function (if available)
          try {
            const { data: funcResult, error: funcError } = await supabase
              .rpc('ensure_user_in_mapping_table', {
                p_new_auth_id: user.id,
                p_username: username,
                p_email: user.email || ''
              });


            if (!funcError && funcResult?.success) {
              insertSuccess = true;
            } else if (funcError?.code === '42883') {
              // Function doesn't exist, try fallback
            } else {
              console.error('Database function failed:', funcError);
            }
          } catch (error) {
          }

          // Try method 2: Direct table insert (fallback)
          if (!insertSuccess) {
            try {
              const { error: insertError } = await supabase
                .from('user_migration_mapping')
                .insert({
                  old_user_id: '2e94c75d-a980-4d8a-98c0-74a5d89e44be', // Use existing user ID as placeholder for new users (foreign key constraint)
                  new_auth_id: user.id,
                  username: username,
                  email: user.email || '',
                  migration_status: 'new_user',
                  migrated_at: new Date().toISOString(),
                  rollback_data: null
                })
                .select();


              if (!insertError) {
                insertSuccess = true;
              } else {
                console.error('Direct insert failed:', {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                });
                
                // Handle unique constraint violations
                if (insertError.code === '23505') { // PostgreSQL unique violation error code
                  if (insertError.message?.includes('unique_username')) {
                    console.error('Database constraint violation: Username already exists');
                  } else if (insertError.message?.includes('unique_email')) {
                    console.error('Database constraint violation: Email already exists');
                  } else {
                    console.error('Database constraint violation: Duplicate data detected');
                  }
                }
              }
            } catch (error) {
              console.error('Direct insert approach failed:', error);
            }
          }

          // Final verification - check if the user now exists in mapping table
          if (insertSuccess) {
            try {
              const { data: verifyUsers, error: verifyError } = await supabase
                .from('user_migration_mapping')
                .select('username, migration_status')
                .eq('new_auth_id', user.id);
              
              if (!verifyError && verifyUsers && verifyUsers.length > 0) {
                if (verifyUsers.length > 1) {
                  console.warn('⚠️ Multiple mappings found for user, but login will still work:', verifyUsers.length);
                }
              } else {
                console.error('❌ VERIFICATION FAILED: User not found after insert', verifyError);
                insertSuccess = false;
              }
            } catch (error) {
              console.error('Verification check failed:', error);
            }
          }

          if (!insertSuccess) {
            console.error('❌ All methods failed to insert user mapping. This will affect username login.');
            console.error('Manual SQL (run this in Supabase SQL editor):');
            console.error(`INSERT INTO user_migration_mapping (old_user_id, new_auth_id, username, email, migration_status, migrated_at, rollback_data) VALUES ('2e94c75d-a980-4d8a-98c0-74a5d89e44be', '${user.id}', '${username}', '${user.email}', 'new_user', NOW(), NULL);`);
          }
        })(),
        timeout
      ]);
    } catch (error) {
      console.error('Error in ensureUserInMappingTable (outer catch):', error);
      // Don't re-throw the error to prevent blocking auth flow
    }
    
    } finally {
      // Always remove the user from processing set when done
      usersBeingProcessed.delete(user.id);
    }
  },

  // Check if username already exists in the system
  checkUsernameExists: async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_migration_mapping')
        .select('id')
        .eq('username', username.trim())
        .limit(1);

      if (error) {
        console.error('Error checking username:', error);
        return false; // On error, allow the attempt (better UX than blocking)
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Exception checking username:', error);
      return false;
    }
  },

  // Check if email already exists in the system
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_migration_mapping')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .limit(1);

      if (error) {
        console.error('Error checking email:', error);
        return false; // On error, allow the attempt (better UX than blocking)
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Exception checking email:', error);
      return false;
    }
  }
}));