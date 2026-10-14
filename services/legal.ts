/** Privacy Policy and Terms live on the landing site; the app links there in its current language. */
const SITE = 'https://www.scanything.online';

export const legalUrl = (page: 'privacy' | 'terms') => {
  const lang = typeof document !== 'undefined' && document.documentElement.lang.startsWith('id') ? 'id' : 'en';
  return `${SITE}/${page}?lang=${lang}`;
};

/** Opens a legal page: the in-app browser in the native apps, a new tab on the web. */
export const openLegal = async (page: 'privacy' | 'terms') => {
  const url = legalUrl(page);
  const { isNative, openInAppBrowser } = await import('./native');
  if (isNative()) openInAppBrowser(url);
  else window.open(url, '_blank', 'noopener');
};
