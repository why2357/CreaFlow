const fs = require('fs');

const content = fs.readFileSync('src/api/login.ts', 'utf-8');

// 按函数分割
const functions = content.split(/export\s+function\s+/).filter(s => s.trim());

console.log(`Found ${functions.length} exported functions\n`);

functions.forEach((func, i) => {
  const nameMatch = func.match(/^(\w+)/);
  if (!nameMatch) return;
  const funcName = nameMatch[1];

  // 查找 url
  const urlMatch = func.match(/url:\s*['"`]([^'"`]+)['"`]/);
  // 查找 method
  const methodMatch = func.match(/method:\s*['"`]([\w]+)['"`]/);

  if (urlMatch && methodMatch) {
    console.log(`${i + 1}. ${funcName}: ${methodMatch[1].toUpperCase()} ${urlMatch[1]}`);
  } else {
    console.log(`${i + 1}. ${funcName}: INCOMPLETE`);
    if (!urlMatch) console.log('   Missing url');
    if (!methodMatch) console.log('   Missing method');
  }
});
