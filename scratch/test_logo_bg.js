const fs = require('fs');
const b64 = JSON.parse(fs.readFileSync('assets/b64_constants.json', 'utf8'));

const testHtml = `
<!DOCTYPE html>
<html>
<body style="background:#2A2A2B; padding:20px;">
  <h3>Logo on Dark Background</h3>
  <img src="${b64.logo}" style="height: 40px;" />
</body>
</html>
`;

fs.writeFileSync('scratch/test_logo.html', testHtml);
console.log('Created test_logo.html');
