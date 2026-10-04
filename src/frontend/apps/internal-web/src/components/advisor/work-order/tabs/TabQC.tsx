'use client';
import React from 'react';

export default function TabQC() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
      <span className="material-symbols-outlined text-[48px] text-outline mb-2">fact_check</span>
      <h3 className="text-title-md font-bold text-on-surface">Quality Control</h3>
      <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
        Perform final checks on completed jobs and ensure vehicle is ready.
      </p>
    </div>
  );
}
