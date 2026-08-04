// Validation rules for POMS

const VALIDATION = {
  // GSTIN Validation (Indian Goods and Services Tax Identification Number)
  isValidGSTIN(gstin) {
    if (!gstin) return true; // Optional field in some places, handle required separately
    const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    return regex.test(gstin.toUpperCase());
  },

  // PAN Validation (Permanent Account Number)
  isValidPAN(pan) {
    if (!pan) return true;
    const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    return regex.test(pan.toUpperCase());
  },

  // CIN Validation (Corporate Identification Number)
  isValidCIN(cin) {
    if (!cin) return true;
    const regex = /^[L|U]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
    return regex.test(cin.toUpperCase());
  },

  // Email Validation
  isValidEmail(email) {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Contact Phone Number Validation (India 10 digits, or standard format)
  isValidPhone(phone) {
    if (!phone) return true;
    const regex = /^[0-9-+()\s]{10,15}$/;
    return regex.test(phone);
  },

  // Validate form fields and return an array of errors
  validatePO(poData) {
    const errors = [];

    // PO Info
    if (!poData.poDate) errors.push('PO Date is required.');
    if (!poData.supplierName) errors.push('Supplier Name is required.');
    if (!poData.shipToName) errors.push('Consignee / Ship To Name is required.');

    // Supplier details
    if (poData.supplierEmail && !this.isValidEmail(poData.supplierEmail)) {
      errors.push('Supplier Email is invalid.');
    }
    if (poData.supplierPhone && !this.isValidPhone(poData.supplierPhone)) {
      errors.push('Supplier Contact Number is invalid.');
    }

    // Ship To details
    if (poData.shipToGstin && !this.isValidGSTIN(poData.shipToGstin)) {
      errors.push('Consignee GSTIN is invalid.');
    }
    if (poData.shipToPan && !this.isValidPAN(poData.shipToPan)) {
      errors.push('Consignee PAN is invalid.');
    }
    if (poData.shipToCin && !this.isValidCIN(poData.shipToCin)) {
      errors.push('Consignee CIN is invalid.');
    }
    if (poData.shipToEmail && !this.isValidEmail(poData.shipToEmail)) {
      errors.push('Consignee Email is invalid.');
    }

    // Products Details Table
    if (!poData.items || poData.items.length === 0) {
      errors.push('At least one item must be added to the Products table.');
    } else {
      poData.items.forEach((item, index) => {
        const sNo = index + 1;
        if (!item.description || item.description.trim() === '') {
          errors.push(`Item ${sNo}: Description is required.`);
        }
        if (item.qty === undefined || item.qty === null || isNaN(item.qty) || item.qty <= 0) {
          errors.push(`Item ${sNo}: Quantity must be greater than zero.`);
        }
        if (item.rate === undefined || item.rate === null || isNaN(item.rate) || item.rate < 0) {
          errors.push(`Item ${sNo}: Rate cannot be negative.`);
        }
      });
    }

    // Charges and Totals
    const numericFields = [
      { name: 'Discount', val: poData.discount },
      { name: 'Others', val: poData.others },
      { name: 'Freight', val: poData.freight },
      { name: 'Loading', val: poData.loading },
      { name: 'Unloading', val: poData.unloading },
      { name: 'Packing', val: poData.packing },
      { name: 'Insurance', val: poData.insurance }
    ];

    numericFields.forEach(field => {
      if (field.val !== undefined && field.val !== null && field.val !== '') {
        const val = parseFloat(field.val);
        if (isNaN(val) || val < 0) {
          errors.push(`${field.name} cannot be negative.`);
        }
      }
    });

    return errors;
  }
};

window.VALIDATION = VALIDATION;
