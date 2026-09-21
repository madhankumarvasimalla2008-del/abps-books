const http = require('http');

async function getPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runCatalogTests() {
  console.log('Testing Books Catalog Page functionality...');
  let failures = 0;

  // 1. Basic Catalog Load
  const resCatalog = await getPage('/books');
  if (resCatalog.status === 200 && resCatalog.body.includes('Educational Books')) {
    console.log('✓ /books basic load: SUCCESS');
  } else {
    console.error('✗ /books basic load: FAILED');
    failures++;
  }

  // 2. Search query parameter URL
  const resSearch = await getPage('/books?q=Mathematics');
  if (resSearch.status === 200) {
    console.log('✓ /books?q=Mathematics URL state: SUCCESS');
  } else {
    console.error('✗ /books?q=Mathematics URL state: FAILED');
    failures++;
  }

  // 3. Grade filter parameter URL
  const resGrade = await getPage('/books?grade=Class%2010');
  if (resGrade.status === 200) {
    console.log('✓ /books?grade=Class%2010 URL state: SUCCESS');
  } else {
    console.error('✗ /books?grade=Class%2010 URL state: FAILED');
    failures++;
  }

  // 4. Combined filters parameter URL
  const resCombined = await getPage('/books?grade=Class%2010&subject=Science&sort=price-asc');
  if (resCombined.status === 200) {
    console.log('✓ /books?grade=Class%2010&subject=Science&sort=price-asc URL state: SUCCESS');
  } else {
    console.error('✗ /books combined filters URL state: FAILED');
    failures++;
  }

  if (failures === 0) {
    console.log('\nAll 4 catalog integration tests passed!');
  } else {
    console.error(`\n${failures} catalog test(s) failed.`);
    process.exit(1);
  }
}

runCatalogTests();
