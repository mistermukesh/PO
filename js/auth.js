// Session management and routing for POMS

const AUTH = {
  // Check if session exists (always true as auth is removed)
  isAuthenticated() {
    return true;
  },

  // Perform API verification check (URL validation only)
  async login(apiUrl) {
    if (!apiUrl) {
      throw new Error('API URL is required.');
    }

    const cleanUrl = apiUrl.replace(/\/$/, '');

    try {
      const response = await fetch(`${cleanUrl}?action=dashboard`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok. Please verify the URL.');
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        window.CONFIG.API_URL = cleanUrl;
        if (data.userEmail) window.CONFIG.USER_EMAIL = data.userEmail;
        if (data.userName) window.CONFIG.USER_NAME = data.userName;
        return true;
      } else {
        throw new Error(data.message || 'Verification failed.');
      }
    } catch (err) {
      console.error('Connection error:', err);
      throw new Error(err.message || 'Failed to connect to the Google Apps Script API. Make sure your Web App is deployed and "Anyone" has access.');
    }
  },

  // Clear connection settings
  logout() {
    localStorage.removeItem('poms_api_url');
    localStorage.removeItem('poms_user_email');
    localStorage.removeItem('poms_user_name');
    window.location.reload();
  },

  // Route guard: Redirect landing pages immediately to dashboard
  checkAuthAndRedirect() {
    const path = window.location.pathname;
    const isLogin = path.endsWith('index.html') || path === '/' || path.endsWith('/');
    if (isLogin) {
      window.location.href = 'dashboard.html';
    }
  }
};

window.AUTH = AUTH;
// Run check immediately
document.addEventListener('DOMContentLoaded', () => {
  AUTH.checkAuthAndRedirect();
});
