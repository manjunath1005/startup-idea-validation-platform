import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lightbulb, Lock, Mail, User, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (err, fallback) => {
    console.error(err);
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail[0]?.msg || 'Validation error';
    if (detail && typeof detail === 'object') return detail.message || JSON.stringify(detail);
    return fallback;
  };

  // Handle countdown for resending OTP
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Requesting verification code (Step 1)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const response = await sendOtp(email);
      setStep(2);
      setResendCooldown(60);
      setInfoMessage(response?.message || `We've sent a verification code to ${email}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send verification code. Please check your email address or try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Completing registration with OTP (Step 2)
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      await register(email, password, fullName, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to verify OTP or register. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Resend the OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const response = await sendOtp(email);
      setResendCooldown(60);
      setInfoMessage(response?.message || 'Verification code resent successfully!');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 animate-scale-in border border-slate-200">
        
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-3 text-blue-600">
                <Lightbulb size={28} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
                Start Your Validation
              </h2>
              <p className="text-sm text-slate-500 mt-1 text-center font-medium">
                Create an account to begin generating AI validation reports
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full !pl-11 glass-input"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    className="w-full !pl-11 glass-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full !pl-11 glass-input"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50 disabled:pointer-events-none mt-8 cursor-pointer text-sm"
              >
                {loading ? 'Sending Code...' : 'Get Verification Code'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-3 text-blue-600">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
                Verify Your Email
              </h2>
              <p className="text-sm text-slate-500 mt-2 text-center px-2 font-medium">
                We've sent a 6-digit verification code to <br/>
                <span className="font-bold text-blue-600">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  className="w-full glass-input text-center tracking-[0.5em] text-2xl font-bold font-mono pl-[0.5em] border border-slate-300"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                  }}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
                >
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-full border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                  <ArrowLeft size={16} />
                  Change Account Details
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500 font-medium">Didn't receive the email? </span>
              {resendCooldown > 0 ? (
                <span className="text-blue-600 font-bold">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 hover:underline hover:text-blue-700 font-bold cursor-pointer"
                >
                  Resend Code
                </button>
              )}
            </div>
          </>
        )}

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline hover:text-blue-700 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
