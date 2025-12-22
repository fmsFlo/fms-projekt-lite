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
      // Daten werden geladen, aber nicht über return zurückgegeben
      // Der Hook gibt nur clearDraft zurück
      // Die Daten müssen vom aufrufenden Component selbst geladen werden
    }
    // Kein return - useEffect gibt nichts zurück (oder undefined)
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

