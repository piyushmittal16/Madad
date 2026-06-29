import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 🚀 PERFORMANCE CONCEPT: Code Splitting & Lazy Loading components bundles
const App = lazy(() => import('./App'));

// Shimmer Loader Component placeholder framework
const ShimmerFallback = () => (
  <div className="h-screen w-screen bg-slate-50 flex flex-col justify-center items-center gap-2 select-none">
    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin"></div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing App Infrastructure Core...</span>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <Suspense fallback={<ShimmerFallback />}>
    <App />
  </Suspense>
);