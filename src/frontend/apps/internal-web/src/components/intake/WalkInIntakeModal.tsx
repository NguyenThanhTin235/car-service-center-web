import React from 'react';
import BaseIntakeModal, { IntakeModalProps } from './BaseIntakeModal';

export default function WalkInIntakeModal(props: IntakeModalProps) {
  return <BaseIntakeModal {...props} mode="WALK_IN" />;
}
