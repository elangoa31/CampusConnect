import React from 'react';
import { motion } from 'framer-motion';
import { Compass, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isConfigured, error, setError } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Main Container: ~80-85% viewport, rounded-28px, clean premium card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[1240px] min-h-[82vh] lg:h-[84vh] bg-white rounded-[28px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12),0_0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row border border-slate-100"
      >
        {/* LEFT PANEL: Ocean aerial photo, logo at top-left, promotional text at bottom */}
        <div className="relative w-full lg:w-1/2 min-h-[320px] lg:min-h-full flex flex-col justify-between p-8 sm:p-10 lg:p-14 text-white overflow-hidden bg-slate-900 select-none">
          {/* Ocean Aerial Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: 'url(/assets/images/ocean-aerial.jpg)',
            }}
          />

          {/* Dark Overlay with turquoise tint for high contrast & elegance */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-900/65 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-radial from-teal-900/20 via-transparent to-black/40 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 shadow-sm">
              <Compass className="w-5 h-5 text-teal-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                CAMPUSCONNECT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-teal-200/80 font-medium">
                Faculty Discovery & Availability
              </span>
            </div>
          </div>

          {/* Bottom Promotional Text */}
          <div className="relative z-10 mt-auto pt-10 lg:pt-0 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.08] text-white uppercase"
            >
              YOUR CAMPUS.
              <br />
              <span className="text-teal-200">CONNECTED.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-4 space-y-2 text-slate-200 text-xs sm:text-sm font-light leading-relaxed"
            >
              <p className="font-medium text-slate-100">
                Find your faculty. Know their availability. Save your time.
              </p>
              <p className="text-slate-300 text-xs leading-normal">
                Stay connected with your college through real-time faculty availability and location updates.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-6 pt-3 border-t border-white/15 flex items-center gap-2 text-xs font-medium text-teal-300 tracking-wide"
            >
              <span className="w-5 h-0.5 bg-teal-400 rounded-full" />
              <span>Your campus, within reach.</span>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL: Pure white background, centered form (width approx 340-360px), generous whitespace */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
          {/* Supabase unconfigured warning banner */}
          {!isConfigured && (
            <div className="w-full max-w-[360px] mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5 shadow-sm">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Supabase credentials needed</span>
                <span className="text-[11px] text-amber-700 leading-tight block">
                  Add <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> to <code className="font-mono text-[10px]">.env</code> for live cloud authentication.
                </span>
              </div>
            </div>
          )}

          {/* Global error alert */}
          {error && (
            <div className="w-full max-w-[360px] mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start justify-between gap-2 shadow-sm animate-shake">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700 font-bold text-sm leading-none focus:outline-none"
              >
                &times;
              </button>
            </div>
          )}

          {/* Form wrapper */}
          <div className="w-full max-w-[350px] my-auto py-4">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
