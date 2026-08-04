// Configuration settings for POMS
const CONFIG = {
  get API_URL() {
    const stored = localStorage.getItem('poms_api_url');
    if (!stored || !stored.trim().startsWith('http')) {
      return 'https://script.google.com/macros/s/AKfycbz32ay0-WGFZzPwLmvpSX_hpNw4cDBAQ6bP2BI_4z3viCqhz3UOtj0VWEPLzgYUiyPQ/exec';
    }
    return stored;
  },
  set API_URL(val) {
    localStorage.setItem('poms_api_url', val);
  },
  get USER_EMAIL() {
    return localStorage.getItem('poms_user_email') || 'user@example.com';
  },
  set USER_EMAIL(val) {
    localStorage.setItem('poms_user_email', val);
  },
  get USER_NAME() {
    return localStorage.getItem('poms_user_name') || 'Authorized User';
  },
  set USER_NAME(val) {
    localStorage.setItem('poms_user_name', val);
  }
};
// Export CONFIG globally or as a module
window.CONFIG = CONFIG;
