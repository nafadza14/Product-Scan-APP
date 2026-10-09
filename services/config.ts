export const getApiKey = (): string => {
  const key = process.env.API_KEY;
  return typeof key === 'string' && key && key !== 'undefined' && key !== 'null' ? key : '';
};

export const getModel = () => process.env.GEMINI_MODEL || 'gemini-flash-latest';
