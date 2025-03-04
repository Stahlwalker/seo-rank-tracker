import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [view, setView] = useState<'signIn' | 'signUp'>('signIn');

  const toggleView = () => {
    setView(view === 'signIn' ? 'signUp' : 'signIn');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {view === 'signIn' ? (
          <SignIn onToggleView={toggleView} />
        ) : (
          <SignUp onToggleView={toggleView} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;