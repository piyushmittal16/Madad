import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Sliders, Activity, User, Briefcase, Send, XOctagon, Sparkles, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [profileNode, setProfileNode] = useState(null);
  const providerUser = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({ city: '', serviceType: '', pricePerHour: '', bio: '' });
  const [formFeedback, setFormFeedback] = useState('');

  const fetchProviderDataset = useCallback(async () => {
    if (!providerUser) return;
    try {
      // API call to pull actual state parameters
      const res = await axios.get(`http://localhost:5000/api/bookings?userId=${providerUser.id}&role=provider`);
      setBookings(res.data || []);

      const allUsersRes = await axios.get(`http://localhost:5000/api/users/admin/all`);
      const mine = allUsersRes.data.users.find(u => u._id === providerUser.id);
      if (mine) {
        setProfileNode(mine);
        setFormData({
          city: mine.city || '',
          serviceType: mine.serviceType || '',
          pricePerHour: mine.pricePerHour || '',
          bio: mine.bio || ''
        });
      }
    } catch (err) {
      console.error('Error syncing provider dataset telemetry.', err);
    }
  }, [providerUser?.id]);

  useEffect(() => {
    fetchProviderDataset();
    const socketClient = io('http://localhost:5000');
    
    // 🔥 LIVE UPDATES PIPELINE MATCHING NOTIFICATIONS STREAM
    socketClient.on('GLOBAL_DATABASE_MUTATION', () => {
      console.log('📢 Socket Received: Synchronizing Provider metrics & active rating indicators...');
      fetchProviderDataset();
    });
    
    return () => { socketClient.disconnect(); };
  }, [fetchProviderDataset]);

  const handleRejectedClickAlert = () => {
    alert("Access Denied: Your onboarding application has been permanently declined by the administration due to verification policy criteria.");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileNode?.isRejected === true) return handleRejectedClickAlert();
    try {
      const payload = {
        ...formData,
        isApproved: profileNode?.isApproved === true ? true : false,
        isRejected: false
      };

      await axios.put(`http://localhost:5000/api/users/profile/${providerUser.id}`, payload);
      setFormFeedback('Profile settings updated successfully live in the marketplace!');
      fetchProviderDataset();
    } catch (err) {
      setFormFeedback('Error updating profile configuration values.');
    }
  };

  const changeAvailability = async (nextStatus) => {
    if (profileNode?.isRejected === true) return handleRejectedClickAlert();
    try {
      await axios.put(`http://localhost:5000/api/users/availability/${providerUser.id}`, { status: nextStatus });
      fetchProviderDataset();
    } catch (err) {
      console.error('Availability switch matrix failed.', err);
    }
  };

  const updateBookingStatus = async (id, status) => {
    if (profileNode?.isRejected === true) return handleRejectedClickAlert();
    try {
      await axios.put(`http://localhost:5000/api/bookings/${id}`, { status });
      fetchProviderDataset();
    } catch (err) {
      console.error('Order state update execution crashed.', err);
    }
  };

  const completedJobsCount = bookings.filter(b => b.status === 'Completed').length;
  
  // CALCULATE EARNINGS USING BOOKING SPECIFIC SNAPSHOT RATE 
  let totalEarningsGross = 0;
  bookings.forEach(b => {
    if (b.status === 'Completed') {
      const dealPriceVal = b.pricePerHour || b.provider?.pricePerHour || 0;
      totalEarningsGross += Number(dealPriceVal);
    }
  });
  const netEarnings = totalEarningsGross - (totalEarningsGross * 0.15);

  const activeStatus = profileNode?.availabilityStatus || 'not available';
  const isApprovedByAdmin = profileNode?.isApproved === true;
  const isRejectedByAdmin = profileNode?.isRejected === true;
  
  const hasFilledInitialData = profileNode?.serviceType && profileNode?.serviceType.trim() !== "" && profileNode?.pricePerHour > 0;

  const serviceOptions = ['Beauty & Spa', 'Electrician', 'Home Repairs', 'Cleaning', 'Painting'];
  const isFormCompletelyFilled = formData.city.trim() !== '' && formData.serviceType.trim() !== '' && formData.pricePerHour.toString().trim() !== '' && formData.pricePerHour > 0 && formData.bio.trim() !== '';

  if (!providerUser) return <div className="p-10 font-bold text-center">Unauthorized Platform Access.</div>;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans relative selection:bg-orange-500 selection:text-white">
      <Navbar />

      {isRejectedByAdmin && (
        <div onClick={handleRejectedClickAlert} className="fixed inset-x-0 bottom-0 top-[64px] bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-not-allowed select-none">
          <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-2xl max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200"><XOctagon size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Application Onboarding Declined</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Access Denied: Your provider onboarding application has been permanently declined by the administration.</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 relative">
            {isApprovedByAdmin ? (
              <div className="absolute top-3 right-3 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1 text-[10px] font-black uppercase select-none">
                <CheckCircle size={12} className="text-emerald-500"/> Verified Active
              </div>
            ) : hasFilledInitialData && (
              <div className="absolute top-3 right-3 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 text-[10px] font-black uppercase select-none">
                ⏳ Queue Audit
              </div>
            )}

            <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-1.5 mb-1"><Sparkles size={16}/> Profile Settings</h3>
            <p className="text-xs text-slate-400 mb-5">Configure or update your marketplace service credentials instantly.</p>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Select Service Field *</label>
                <select 
                  value={formData.serviceType} 
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-bold rounded-xl outline-none focus:border-orange-500 bg-white"
                >
                  <option value="">-- Choose Field Subcategory --</option>
                  {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Price Per Hour (₹) *</label>
                <input type="number" placeholder="e.g. 249" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-bold rounded-xl outline-none focus:border-orange-500 focus:bg-white" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Operation Base City *</label>
                <input type="text" placeholder="e.g. gwalior" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-bold rounded-xl outline-none focus:border-orange-500 focus:bg-white lowercase font-mono" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Expertise Bio Statement *</label>
                <textarea placeholder="Describe your experience..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-medium rounded-xl h-20 outline-none focus:border-orange-500 focus:bg-white resize-none" />
              </div>

              {formFeedback && <p className="text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 p-2 rounded-lg">{formFeedback}</p>}

              {/* 🔥 Added active bounce effect */}
              <button 
                type="submit" 
                disabled={!isFormCompletelyFilled} 
                className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 duration-100 ${
                  isFormCompletelyFilled 
                    ? 'bg-[#0f172a] hover:bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-200'
                }`}
              >
                <Send size={14}/> {isApprovedByAdmin ? 'Save & Update Profile' : hasFilledInitialData ? 'Update Pending Specs' : 'Dispatch Verification Request'}
              </button>
            </form>
          </div>

          {isApprovedByAdmin && (
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-1.5"><Sliders size={18} className="text-orange-500"/> Availability Toggles</h3>
              <div className="p-3 bg-slate-50 border rounded-xl mb-4 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Live Status Counter:</span>
                <span className={`uppercase font-black px-2 py-0.5 rounded border ${activeStatus === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : activeStatus === 'busy' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{activeStatus}</span>
              </div>
              {/* 🔥 Added dynamic button bounce effects */}
              <div className="space-y-2">
                <button disabled={activeStatus === 'busy'} onClick={() => changeAvailability('available')} className={`w-full py-2.5 text-xs font-bold rounded-xl transition active:scale-[0.98] duration-100 ${activeStatus === 'available' ? 'bg-emerald-500 text-white shadow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40'} cursor-pointer`}>Go Online: Available</button>
                <button disabled={activeStatus === 'busy'} onClick={() => changeAvailability('not available')} className={`w-full py-2.5 text-xs font-bold rounded-xl transition active:scale-[0.98] duration-100 ${activeStatus === 'not available' ? 'bg-red-500 text-white shadow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40'} cursor-pointer`}>Go Offline: Not Available</button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Activity size={18} className="text-orange-500"/> Personal Metric Ledger</h3>
            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
              <div className="py-3 flex justify-between"><span>Jobs Executed Count:</span><span className="text-slate-900 font-black">{completedJobsCount} Items</span></div>
              <div className="py-3 flex justify-between"><span>Gross Value Revenue:</span><span className="text-slate-900 font-black">₹{totalEarningsGross}</span></div>
              <div className="py-3 flex justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-emerald-800">
                <span>Net Profit (15% Cut):</span>
                <span className="font-black text-emerald-600 text-sm">₹{netEarnings.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-slate-900">Task Allocation Terminal</h3>
          {isApprovedByAdmin ? (
            <div className="space-y-4">
              {bookings.map(b => {
                const displayedPrice = b.pricePerHour || b.provider?.pricePerHour || 0;
                
                return (
                  <div key={b._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${b.status === 'Pending' ? 'bg-amber-100 text-amber-800' : b.status === 'Accepted' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{b.status}</span>
                        <span className="text-xs text-slate-400 font-semibold">📅 Scheduled: {b.date} at {b.time}</span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900">Client: {b.customer?.name}</h4>
                      <p className="text-xs font-mono bg-slate-50 p-3 border rounded-xl text-slate-500 max-w-xl">{b.notes}</p>
                    </div>
                    <div className="flex w-full md:w-auto justify-end gap-2">
                      <div className="text-right mr-4 hidden md:block">
                        <span className="text-sm font-black text-slate-900 block">₹{displayedPrice}/hr</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Locked Price</span>
                      </div>
                      {/* 🔥 Added dynamic micro-animations triggers onto operational flows */}
                      {b.status === 'Pending' && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button onClick={() => updateBookingStatus(b._id, 'Accepted')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition w-full md:w-auto text-center cursor-pointer active:scale-95 duration-100">Accept Contract</button>
                          <button onClick={() => updateBookingStatus(b._id, 'Cancelled')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition w-full md:w-auto text-center cursor-pointer active:scale-95 duration-100">Decline</button>
                        </div>
                      )}
                      {b.status === 'Accepted' && <button onClick={() => updateBookingStatus(b._id, 'Completed')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow w-full md:w-auto text-center cursor-pointer active:scale-95 duration-100">Mark Complete</button>}
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-xs text-slate-400">No active work orders routed yet.</div>}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <Briefcase className="text-slate-300 mx-auto mb-3" size={32}/>
              <h4 className="text-sm font-black text-slate-700">Account Access Frozen</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Please completely fulfill profile configurations to pass security clearance before task distribution starts.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}