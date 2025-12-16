import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import { ShieldCheck, AlertCircle, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) throw error;
        
        // If signup is successful but no session, it usually means email confirmation is required
        // However, we'll let the App.tsx listener handle the state change if auto-login happens.
        // If not, we might need to tell user to check email. 
        // For this MVP, we assume auto-confirm is off or user proceeds.
        
      } else {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Authentication Error:", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-[#6FAE9A] flex items-center justify-center shadow-lg mb-6 text-white">
        <ShieldCheck size={40} />
      </div>
      
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2 text-center">
        {isSignUp ? "Create Account" : "Welcome Back"}
      </h1>
      <p className="text-gray-500 mb-8 text-center max-w-xs text-sm">
        {isSignUp 
          ? "Start your personalized health journey today." 
          : "Sign in to access your scan history."}
      </p>
      
      {errorMessage && (
        <div className="w-full max-w-sm mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-600 leading-snug">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
        
        {isSignUp && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#6FAE9A] focus:ring-1 focus:ring-[#6FAE9A] transition-all"
              required={isSignUp}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="email" 
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#6FAE9A] focus:ring-1 focus:ring-[#6FAE9A] transition-all"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#6FAE9A] focus:ring-1 focus:ring-[#6FAE9A] transition-all"
            required
            minLength={6}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            fullWidth 
            disabled={loading}
          >
            {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }} 
            className="text-[#6FAE9A] font-bold ml-1 hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;