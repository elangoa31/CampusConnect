import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/auth.types';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIntendedRole } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    setIntendedRole(role);
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-x-hidden font-sans bg-slate-950">
      {/* Background Aerial Ocean Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: 'url(/assets/images/ocean-aerial.jpg)',
        }}
      />
      {/* Dark Overlay with turquoise tint */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/80 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-radial from-teal-900/20 via-transparent to-black/50 pointer-events-none" />

      {/* Header with CampusConnect Wordmark */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 shadow-sm">
            <Compass className="w-5 h-5 text-teal-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
              CAMPUSCONNECT
            </span>
            <span className="text-[10px] uppercase tracking-widest text-teal-200/80 font-medium">
              Faculty Discovery & Availability
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-auto py-8 text-center space-y-8 sm:space-y-10">
        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight">
            Welcome to CampusConnect
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto font-normal">
            Choose how you want to access your campus.
          </p>
        </motion.div>

        {/* Two Selectable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto text-left">
          {/* CARD 1: STUDENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => handleSelectRole('student')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelectRole('student');
              }
            }}
            className="group relative bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/40 flex flex-col justify-between cursor-pointer hover:border-teal-500/50 hover:shadow-[0_25px_50px_-12px_rgba(13,92,88,0.25)] transition-all duration-200"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center border border-teal-100/80 group-hover:bg-[#0d5c58] group-hover:text-white transition-colors duration-200">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  I&apos;m a Student
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Find faculty members, check their availability and discover where to reach them.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('student');
                }}
                className="w-full py-3 px-4 bg-[#0d5c58] group-hover:bg-[#094340] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40"
              >
                <span>Continue as Student</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: STAFF */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => handleSelectRole('staff')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelectRole('staff');
              }
            }}
            className="group relative bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/40 flex flex-col justify-between cursor-pointer hover:border-teal-500/50 hover:shadow-[0_25px_50px_-12px_rgba(13,92,88,0.25)] transition-all duration-200"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center border border-teal-100/80 group-hover:bg-[#0d5c58] group-hover:text-white transition-colors duration-200">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  I&apos;m Faculty
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Manage your availability, update your location and keep students informed.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('staff');
                }}
                className="w-full py-3 px-4 bg-[#0d5c58] group-hover:bg-[#094340] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40"
              >
                <span>Continue as Staff</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center pb-2">
        <p className="text-xs text-teal-200/70 font-medium tracking-wide">
          Your campus, within reach.
        </p>
      </footer>
    </div>
  );
};
