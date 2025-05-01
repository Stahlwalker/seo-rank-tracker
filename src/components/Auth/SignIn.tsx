import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { LineChart } from 'lucide-react';

interface SignInFormValues {
  email?: string;
  password: string;
}

interface SignInProps {
  onSuccess?: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, error: authError } = useAuth();
  const [mode, setMode] = useState<'admin' | 'viewer'>('admin');

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const success = await login(
        mode === 'admin' ? data.email || null : null,
        data.password
      );
      if (success) {
        if (onSuccess) onSuccess();
      } else if (authError) {
        setError(authError);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 rounded-lg shadow-md p-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Sign In</h2>

        <div className="flex mb-6 gap-2">
          <button
            className={`flex-1 px-4 py-2 rounded-md border ${mode === 'admin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
            onClick={() => setMode('admin')}
            type="button"
          >
            Admin
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-md border ${mode === 'viewer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
            onClick={() => setMode('viewer')}
            type="button"
          >
            Viewer
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/80 border-l-4 border-red-500 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {mode === 'admin' && (
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`w-full px-3 py-2 border rounded-md bg-gray-800 text-gray-100 placeholder-gray-500 ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                {...register('email', {
                  required: mode === 'admin' ? 'Email is required' : false,
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                disabled={mode !== 'admin'}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`w-full px-3 py-2 border rounded-md bg-gray-800 text-gray-100 placeholder-gray-500 ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;