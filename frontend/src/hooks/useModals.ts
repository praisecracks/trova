import { useState } from 'react';

export function useModals() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [kycTriggerReason, setKycTriggerReason] = useState('Verify your identity to lock in higher payouts and transaction limits.');

  return {
    isModalOpen,
    setIsModalOpen,
    isKYCModalOpen,
    setIsKYCModalOpen,
    kycTriggerReason,
    setKycTriggerReason
  };
}
