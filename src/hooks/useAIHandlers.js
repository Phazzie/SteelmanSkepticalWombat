import { useState } from 'react';
import { getBSAnalysis, getEmergencyWombat } from '../services/ai';

export function useAIHandlers(setNotification) {
  const [isAiLoading, setIsAiLoading] = useState(null);

  const handleBSMeter = async text => {
    setIsAiLoading('bs-meter');
    const result = await getBSAnalysis(text);
    setNotification({ show: true, message: result || 'The Wombat is speechless.', type: 'info' });
    setIsAiLoading(null);
  };

  const handleEmergencyWombat = async () => {
    setIsAiLoading('emergency');
    const result = await getEmergencyWombat();
    setNotification({ show: true, message: result || 'The Wombat is on a coffee break.', type: 'info' });
    setIsAiLoading(null);
  };

  return { isAiLoading, setIsAiLoading, handleBSMeter, handleEmergencyWombat };
}
