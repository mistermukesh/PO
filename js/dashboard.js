// Dashboard controller for POMS

const DASHBOARD = {
  allPOs: [],
  filteredPOs: [],

  // Initialize Dashboard Page
  async init() {
    this.setupListeners();
    await this.loadDashboardData();
  },

  // Setup dashboard controls listeners
  setupListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFiltersAndSort());
    }

    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', () => this.applyFiltersAndSort());
    }

    const filterSupplier = document.getElementById('filter-supplier');
    if (filterSupplier) {
      filterSupplier.addEventListener('change', () => this.applyFiltersAndSort());
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.applyFiltersAndSort());
    }
  },

  // Load metrics & table records
  async loadDashboardData() {
    const mainTableBody = document.getElementById('po-list-rows');
    if (mainTableBody) {
      mainTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;"><span class="spinner">⏳</span> Fetching latest PO data...</td></tr>`;
    }

    try {
      // 1. Fetch dashboard statistics & PO list
      const stats = await window.API.getDashboard();
      this.allPOs = stats.purchaseOrders || [];

      // Update KPI Cards
      document.getElementById('stat-total-count').textContent = stats.totalCount || 0;
      document.getElementById('stat-today-count').textContent = stats.todayCount || 0;
      document.getElementById('stat-monthly-total').textContent = '₹' + window.UTILS.formatIndianCurrency(stats.monthlyTotal || 0);

      // Populate Supplier Filter dropdown
      this.populateSupplierFilter();

      // Render PO Table
      this.applyFiltersAndSort();

    } catch (err) {
      window.UI.showToast(err.message || 'Failed to load dashboard data. Please check connections.', 'error');
      if (mainTableBody) {
        mainTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 40px;">⚠️ Error loading POs.</td></tr>`;
      }
    }
  },

  // Populates unique suppliers in the filter dropdown
  populateSupplierFilter() {
    const filterSup = document.getElementById('filter-supplier');
    if (!filterSup) return;

    // Extract unique supplier names
    const suppliers = [...new Set(this.allPOs.map(po => po.supplierName).filter(Boolean))];
    
    filterSup.innerHTML = '<option value="">All Suppliers</option>' + 
      suppliers.map(sup => `<option value="${encodeURIComponent(sup)}">${sup}</option>`).join('');
  },

  // Apply filters and sort to `allPOs` and render
  applyFiltersAndSort() {
    // 1. Search Query
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    
    // 2. Filters
    const statusVal = document.getElementById('filter-status')?.value || '';
    const supplierVal = decodeURIComponent(document.getElementById('filter-supplier')?.value || '');

    this.filteredPOs = this.allPOs.filter(po => {
      // Search matches PO NO, Supplier, GST, Date, Amount, Status
      const matchSearch = !searchVal || 
        po.poNo.toLowerCase().includes(searchVal) ||
        (po.supplierName || '').toLowerCase().includes(searchVal) ||
        (po.supplierGstin || '').toLowerCase().includes(searchVal) ||
        (po.poDate || '').toLowerCase().includes(searchVal) ||
        (po.grandTotal || '').toString().includes(searchVal) ||
        (po.status || '').toLowerCase().includes(searchVal);

      const matchStatus = !statusVal || po.status === statusVal;
      const matchSupplier = !supplierVal || po.supplierName === supplierVal;

      return matchSearch && matchStatus && matchSupplier;
    });

    // 3. Sorting
    const sortVal = document.getElementById('sort-select')?.value || 'newest';
    this.filteredPOs.sort((a, b) => {
      if (sortVal === 'newest') {
        return new Date(b.poDate) - new Date(a.poDate);
      } else if (sortVal === 'oldest') {
        return new Date(a.poDate) - new Date(b.poDate);
      } else if (sortVal === 'supplier') {
        return (a.supplierName || '').localeCompare(b.supplierName || '');
      } else if (sortVal === 'ponumber') {
        return (a.poNo || '').localeCompare(b.poNo || '');
      } else if (sortVal === 'amount') {
        return b.grandTotal - a.grandTotal;
      }
      return 0;
    });

    this.renderPOTable();
  },

  // Render HTML table rows
  renderPOTable() {
    const tableBody = document.getElementById('po-list-rows');
    if (!tableBody) return;

    if (this.filteredPOs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">No Purchase Orders found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = this.filteredPOs.map((po) => {
      const formattedDate = window.UTILS.formatDate(po.poDate);
      const formattedAmt = '₹' + window.UTILS.formatIndianCurrency(po.grandTotal);

      return `
        <tr>
          <td><a href="view-po.html?id=${encodeURIComponent(po.poNo)}" style="color: var(--accent-color); font-weight: 700; text-decoration: none;">${po.poNo}</a></td>
          <td>${formattedDate}</td>
          <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${po.supplierName || ''}</td>
          <td>${formattedAmt}</td>
          <td>
            <div style="display: flex; gap: 8px; align-items: center;">
              <a href="view-po.html?id=${encodeURIComponent(po.poNo)}" class="btn btn-secondary btn-sm">👁️ View</a>
              <a href="${po.directDownloadLink || '#'}" class="btn btn-secondary btn-sm" target="_blank" ${!po.directDownloadLink ? 'disabled style="opacity: 0.5;"' : ''}>📥 Download</a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
};

window.DASHBOARD = DASHBOARD;
