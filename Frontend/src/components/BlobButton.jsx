import React from 'react';

export default function BlobButton({ children, isLoading, disabled, type = "button", className = "", onClick }) {
  return (
    <div className={`blob-btn-container w-full ${className}`}>
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className="blob-btn w-full font-black text-xs uppercase tracking-widest py-3.5 px-6 text-[#0f172a] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            {/* Realtime dynamic material tailwind loader spinner loop */}
            <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing Entry...</span>
          </>
        ) : (
          children
        )}

        {/* Liquid Blobs Layout Structures */}
        <span className="blob-btn__inner">
          <span className="blob-btn__blobs">
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
          </span>
        </span>
      </button>

      {/* Reusable SVG Gooey Filter definitions link matrix */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" result="goo"></feColorMatrix>
            <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
          </filter>
        </defs>
      </svg>
    </div>
  );
}