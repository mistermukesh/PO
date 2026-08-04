// Utility functions for POMS

const UTILS = {
  // Format number to Indian Currency style (e.g., 1,66,500.00)
  formatIndianCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '';
    }
    const num = parseFloat(amount);
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  // Parse Indian currency string or normal number string back to Float
  parseNumber(str) {
    if (!str) return 0;
    const cleanStr = str.toString().replace(/,/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  },

  // Format date to DD/MM/YYYY
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  // Get current Financial Year (e.g., "26-27")
  getFinancialYear(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date();
    const month = date.getMonth(); // 0-indexed (Jan = 0)
    const year = date.getFullYear();
    
    // Financial year in India starts in April (month index 3)
    let startYear = year;
    if (month < 3) {
      startYear = year - 1;
    }
    
    const endYearShort = String(startYear + 1).slice(-2);
    const startYearShort = String(startYear).slice(-2);
    return `${startYearShort}-${endYearShort}`;
  },

  // Convert number to Indian Rupees in words
  numberToWords(amount) {
    const num = Math.floor(UTILS.parseNumber(amount));
    const paisa = Math.round((UTILS.parseNumber(amount) - num) * 100);
    
    if (num === 0 && paisa === 0) return 'Indian Rupees Zero Only';
    
    let words = 'Indian Rupees ';
    
    if (num > 0) {
      words += UTILS.convertIntegerToWords(num);
    }
    
    if (paisa > 0) {
      if (num > 0) words += ' and ';
      words += UTILS.convertIntegerToWords(paisa) + ' Paisa';
    }
    
    words += ' Only';
    // Clean double spaces
    return words.replace(/\s+/g, ' ').trim();
  },

  convertIntegerToWords(num) {
    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const doubleDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    let words = '';
    
    // Crores
    const crores = Math.floor(num / 10000000);
    let rem = num % 10000000;
    if (crores > 0) {
      words += UTILS.convertIntegerToWords(crores) + ' Crore ';
    }
    
    // Lakhs
    const lakhs = Math.floor(rem / 100000);
    rem = rem % 100000;
    if (lakhs > 0) {
      words += UTILS.convertTensAndOnes(lakhs, singleDigits, teenDigits, doubleDigits) + ' Lakh ';
    }
    
    // Thousands
    const thousands = Math.floor(rem / 1000);
    rem = rem % 1000;
    if (thousands > 0) {
      words += UTILS.convertTensAndOnes(thousands, singleDigits, teenDigits, doubleDigits) + ' Thousand ';
    }
    
    // Hundreds
    const hundreds = Math.floor(rem / 100);
    rem = rem % 100;
    if (hundreds > 0) {
      words += singleDigits[hundreds] + ' Hundred ';
    }
    
    // Tens and Ones
    if (rem > 0) {
      words += UTILS.convertTensAndOnes(rem, singleDigits, teenDigits, doubleDigits);
    }
    
    return words.trim();
  },

  convertTensAndOnes(num, singleDigits, teenDigits, doubleDigits) {
    if (num < 10) return singleDigits[num];
    if (num < 20) return teenDigits[num - 10];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return (doubleDigits[tens] + ' ' + singleDigits[ones]).trim();
  }
};

window.UTILS = UTILS;
