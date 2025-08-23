import { supabase } from './supabase';

// Helper function to set user context for RLS policies
export const setUserContext = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('set_current_user_id', {
      user_uuid: userId
    });
    
    if (error) {
      console.error('Failed to set user context:', error);
    }
  } catch (error) {
    console.error('Error setting user context:', error);
  }
};

// Helper function to create a Supabase client with user context
export const createUserAwareSupabaseClient = (userId: string) => {
  // Set user context before any operations
  setUserContext(userId);
  return supabase;
};