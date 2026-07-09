import { fontStore } from './fontStore';

export const SETTINGS_STORAGE_KEY = 'fontEffects.settings';

export function saveSettingsToLocalStorage() {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(fontStore.toJSON()),
    );
  } catch (error) {
    console.warn('Unable to save FontEffects settings.', error);
  }
}

export function loadSettingsFromLocalStorage() {
  try {
    const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedValue == null) return false;

    return fontStore.loadJSON(JSON.parse(storedValue));
  } catch (error) {
    console.warn('Unable to load FontEffects settings.', error);
    return false;
  }
}
