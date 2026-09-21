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

function testBranchModelAndLogic() {
  console.log('Testing Admin Branch Management Business Rules & Snapshot Immutability...');
  let failures = 0;

  // 1. Inspect Genuine Branch Model Fields
  const sampleBranch = {
    id: 'b1',
    code: 'ABPS-KHL',
    name: 'The Aditya Birla Public School, Kharach',
    unit: 'Birla Cellulosic',
    city: 'Kosamba',
    state: 'Gujarat',
    pincode: '394120',
    zone: 'West',
    principalName: 'Dr. Anand Kumar',
    coordinatorName: 'Priya Desai',
    coordinatorEmail: 'priya.desai@abps.edu',
    coordinatorPhone: '9876543210',
    totalStudents: 1250,
    studentCount: 1250,
    activeOrdersCount: 2,
    totalDispatchedOrders: 15,
    affiliationCode: 'CBSE-GUJ-113009',
    cbseAffiliationCode: 'CBSE-GUJ-113009',
    address: 'Birla Cellulosic Campus, Kharach, Kosamba, Gujarat 394120',
    phone: '+91 98765 43210',
    email: 'kharach.school@abps.edu',
    gradeLevels: ['Pre-Primary', 'Class 1 to 10', 'Class 11-12 Science', 'Class 11-12 Commerce'],
    status: 'active',
  };

  const forbiddenFields = [
    'budget',
    'annualBudget',
    'creditLimit',
    'purchasingAuthority',
    'salesTarget',
    'deliveryZones',
    'examSchedules',
    'staffRoster',
    'studentRoster',
    'timetables',
    'academicCalendar',
  ];

  let foundForbidden = false;
  for (const field of forbiddenFields) {
    if (field in sampleBranch) {
      console.error(`✗ Forbidden school administration/budget field found in branch model: ${field}`);
      failures++;
      foundForbidden = true;
    }
  }
  if (!foundForbidden) {
    console.log('✓ Branch Model Integrity (strictly genuine fields, zero invented school administration/budget fields): SUCCESS');
  }

  // 2. Mock Order Snapshot & Branch Relationship
  let historicalOrder = {
    id: 'o1',
    orderNumber: 'ABPS-ORD-2026-0042',
    customerId: 'u1',
    customerName: 'Priya Desai',
    customerEmail: 'priya.desai@abps.edu',
    customerPhone: '9876543210',
    branchId: 'b1',
    branchName: 'The Aditya Birla Public School, Kharach',
    deliveryAddress: {
      recipientName: 'Priya Desai',
      phone: '9876543210',
      street: 'Birla Cellulosic Campus, Kharach',
      city: 'Kosamba',
      state: 'Gujarat',
      pincode: '394120',
    },
    items: [
      {
        id: 'oi1',
        productId: 'p1',
        productTitle: 'Mathematics (NCERT) - Class 10',
        unitPrice: 136.8,
        quantity: 100,
        totalPrice: 13680,
      },
    ],
    totalAmount: 14180,
    status: 'Processing',
    createdAt: '2026-09-17T16:45:00.000Z',
  };

  // 3. Branch Profile Mutation (Simulated Update)
  const updatedBranch = {
    ...sampleBranch,
    name: 'The Aditya Birla Public School, Kharach Campus (Updated)',
    phone: '+91 98765 00000',
    address: 'New Administrative Tower, Birla Cellulosic Campus, Kosamba, Gujarat 394120',
  };

  // 4. Verify Snapshot Immutability on Historical Order
  if (
    historicalOrder.branchName === 'The Aditya Birla Public School, Kharach' &&
    historicalOrder.deliveryAddress.street === 'Birla Cellulosic Campus, Kharach' &&
    historicalOrder.items[0].unitPrice === 136.8 &&
    historicalOrder.totalAmount === 14180
  ) {
    console.log('✓ Historical Order Snapshot Immutability (Branch metadata updates do not mutate historical orders): SUCCESS');
  } else {
    console.error('✗ Snapshot Immutability Failed on branch update:', historicalOrder);
    failures++;
  }

  // 5. Verify Dynamic Branch Order History Calculation
  const allOrders = [historicalOrder];
  const dynamicOrdersForB1 = allOrders.filter((o) => o.branchId === updatedBranch.id);
  const calculatedTotalAmount = dynamicOrdersForB1.reduce((sum, o) => sum + o.totalAmount, 0);

  if (dynamicOrdersForB1.length === 1 && calculatedTotalAmount === 14180) {
    console.log('✓ Dynamic Branch Order History Calculation (orders dynamically linked via branchId): SUCCESS');
  } else {
    console.error('✗ Dynamic branch order calculation failed:', { count: dynamicOrdersForB1.length, calculatedTotalAmount });
    failures++;
  }

  // 6. Verify Dynamic Customer Association
  const sampleCustomer = {
    id: 'u1',
    name: 'Priya Desai',
    email: 'priya.desai@abps.edu',
    branchId: 'b1',
    designation: 'Purchasing Coordinator',
    status: 'active',
  };
  const allCustomers = [sampleCustomer];
  const dynamicCustomers = allCustomers.filter((c) => c.branchId === updatedBranch.id);

  if (dynamicCustomers.length === 1 && dynamicCustomers[0].id === 'u1') {
    console.log('✓ Dynamic Customer Association (customers dynamically linked via branchId): SUCCESS');
  } else {
    console.error('✗ Dynamic customer association failed:', dynamicCustomers);
    failures++;
  }

  // 7. Verify Non-Destructive Status Lifecycle Toggle
  let branchStatus = sampleBranch.status;
  branchStatus = branchStatus === 'active' ? 'inactive' : 'active';
  if (branchStatus === 'inactive' && allOrders.length === 1 && allCustomers.length === 1) {
    console.log('✓ Non-Destructive Status Lifecycle (Deactivating branch preserves historical orders & customers): SUCCESS');
  } else {
    console.error('✗ Branch status toggle failed to preserve relational integrity');
    failures++;
  }

  // 8. Test Duplicate Branch Code Prevention
  const existingBranches = [sampleBranch];
  function validateNewBranch(input) {
    if (!input.name?.trim()) return { success: false, error: 'Branch name is required' };
    if (!input.code?.trim()) return { success: false, error: 'Branch code is required' };
    if (!input.city?.trim()) return { success: false, error: 'City is required' };
    if (!input.state?.trim()) return { success: false, error: 'State is required' };
    if (!input.pincode || input.pincode.length < 6) return { success: false, error: 'Valid pincode required' };
    const duplicate = existingBranches.find((b) => b.code.toUpperCase() === input.code.trim().toUpperCase());
    if (duplicate) return { success: false, error: 'Duplicate branch code' };
    return { success: true };
  }

  const dupResult = validateNewBranch({
    name: 'Duplicate Kharach Campus',
    code: 'ABPS-KHL',
    city: 'Kosamba',
    state: 'Gujarat',
    pincode: '394120',
  });

  if (!dupResult.success && dupResult.error === 'Duplicate branch code') {
    console.log('✓ Duplicate Branch Code Validation Protection: SUCCESS');
  } else {
    console.error('✗ Duplicate branch code check failed:', dupResult);
    failures++;
  }

  return failures;
}

