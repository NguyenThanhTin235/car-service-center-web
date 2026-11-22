'use client';

import React from 'react';
import {
  DashboardStatusBreakdown,
  DashboardStatusBreakdownProps,
  BreakdownItem,
} from './DashboardStatusBreakdown';

export type DonutItem = BreakdownItem;
export type DashboardStatusDonutProps = DashboardStatusBreakdownProps;

/**
 * @deprecated Tuyệt đối không dùng biểu đồ tròn/quạt (Donut/Pie) trên Dashboard vì mắt thường không thể ước lượng diện tích hình quạt chính xác.
 * Component này tự động ánh xạ sang DashboardStatusBreakdown (Horizontal Bar & Segmented Progress Bar).
 */
export const DashboardStatusDonut: React.FC<DashboardStatusDonutProps> = (props) => {
  return <DashboardStatusBreakdown {...props} />;
};

export default DashboardStatusDonut;
