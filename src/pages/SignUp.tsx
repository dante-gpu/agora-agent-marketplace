import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/Button';
import Input from '../components/Input';
import GoogleButton from '../components/GoogleButton';

function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, loading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate username
    if (username.length < 3) {
      setFormError('Username must be at least 3 characters long');
      return;
    }
    if (username.length > 30) {
      setFormError('Username must be less than 30 characters');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      setFormError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    // Validate password
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await signUp(email, password, username);
      navigate('/');
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setFormError('');
      await signInWithGoogle();
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>
        <div className="bg-gray-900 rounded-xl p-8">
          {(formError || error) && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{formError || error}</p>
            </div>
          )}

          <div className="space-y-4">
            <GoogleButton
              onClick={handleGoogleSignIn}
              loading={loading}
            >
              Continue with Google
            </GoogleButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              icon={<User className="w-5 h-5" />}
              placeholder="Choose a username"
              required
              pattern="[a-z0-9_-]+"
              title="Username can only contain letters, numbers, underscores, and hyphens"
              maxLength={30}
            />
            <p className="mt-1 text-sm text-gray-400">
              Only letters, numbers, underscores, and hyphens allowed
            </p>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                placeholder="Create a password"
                required
                minLength={6}
              />
              <p className="mt-1 text-sm text-gray-400">
                Must be at least 6 characters
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#e1ffa6] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;