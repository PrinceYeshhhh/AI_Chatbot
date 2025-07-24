import React, { useEffect } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
// import Joyride from 'react-joyride'; // Uncomment if using react-joyride

const steps = [
  { title: 'File Upload', content: 'Upload files to get started.' },
  { title: 'Chat', content: 'Chat with AI or query your files.' },
  { title: 'Model Switching', content: 'Switch between AI models.' },
  { title: 'Agent Workflows', content: 'Try out agent workflows.' },
];

export const OnboardingWalkthrough: React.FC = () => {
  const {
    hasCompletedOnboarding,
    onboardingProgress,
    setOnboardingProgress,
    completeOnboarding,
    refreshOnboarding,
  } = useOnboarding();

  useEffect(() => {
    refreshOnboarding();
    // eslint-disable-next-line
  }, []);

  const finishOnboarding = async () => {
    await setOnboardingProgress(steps.length);
    await completeOnboarding();
  };

  const nextStep = async () => {
    const next = onboardingProgress + 1;
    if (next < steps.length) {
      await setOnboardingProgress(next);
    } else {
      await finishOnboarding();
    }
  };

  const skip = async () => {
    await finishOnboarding();
  };

  if (hasCompletedOnboarding === null) return <div>Loading onboarding...</div>;
  if (hasCompletedOnboarding) return <div>Onboarding complete!</div>;
  return (
    <div className="onboarding-step" style={{ border: '2px solid #007bff', padding: 16, borderRadius: 8, background: '#f0f8ff' }}>
      <div style={{ marginBottom: 8 }}>
        Step {onboardingProgress + 1} of {steps.length}
      </div>
      <h3>{steps[onboardingProgress].title}</h3>
      <p>{steps[onboardingProgress].content}</p>
      <button onClick={nextStep}>{onboardingProgress === steps.length - 1 ? 'Done' : 'Next'}</button>
      <button onClick={skip} style={{ marginLeft: 8 }}>Skip</button>
    </div>
  );
}; 