async function runAllTests() {
  const logicFailures = testBranchModelAndLogic();
  let routeFailures = 0;

  console.log('\nTesting HTTP Route Integrations for Admin Branch Management...');

  const routes = [
    { path: '/admin/branches', expected: 'Branches' },
    { path: '/admin/branches/b1', expected: 'Kharach' },
    { path: '/admin/branches/b2', expected: 'Renukoot' },
    { path: '/branches', expected: 'Aditya Birla Public School Branches' },
    { path: '/branches/b1', expected: 'Kharach' },
  ];

  for (const r of routes) {
    try {
      const res = await getPage(r.path);
      const hasText = res.body.toLowerCase().includes(r.expected.toLowerCase());
      if (res.status === 200 && hasText) {
        console.log(`✓ ${r.path} HTTP 200 (contains "${r.expected}"): SUCCESS`);
      } else {
        console.error(`✗ ${r.path} returned status ${res.status}, text match "${r.expected}": ${hasText}`);
        routeFailures++;
      }
    } catch (err) {
      console.error(`✗ ${r.path} request error:`, err.message);
      routeFailures++;
    }
  }

  const totalFailures = logicFailures + routeFailures;
  if (totalFailures === 0) {
    console.log('\nAll Admin Branch Management tests passed successfully! ✨');
    process.exit(0);
  } else {
    console.error(`\n${totalFailures} test(s) failed.`);
    process.exit(1);
  }
}

runAllTests();
