import { useEffect, useRef, useCallback } from 'react';
import { FormPersistence } from '@/lib/persistence';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseFormPersistenceOptions {
  formId: string;
  autosaveDelay?: number;
  enabled?: boolean;
}

export function useFormPersistence<T extends Record<string, any>>(
  formData: T,
  setFormData: (data: T) => void,
  options: UseFormPersistenceOptions
) {
  const { formId, autosaveDelay = 2000, enabled = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const autosaveTimerRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (!enabled || hasLoadedRef.current) return;

    const draft = FormPersistence.loadDraft<T>(formId, user?.id);
    if (draft) {
      setFormData(draft);
      hasLoadedRef.current = true;
      
      toast({
        title: 'Draft Restored',
        description: 'Your previous work has been restored.',
      });
    }
  }, [formId, user?.id, enabled, setFormData, toast]);

  // Auto-save on changes
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(formData);
    
    // Skip if no changes
    if (currentData === lastSavedRef.current) return;

    // Clear previous timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Schedule save
    autosaveTimerRef.current = setTimeout(() => {
      FormPersistence.saveDraft(formId, formData, user?.id);
      lastSavedRef.current = currentData;
    }, autosaveDelay);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, formId, user?.id, autosaveDelay, enabled]);

  const clearDraft = useCallback(() => {
    FormPersistence.clearDraft(formId);
    lastSavedRef.current = '';
  }, [formId]);

  const saveDraftNow = useCallback(() => {
    if (!enabled) return;
    
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    FormPersistence.saveDraft(formId, formData, user?.id);
    lastSavedRef.current = JSON.stringify(formData);
  }, [formData, formId, user?.id, enabled]);

  return {
    clearDraft,
    saveDraftNow,
  };
}
