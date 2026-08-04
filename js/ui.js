// UI Utilities and Component Loader for POMS

// Apply theme immediately to prevent dark-to-light screen flashing on load
(function() {
  const savedTheme = localStorage.getItem('poms_theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }
})();

const UI = {
  // Load common components (navbar, sidebar) and set up listeners
  async initLayout(pageTitle, pageSubtitle) {
    const sidebarContainer = document.getElementById('sidebar-container');
    const navbarContainer = document.getElementById('navbar-container');

    // 1. Load Sidebar
    if (sidebarContainer) {
      try {
        const res = await fetch('components/sidebar.html');
        if (res.ok) {
          sidebarContainer.innerHTML = await res.text();
          this.highlightActiveLink();
        }
      } catch (err) {
        console.error('Failed to load sidebar:', err);
      }
    }

    // 2. Load Navbar
    if (navbarContainer) {
      try {
        const res = await fetch('components/navbar.html');
        if (res.ok) {
          navbarContainer.innerHTML = await res.text();
          if (pageTitle) document.getElementById('nav-title').textContent = pageTitle;
          if (pageSubtitle) document.getElementById('nav-subtitle').textContent = pageSubtitle;

          // Set user details in profile section
          document.getElementById('profile-name').textContent = window.CONFIG.USER_NAME;
          document.getElementById('profile-email').textContent = window.CONFIG.USER_EMAIL;
          document.getElementById('profile-avatar').textContent = (window.CONFIG.USER_NAME || 'U').charAt(0).toUpperCase();

          // Bind theme toggle button
          this.setupThemeToggle();
        }
      } catch (err) {
        console.error('Failed to load navbar:', err);
      }
    }
  },

  // Setup theme toggle listener and persistence
  setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light-theme');
        localStorage.setItem('poms_theme', isLight ? 'light' : 'dark');
        this.showToast(`Switched to ${isLight ? 'Light' : 'Dark'} Mode`, 'info');
      });
    }
  },

  // Highlight current page in the sidebar
  highlightActiveLink() {
    const path = window.location.pathname;
    let activeId = 'link-dashboard';

    if (path.includes('create-po')) {
      activeId = 'link-create';
    }

    const activeLink = document.getElementById(activeId);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    // Remove toast after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s forwards cubic-bezier(0.18, -0.89, 0.32, 0.88)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  },

  // Loading indicator helper for buttons
  showLoader(buttonEl, text = 'Loading...') {
    if (!buttonEl) return;
    buttonEl.disabled = true;
    buttonEl.dataset.originalText = buttonEl.innerHTML;
    buttonEl.innerHTML = `<span class="spinner">⏳</span> ${text}`;
  },

  hideLoader(buttonEl, defaultText) {
    if (!buttonEl) return;
    buttonEl.disabled = false;
    buttonEl.innerHTML = defaultText || buttonEl.dataset.originalText || 'Submit';
  }
};

window.UI = UI;
