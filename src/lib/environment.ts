// Environment detection - Production Ready (Optimized for performance)
export const getEnvironment = (): 'production' | 'staging' | 'development' => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development check (localhost only)
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        port === '5173' || 
        port === '3000') {
      return 'development';
    }
  }
  
  // Everything else is production (includes Figma Make for performance)
  return 'production';
};

export const ENVIRONMENT = getEnvironment();
export const IS_PRODUCTION = ENVIRONMENT === 'production';
export const IS_STAGING = ENVIRONMENT === 'staging';
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';

// Production-optimized logging
export const createLogger = (environment: string) => {
  if (environment === 'production') {
    return {
      log: () => {},
      warn: () => {},
      error: console.error,
      info: () => {},
      debug: () => {}
    };
  } else if (environment === 'staging') {
    return {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: () => {}
    };
  } else {
    return console; // Full logging in development
  }
};

export const logger = createLogger(ENVIRONMENT);
