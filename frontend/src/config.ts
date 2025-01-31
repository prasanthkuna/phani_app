// Environment-specific configuration
const config = {
  // API URL - default to localhost for development, but can be overridden by environment variable
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  
  // Other configuration options can be added here
  withCredentials: true,
};

export default config; 