'use client';

import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div
      data-testid="profile-loading-skeleton"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse"
    >
      {/* Left Identity Column */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-2.5 flex-1 w-full">
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-3.5 bg-slate-100 rounded w-4/5" />
              <div className="flex gap-2 pt-1">
                <div className="h-6 bg-slate-200 rounded-full w-24" />
                <div className="h-6 bg-slate-100 rounded-full w-20" />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 space-y-3.5">
            <div className="h-3.5 bg-slate-200 rounded w-32" />
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center justify-between">
                <div className="h-3.5 bg-slate-100 rounded w-24" />
                <div className="h-3.5 bg-slate-200 rounded w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Workspace Column */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex gap-3">
            <div className="h-9 bg-slate-200 rounded-xl w-36" />
            <div className="h-9 bg-slate-100 rounded-xl w-40" />
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-48" />
              <div className="h-3.5 bg-slate-100 rounded w-80 max-w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-24" />
                <div className="h-11 bg-slate-100 rounded-xl w-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-28" />
                <div className="h-11 bg-slate-100 rounded-xl w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-28" />
              <div className="h-11 bg-slate-100 rounded-xl w-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-24" />
              <div className="h-24 bg-slate-100 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
