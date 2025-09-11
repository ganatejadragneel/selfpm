/**
 * withAuth HOC - Authentication wrapper for protected components
 * Ensures user is authenticated before rendering component
 */

import React, { useEffect } from 'react';
import type { ComponentType } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { PageLoader } from '../LoadingStates';

export interface WithAuthProps {
  user: NonNullable<any>; // Simplified for now
}

export function withAuth<P extends WithAuthProps>(
  Component: ComponentType<P>,
  options: {
    redirectTo?: string;
    loadingComponent?: React.ReactNode;
  } = {}
) {
  const { redirectTo = '/login', loadingComponent = <PageLoader message="Authenticating..." /> } = options;
  
  return function AuthenticatedComponent(props: Omit<P, keyof WithAuthProps>) {
    // const navigate = useNavigate();
    const { user, loading, checkAuth } = useSupabaseAuthStore();
    
    useEffect(() => {
      checkAuth();
    }, [checkAuth]);
    
    useEffect(() => {
      if (!loading && !user) {
        // navigate(redirectTo);
        window.location.href = redirectTo;
      }
    }, [loading, user, redirectTo]);
    
    if (loading) {
      return <>{loadingComponent}</>;
    }
    
    if (!user) {
      return null;
    }
    
    return <Component {...(props as P)} user={user} />;
  };
}