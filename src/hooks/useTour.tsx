import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  disableBeacon?: boolean;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (tourName: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  setSteps: (steps: TourStep[]) => void;
  hasCompletedTour: (tourName: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [currentTourName, setCurrentTourName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCompletedTours();
    }
  }, [user]);

  const loadCompletedTours = async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(`tours_completed_${user.id}`);
    if (stored) {
      setCompletedTours(JSON.parse(stored));
    }
  };

  const markTourCompleted = async (tourName: string) => {
    if (!user) return;
    
    const updated = [...new Set([...completedTours, tourName])];
    setCompletedTours(updated);
    localStorage.setItem(`tours_completed_${user.id}`, JSON.stringify(updated));
  };

  const startTour = (tourName: string) => {
    setCurrentTourName(tourName);
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTour = () => {
    if (currentTourName) {
      markTourCompleted(currentTourName);
    }
    setIsActive(false);
    setCurrentStep(0);
    setCurrentTourName(null);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    endTour();
  };

  const hasCompletedTour = (tourName: string) => {
    return completedTours.includes(tourName);
  };

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        setSteps,
        hasCompletedTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
