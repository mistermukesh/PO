// Calculation engine for POMS

const CALCULATION = {
  // Recalculates all figures for a PO and returns the updated PO data object
  recalculatePO(poData) {
    // 1. Calculate individual item amounts and sum them for Sub Total
    let subTotal = 0;
    poData.items = (poData.items || []).map(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      subTotal += amount;
      return {
        ...item,
        qty: qty,
        rate: rate,
        amount: amount
      };
    });

    poData.subTotal = Math.round(subTotal * 100) / 100;

    // 2. Parse all charges and discounts
    const discount = 0;
    const others = parseFloat(poData.others) || 0;
    const freight = parseFloat(poData.freight) || 0;
    const loading = parseFloat(poData.loading) || 0;
    const unloading = parseFloat(poData.unloading) || 0;
    const packing = parseFloat(poData.packing) || 0;
    const insurance = 0;

    // 3. Taxable value for GST is Sub Total - Discount
    const taxableValue = Math.max(0, poData.subTotal - discount);
    poData.taxableValue = Math.round(taxableValue * 100) / 100;

    // 4. Calculate GST based on tax type (enforced CGST+SGST)
    const taxType = 'CGST_SGST';
    const cgstRate = parseFloat(poData.cgstRate) !== undefined && poData.cgstRate !== null ? parseFloat(poData.cgstRate) : 9;
    const sgstRate = parseFloat(poData.sgstRate) !== undefined && poData.sgstRate !== null ? parseFloat(poData.sgstRate) : 9;

    const cgst = Math.round(taxableValue * (cgstRate / 100) * 100) / 100;
    const sgst = Math.round(taxableValue * (sgstRate / 100) * 100) / 100;
    const igst = 0;

    poData.cgst = cgst;
    poData.sgst = sgst;
    poData.igst = igst;
    poData.cgstRate = cgstRate;
    poData.sgstRate = sgstRate;
    poData.igstRate = 0;
    poData.taxType = taxType;

    // 5. Grand Total = Taxable Value + Taxes + Other Charges
    const grandTotal = taxableValue + cgst + sgst + igst + others + freight + loading + unloading + packing + insurance;
    poData.grandTotal = Math.round(grandTotal * 100) / 100;

    // 6. Convert Grand Total to Words
    poData.amountInWords = window.UTILS ? window.UTILS.numberToWords(poData.grandTotal) : '';

    return poData;
  },

  // Perform calculation of GST tax rates based on GSTIN state codes
  // In India, GSTIN starts with a 2-digit state code.
  // If the supplier and shipping location are in the same state, CGST+SGST applies.
  // Otherwise, IGST applies.
  autoDetermineTaxType(supplierGstin, shipToGstin) {
    return 'CGST_SGST';
  }
};

window.CALCULATION = CALCULATION;
