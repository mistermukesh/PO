const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('Code.gs', 'utf8');

// Mock Apps Script globals
const sandbox = {
  SpreadsheetApp: {},
  ContentService: { MimeType: { JSON: 'JSON' } },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@example.com' }) },
  Utilities: {
    newBlob: () => ({ getBytes: () => [], getDataAsString: () => '{}' }),
    base64Encode: () => '',
    base64Decode: () => []
  },
  HtmlService: { createHtmlOutput: () => ({ getAs: () => ({}) }) },
  DriveApp: { getFoldersByName: () => ({ hasNext: () => false }), createFile: () => ({}) },
  GmailApp: { sendEmail: () => {} },
  Logger: { log: console.log }
};

try {
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  console.log('Code.gs parsed successfully with NO syntax errors!');

  // Check if STAMP_BASE64 is defined in sandbox
  console.log('PASSCODE:', sandbox.PASSCODE);
  console.log('LOGO_BASE64 defined?', !!sandbox.LOGO_BASE64);
  console.log('SIGN_BASE64 defined?', !!sandbox.SIGN_BASE64);
  console.log('STAMP_BASE64 defined?', !!sandbox.STAMP_BASE64);

} catch (err) {
  console.error('Syntax error in Code.gs:', err);
}
