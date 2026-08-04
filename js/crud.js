// CRUD logic for POMS Create and Edit Forms

const CRUD = {
  activeItems: [],
  currentTaxType: 'CGST_SGST',
  defaultTerms: `1. Prices are Ex-Works (EXW). GST will be applicable as per government norms, if not mentioned as inclusive.
2. 40% advance payment is required to initiate the order.
3. Remaining 60% balance must be paid before dispatch of material.
4. Advance payment is non-refundable once the work has been initiated.
5. Delivery timeline is 15-25 working days from receipt of advance, subject to project scope.`,

  signatories: [
    { name: 'Adarsh Mishra', designation: 'Sr. Purchase Executive', signUrl: 'https://i.imgur.com/gK9RzUp.png', stampUrl: 'https://i.imgur.com/kP4U5e3.png' }
  ],

  // Initialize Create PO Form
  initCreateForm() {
    this.activeItems = [];
    this.setDefaultValues();
    this.setupFormListeners();

    // Check if there is duplicate data from sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('duplicate') === '1') {
      try {
        const raw = sessionStorage.getItem('duplicate_po');
        if (raw) {
          const poData = JSON.parse(raw);
          sessionStorage.removeItem('duplicate_po');
          this.populateFormFields(poData);
          window.UI.showToast('Populated fields from duplicated PO. Verify and save.', 'info');
          return;
        }
      } catch (err) {
        console.error('Failed to parse duplicated PO:', err);
      }
    }

    this.addRow(); // Add first default empty row if not duplicating
  },

  // Initialize Edit PO Form
  async initEditForm(poNo) {
    if (!poNo) {
      window.UI.showToast('No PO Number specified for editing.', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
      return;
    }
    this.setupFormListeners();
    await this.loadPODataForEditing(poNo);
  },

  // Set default starting values in fields
  setDefaultValues() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('po-date');
    if (dateInput) dateInput.value = today;

    // Load default terms dynamically as line items
    const termsContainer = document.getElementById('terms-list');
    if (termsContainer) {
      termsContainer.innerHTML = '';
      const defaultTermsArray = this.defaultTerms.split('\n');
      defaultTermsArray.forEach(term => {
        const cleanTerm = term.replace(/^\d+\.\s*/, '');
        this.addTermRow(cleanTerm);
      });
    }
    
    // Default invoice details (KAN Universal)
    const invName = document.getElementById('inv-name');
    if (invName) invName.textContent = 'KAN UNIVERSAL PVT. LTD.';
    const invAddress = document.getElementById('inv-address');
    if (invAddress) invAddress.innerHTML = '1ST FLOOR, HOUSE NO 367, BHARAT NAGAR ROAD,<br>KOTHI WALA BAGH, ASHOK VIHAR PH 4, NEW DELHI 110052<br>GSTIN: 07AAECK5460B1ZU<br>CIN: U51395DL2011PTC227598<br>Email: info@onmail.com<br>Pan No : AAECK5460B<br>Contact : In/xxx';
  },

  // Populate HTML Form Fields with PO object
  populateFormFields(poData) {
    if (!poData) return;

    // General Info
    const poDateInput = document.getElementById('po-date');
    if (poDateInput && poData.poDate) poDateInput.value = poData.poDate.split('T')[0];
    
    // Supplier
    document.getElementById('sup-name').value = poData.supplierName || '';
    document.getElementById('sup-address').value = poData.supplierAddress || '';
    document.getElementById('sup-gstin').value = poData.supplierGstin || '';
    document.getElementById('sup-pan').value = poData.supplierPan || '';
    document.getElementById('sup-cin').value = poData.supplierCin || '';
    document.getElementById('sup-email').value = poData.supplierEmail || '';
    document.getElementById('sup-phone').value = poData.supplierPhone || '';
    document.getElementById('sup-contact-person').value = poData.supplierContactPerson || '';

    // Consignee
    document.getElementById('ship-name').value = poData.shipToName || '';
    document.getElementById('ship-address').value = poData.shipToAddress || '';
    document.getElementById('ship-gstin').value = poData.shipToGstin || '';
    document.getElementById('ship-pan').value = poData.shipToPan || '';
    document.getElementById('ship-cin').value = poData.shipToCin || '';
    document.getElementById('ship-email').value = poData.shipToEmail || '';
    document.getElementById('ship-phone').value = poData.shipToPhone || '';


    document.getElementById('show-others').checked = poData.showOthers !== undefined ? poData.showOthers : true;
    document.getElementById('show-freight').checked = poData.showFreight !== undefined ? poData.showFreight : true;
    document.getElementById('show-loading').checked = poData.showLoading !== undefined ? poData.showLoading : true;
    document.getElementById('show-unloading').checked = poData.showUnloading !== undefined ? poData.showUnloading : true;
    document.getElementById('show-packing').checked = poData.showPacking !== undefined ? poData.showPacking : true;

    document.getElementById('freight').value = poData.rawFreight !== undefined ? poData.rawFreight : (poData.freight || 0);
    document.getElementById('loading').value = poData.rawLoading !== undefined ? poData.rawLoading : (poData.loading || 0);
    document.getElementById('unloading').value = poData.rawUnloading !== undefined ? poData.rawUnloading : (poData.unloading || 0);
    document.getElementById('packing').value = poData.rawPacking !== undefined ? poData.rawPacking : (poData.packing || 0);
    document.getElementById('others').value = poData.rawOthers !== undefined ? poData.rawOthers : (poData.others || 0);

    // Auto-expand breakdown panel if any values exist
    const hasDetails = (poData.freight || poData.loading || poData.unloading || poData.packing || 
                        poData.rawFreight || poData.rawLoading || poData.rawUnloading || poData.rawPacking);
    if (hasDetails) {
      const panel = document.getElementById('others-breakdown-panel');
      const btn = document.getElementById('toggle-others-breakdown-btn');
      if (panel && btn) {
        panel.style.display = 'grid';
        btn.textContent = 'Close Breakdown ❌';
      }
    }

    // Taxes Config
    this.currentTaxType = 'CGST_SGST';
    document.getElementById('cgst-rate').value = poData.cgstRate !== undefined ? poData.cgstRate : 9;
    document.getElementById('sgst-rate').value = poData.sgstRate !== undefined ? poData.sgstRate : 9;
    
    this.toggleGstRateFields(this.currentTaxType);

    // Terms
    const termsContainer = document.getElementById('terms-list');
    if (termsContainer) {
      termsContainer.innerHTML = '';
      const termsStr = poData.terms || this.defaultTerms;
      const lines = termsStr.split('\n');
      lines.forEach(line => {
        if (line.trim() !== '') {
          const cleanTerm = line.replace(/^\d+\.\s*/, '');
          this.addTermRow(cleanTerm);
        }
      });
    }

    // Populate Items
    const productBody = document.getElementById('product-rows');
    if (productBody) {
      productBody.innerHTML = '';
      if (poData.items && poData.items.length > 0) {
        poData.items.forEach(item => this.addRow(item));
      } else {
        this.addRow();
      }
    }

    this.triggerRecalculation();
  },

  // Setup Form event handlers
  setupFormListeners() {
    // Add row button
    const addRowBtn = document.getElementById('add-row-btn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', () => this.addRow());
    }

    // Dynamic row inputs changes
    const productBody = document.getElementById('product-rows');
    if (productBody) {
      productBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-rate')) {
          this.triggerRecalculation();
        }
      });
    }

    // Charges input changes
    const chargeInputs = ['discount', 'others', 'freight', 'loading', 'unloading', 'packing', 'insurance', 'tax-type', 'cgst-rate', 'sgst-rate', 'igst-rate'];
    chargeInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.triggerRecalculation());
      }
    });

    // GSTIN triggers for auto tax determination
    const supGstin = document.getElementById('sup-gstin');
    const shipGstin = document.getElementById('ship-gstin');
    if (supGstin && shipGstin) {
      const handleGstinChange = () => {
        const determined = window.CALCULATION.autoDetermineTaxType(supGstin.value, shipGstin.value);
        this.currentTaxType = determined;
        this.toggleGstRateFields(determined);
        this.triggerRecalculation();
      };
      supGstin.addEventListener('input', handleGstinChange);
      shipGstin.addEventListener('input', handleGstinChange);
    }

    // Add term row button
    const addTermBtn = document.getElementById('add-term-btn');
    if (addTermBtn) {
      addTermBtn.addEventListener('click', () => this.addTermRow());
    }

    // Others breakdown panel toggle
    const toggleBreakdownBtn = document.getElementById('toggle-others-breakdown-btn');
    const breakdownPanel = document.getElementById('others-breakdown-panel');
    if (toggleBreakdownBtn && breakdownPanel) {
      toggleBreakdownBtn.addEventListener('click', () => {
        const isHidden = breakdownPanel.style.display === 'none';
        breakdownPanel.style.display = isHidden ? 'grid' : 'none';
        toggleBreakdownBtn.textContent = isHidden ? 'Close Breakdown ❌' : 'Breakdown ⚙️';
      });
    }

    // Dynamic updates from breakdown fields to 'others' total
    const breakdownInputs = document.querySelectorAll('.breakdown-input');
    breakdownInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateOthersFromBreakdown();
      });
    });

    // Checkbox changes trigger recalculation
    const chargeCbs = ['show-others', 'show-freight', 'show-loading', 'show-unloading', 'show-packing'];
    chargeCbs.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) {
        cb.addEventListener('change', () => {
          this.updateOthersFromBreakdown();
        });
      }
    });

    // Form submit
    const poForm = document.getElementById('po-form');
    if (poForm) {
      poForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitPOForm();
      });
    }
  },

  // Toggle GST input fields based on selected tax type (enforced CGST+SGST)
  toggleGstRateFields(taxType) {
    const cgstGroup = document.getElementById('cgst-rate-group');
    const sgstGroup = document.getElementById('sgst-rate-group');

    if (cgstGroup) cgstGroup.style.display = 'block';
    if (sgstGroup) sgstGroup.style.display = 'block';
  },

  // Add a new row to the dynamic product table
  addRow(data = {}) {
    const productBody = document.getElementById('product-rows');
    if (!productBody) return;

    const rowId = 'row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const rowHTML = `
      <tr id="${rowId}" class="product-row">
        <td class="s-no" style="width: 50px; text-align: center; font-weight: 600;">00</td>
        <td>
          <input type="text" class="form-control item-desc" placeholder="Item Name/Description" required value="${data.description || ''}">
        </td>
        <td>
          <input type="text" class="form-control item-specs" placeholder="Specifications" value="${data.specifications || ''}">
        </td>
        <td>
          <input type="text" class="form-control item-brand" placeholder="Brand" value="${data.brand || ''}">
        </td>
        <td style="width: 100px;">
          <input type="number" step="any" min="0" class="form-control item-qty" placeholder="Qty" required value="${data.qty || ''}">
        </td>
        <td style="width: 100px;">
          <select class="form-control item-unit">
            <option value="Pcs" ${data.unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
            <option value="Mtr" ${data.unit === 'Mtr' ? 'selected' : ''}>Mtr</option>
            <option value="Box" ${data.unit === 'Box' ? 'selected' : ''}>Box</option>
            <option value="Set" ${data.unit === 'Set' ? 'selected' : ''}>Set</option>
            <option value="Kg" ${data.unit === 'Kg' ? 'selected' : ''}>Kg</option>
          </select>
        </td>
        <td style="width: 130px;">
          <input type="number" step="any" min="0" class="form-control item-rate" placeholder="Rate" required value="${data.rate || ''}">
        </td>
        <td style="width: 130px; font-weight: 600; text-align: right; vertical-align: middle;">
          <span class="row-amount">₹0.00</span>
        </td>
        <td style="width: 100px; text-align: center;">
          <div class="row-actions">
            <button type="button" class="btn-icon duplicate-row-btn" title="Duplicate Row">📋</button>
            <button type="button" class="btn-icon delete delete-row-btn" title="Delete Row">🗑️</button>
          </div>
        </td>
      </tr>
    `;

    productBody.insertAdjacentHTML('beforeend', rowHTML);
    this.updateSNo();

    // Hook buttons inside this row
    const rowEl = document.getElementById(rowId);
    rowEl.querySelector('.delete-row-btn').addEventListener('click', () => {
      this.deleteRow(rowId);
    });
    rowEl.querySelector('.duplicate-row-btn').addEventListener('click', () => {
      this.duplicateRow(rowEl);
    });

    this.triggerRecalculation();
  },

  // Delete a specific row
  deleteRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
      row.remove();
      this.updateSNo();
      this.triggerRecalculation();
    }
  },

  // Duplicate a specific row
  duplicateRow(rowEl) {
    const data = {
      description: rowEl.querySelector('.item-desc').value,
      specifications: rowEl.querySelector('.item-specs').value,
      brand: rowEl.querySelector('.item-brand').value,
      qty: rowEl.querySelector('.item-qty').value,
      unit: rowEl.querySelector('.item-unit').value,
      rate: rowEl.querySelector('.item-rate').value
    };
    this.addRow(data);
  },

  // Update serial numbers on rows
  updateSNo() {
    const rows = document.querySelectorAll('.product-row');
    rows.forEach((row, index) => {
      const sNoCell = row.querySelector('.s-no');
      if (sNoCell) {
        sNoCell.textContent = String(index + 1).padStart(2, '0');
      }
    });
  },

  // Add a new term row to the dynamic terms list
  addTermRow(val = '') {
    const termsContainer = document.getElementById('terms-list');
    if (!termsContainer) return;

    const rowId = 'term-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const rowHTML = `
      <div id="${rowId}" class="term-row" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
        <span class="term-sno" style="font-weight: 600; min-width: 24px; color: var(--text-primary);">0</span>
        <input type="text" class="form-control term-text" placeholder="Enter Term & Condition" required value="${val}">
        <button type="button" class="btn btn-danger btn-sm term-delete-btn" style="padding: 10px 14px;" title="Delete Term">🗑️</button>
      </div>
    `;

    termsContainer.insertAdjacentHTML('beforeend', rowHTML);
    this.updateTermsSNo();

    // Hook delete button inside this row
    const rowEl = document.getElementById(rowId);
    rowEl.querySelector('.term-delete-btn').addEventListener('click', () => {
      rowEl.remove();
      this.updateTermsSNo();
    });
  },

  // Update serial numbers on terms list
  updateTermsSNo() {
    const rows = document.querySelectorAll('.term-row');
    rows.forEach((row, index) => {
      const sno = row.querySelector('.term-sno');
      if (sno) sno.textContent = index + 1;
    });
  },

  // Calculate Others sum from detailed breakdown inputs
  updateOthersFromBreakdown() {
    const freight = parseFloat(document.getElementById('freight').value) || 0;
    const loading = parseFloat(document.getElementById('loading').value) || 0;
    const unloading = parseFloat(document.getElementById('unloading').value) || 0;
    const packing = parseFloat(document.getElementById('packing').value) || 0;
    const insurance = parseFloat(document.getElementById('insurance').value) || 0;
    
    const total = freight + loading + unloading + packing + insurance;
    const othersInput = document.getElementById('others');
    if (othersInput) {
      othersInput.value = total;
    }
    this.triggerRecalculation();
  },

  // Collect form state data
  getFormData() {
    const items = [];
    document.querySelectorAll('.product-row').forEach(row => {
      items.push({
        description: row.querySelector('.item-desc').value.trim(),
        specifications: row.querySelector('.item-specs').value.trim(),
        brand: row.querySelector('.item-brand').value.trim(),
        qty: parseFloat(row.querySelector('.item-qty').value) || 0,
        unit: row.querySelector('.item-unit').value,
        rate: parseFloat(row.querySelector('.item-rate').value) || 0
      });
    });

    const poData = {
      // General Info
      poDate: document.getElementById('po-date').value,
      paymentTerms: '',
      deliveryTimeline: '',
      currency: 'INR',
      remarks: '',
      
      // Supplier Details
      supplierName: document.getElementById('sup-name').value.trim(),
      supplierAddress: document.getElementById('sup-address').value.trim(),
      supplierGstin: document.getElementById('sup-gstin').value.trim().toUpperCase(),
      supplierPan: document.getElementById('sup-pan').value.trim().toUpperCase(),
      supplierCin: document.getElementById('sup-cin').value.trim().toUpperCase(),
      supplierEmail: document.getElementById('sup-email').value.trim(),
      supplierPhone: document.getElementById('sup-phone').value.trim(),
      supplierContactPerson: document.getElementById('sup-contact-person').value.trim(),

      // Shipping details
      shipToName: document.getElementById('ship-name').value.trim(),
      shipToAddress: document.getElementById('ship-address').value.trim(),
      shipToGstin: document.getElementById('ship-gstin').value.trim().toUpperCase(),
      shipToPan: document.getElementById('ship-pan').value.trim().toUpperCase(),
      shipToCin: document.getElementById('ship-cin').value.trim().toUpperCase(),
      shipToEmail: document.getElementById('ship-email').value.trim(),
      shipToPhone: document.getElementById('ship-phone').value.trim(),

      // Items Array
      items: items,

      // Extra Charges
      discount: 0,
      others: (function() {
        const showOthers = document.getElementById('show-others').checked;
        if (!showOthers) return 0;
        
        const freightVal = parseFloat(document.getElementById('freight').value) || 0;
        const loadingVal = parseFloat(document.getElementById('loading').value) || 0;
        const unloadingVal = parseFloat(document.getElementById('unloading').value) || 0;
        const packingVal = parseFloat(document.getElementById('packing').value) || 0;
        
        const showFreight = document.getElementById('show-freight').checked;
        const showLoading = document.getElementById('show-loading').checked;
        const showUnloading = document.getElementById('show-unloading').checked;
        const showPacking = document.getElementById('show-packing').checked;
        
        let val = 0;
        if (!showFreight) val += freightVal;
        if (!showLoading) val += loadingVal;
        if (!showUnloading) val += unloadingVal;
        if (!showPacking) val += packingVal;
        return val;
      })(),
      freight: document.getElementById('show-freight').checked ? (parseFloat(document.getElementById('freight').value) || 0) : 0,
      loading: document.getElementById('show-loading').checked ? (parseFloat(document.getElementById('loading').value) || 0) : 0,
      unloading: document.getElementById('show-unloading').checked ? (parseFloat(document.getElementById('unloading').value) || 0) : 0,
      packing: document.getElementById('show-packing').checked ? (parseFloat(document.getElementById('packing').value) || 0) : 0,
      insurance: 0,

      // Save states for edit/duplicate population
      showOthers: document.getElementById('show-others').checked,
      showFreight: document.getElementById('show-freight').checked,
      showLoading: document.getElementById('show-loading').checked,
      showUnloading: document.getElementById('show-unloading').checked,
      showPacking: document.getElementById('show-packing').checked,

      rawOthers: parseFloat(document.getElementById('others').value) || 0,
      rawFreight: parseFloat(document.getElementById('freight').value) || 0,
      rawLoading: parseFloat(document.getElementById('loading').value) || 0,
      rawUnloading: parseFloat(document.getElementById('unloading').value) || 0,
      rawPacking: parseFloat(document.getElementById('packing').value) || 0,

      // Taxes Config
      taxType: 'CGST_SGST',
      cgstRate: parseFloat(document.getElementById('cgst-rate').value) || 0,
      sgstRate: parseFloat(document.getElementById('sgst-rate').value) || 0,
      igstRate: 0,

      // Terms & Conditions (compiled from list inputs)
      terms: (function() {
        const termsList = [];
        document.querySelectorAll('.term-row').forEach((row, index) => {
          const val = row.querySelector('.term-text').value.trim();
          if (val) {
            termsList.push(`${index + 1}. ${val}`);
          }
        });
        return termsList.join('\n');
      })(),

      // Signatory (handled by Code.gs backend — images loaded from Drive)
      authorizedSignatory: 'Adarsh Mishra',
      authorizedSignatoryDesignation: 'Sr. Purchase Executive',
      authorizedSignatorySign: null,
      authorizedSignatoryStamp: null
    };

    return poData;
  },

  // Recalculates and updates UI display totals
  triggerRecalculation() {
    let poData = this.getFormData();
    poData = window.CALCULATION.recalculatePO(poData);

    // Update row totals in DOM
    const rows = document.querySelectorAll('.product-row');
    rows.forEach((row, index) => {
      const item = poData.items[index];
      if (item) {
        row.querySelector('.row-amount').textContent = '₹' + window.UTILS.formatIndianCurrency(item.amount);
      }
    });

    // Update Totals Summary
    document.getElementById('txt-subtotal').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.subTotal);
    
    // Toggle CGST/SGST/IGST labels and amounts
    const cgstRow = document.getElementById('row-summary-cgst');
    const sgstRow = document.getElementById('row-summary-sgst');
    const igstRow = document.getElementById('row-summary-igst');

    if (poData.taxType === 'CGST_SGST') {
      if (cgstRow) {
        cgstRow.style.display = 'flex';
        document.getElementById('lbl-cgst').textContent = `CGST (${poData.cgstRate}%)`;
        document.getElementById('txt-cgst').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.cgst);
      }
      if (sgstRow) {
        sgstRow.style.display = 'flex';
        document.getElementById('lbl-sgst').textContent = `SGST (${poData.sgstRate}%)`;
        document.getElementById('txt-sgst').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.sgst);
      }
      if (igstRow) igstRow.style.display = 'none';
    } else if (poData.taxType === 'IGST') {
      if (cgstRow) cgstRow.style.display = 'none';
      if (sgstRow) sgstRow.style.display = 'none';
      if (igstRow) {
        igstRow.style.display = 'flex';
        document.getElementById('lbl-igst').textContent = `IGST (${poData.igstRate}%)`;
        document.getElementById('txt-igst').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.igst);
      }
    } else {
      if (cgstRow) cgstRow.style.display = 'none';
      if (sgstRow) sgstRow.style.display = 'none';
      if (igstRow) igstRow.style.display = 'none';
    }

    // Rest of charges
    const othersRow = document.getElementById('row-summary-others');
    if (othersRow) {
      othersRow.style.display = poData.showOthers ? 'flex' : 'none';
      document.getElementById('txt-others').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.others);
    }

    const freightRow = document.getElementById('row-summary-freight');
    if (freightRow) {
      freightRow.style.display = poData.showFreight ? 'flex' : 'none';
      document.getElementById('txt-freight').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.freight);
    }

    const loadingRow = document.getElementById('row-summary-loading');
    if (loadingRow) {
      loadingRow.style.display = poData.showLoading ? 'flex' : 'none';
      document.getElementById('txt-loading').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.loading);
    }

    const unloadingRow = document.getElementById('row-summary-unloading');
    if (unloadingRow) {
      unloadingRow.style.display = poData.showUnloading ? 'flex' : 'none';
      document.getElementById('txt-unloading').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.unloading);
    }

    const packingRow = document.getElementById('row-summary-packing');
    if (packingRow) {
      packingRow.style.display = poData.showPacking ? 'flex' : 'none';
      document.getElementById('txt-packing').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.packing);
    }


    // Grand Total & Words
    document.getElementById('txt-grandtotal').textContent = '₹' + window.UTILS.formatIndianCurrency(poData.grandTotal);
    document.getElementById('amount-words-text').textContent = poData.amountInWords;
  },

  // Submit PO (Create or Edit)
  async submitPOForm() {
    const poData = this.getFormData();
    const errors = window.VALIDATION.validatePO(poData);

    if (errors.length > 0) {
      errors.forEach(err => window.UI.showToast(err, 'error'));
      return;
    }

    const saveBtn = document.getElementById('submit-po-btn');
    if (saveBtn && saveBtn.disabled) return; // Prevent duplicate clicks

    const isEditMode = document.body.dataset.mode === 'edit';
    const activePoNo = document.body.dataset.pono;

    window.UI.showLoader(saveBtn, isEditMode ? 'Updating PO...' : 'Creating PO...');

    try {
      let result;
      if (isEditMode) {
        poData.updatedBy = window.CONFIG.USER_EMAIL;
        result = await window.API.updatePO(activePoNo, poData);
        window.UI.showToast('Purchase Order updated successfully!', 'success');
      } else {
        poData.createdBy = window.CONFIG.USER_EMAIL;
        result = await window.API.createPO(poData);
        window.UI.showToast('Purchase Order created successfully!', 'success');
      }
      
      const targetPoNo = (result && result.poNo) ? result.poNo : activePoNo;
      if (result) {
        try {
          sessionStorage.setItem('current_po_' + targetPoNo, JSON.stringify(result));
        } catch(e) {}
      }

      // Fast transition to view screen
      setTimeout(() => {
        window.location.href = `view-po.html?id=${encodeURIComponent(targetPoNo)}`;
      }, 500);

    } catch (err) {
      window.UI.showToast(err.message || 'Error occurred while saving PO.', 'error');
      window.UI.hideLoader(saveBtn, isEditMode ? 'Update Purchase Order' : 'Create Purchase Order');
    }
  },

  // Load PO values for edit-po.html
  async loadPODataForEditing(poNo) {
    try {
      const poData = await window.API.getPO(poNo);
      if (!poData) {
        window.UI.showToast('PO not found.', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
      }

      document.body.dataset.pono = poNo;
      document.body.dataset.mode = 'edit';
      
      const titleSpan = document.getElementById('form-mode-title');
      if (titleSpan) titleSpan.textContent = `Edit Purchase Order (${poNo})`;

      // Populate Inputs
      document.getElementById('po-date').value = poData.poDate.split('T')[0];
      document.getElementById('payment-terms').value = poData.paymentTerms || '';
      document.getElementById('delivery-timeline').value = poData.deliveryTimeline || '';
      document.getElementById('currency').value = poData.currency || 'INR';
      document.getElementById('remarks').value = poData.remarks || '';

      // Supplier
      document.getElementById('sup-name').value = poData.supplierName || '';
      document.getElementById('sup-address').value = poData.supplierAddress || '';
      document.getElementById('sup-gstin').value = poData.supplierGstin || '';
      document.getElementById('sup-pan').value = poData.supplierPan || '';
      document.getElementById('sup-cin').value = poData.supplierCin || '';
      document.getElementById('sup-email').value = poData.supplierEmail || '';
      document.getElementById('sup-phone').value = poData.supplierPhone || '';
      document.getElementById('sup-contact-person').value = poData.supplierContactPerson || '';

      // Consignee
      document.getElementById('ship-name').value = poData.shipToName || '';
      document.getElementById('ship-address').value = poData.shipToAddress || '';
      document.getElementById('ship-gstin').value = poData.shipToGstin || '';
      document.getElementById('ship-pan').value = poData.shipToPan || '';
      document.getElementById('ship-cin').value = poData.shipToCin || '';
      document.getElementById('ship-email').value = poData.shipToEmail || '';
      document.getElementById('ship-phone').value = poData.shipToPhone || '';

      // Charges
      document.getElementById('discount').value = poData.discount || 0;
      document.getElementById('others').value = poData.others || 0;
      document.getElementById('freight').value = poData.freight || '';
      document.getElementById('loading').value = poData.loading || '';
      document.getElementById('unloading').value = poData.unloading || '';
      document.getElementById('packing').value = poData.packing || '';
      document.getElementById('insurance').value = poData.insurance || '';

      // Taxes Config
      document.getElementById('tax-type').value = poData.taxType || 'CGST_SGST';
      document.getElementById('cgst-rate').value = poData.cgstRate !== undefined ? poData.cgstRate : 9;
      document.getElementById('sgst-rate').value = poData.sgstRate !== undefined ? poData.sgstRate : 9;
      document.getElementById('igst-rate').value = poData.igstRate !== undefined ? poData.igstRate : 18;
      
      this.toggleGstRateFields(poData.taxType || 'CGST_SGST');

      // Terms
      document.getElementById('terms-textarea').value = poData.terms || this.defaultTerms;

      // Populate Items
      const productBody = document.getElementById('product-rows');
      if (productBody) {
        productBody.innerHTML = '';
        if (poData.items && poData.items.length > 0) {
          poData.items.forEach(item => this.addRow(item));
        } else {
          this.addRow();
        }
      }

      // Populate Signatories dropdown
      const sigSelect = document.getElementById('signatory-select');
      if (sigSelect) {
        sigSelect.innerHTML = this.signatories.map((s, index) => 
          `<option value="${index}" ${poData.authorizedSignatory === s.name ? 'selected' : ''}>${s.name} (${s.designation})</option>`
        ).join('');
        this.updateSignatoryDetails();
      }

      this.triggerRecalculation();
    } catch (err) {
      window.UI.showToast('Error loading PO details for editing.', 'error');
    }
  }
};

window.CRUD = CRUD;
