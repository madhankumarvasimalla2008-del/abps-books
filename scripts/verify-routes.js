const http = require('http');

const routesToTest = [
  // Customer Portal Routes
  { path: '/', expectedText: 'Aditya Birla Public School' },
  { path: '/books', expectedText: 'Educational Books' },
  { path: '/books/p1', expectedText: 'Mathematics (NCERT)' },
  { path: '/categories', expectedText: 'Categories' },
  { path: '/cart', expectedText: 'Your Cart' },
  { path: '/checkout', expectedText: 'Cart is Empty' },
  { path: '/orders', expectedText: 'Order History' },
  { path: '/orders/o1', expectedText: 'Order Details' },
  { path: '/orders/o1/track', expectedText: 'Order Tracking' },
  { path: '/orders/confirmation', expectedText: 'Order Confirmed' },
  { path: '/branches', expectedText: 'School Branches' },
  { path: '/branches/b1', expectedText: 'Kharach' },
  { path: '/tracking', expectedText: 'Track Your Order' },
  { path: '/search', expectedText: 'Search Textbook Repository' },
  { path: '/login', expectedText: 'Sign In' },
  { path: '/forgot-password', expectedText: 'Reset Branch Password' },
  { path: '/reset-password', expectedText: 'Create New Password' },
  { path: '/profile', expectedText: 'My Profile' },
  { path: '/profile/addresses', expectedText: 'Saved Addresses' },
  { path: '/profile/security', expectedText: 'Security Settings' },

  // Admin Portal Routes
  { path: '/admin', expectedText: 'Dashboard' },
  { path: '/admin/products', expectedText: 'Catalog' },
  { path: '/admin/products/new', expectedText: 'Add New Textbook' },
  { path: '/admin/products/p1/edit', expectedText: 'Edit Textbook' },
  { path: '/admin/categories', expectedText: 'Categories' },
  { path: '/admin/inventory', expectedText: 'Inventory' },
  { path: '/admin/inventory/movements', expectedText: 'Stock Movement' },
  { path: '/admin/inventory/bulk', expectedText: 'Bulk Stock Adjustment' },
  { path: '/admin/orders', expectedText: 'Orders' },
  { path: '/admin/orders/o1', expectedText: 'Order Details' },
  { path: '/admin/customers', expectedText: 'School Coordinators' },
  { path: '/admin/customers/u1', expectedText: 'Coordinator' },
  { path: '/admin/branches', expectedText: 'School Branches' },
  { path: '/admin/branches/b1', expectedText: 'Kharach' },
  { path: '/admin/suppliers', expectedText: 'Publishers' },
  { path: '/admin/purchase-orders', expectedText: 'Purchase Order' },
  { path: '/admin/shipments', expectedText: 'Shipment' },
  { path: '/admin/shipments/SHP-2026-1092', expectedText: 'Shipment' },
  { path: '/admin/payments', expectedText: 'Institutional Payments' },
  { path: '/admin/payments/transactions', expectedText: 'Bank Transaction Logs' },
  { path: '/admin/invoices', expectedText: 'Institutional Tax Invoices' },
  { path: '/admin/refunds', expectedText: 'Credit Notes' },
  { path: '/admin/reports', expectedText: 'Procurement' },
  { path: '/admin/notifications', expectedText: 'Operations Activity' },
  { path: '/admin/settings', expectedText: 'Platform Settings' },
  { path: '/admin/settings/roles', expectedText: 'Role-Based Access Control' },
  { path: '/admin/settings/system', expectedText: 'System Infrastructure' },
];

function testRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${route.path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const containsText = data.toLowerCase().includes(route.expectedText.toLowerCase());
        resolve({
          path: route.path,
          statusCode: res.statusCode,
          success: res.statusCode === 200 && containsText,
          expectedText: route.expectedText,
          containsText,
          contentLength: data.length,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path: route.path,
        statusCode: 0,
        success: false,
        error: err.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        path: route.path,
        statusCode: 408,
        success: false,
        error: 'Timeout',
      });
    });
  });
}

async function runAll() {
  console.log(`Starting verification of ${routesToTest.length} routes...`);
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const r of routesToTest) {
    const result = await testRoute(r);
    if (result.success) {
      console.log(`✓ [${result.statusCode}] ${result.path}`);
      passed++;
    } else {
      console.log(`✗ [${result.statusCode}] ${result.path} - Text "${r.expectedText}" match: ${result.containsText} (err: ${result.error || 'none'})`);
      failed++;
      failures.push(result);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${routesToTest.length} routes.`);
  if (failures.length > 0) {
    console.log('Failed routes details:', JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

runAll();
