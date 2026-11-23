'use client';
import React from 'react';
import ReadOnlyROModal from '@/components/intake/ReadOnlyROModal';

interface StaffWorkOrderDetailModalProps {
  workOrderId: number;
  onClose: () => void;
}

export default function StaffWorkOrderDetailModal({
  workOrderId,
  onClose,
}: StaffWorkOrderDetailModalProps) {
  return <ReadOnlyROModal workOrderId={workOrderId} onClose={onClose} />;
}

