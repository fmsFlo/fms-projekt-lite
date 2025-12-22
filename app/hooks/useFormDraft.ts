import { useEffect } from 'react';

export function useFormDraft<T>(
  formId: string,
  watchedValues: T,
  isDirty: boolean
) {
  // Beim Mount: Lade Draft
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${formId}`);
    if (saved) {
      const data = JSON.parse(saved);
      return data; // Gib Daten zurück für reset()
    }
  }, [formId]);

  // Bei Änderungen: Speichere Draft
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(`draft_${formId}`, JSON.stringify(watchedValues));
    }
  }, [watchedValues, isDirty, formId]);

  // Cleanup Funktion
  const clearDraft = () => localStorage.removeItem(`draft_${formId}`);
  
  return { clearDraft };
}

