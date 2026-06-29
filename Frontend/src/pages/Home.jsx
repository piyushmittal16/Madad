import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, MapPin, AlertCircle, Sparkles, Star, Calendar, Clock, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import BlobButton from '../components/BlobButton'; // 🔥 Import the liquid core layout wrapper

const baseURL = import.meta.env.VITE_API_URL;

// 🚀 PERFORMANCE CONCEPT: React.memo for Provider Grid Cards
const ProviderCard = React.memo(({ provider, onSelect }) => {
  const currentStatus = provider.availabilityStatus || 'available';
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between border-slate-100 hover:shadow-md transition duration-200">
      <div>
        <div className="flex justify-between items-center">
          <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{provider.serviceType || 'General'}</span>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            currentStatus === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
            currentStatus === 'busy' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'available' ? 'bg-emerald-500' : currentStatus === 'busy' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
            {currentStatus}
          </span>
        </div>
        
        <h4 className="text-lg font-bold text-slate-900 mt-3 flex items-center justify-between">
          {provider.name}
          <span className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
            <Star size={12} fill="currentColor"/> {provider.averageRating || '0.0'}
          </span>
        </h4>
        
        <p className="text-xs text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">📍 City base: {provider.city}</p>
        <p className="text-slate-500 text-xs italic mt-3 font-medium">"{provider.bio}"</p>
      </div>
      
      <div className="border-t pt-4 flex justify-between items-center mt-6 border-slate-100">
        <span className="text-lg font-black text-slate-900">₹{provider.pricePerHour}/hr</span>
        <button 
          disabled={currentStatus !== 'available'} 
          onClick={() => onSelect(provider)} 
          className={`font-bold text-xs px-4 py-2.5 rounded-xl transition shadow active:animate-click-bounce cursor-pointer duration-150 ${
            currentStatus === 'available' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {currentStatus === 'available' ? 'Select Partner →' : currentStatus === 'busy' ? 'Busy' : 'Offline'}
        </button>
      </div>
    </div>
  );
});

export default function Home() {
  const [allProviders, setAllProviders] = useState([]); 
  
  // Search Inputs & Filters State Control
  const [cityInput, setCityInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [debouncedService, setDebouncedService] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Booking Specifications Form State Parameters
  const [timeHour, setTimeHour] = useState('10');
  const [timeMin, setTimeMin] = useState('00');
  const [timePeriod, setTimePeriod] = useState('AM');
  const [bookingData, setBookingData] = useState({ date: '', phone: '', address: '' });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // 🔥 Loader track state to block double checkout clicks loops
  const [isBookingProcessing, setIsBookingProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const categoriesList = ['All', 'Electrician', 'Home Repairs', 'Cleaning', 'Painting', 'Beauty & Spa'];

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  }, []);

  const fetchInitialProviders = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/api/users/providers`);
      setAllProviders(res.data || []);
    } catch (err) {
      console.error('Error fetching catalog data matrix channels.', err);
    }
  }, []);

  useEffect(() => {
    const timeoutHandler = setTimeout(() => {
      setDebouncedService(serviceInput);
    }, 300); 
    return () => clearTimeout(timeoutHandler);
  }, [serviceInput]);

  useEffect(() => {
    fetchInitialProviders();
    const socketClient = io('http://localhost:5000');
    socketClient.on('GLOBAL_DATABASE_MUTATION', () => {
      fetchInitialProviders();
    });
    return () => { socketClient.disconnect(); };
  }, [fetchInitialProviders]);

  const filteredProviders = useMemo(() => {
    let result = [...allProviders];
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.serviceType?.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    }
    if (cityInput && cityInput.trim() !== '') {
      result = result.filter(p => p.city?.toLowerCase().trim().includes(cityInput.toLowerCase().trim()));
    }
    if (debouncedService && debouncedService.trim() !== '') {
      const target = debouncedService.toLowerCase().trim();
      result = result.filter(p => p.serviceType?.toLowerCase().trim().includes(target) || p.name?.toLowerCase().trim().includes(target));
    }
    return result; 
  }, [selectedCategory, cityInput, debouncedService, allProviders]);

  const handleCardSelection = useCallback((provider) => {
    setSelectedProvider(provider);
  }, []);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (isBookingProcessing) return;
    if (!user) return showToast("Authentication Required!", "error");

    setIsBookingProcessing(true);
    try {
      await axios.post(`${baseURL}/api/bookings/create`, {
        customer: user.id,
        provider: selectedProvider._id,
        serviceType: selectedProvider.serviceType,
        date: bookingData.date,
        time: `${timeHour}:${timeMin} ${timePeriod}`,
        notes: `Address: ${bookingData.address} | Contact: ${bookingData.phone}`
      });
      showToast(`Booking allocated successfully! Notification sent.`, 'success');
      setSelectedProvider(null);
      setBookingData({ date: '', phone: '', address: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking allocation collapsed.', 'error');
    } finally {
      setIsBookingProcessing(false);
    }
  };

  // Sub-component wrapper for the actual Form implementation to maintain features parity
  const renderBookingForm = () => (
    <form onSubmit={handleBookSubmit} className="space-y-4">
      <div className="p-3 bg-slate-50 text-xs font-bold rounded-xl border border-orange-100 text-slate-700">
        Target Specialist: <span className="text-orange-600 font-black">{selectedProvider.name}</span>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Select Execution Date *</label>
        <input type="date" required disabled={isBookingProcessing} value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} className="w-full border p-2.5 text-xs rounded-xl outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white disabled:opacity-50" />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Select Ideal Timing *</label>
        <div className="grid grid-cols-3 gap-2">
          <select disabled={isBookingProcessing} value={timeHour} onChange={e => setTimeHour(e.target.value)} className="border p-2.5 text-xs rounded-xl font-bold bg-slate-50 disabled:opacity-50">
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select disabled={isBookingProcessing} value={timeMin} onChange={e => setTimeMin(e.target.value)} className="border p-2.5 text-xs rounded-xl font-bold bg-slate-50 disabled:opacity-50"><option value="00">00</option><option value="30">30</option></select>
          <select disabled={isBookingProcessing} value={timePeriod} onChange={e => setTimePeriod(e.target.value)} className="border p-2.5 text-xs rounded-xl font-bold bg-slate-50 disabled:opacity-50"><option value="AM">AM</option><option value="PM">PM</option></select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Contact Phone Number *</label>
        <input type="tel" required disabled={isBookingProcessing} value={bookingData.phone} placeholder="+91 XXXXX XXXXX" onChange={e => setBookingData({...bookingData, phone: e.target.value})} className="w-full border p-2.5 text-xs rounded-xl bg-slate-50 font-semibold focus:bg-white disabled:opacity-50" />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Complete Site Address Location *</label>
        <textarea required disabled={isBookingProcessing} value={bookingData.address} placeholder="House No, Landmark, Street specs..." onChange={e => setBookingData({...bookingData, address: e.target.value})} className="w-full border p-2.5 text-xs rounded-xl h-20 resize-none outline-none bg-slate-50 font-medium focus:bg-white disabled:opacity-50" />
      </div>
      {/* 🔥 INTEGRATED: Custom Liquid Blob Button wrapper with absolute design alignment config */}
      <BlobButton type="submit" isLoading={isBookingProcessing} className="mt-2 btn-wave-effect">
        Confirm Dispatch
      </BlobButton>
    </form>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans relative selection:bg-orange-500 selection:text-white">
      {toast.show && (
        <div className="fixed top-24 inset-x-0 z-[10000] flex justify-center items-center px-4 pointer-events-none animate-slide-in">
          <div className="bg-slate-900 text-white text-xs font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 pointer-events-auto max-w-sm">
            <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`} />
            <span className="leading-relaxed">{toast.message}</span>
          </div>
        </div>
      )}
      <Navbar />

      {/* CORE HERO SEARCH TERMINAL */}
      <div className="bg-[#0f172a] text-white py-14 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,138,0,0.1),transparent_50%)]"></div>
        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-2">Verified Professionals, At-Home Services <Sparkles className="text-orange-400" size={28}/></h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">Instant real-time booking matching network for maintenance and repair experts</p>
        
        <div className="mt-8 max-w-4xl mx-auto bg-white p-3 rounded-2xl flex flex-col md:flex-row gap-3 shadow-xl">
          <div className="flex-1 relative flex items-center">
            <MapPin size={18} className="absolute left-4 text-slate-400" />
            <input type="text" placeholder="Type city base... (e.g. gwalior)" value={cityInput} onChange={e => setCityInput(e.target.value)} className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-xl text-slate-900 text-sm font-semibold border border-slate-200 outline-none focus:bg-white focus:border-orange-500 transition" />
          </div>
          <div className="flex-1 relative flex items-center">
            <Search size={18} className="absolute left-4 text-slate-400" />
            <input type="text" placeholder="Search service category or name... (e.g. Electrician)" value={serviceInput} onChange={e => setServiceInput(e.target.value)} className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-xl text-slate-900 text-sm font-semibold border border-slate-200 outline-none focus:bg-white focus:border-orange-500 transition" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer active:animate-click-bounce duration-150 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'All' ? '📁 All Services' : cat}
                </button>
              ))}
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Rated Professionals (Ranked by Stars)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredProviders.map(p => (
                <ProviderCard key={p._id} provider={p} onSelect={handleCardSelection} />
              ))}
            </div>
            {filteredProviders.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-xs text-slate-400 font-bold uppercase tracking-wider">No verified experts found matching criteria.</div>
            )}
          </div>

          {/* DESKTOP SPECIFIC SIDEBAR PANEL */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow border border-slate-100 sticky top-24">
              <h3 className="text-md font-black mb-4 text-slate-900 uppercase tracking-wide">Allocation Specifications</h3>
              {selectedProvider ? (
                renderBookingForm()
              ) : (
                <p className="text-xs text-slate-400 text-center py-10 font-medium leading-relaxed">Select an approved active partner card from the directory to start booking mapping.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE & TABLET MODAL OVERLAY TRIGGER POPUP */}
      {selectedProvider && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProvider(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer focus:outline-none active:animate-click-bounce"
            >
              <X size={18} />
            </button>
            <h3 className="text-md font-black mb-4 text-slate-900 uppercase tracking-wide pr-6">Allocation Specifications</h3>
            {renderBookingForm()}
          </div>
        </div>
      )}
    </div>
  );
}