import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { supabase, projectId, publicAnonKey } from "../supabaseClient";
import { isRestApi } from "../config/restApi";
import { authLogin, authRegister, checkUsername } from "../services/backendApi";
import authClient from "../services/authClient";
import { useAuthStore } from "../store/authStore";

interface LoginPageProps {
  onLogin?: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsernameAvailability = async (uname: string) => {
    if (!uname || uname.length < 3) {
      setUsernameError(uname.length > 0 && uname.length < 3 ? 'Username must be at least 3 characters' : null);
      setUsernameValid(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameError(null);

    try {
      if (isRestApi()) {
        const { available } = await checkUsername(uname.toLowerCase());
        if (!available) {
          setUsernameError('Username already taken');
          setUsernameValid(false);
        } else {
          setUsernameError(null);
          setUsernameValid(true);
        }
        return;
      }
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/username/check/${uname.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (res.ok) {
        const { available } = await res.json();
        if (!available) {
          setUsernameError('Username already taken');
          setUsernameValid(false);
        } else {
          setUsernameError(null);
          setUsernameValid(true);
        }
      }
    } catch (err) {
      // If server isn't reachable, allow any username
      setUsernameError(null);
      setUsernameValid(true);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setUsername(value);
    setUsernameValid(false);
    if ((window as any).usernameCheckTimeout) clearTimeout((window as any).usernameCheckTimeout);
    (window as any).usernameCheckTimeout = setTimeout(() => {
      if (value) checkUsernameAvailability(value);
      else { setUsernameError(null); setUsernameValid(false); }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!username || username.length < 3) throw new Error('Username must be at least 3 characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        const res = await authClient.signUp(email, password, username.toLowerCase());
        if (!res.success) throw new Error(res.message || 'Registration failed');
        if (res.needsVerification) {
          setError('Account created — please check your email to verify before signing in.');
          return;
        }
        // success
        onLogin?.();
        return;
      } else {
        const res = await authClient.signIn(email, password);
        if (!res.success) throw new Error(res.message || 'Login failed');
        onLogin?.();
        return;
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      const msg = err?.message || err?.toString() || 'An error occurred. Please try again.';
      setError(msg);
      if (isSignUp && (msg.includes('already registered') || msg.includes('already in use') || msg.includes('already')) ) {
        setTimeout(() => { setIsSignUp(false); setError('This email is registered. Please sign in below.'); }, 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In dev, prefer the forced auth override so demo always works
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_FORCE_AUTH === 'true') {
        const token = import.meta.env.VITE_DEV_AUTH_TOKEN || 'dev-token';
        const uid = import.meta.env.VITE_DEV_USER_ID || 'dev-user';
        useAuthStore.getState().setAuth(token, uid);
        onLogin?.();
        return;
      }

      if (isRestApi()) {
        throw new Error('Demo login is not available when using the REST API backend.');
      }

      console.log('🎮 Demo login: Calling Supabase demo function...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/demo-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to setup demo account');
      }

      const { email: demoEmail, password: demoPassword } = await response.json();
      console.log('✅ Demo account ready, signing in...');

      const signInRes = await authClient.signIn(demoEmail, demoPassword);
      if (!signInRes.success) throw new Error(signInRes.message || 'Demo sign-in failed');
      console.log('✅ Demo login complete!');
      onLogin?.();

    } catch (err: any) {
      console.error('❌ Demo login failed:', err);
      setError(err?.message || 'Demo login failed. Please try regular sign up instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center p-4 relative overflow-auto">
      {/* Industrial Background Grid */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-8 w-6 h-6 bg-foreground border-2 border-foreground opacity-20"
        style={{ animation: 'floatY 4s ease-in-out infinite' }} />
      <div className="absolute top-40 right-12 w-4 h-4 bg-foreground border-2 border-foreground opacity-15 rotate-45"
        style={{ animation: 'floatY 3.5s ease-in-out 0.5s infinite' }} />
      <div className="absolute bottom-40 left-16 w-5 h-5 bg-foreground border-2 border-foreground opacity-10"
        style={{ animation: 'floatY 5s ease-in-out 1s infinite' }} />
      <div className="absolute bottom-60 right-8 w-3 h-3 bg-card border-2 border-foreground opacity-20 rotate-12"
        style={{ animation: 'floatY 3s ease-in-out 0.8s infinite' }} />

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-foreground border-4 border-foreground mb-4 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
            style={{ animation: 'logoEntrance 0.7s cubic-bezier(.22,.68,0,1.2) both' }}>
            <Zap className="text-background w-12 h-12" strokeWidth={3}
              style={{ animation: 'floatY 3s ease-in-out 0.8s infinite' }} />
          </div>
          <h1 className="text-6xl font-black text-foreground tracking-tighter mb-2 drop-shadow-sm uppercase"
            style={{ textShadow: '4px 4px 0px rgba(255,255,255,0.5)', animation: 'fadeSlideUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.3s both' }}>
            Vibe
          </h1>
          <div className="bg-foreground text-background inline-block px-3 py-1 font-bold text-sm border-2 border-card"
            style={{ transform: 'rotate(-2deg)', animation: 'taglineIn 0.5s cubic-bezier(.22,.68,0,1.2) 0.55s both' }}>
            Connect. Share. Vibe.
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-card border-4 border-foreground p-8 shadow-[12px_12px_0px_0px_var(--foreground)] relative"
          style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.7s both' }}>
          {/* Screw Heads */}
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
            <div key={pos} className={`absolute ${pos} w-3 h-3 bg-secondary rounded-full border border-foreground flex items-center justify-center`}>
              <div className="w-full h-[1px] bg-foreground transform rotate-45"></div>
            </div>
          ))}

          {/* Toggle */}
          <div className="flex border-2 border-foreground mb-8 bg-secondary">
            <button onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-3 font-bold text-lg transition-all ${!isSignUp ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}>
              LOGIN
            </button>
            <div className="w-[2px] bg-foreground"></div>
            <button onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-3 font-bold text-lg transition-all ${isSignUp ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}>
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 border-2 border-red-600 text-red-600 font-bold text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-sm font-black text-foreground uppercase tracking-wider">Username</label>
                <input type="text" value={username} onChange={handleUsernameChange}
                  placeholder="CHOOSE_USERNAME" required={isSignUp}
                  className="w-full px-4 py-3 bg-card border-2 border-foreground font-bold outline-none text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0px_0px_var(--foreground)] focus:-translate-y-1 transition-all" />
                {checkingUsername && (
                  <div className="flex items-center text-sm text-gray-500 mt-1"><AlertCircle className="w-4 h-4 mr-1" />Checking...</div>
                )}
                {usernameError && (
                  <div className="flex items-center text-sm text-red-500 mt-1"><AlertCircle className="w-4 h-4 mr-1" />{usernameError}</div>
                )}
                {usernameValid && (
                  <div className="flex items-center text-sm text-green-500 mt-1"><CheckCircle className="w-4 h-4 mr-1" />Available</div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER_EMAIL" required
                className="w-full px-4 py-3 bg-card border-2 border-foreground font-bold outline-none text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0px_0px_var(--foreground)] focus:-translate-y-1 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground uppercase tracking-wider">Password</label>
              <div className="relative group">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER_PASSWORD" required
                  className="w-full px-4 py-3 bg-card border-2 border-foreground font-bold outline-none text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0px_0px_var(--foreground)] focus:-translate-y-1 transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary border border-transparent hover:border-foreground rounded transition-all">
                  {showPassword ? <EyeOff className="text-foreground" size={20} strokeWidth={2.5} /> : <Eye className="text-foreground" size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-sm font-black text-foreground uppercase tracking-wider">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="CONFIRM_PASSWORD" required={isSignUp}
                  className="w-full px-4 py-3 bg-card border-2 border-foreground font-bold outline-none text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0px_0px_var(--foreground)] focus:-translate-y-1 transition-all" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-foreground text-background font-black text-lg uppercase border-2 border-foreground hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_var(--foreground)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
              {loading ? 'Processing...' : (
                <>{isSignUp ? 'Create Account' : 'Login'}<ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} /></>
              )}
            </button>
          </form>

          {isSignUp && (
            <p className="text-xs font-medium text-gray-500 text-center mt-6 border-t-2 border-gray-100 pt-4">
              By signing up, you agree to our Terms of Service and Privacy Policy.<br />We keep it raw and real.
            </p>
          )}
        </div>

        {/* Demo Login */}
        <div className="mt-8 text-center space-y-4"
          style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.9s both' }}>
          <button onClick={handleDemoLogin} disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-card border-2 border-foreground font-bold text-sm shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-y-1 hover:shadow-none transition-all active:scale-95">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-status-pulse"></span>
            {loading ? 'INITIALIZING DEMO...' : 'TRY DEMO MODE'}
          </button>
          
          <div className="text-xs">
            <a href="/debug" className="text-foreground/50 hover:text-foreground border-b border-foreground/50 hover:border-foreground transition-colors">
              Having issues? Check configuration →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}