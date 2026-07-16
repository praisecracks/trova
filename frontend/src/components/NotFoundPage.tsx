import React from 'react';

const NotFoundPage = ({ onGoHome }: { onGoHome?: () => void }) => {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-6xl font-extrabold text-zinc-400">404</span>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-zinc-400 text-sm">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        <button
          onClick={() => onGoHome ? onGoHome() : window.location.href = '/'}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-colors active:scale-98 cursor-pointer"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
