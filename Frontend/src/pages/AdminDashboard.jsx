import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ShieldAlert, Search, Bell, BarChart3, Wallet, ShoppingBag, X, Check, Trash2, ShieldX, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
const baseURL = import.meta.env.VITE_API_URL;

const UserRow = React.memo(({ user, approveProvider, rejectProvider }) => {
  const currentStatus = user.availabilityStatus || 'available';
  const checkApproved = user.isApproved === true;
  const checkRejected = user.isRejected === true;

  const hasSubmittedRequest = 
    user.serviceType && user.serviceType.trim() !== "" &&
    user.bio && user.bio.trim() !== "" &&
    user.pricePerHour > 0;

  const checkPending = !checkApproved && !checkRejected && user.role === 'provider' && hasSubmittedRequest;

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-6 hover:shadow-md transition">
      <div className="space-y-2">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
          {user.name} <span className="text-xs font-normal text-slate-400 font-mono">({user.email})</span>
          {user.role === 'provider' && (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
              currentStatus === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              currentStatus === 'busy' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-1 h-1 rounded-full ${currentStatus === 'available' ? 'bg-emerald-500' : currentStatus === 'busy' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
              {currentStatus}
            </span>
          )}
        </h4>
        <p className="text-xs font-bold text-slate-400 uppercase">📍 Region Node: {user.city || 'NA'} | Service: {user.serviceType || 'Not Specified'}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {checkPending && (
          <div className="flex items-center gap-2">
            <button onClick={() => approveProvider(user._id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wide px-3 py-2 rounded-xl shadow-sm transition cursor-pointer">Approve</button>
            <button onClick={() => rejectProvider(user._id)} className="bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] uppercase tracking-wide px-3 py-2 rounded-xl shadow-sm transition cursor-pointer">Reject</button>
          </div>
        )}

        <div className="text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border select-none">
          {user.role === 'admin' ? (
            <span className="text-indigo-600">System Root Core</span>
          ) : checkRejected ? (
            <span className="text-red-600">Application Declined</span>
          ) : checkApproved ? (
            <span className="text-emerald-600">Active Live Verified</span>
          ) : checkPending ? (
            <span className="text-amber-600">Locked Under Queue</span>
          ) : (
            <span className="text-slate-400">Profile Incomplete</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');    
  const [analyticsData, setAnalyticsData] = useState({ totalBookingsRequires: 0, joinedProvidersNo: 0, totalConsumerBookedValue: 0, platformEarning: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showBellBox, setShowBellBox] = useState(false); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Master function optimized for normal user interactions
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/api/users/admin/all?filter=${roleFilter}&search=${searchTerm}`);
      setUsers(res.data.users || []);
      setAnalyticsData(res.data.analytics || { totalBookingsRequires: 0, joinedProvidersNo: 0, totalConsumerBookedValue: 0, platformEarning: 0 });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error compiling dashboard analytics telemetry metrics.', err);
    }
  }, [roleFilter, searchTerm]);

  // 🔥 FIX: Airtight socket live updates system that completely bypasses state closure lockouts
  useEffect(() => {
    // Initial Load
    fetchAdminData();

    const socketClient = io('http://localhost:5000');
    
    socketClient.on('GLOBAL_DATABASE_MUTATION', async () => {
      console.log('📢 Real-time Trigger Received: Synchronizing Admin Dashboard Data Counters Live...');
      try {
        // We use state references safely inside a fresh atomic API call execution block
        // This avoids stale state closures during global mutation events
        const res = await axios.get(`${baseURL}/api/users/admin/all?filter=${roleFilter}&search=${searchTerm}`);
        setUsers(res.data.users || []);
        setAnalyticsData(res.data.analytics || { totalBookingsRequires: 0, joinedProvidersNo: 0, totalConsumerBookedValue: 0, platformEarning: 0 });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Socket background data sync failed', err);
      }
    });

    return () => { socketClient.disconnect(); };
  }, [fetchAdminData, roleFilter, searchTerm]); // Dynamic dependency inclusion forces closure updates safely

  const approveProvider = useCallback(async (id) => {
    try {
      await axios.put(`${baseURL}/api/users/admin/update/${id}`);
      fetchAdminData();
      setShowBellBox(false);
    } catch (err) { console.error(err); }
  }, [fetchAdminData]);

  const rejectProvider = useCallback(async (id) => {
    try {
      await axios.delete(`${baseURL}/api/users/admin/reject/${id}`);
      fetchAdminData();
      setShowBellBox(false);
    } catch (err) { console.error(err); }
  }, [fetchAdminData]);

  const optimizedMetrics = useMemo(() => {
    const grossValue = analyticsData.totalConsumerBookedValue || 0;
    return {
      totalBookings: analyticsData.totalBookingsRequires || 0,
      joinedProviders: analyticsData.joinedProvidersNo || 0,
      platformEarnings: analyticsData.platformEarning || 0,
      grossValue: grossValue
    };
  }, [analyticsData]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return users.slice(startIndex, startIndex + itemsPerPage);
  }, [users, currentPage]);

  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans relative selection:bg-orange-500 selection:text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Live Platform Database Matrix</span>
            </div>
            <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mt-1.5">Founder Executive Control</h2>
          </div>
          
          <div className="relative">
            <button onClick={() => setShowBellBox(true)} className="p-3 bg-white rounded-xl border relative shadow-sm hover:bg-slate-50 transition focus:outline-none cursor-pointer">
              <Bell size={18} className="text-slate-700" />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{notifications.length}</span>}
            </button>
          </div>
        </div>

        {showBellBox && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 relative max-h-[85vh] flex flex-col justify-between">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-orange-500" size={20} />
                  <h3 className="text-md font-black uppercase tracking-wide text-slate-900">Incoming Verification Queues</h3>
                </div>
                <button onClick={() => setShowBellBox(false)} className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 divide-y divide-slate-100 max-h-[55vh] pr-1">
                {notifications.map(n => (
                  <div key={n._id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900">{n.name} <span className="text-xs text-slate-400 font-mono">({n.email})</span></h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block">Fields: {n.serviceType} | Price: ₹{n.pricePerHour}/hr</p>
                      <p className="text-xs text-slate-500 italic mt-1 font-medium">"Bio: {n.bio}"</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">📍 Requested City Base: <span className="text-slate-700">{n.city}</span></p>
                    </div>
                    <div className="flex items-center gap-2 sm:self-center">
                      <button onClick={() => approveProvider(n._id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer"><Check size={12}/> Approve</button>
                      <button onClick={() => rejectProvider(n._id)} className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer"><Trash2 size={12}/> Reject</button>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <ShieldX className="text-slate-300 mx-auto" size={32}/>
                    <p className="text-xs text-slate-400 font-medium">All onboarding queues are completely cleared.</p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-3 text-right">
                <button onClick={() => setShowBellBox(false)} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">Close Panel</button>
              </div>
            </div>
          </div>
        )}

        {/* METRICS INFRASTRUCTURE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-[#ff8a00] rounded-xl"><BarChart3 size={20}/></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Active Contracts</span><span className="text-lg font-black text-slate-900">{optimizedMetrics.totalBookings} Jobs</span></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Joined Providers No</span><span className="text-lg font-black text-slate-900">{optimizedMetrics.joinedProviders} Experts</span></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={20}/></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Platform Earnings (15%)</span><span className="text-lg font-black text-emerald-600">₹{optimizedMetrics.platformEarnings.toFixed(1)}</span></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShoppingBag size={20}/></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Gross Revenue Value</span><span className="text-lg font-black text-slate-900">₹{optimizedMetrics.grossValue}</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full flex items-center">
            <Search size={16} className="text-slate-400 absolute left-4" />
            <input type="text" placeholder="Search directory users records dynamically by name..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-orange-500 font-medium transition-all" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="border px-4 py-3 text-xs font-black bg-slate-50 rounded-xl outline-none w-full md:w-56 cursor-pointer focus:border-orange-500">
            <option value="all">📁 Show Complete Directory</option>
            <option value="provider">💼 Field Providers Only</option>
            <option value="customer">👥 Customers Base Only</option>
          </select>
        </div>

        <div className="space-y-4">
          {paginatedUsers.map(u => (
            <UserRow 
              key={u._id} 
              user={u} 
              approveProvider={approveProvider} 
              rejectProvider={rejectProvider} 
            />
          ))}
          {paginatedUsers.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 bg-white border rounded-2xl">No user records matched current filter queries.</div>
          )}
        </div>

        {users.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages} ({users.length} Total Records)</span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="p-2 bg-white rounded-xl border text-slate-600 disabled:opacity-40 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16}/>
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="p-2 bg-white rounded-xl border text-slate-600 disabled:opacity-40 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}