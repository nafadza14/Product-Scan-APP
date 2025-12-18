import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import Card from './Card';
import { ShieldCheck, AlertCircle, Mail, Lock, User, Eye, EyeOff, X, HelpCircle } from 'lucide-react';

interface AuthProps {
    onCancel?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);

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
      setErrorMessage(error.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setErrorMessage("Gagal masuk dengan Google. Pastikan konfigurasi di Google Cloud Console sudah benar.");
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
                ? "Pendamping kesehatan pribadi Anda." 
                : "Selamat datang kembali di ruang aman Anda."}
            </p>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl">
                    <div className="flex items-start gap-3 mb-2">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-semibold text-red-600 leading-snug">{errorMessage}</p>
                    </div>
                    <button 
                        onClick={() => setShowOAuthHelp(!showOAuthHelp)}
                        className="text-[10px] font-bold text-red-700 underline flex items-center gap-1"
                    >
                        <HelpCircle size={10} /> Masalah 403 Forbidden?
                    </button>
                    
                    {showOAuthHelp && (
                        <div className="mt-3 p-3 bg-white/50 rounded-xl text-[10px] text-red-800 space-y-2 border border-red-200">
                            <p><strong>Penyebab:</strong> Proyek Google Anda mungkin masih dalam status "Testing".</p>
                            <p><strong>Solusi:</strong> Di Google Cloud Console &gt; OAuth Consent Screen, klik <strong>"Publish App"</strong> agar statusnya menjadi "In Production", atau tambahkan email Anda ke daftar <strong>"Test Users"</strong>.</p>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {isSignUp && (
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6FAE9A]" size={20} />
                    <input 
                    type="text" 
                    placeholder="Nama Lengkap"
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
                    placeholder="Alamat Email"
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
                    placeholder="Kata Sandi"
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

                <div className="pt-4 space-y-4">
                  <Button 
                      type="submit" 
                      fullWidth 
                      disabled={loading}
                      className="shadow-xl shadow-[#6FAE9A]/20"
                  >
                      {loading ? "Memproses..." : (isSignUp ? "Buat Akun" : "Masuk")}
                  </Button>

                  <div className="flex items-center gap-3 py-2">
                    <div className="h-[1px] flex-1 bg-gray-200"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atau</span>
                    <div className="h-[1px] flex-1 bg-gray-200"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>{loading ? "Menghubungkan..." : "Masuk dengan Google"}</span>
                  </button>
                </div>
            </form>
        </Card>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
            {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}
            <button 
                onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                }} 
                className="text-[#6FAE9A] font-bold ml-1 hover:text-[#5D9A88] transition-colors"
            >
                {isSignUp ? "Masuk" : "Daftar Sekarang"}
            </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;