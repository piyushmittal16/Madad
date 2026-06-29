import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, User, LayoutDashboard, Bell, X, Check, Star, ShieldAlert } from 'lucide-react';
import logo from "../assets/logo.png";

// Helper for dynamic elapsed timestamp strings
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  return `${Math.floor(diffHrs / 24)} days ago`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [liveToast, setLiveToast] = useState({ show: false, message: '' });
  const dropdownRef = useRef(null);

  const fetchActiveNotifications = useCallback(async (isGatewayLogin = false) => {
    if (!user?.id || user.role === 'admin') return; // 🔥 Guard constraint: Skip network load for admin node roles
    try {
      const res = await axios.get(`http://localhost:5000/api/users/notifications/stream?userId=${user.id}&fetchToasts=${isGatewayLogin}`);
      
      if (isGatewayLogin) {
        if (res.data && res.data.length > 0) {
          setLiveToast({ show: true, message: res.data[0].message });
          setTimeout(() => setLiveToast({ show: false, message: '' }), 5000);
        }
        fetchActiveNotifications(false);
      } else {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.error('Error polling notification variables.', err);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.id && user.role !== 'admin') { // 🔥 Guard context configuration
      const justLoggedIn = localStorage.getItem('JUST_LOGGED_IN_SESSION');
      if (justLoggedIn === 'true') {
        localStorage.removeItem('JUST_LOGGED_IN_SESSION');
        fetchActiveNotifications(true);
      } else {
        fetchActiveNotifications(false);
      }

      const socket = io('http://localhost:5000');
      socket.on('GLOBAL_DATABASE_MUTATION', (data) => {
        if (data.type === 'BOOKING_STATUS_MUTATED' || data.type === 'REVIEW_STREAM_MUTATED') {
          fetchActiveNotifications(false);
          axios.get(`http://localhost:5000/api/users/notifications/stream?userId=${user.id}`).then(res => {
            if (res.data && res.data.length > 0) {
              setLiveToast({ show: true, message: res.data[0].message });
              setTimeout(() => setLiveToast({ show: false, message: '' }), 5000);
            }
          });
        }
      });

      return () => socket.disconnect();
    }
  }, [user?.id, user?.role, fetchActiveNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBellPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutAction = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDismissAlert = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.put(`http://localhost:5000/api/users/notifications/dismiss/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleBulkClear = async () => {
    try {
      await axios.post(`http://localhost:5000/api/users/notifications/clear-all`, { userId: user.id });
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const handleNotificationClick = (item) => {
    setShowBellPanel(false);
    if (user.role === 'customer') navigate('/customer-dashboard');
    else if (user.role === 'provider') navigate('/provider-dashboard');
  };

  const handleDashboardRedirect = () => {
    if (!user) return navigate('/login');
    if (user.role === 'admin') navigate('/admin-dashboard');
    else if (user.role === 'provider') navigate('/provider-dashboard');
    else navigate('/customer-dashboard');
  };

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 text-white sticky top-0 z-[999] selection:bg-orange-500">
      {liveToast.show && (
        <div className="fixed top-20 right-5 z-[999999] flex items-center gap-3 p-4 rounded-xl shadow-2xl bg-slate-900 text-white text-xs font-bold border border-slate-800 animate-slide-in max-w-sm">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></div>
          <span className="leading-relaxed">{liveToast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link to="/" className="flex items-center gap-3 group focus:outline-none active:scale-95 duration-100">
            <div className="relative w-8 h-8 flex items-center justify-center transition group-hover:scale-105 duration-200">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center -space-y-1">
              <span className="text-xl font-black tracking-tight text-white">Madad</span>
              <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">Local Services</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {token && user ? (
              <>
                {/* 🔥 CONDITION ENFORCED: Hide notification bell completely if role is admin */}
                {user.role !== 'admin' && (
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setShowBellPanel(!showBellPanel)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/50 border border-slate-800 transition relative active:scale-90 duration-100 cursor-pointer"
                    >
                      <Bell size={16} />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
                          {notifications.length}
                        </span>
                      )}
                    </button>

                    {showBellPanel && (
                      <div className="absolute right-0 mt-3 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 py-3 z-[9999] flex flex-col max-h-[420px]">
                        <div className="px-4 pb-2 border-b flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-slate-900 tracking-wider">Marketplace Alerts</span>
                          {notifications.length > 0 && (
                            <button onClick={handleBulkClear} className="text-[10px] text-orange-500 font-black hover:underline uppercase tracking-wide cursor-pointer">Clear All</button>
                          )}
                        </div>
                        
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                          {notifications.map(item => (
                            <div 
                              key={item._id} 
                              onClick={() => handleNotificationClick(item)}
                              className="p-3.5 hover:bg-slate-50 transition flex items-start gap-3 relative group cursor-pointer"
                            >
                              <div className="shrink-0 mt-0.5">
                                {item.type === 'Accept' && <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Check size={12} strokeWidth={3}/></div>}
                                {item.type === 'Complete' && <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Check size={12} strokeWidth={3}/></div>}
                                {item.type === 'Rating' && <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><Star size={12} fill="currentColor"/></div>}
                                {item.type === 'System' && <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><ShieldAlert size={12}/></div>}
                              </div>
                              
                              <div className="flex-1 pr-4 space-y-0.5">
                                <p className="text-xs font-bold leading-relaxed text-slate-700">{item.message}</p>
                                <span className="text-[9px] font-medium text-slate-400 block">{formatTimeAgo(item.createdAt)}</span>
                              </div>

                              <button 
                                onClick={(e) => handleDismissAlert(item._id, e)}
                                className="absolute right-2 top-3 text-slate-300 hover:text-red-500 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 rounded cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                          {notifications.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">No fresh updates.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800">
                  <User size={13} className="text-orange-500" />
                  <span>Hi, <span className="text-white">{user.name}</span></span>
                </div>

                <button onClick={handleDashboardRedirect} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition focus:outline-none cursor-pointer active:scale-95 duration-100">
                  <LayoutDashboard size={14} className="text-slate-400" />
                  <span>Dashboard</span>
                </button>

                <button onClick={handleLogoutAction} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-2 rounded-xl transition focus:outline-none cursor-pointer active:scale-95 duration-100">
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition active:scale-95 duration-100">Sign In</Link>
                <Link to="/register" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/10 hover:opacity-95 transition active:scale-95 duration-100">Join Market</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}