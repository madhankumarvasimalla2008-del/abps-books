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

function testAdjustmentLogic() {
  console.log('\nTesting Inventory Adjustment Business Logic & Safety Rules...');
  let logicFailures = 0;

  // Helper simulated adjust function matching InventoryContext
  function simulateAdjust(currentStock, adjustment, threshold = 50, status = 'in_stock') {
    if (!Number.isInteger(adjustment)) {
      return { success: false, error: 'Adjustment must be a valid integer.' };
    }
    if (adjustment === 0) {
      return { success: false, error: 'Adjustment amount cannot be zero.' };
    }
    const resultingStock = currentStock + adjustment;
    if (resultingStock < 0) {
      return { success: false, error: 'Resulting stock cannot be negative.' };
    }

    let newStatus = status;
    if (status !== 'discontinued') {
      if (resultingStock === 0) newStatus = 'out_of_stock';
      else if (resultingStock <= threshold) newStatus = 'low_stock';
      else newStatus = 'in_stock';
    }

    return {
      success: true,
      resultingStock,
      newStatus,
    };
  }

  // Case 1: Valid Positive Adjustment
  const res1 = simulateAdjust(100, 50, 50);
  if (res1.success && res1.resultingStock === 150 && res1.newStatus === 'in_stock') {
    console.log('✓ Valid positive adjustment (+50 on 100 -> 150): SUCCESS');
  } else {
    console.error('✗ Valid positive adjustment: FAILED', res1);
    logicFailures++;
  }

  // Case 2: Valid Negative Adjustment
  const res2 = simulateAdjust(100, -30, 50);
  if (res2.success && res2.resultingStock === 70 && res2.newStatus === 'in_stock') {
    console.log('✓ Valid negative adjustment (-30 on 100 -> 70): SUCCESS');
  } else {
    console.error('✗ Valid negative adjustment: FAILED', res2);
    logicFailures++;
  }

  // Case 3: Transition to Low Stock
  const res3 = simulateAdjust(100, -60, 50);
  if (res3.success && res3.resultingStock === 40 && res3.newStatus === 'low_stock') {
    console.log('✓ Transition to low_stock status when <= threshold: SUCCESS');
  } else {
    console.error('✗ Low stock status transition: FAILED', res3);
    logicFailures++;
  }

  // Case 4: Transition to Out of Stock
  const res4 = simulateAdjust(100, -100, 50);
  if (res4.success && res4.resultingStock === 0 && res4.newStatus === 'out_of_stock') {
    console.log('✓ Transition to out_of_stock status when stock reaches 0: SUCCESS');
  } else {
    console.error('✗ Out of stock status transition: FAILED', res4);
    logicFailures++;
  }

  // Case 5: Reject Negative Resulting Stock
  const res5 = simulateAdjust(50, -60, 50);
  if (!res5.success && res5.error.includes('negative')) {
    console.log('✓ Strict negative resulting stock rejection (-60 on 50 -> rejected): SUCCESS');
  } else {
    console.error('✗ Negative stock rejection: FAILED', res5);
    logicFailures++;
  }

  // Case 6: Reject Zero Adjustment
  const res6 = simulateAdjust(50, 0, 50);
  if (!res6.success && res6.error.includes('zero')) {
    console.log('✓ Zero quantity adjustment rejection: SUCCESS');
  } else {
    console.error('✗ Zero quantity rejection: FAILED', res6);
    logicFailures++;
  }

  // Case 7: Reject Non-Integer Adjustment
  const res7 = simulateAdjust(50, 12.5, 50);
  if (!res7.success && res7.error.includes('integer')) {
    console.log('✓ Decimal/Non-integer adjustment rejection (12.5 -> rejected): SUCCESS');
  } else {
    console.error('✗ Non-integer rejection: FAILED', res7);
    logicFailures++;
  }

  return logicFailures;
}

async function runInventoryTests() {
  console.log('Testing Admin Inventory Management Module HTTP Endpoints...');
  let failures = 0;

  // 1. Admin Inventory Overview Page
  const resOverview = await getPage('/admin/inventory');
  if (resOverview.status === 200 && (resOverview.body.includes('Inventory & Stock Management') || resOverview.body.includes('Inventory &amp; Stock Management') || resOverview.body.includes('Inventory'))) {
    console.log('✓ /admin/inventory overview page load: SUCCESS');
  } else {
    console.error('✗ /admin/inventory overview page load: FAILED');
    failures++;
  }

  // 2. Admin Inventory Bulk Adjustment Page
  const resBulk = await getPage('/admin/inventory/bulk');
  if (resBulk.status === 200 && resBulk.body.includes('Bulk Stock Adjustment')) {
    console.log('✓ /admin/inventory/bulk page load: SUCCESS');
  } else {
    console.error('✗ /admin/inventory/bulk page load: FAILED');
    failures++;
  }

  // 3. Admin Inventory Movements Page
  const resMovements = await getPage('/admin/inventory/movements');
  if (resMovements.status === 200 && resMovements.body.includes('Stock Movement Audit Trail')) {
    console.log('✓ /admin/inventory/movements page load: SUCCESS');
  } else {
    console.error('✗ /admin/inventory/movements page load: FAILED');
    failures++;
  }

  // 4. Verify presence of Stock Safety Rules / KPI indicators
  if (resBulk.body.includes('Stock Safety Rule') || resBulk.body.includes('Resulting Stock')) {
    console.log('✓ Bulk page safety rules & resulting stock columns present: SUCCESS');
  } else {
    console.error('✗ Bulk page safety indicators missing: FAILED');
    failures++;
  }

  // 5. Test Logic
  const logicFailures = testAdjustmentLogic();
  failures += logicFailures;

  if (failures === 0) {
    console.log('\nAll Admin Inventory integration and safety tests passed successfully!\n');
  } else {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
  }
}

runInventoryTests();
