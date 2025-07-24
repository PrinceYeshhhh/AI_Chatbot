import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserOnboardingStatus, updateUserOnboardingStatus } from "../services/onboardingService";

interface OnboardingContextType {
  hasCompletedOnboarding: boolean | null;
  onboardingProgress: number;
  setOnboardingProgress: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [onboardingProgress, setOnboardingProgressState] = useState<number>(0);

  const refreshOnboarding = async () => {
    const status = await getUserOnboardingStatus();
    setHasCompletedOnboarding(status.has_completed_onboarding);
    setOnboardingProgressState(status.onboarding_progress || 0);
  };

  useEffect(() => {
    refreshOnboarding();
  }, []);

  const setOnboardingProgress = async (step: number) => {
    await updateUserOnboardingStatus({ onboarding_progress: step });
    setOnboardingProgressState(step);
  };

  const completeOnboarding = async () => {
    await updateUserOnboardingStatus({ has_completed_onboarding: true });
    setHasCompletedOnboarding(true);
  };

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, onboardingProgress, setOnboardingProgress, completeOnboarding, refreshOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return context;
}; 