import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Calendar, Clock, Star, ShoppingBag, CheckCircle, Hourglass } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'http://localhost:5000';

export default function CustomerDashboard() {
  const [myBookings, setMyBookings] = useState([]);
  const [activeRating, setActiveRating] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  }, []);

  const fetchCustomerBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/api/bookings?userId=${user.id}&role=customer`);
      const bookingsData = Array.isArray(res.data) ? res.data : [];
      setMyBookings(bookingsData);

      // Initialize ratings from DB (ratingGiven field)
      setActiveRating(prev => {
        const updated = { ...prev };
        bookingsData.forEach(b => {
          if (!updated[b._id] && b.ratingGiven > 0) {
            updated[b._id] = b.ratingGiven;
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Bookings fetch error:', err);
      showToast('Bookings load nahi hui.', 'error');
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    fetchCustomerBookings();
    const socket = io(API);
    socket.on('GLOBAL_DATABASE_MUTATION', fetchCustomerBookings);
    return () => socket.disconnect();
  }, [fetchCustomerBookings]);

  const submitProviderReview = async (bookingId, providerId, scoreValue) => {
    if (!bookingId || !providerId) {
      return showToast('Booking ya provider ID missing hai.', 'error');
    }
    if (submitting[bookingId]) return; // prevent double click

    setSubmitting(prev => ({ ...prev, [bookingId]: true }));

    try {
      await axios.post(`${API}/api/users/review/add`, {
        bookingId: String(bookingId),
        providerId: String(providerId),
        rating: Number(scoreValue),
      });

      setActiveRating(prev => ({ ...prev, [bookingId]: scoreValue }));
      showToast('Rating submit ho gayi! Shukriya.', 'success');
      fetchCustomerBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Rating submit nahi hui.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  if (!user) {
    return (
      <div className="p-10 font-bold text-center text-red-500">
        Unauthorized — pehle login karein.
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans relative selection:bg-orange-500 selection:text-white">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-24 right-5 z-[99999] flex items-center gap-3 p-4 rounded-xl shadow-2xl bg-slate-900 text-white text-xs font-bold border border-slate-800 max-w-sm animate-slide-in">
          <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'success' ? 'bg-emerald-400' : 'bg-orange-500'
          }`} />
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      )}

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">My Bookings</h2>
          <p className="text-sm text-slate-400 mt-1">Apni bookings track karein aur completed services ko rate karein</p>
        </div>

        <div className="space-y-6">
          {myBookings.map(b => {
            const currentRating = activeRating[b._id] || 0;
            // provider populated object ya raw ObjectId dono handle karo
            const providerId = b.provider?._id ?? b.provider;
            const providerName = b.provider?.name || 'Field Specialist';
            const price = b.pricePerHour ?? b.provider?.pricePerHour ?? 0;
            const isSubmitting = submitting[b._id] || false;

            return (
              <div
                key={b._id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition duration-200"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    {/* Status + Date/Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                        b.status === 'Pending'   ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        b.status === 'Accepted'  ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                   'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {b.status === 'Pending'   && <Hourglass size={10} />}
                        {b.status === 'Accepted'  && <ShoppingBag size={10} />}
                        {b.status === 'Completed' && <CheckCircle size={10} />}
                        {b.status}
                      </span>
                      <span className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1">
                        <Calendar size={12} /> {b.date} &nbsp;|&nbsp; <Clock size={12} /> {b.time}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-lg">
                      Specialist: {providerName}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Service: {b.serviceType}
                    </p>
                    {b.notes && (
                      <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {b.notes}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right sm:self-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 min-w-[120px]">
                    <span className="text-xl font-black text-slate-900 block">₹{price}</span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
                      COD Payment
                    </span>
                  </div>
                </div>

                {/* Rating Section — only for Completed bookings */}
                {b.status === 'Completed' && (
                  <div className="bg-gradient-to-r from-amber-50/40 to-orange-50/20 border border-dashed border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                        ⭐ Rate your experience
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentRating > 0
                          ? `Aapne ${currentRating} star diye hain — update kar sakte hain.`
                          : 'Star click karke rating dein.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-2 rounded-xl border shadow-sm">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => submitProviderReview(b._id, providerId, star)}
                          className={`transition active:scale-95 focus:outline-none p-0.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                            star <= currentRating
                              ? 'text-amber-400'
                              : 'text-slate-200 hover:text-orange-400'
                          }`}
                          title={`${star} star`}
                        >
                          <Star
                            size={22}
                            className={star <= currentRating ? 'fill-amber-400' : 'fill-none'}
                          />
                        </button>
                      ))}
                      {isSubmitting && (
                        <span className="text-[10px] text-slate-400 ml-1 animate-pulse">saving...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {myBookings.length === 0 && (
            <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-xs text-slate-400 font-bold uppercase tracking-wider">
              Abhi tak koi booking nahi hai.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}