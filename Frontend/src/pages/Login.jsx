import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import BlobButton from '../components/BlobButton'; // 🔥 Import button wrapper

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgetMode, setIsForgetMode] = useState(false);
  
  const [forgetEmail, setForgetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [authFeedback, setAuthFeedback] = useState({ message: '', type: '' });

  // 🔥 Loading state parameter to stop multi-clicking duplicate submissions
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const triggerFeedbackMessage = (message, type = 'error') => {
    setAuthFeedback({ message, type });
    setTimeout(() => setAuthFeedback({ message: '', type: '' }), 6000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Guard clause
    
    setIsLoading(true); // Trigger loader
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email: email.trim(), 
        password 
      });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('JUST_LOGGED_IN_SESSION', 'true');
        
        const userRole = res.data.user.role;
        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (userRole === 'provider') {
          navigate('/provider-dashboard');
        } else {
          navigate('/'); 
        }
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Invalid operational credentials.';
      triggerFeedbackMessage(serverMessage, 'error');
    } finally {
      setIsLoading(false); // Shutdown loader tracking states
    }
  };

  const handleForgetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forget-password', {
        email: forgetEmail.trim(),
        newPassword
      });
      if (res.data.success) {
        alert(res.data.message);
        setIsForgetMode(false); 
        setNewPassword('');
        setForgetEmail('');
        setAuthFeedback({ message: '', type: '' });
      }
    } catch (err) {
      triggerFeedbackMessage(err.response?.data?.message || 'Verification framework processing crashed.', 'error');
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />
      <div className="flex justify-center items-center py-20 px-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-md transition-all duration-300">
          {authFeedback.message && (
            <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 border text-xs font-bold leading-relaxed ${
              authFeedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>{authFeedback.message}</div>
            </div>
          )}

          {!isForgetMode ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">Welcome Back</h2>
                <p className="text-sm text-slate-400 mt-2">Access your localized household service ecosystem</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail size={18} /></span>
                    <input type="email" required disabled={isLoading} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Password Access Key</label>
                    <button type="button" disabled={isLoading} onClick={() => { setForgetEmail(email); setIsForgetMode(true); }} className="text-xs font-bold text-[#ff8a00] hover:underline focus:outline-none">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock size={18} /></span>
                    <input type={showPassword ? "text" : "password"} required disabled={isLoading} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 🔥 INTEGRATED: Custom Liquid Blob Button with Auto Loader & Animation */}
                <BlobButton type="submit" isLoading={isLoading} className="mt-2 btn-wave-effect">
                  Sign In to Marketplace
                </BlobButton>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">New to Madad?</span></div>
              </div>

              <Link to="/register" className="block w-full text-center border-2 border-slate-100 hover:border-[#ff8a00] text-slate-700 font-bold py-2.5 rounded-xl transition-all text-sm active:scale-95 duration-100">
                Create Service Account
              </Link>
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => { setIsForgetMode(false); setAuthFeedback({ message: '', type: '' }); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#0f172a] transition mb-6 focus:outline-none">
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Reset Key Configuration</h2>
                <p className="text-xs text-slate-400 mt-1">Provide your registered email account to reconfigure password parameter weights safely.</p>
              </div>
              <form onSubmit={handleForgetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Registered Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail size={18} /></span>
                    <input type="email" required value={forgetEmail} onChange={e => setForgetEmail(e.target.value)} placeholder="youraccount@example.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Configure New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><KeyRound size={18} /></span>
                    <input type={showNewPassword ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Configure new access key" className="w-full pl-10 pr-10 py-3 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#ff8a00] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 duration-100 text-sm tracking-wide mt-2">
                  Override & Save Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}