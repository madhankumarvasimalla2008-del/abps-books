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

async function runProductTests() {
  console.log('Testing Admin Product Management Module...');
  let failures = 0;

  // 1. Admin Products List
  const resList = await getPage('/admin/products');
  if (resList.status === 200 && (resList.body.includes('Catalog') || resList.body.includes('Textbook Repository'))) {
    console.log('✓ /admin/products basic load: SUCCESS');
  } else {
    console.error('✗ /admin/products basic load: FAILED');
    failures++;
  }

  // 2. Admin New Product Page
  const resNew = await getPage('/admin/products/new');
  if (resNew.status === 200 && resNew.body.includes('Add New Textbook')) {
    console.log('✓ /admin/products/new load: SUCCESS');
  } else {
    console.error('✗ /admin/products/new load: FAILED');
    failures++;
  }

  // 3. Admin Edit Product Page (p1)
  const resEdit = await getPage('/admin/products/p1/edit');
  if (resEdit.status === 200 && resEdit.body.includes('Edit Textbook')) {
    console.log('✓ /admin/products/p1/edit load: SUCCESS');
  } else {
    console.error('✗ /admin/products/p1/edit load: FAILED');
    failures++;
  }

  // 4. Verify Catalog Master & Inventory Isolation disclaimer exists
  if (resNew.body.includes('Warehouse Inventory') || resNew.body.includes('Catalog & Curriculum Master Record')) {
    console.log('✓ Architecture isolation disclaimer present in ProductForm: SUCCESS');
  } else {
    console.error('✗ Architecture isolation disclaimer missing: FAILED');
    failures++;
  }

  if (failures === 0) {
    console.log('\nAll Admin Product Management integration tests passed successfully!');
  } else {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
  }
}

runProductTests();
