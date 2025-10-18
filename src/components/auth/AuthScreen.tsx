import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { PasswordResetScreen } from './PasswordResetScreen';

type AuthMode = 'login' | 'register' | 'reset';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');

  const renderAuthComponent = () => {
    switch (mode) {
      case 'register':
        return <RegisterScreen onSwitchToLogin={() => setMode('login')} />;
      case 'reset':
        return <PasswordResetScreen onSwitchToLogin={() => setMode('login')} />;
      default:
        return (
          <LoginScreen
            onSwitchToRegister={() => setMode('register')}
            onSwitchToReset={() => setMode('reset')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderAuthComponent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}