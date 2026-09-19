import React, { useState } from 'react';
import {
  User,
  KeyRound,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  Store,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { profile, login, register, loginWithGoogle, isSyncing, isFirestoreConnected } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success && res.message) {
        setLoginError(res.message);
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Register Form States
  const [regUsername, setRegUsername] = useState('');
  const [regNamaMitra, setRegNamaMitra] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = login(loginUsername, loginPassword);
    if (!result.success) {
      setLoginError(result.message || 'Username atau password tidak sesuai.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok dengan password yang dibuat.');
      return;
    }

    const result = register({
      username: regUsername,
      namaMitra: regNamaMitra,
      whatsapp: regWhatsapp,
      password: regPassword,
    });

    if (result.success) {
      setRegSuccess(result.message);
      // Prefill login username and switch after a brief pause
      setLoginUsername(regUsername.trim().toLowerCase().replace(/^@/, ''));
      setLoginPassword('');
      setRegUsername('');
      setRegNamaMitra('');
      setRegWhatsapp('');
      setRegPassword('');
      setRegConfirmPassword('');
      setTimeout(() => {
        setActiveTab('login');
      }, 1500);
    } else {
      setRegError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-24"></div>
      </div>

      <div className="relative w-full max-w-md bg-[#141A28] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-600/30">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span>{profile.inisialLogo || 'GA'}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {profile.namaMitra || 'PEMBUKUAN MITRA'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Kasir, Kas Harian & Manajemen Tagihan Piutang
            </p>
          </div>
        </div>

        {/* Tab Switcher: Masuk vs Pendaftaran */}
        <div className="p-1 bg-[#0E1320] border border-slate-800 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </button>

          <button
            type="button"
            id="tab-register-btn"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pendaftaran Akun</span>
          </button>
        </div>

        {/* TAB 1: FORM LOGIN */}
        {activeTab === 'login' && (
          <div className="space-y-4 animate-fade-in">
            {/* Google Sign In Option */}
            <button
              type="button"
              id="btn-google-login"
              onClick={handleGoogleLogin}
              disabled={googleLoading || isSyncing}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer shadow-lg hover:border-indigo-500/60 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{googleLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google (Cloud)'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                atau masuk manual
              </span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

            <div>
              <label
                htmlFor="input-login-username"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Masukkan username Anda (cth: gordiarafah)"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-login-password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Aplikasi</span>
            </button>
          </form>
        </div>
        )}

        {/* TAB 2: FORM PENDAFTARAN AKUN */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fade-in">
            {regError && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="input-reg-username"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
              >
                Username Baru
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="cth: kasir_mitra (tanpa spasi)"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-reg-namamitra"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
              >
                Nama Lengkap / Nama Toko Mitra
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-namamitra"
                  type="text"
                  value={regNamaMitra}
                  onChange={(e) => setRegNamaMitra(e.target.value)}
                  placeholder="cth: GORDI ARAFAH / Mitra Sukses"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-reg-whatsapp"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
              >
                Nomor WhatsApp <span className="text-slate-500 normal-case">(Opsional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-whatsapp"
                  type="tel"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="cth: 085189186944"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-reg-password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  {showRegPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="input-reg-confirmpassword"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-confirmpassword"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  className="w-full bg-[#0E1320] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-register-submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer mt-3"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan Akun Baru</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                Sudah memiliki akun? Masuk di Sini
              </button>
            </div>
          </form>
        )}

        {/* Real-time Cloud status info */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span>Cloud Database: {isFirestoreConnected ? 'Online (Real-time)' : 'Menghubungkan...'}</span>
          </div>
          <span className="text-slate-500 font-medium">Sinkron HP & PC</span>
        </div>
      </div>
    </div>
  );
};
