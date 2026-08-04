// API client for communicating with Google Apps Script Web App (POMS)

const API = {
  activeRequests: new Map(),

  async request(action, params = {}, method = 'GET') {
    const apiUrl = window.CONFIG.API_URL;

    if (!apiUrl || apiUrl.includes('YOUR_GA_SCRIPT_WEB_APP_URL')) {
      throw new Error('API URL is not configured. Please set CONFIG.API_URL in js/config.js.');
    }

    const url = new URL(apiUrl);
    url.searchParams.append('action', action);

    const options = {
      method: 'GET',
      redirect: 'follow'
    };

    if (method === 'GET') {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    } else {
      options.method = 'POST';
      options.headers = {
        'Content-Type': 'text/plain;charset=utf-8'
      };
      options.body = JSON.stringify({
        action: action,
        ...params
      });
    }

    try {
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html') || responseText.includes('Service Login')) {
          throw new Error('Deployment Permission Error: Please update Google Apps Script Web App deployment -> "Who has access" set to "Anyone".');
        }
        throw new Error('Invalid JSON response from Google Apps Script server.');
      }
      
      if (result && result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'API transaction failed');
      }
    } catch (err) {
      console.error(`API request failed [${action}]:`, err);
      throw err;
    }
  },

  async getDashboard() {
    return this.request('dashboard');
  },

  async listPOs() {
    return this.request('listPO');
  },

  async getPO(poNo) {
    return this.request('getPO', { id: poNo });
  },

  async createPO(poData) {
    return this.request('createPO', { po: poData }, 'POST');
  },

  async updatePO(poNo, poData) {
    return this.request('updatePO', { id: poNo, po: poData }, 'POST');
  },

  async deletePO(poNo, deletedBy) {
    return this.request('deletePO', { id: poNo, deletedBy: deletedBy }, 'POST');
  },

  async sendPOEmail(poNo, recipientEmail) {
    return this.request('sendEmail', { id: poNo, email: recipientEmail }, 'POST');
  }
};

window.API = API;
