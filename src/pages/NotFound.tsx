import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, ArrowRight, Sparkles } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a14' }}>
      {/* Neon orbs */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: '#00D4FF' }} />
      <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ background: '#B24BF3' }} />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="text-center relative z-10 max-w-lg mx-auto px-4">
        {/* 404 number */}
        <div className="text-[10rem] font-bold leading-none mb-4 gradient-text-cyan-purple" style={{ fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
          404
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#f0f0ff' }}>
          הדף לא נמצא
        </h2>
        <p className="mb-8" style={{ color: 'rgba(160,160,210,0.6)' }}>
          הדף שחיפשת לא קיים או הוסר. חזור לדף הבית.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/home" className="btn-neon-cyan flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> חזור לדף הבית
          </Link>
          <Link to="/create" className="btn-ghost flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> צור סיכום
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
