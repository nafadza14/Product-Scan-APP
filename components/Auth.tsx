import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import Card from './Card';
import { ShieldCheck, AlertCircle, Mail, Lock, User, Eye, EyeOff, X } from 'lucide-react';

interface AuthProps {
    onCancel?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onCancel }) => {
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
      } else {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#6FAE9A]/20 rounded-full blur-[80px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#4D8C7A]/20 rounded-full blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Close Button */}
      {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 z-20 p-2 bg-white/40 backdrop-blur-md rounded-full text-gray-600 hover:bg-white/60 transition-colors"
          >
              <X size={24} />
          </button>
      )}

      {/* Main Content */}
      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#6FAE9A]/30 rounded-full blur-xl animate-pulse-soft"></div>
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#6FAE9A] to-[#4D8C7A] flex items-center justify-center shadow-2xl relative z-10 text-white transform rotate-3">
                    <ShieldCheck size={48} />
                </div>
            </div>
            
            <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2 text-center tracking-tight">
                VitalSense
            </h1>
            <p className="text-gray-500 text-center text-sm font-medium">
                {isSignUp 
                ? "Your personalized health companion." 
                : "Welcome back to your safe space."}
            </p>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-semibold text-red-600 leading-snug">{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {isSignUp && (
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6FAE9A]" size={20} />
                    <input 
                    type="text" 
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FAE9A]/50 transition-all font-medium placeholder:text-gray-400"
                    required={isSignUp}
                    />
                </div>
                )}

                <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6FAE9A]" size={20} />
                <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FAE9A]/50 transition-all font-medium placeholder:text-gray-400"
                    required
                />
                </div>

                <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6FAE9A]" size={20} />
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-12 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FAE9A]/50 transition-all font-medium placeholder:text-gray-400"
                    required
                    minLength={6}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6FAE9A] transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                </div>

                <div className="pt-4">
                <Button 
                    type="submit" 
                    fullWidth 
                    disabled={loading}
                    className="shadow-xl shadow-[#6FAE9A]/20"
                >
                    {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                </Button>
                </div>
            </form>
        </Card>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
                onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                }} 
                className="text-[#6FAE9A] font-bold ml-1 hover:text-[#5D9A88] transition-colors"
            >
                {isSignUp ? "Sign In" : "Sign Up"}
            </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;