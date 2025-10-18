import { useState, useEffect, useCallback } from 'react';

// URL routing helper functions
const getPathFromUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};

const getUserIdFromPath = (path: string): string | null => {
  // Remove leading slash and check if it's a user_id
  const trimmedPath = path.replace(/^\//, '');
  
  // If it's empty or contains slashes, it's not a user_id
  if (!trimmedPath || trimmedPath.includes('/')) {
    return null;
  }
  
  // Return the user_id if it looks valid
  return trimmedPath;
};

const updateUrl = (path: string): void => {
  if (typeof window !== 'undefined') {
    const newUrl = path === '/' ? '/' : `/${path}`;
    window.history.pushState({}, '', newUrl);
  }
};

// Hook for URL-based user profile routing
export const useProfileRouting = () => {
  const [urlUserId, setUrlUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const handleLocationChange = () => {
      const path = getPathFromUrl();
      const userId = getUserIdFromPath(path);
      setUrlUserId(userId);
    };
    
    // Initial check
    handleLocationChange();
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  const navigateToProfile = useCallback((userId: string) => {
    updateUrl(userId);
    setUrlUserId(userId);
  }, []);
  
  const navigateToHome = useCallback(() => {
    updateUrl('/');
    setUrlUserId(null);
  }, []);
  
  return {
    urlUserId,
    navigateToProfile,
    navigateToHome
  };
};