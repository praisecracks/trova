import React from 'react';

interface HealthTabProps {
  theme?: 'dark' | 'light';
}

export function HealthTab({ theme }: HealthTabProps) {
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col gap-4">
      <div className={`p-5 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <h3 className={`text-sm font-bold mb-4 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Database
              </span>
              <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                Healthy
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[95%]"></div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                API
              </span>
              <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                Healthy
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[98%]"></div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Memory Usage
              </span>
              <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-yellow-100 text-yellow-700">
                Moderate
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 w-[60%]"></div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Uptime
              </span>
              <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                99.9%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[100%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
