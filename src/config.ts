export const config = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
  validateApiKey: () => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ No Open Router API key found. Please set VITE_OPENROUTER_API_KEY in .env.local');
      return false;
    }
    // Basic key format validation (adjust as needed)
    if (apiKey.length < 10) {
      console.error('❌ Invalid Open Router API key');
      return false;
    }
    return true;
  }
};