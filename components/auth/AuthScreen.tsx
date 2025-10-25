import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { PasswordResetScreen } from './PasswordResetScreen';

type AuthView = 'login' | 'register' | 'reset';

export const AuthScreen: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div>
      {view === 'login' && (
        <LoginScreen
          onSwitchToRegister={() => setView('register')}
          onSwitchToReset={() => setView('reset')}
        />
      )}
      {view === 'register' && (
        <RegisterScreen onSwitchToLogin={() => setView('login')} />
      )}
      {view === 'reset' && (
        <PasswordResetScreen onSwitchToLogin={() => setView('login')} />
      )}
    </div>
  );
};
