import React from 'react';
import BaseIntakeModal, { IntakeModalProps } from './BaseIntakeModal';

export default function TowInIntakeModal(props: IntakeModalProps) {
  return <BaseIntakeModal {...props} mode="TOW_IN" />;
}
