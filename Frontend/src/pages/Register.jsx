import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, MapPin, Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import BlobButton from '../components/BlobButton'; // 🔥 Import the dynamic reusable button layer

const baseURL = import.meta.env.VITE_API_URL;

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    role: 'customer' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Strict guard lockout path to block duplicate clicks execution

    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        city: formData.city,
        role: formData.role
      });
      
      if (res.data.success) {
        alert('Account Created Successfully! Redirecting to secure login gateway.');
        navigate('/login');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Schema transmission processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />
      
      <div className="flex justify-center items-center py-16 px-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-md transition-all duration-300">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-400 mt-2">Join the hyperlocal localized household service ecosystem</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User size={18} /></span>
                <input 
                  type="text" 
                  required 
                  disabled={loading}
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Piyush Mittal" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium disabled:opacity-60" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail size={18} /></span>
                <input 
                  type="email" 
                  required 
                  disabled={loading}
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium disabled:opacity-60" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password Access Key *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock size={18} /></span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  disabled={loading}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium disabled:opacity-60" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Operation Base City *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><MapPin size={18} /></span>
                <input 
                  type="text" 
                  required 
                  disabled={loading}
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g. gwalior" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-medium lowercase disabled:opacity-60" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select Account Profile Role *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Briefcase size={18} /></span>
                <select 
                  value={formData.role} 
                  disabled={loading}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-[#0f172a] rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff8a00] focus:bg-white transition-all text-sm font-black cursor-pointer disabled:opacity-60"
                >
                  <option value="customer">👥 Customer (Book Home Services)</option>
                  <option value="provider">💼 Field Provider (Offer Service Expertise)</option>
                </select>
              </div>
            </div>

            {/* 🔥 INTEGRATED: Custom Blob Button component with internal state processing loaders */}
            <BlobButton type="submit" isLoading={loading} className="mt-4 btn-wave-effect">
              <span>Register Profile Node</span>
            </BlobButton>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Already Registered?</span></div>
          </div>

          <Link to="/login" className="block w-full text-center border-2 border-slate-100 hover:border-[#ff8a00] text-slate-700 font-bold py-2.5 rounded-xl transition-all text-sm active:scale-95 duration-100">
            Sign In to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}