// Codes a shopper has found in the treasure hunt, remembered on this device only.
const KEY = 'chari_found_codes';

export const getFoundCodes = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(list)) return [];
    const now = Date.now();
    return list.filter((c) => c && c.code && (!c.expiresAt || new Date(c.expiresAt).getTime() > now));
  } catch {
    return [];
  }
};

export const saveFoundCode = (found) => {
  try {
    const list = getFoundCodes().filter((c) => c.code !== found.code && c.huntId !== found.huntId);
    list.unshift(found);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
};

export const hasFound = (huntId) => getFoundCodes().some((c) => c.huntId === huntId);
