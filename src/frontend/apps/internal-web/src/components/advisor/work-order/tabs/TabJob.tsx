'use client';
import React from 'react';

export default function TabJob() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
      <span className="material-symbols-outlined text-[48px] text-outline mb-2">build</span>
      <h3 className="text-title-md font-bold text-on-surface">Job Management</h3>
      <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
        Define repair jobs, assign technicians, and track labour hours here.
      </p>
    </div>
  );
}
