'use client';

import React from 'react';

export default function AdvisorQCPortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Kiểm định chất lượng (QC)
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Danh sách các phương tiện chờ kiểm tra chất lượng (QC) sau khi sửa chữa.
          </p>
        </div>
      </div>
      
      <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant p-12 flex flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline">fact_check</span>
        <p className="text-headline-md font-headline-md text-on-surface-variant">Chức năng đang phát triển</p>
        <p className="text-body-sm font-body-sm text-outline max-w-md">
          Tính năng Waitlist cho Kiểm định chất lượng (QC) sẽ được xây dựng ở các Use Case tiếp theo.
        </p>
      </div>
    </div>
  );
}
