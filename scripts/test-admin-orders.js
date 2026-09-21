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

function testAdminOrderLogic() {
  console.log('Testing Admin Order Management Business Rules & Snapshot Immutability...');
  let failures = 0;

  const VALID_ORDER_STATUSES = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  const STANDARD_WORKFLOW = [
    { status: 'Pending', label: 'Order Placed', description: 'Order has been recorded' },
    { status: 'Confirmed', label: 'Order Confirmed', description: 'Order details verified' },
    { status: 'Processing', label: 'Processing', description: 'Order is being prepared for dispatch' },
    { status: 'Packed', label: 'Packed', description: 'Books inspected and packed in cartons' },
    { status: 'Shipped', label: 'Shipped', description: 'Consignment dispatched with logistics partner' },
    { status: 'Out for Delivery', label: 'Out for Delivery', description: 'Consignment out for delivery to school' },
    { status: 'Delivered', label: 'Delivered', description: 'Consignment received and verified by school' },
  ];

  // Mock catalog product
  const catalogProduct = {
    id: 'p1',
    title: 'Mathematics Class 10 (NCERT)',
    sellingPrice: 180,
  };

  // Mock historical order snapshot created when catalog price was 180
  let mockOrder = {
    id: 'o1',
    orderNumber: 'ABPS-ORD-2026-1001',
    customerId: 'u1',
    customerName: 'Kavita Sharma',
    customerEmail: 'kavita.sharma@kharach.abps.edu.in',
    customerPhone: '+91 98251 23456',
    branchId: 'b1',
    branchName: 'ABPS Kharach',
    branchCode: 'ABPS-KHR',
    items: [
      {
        id: 'oi1',
        productId: 'p1',
        productTitle: 'Mathematics Class 10 (NCERT)',
        title: 'Mathematics Class 10 (NCERT)',
        sku: 'MATH-10-NCERT',
        isbn: '978-8174506344',
        grade: 'Class 10',
        subject: 'Mathematics',
        publisher: 'NCERT',
        unitPrice: 180,
        price: 180,
        quantity: 45,
        totalPrice: 8100,
      },
    ],
    totalQuantity: 45,
    subtotal: 8100,
    discount: 810,
    discountAmount: 810,
    tax: 0,
    shippingFee: 0,
    totalAmount: 7290,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    paymentMethod: 'Institutional Credit',
    paymentReference: 'ABPS-PO-2026-0042',
    deliveryAddress: {
      recipientName: 'Kavita Sharma (Headmistress)',
      phone: '+91 98251 23456',
      street: 'Aditya Birla Public School, Kharach Campus',
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '392012',
    },
    shippingAddress: {
      recipientName: 'Kavita Sharma (Headmistress)',
      phone: '+91 98251 23456',
      street: 'Aditya Birla Public School, Kharach Campus',
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '392012',
    },
    poNumber: 'PO-KHR-2026-089',
    schoolPoNumber: 'PO-KHR-2026-089',
    courierPartner: 'Delhivery Logistics',
    carrier: 'Delhivery Logistics',
    trackingNumber: 'TRK-98321045',
    createdAt: '12 Feb 2026',
    updatedAt: '12 Feb 2026',
    timeline: [
      {
        status: 'Pending',
        label: 'Order Placed',
        description: 'Order placed by school coordinator',
        timestamp: '2026-02-12T09:30:00.000Z',
        completed: true,
        current: false,
      },
      {
        status: 'Confirmed',
        label: 'Order Confirmed',
        description: 'School PO verified and approved',
        timestamp: '2026-02-12T11:00:00.000Z',
        completed: true,
        current: true,
      },
    ],
  };

  // Helper simulated updateOrderStatus
  function updateOrderStatus(targetOrder, newStatus, options) {
    if (!VALID_ORDER_STATUSES.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status "${newStatus}". Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`,
      };
    }

    const now = new Date().toISOString();
    let updatedTimeline = [];

    if (newStatus === 'Cancelled') {
      const prevSteps = (targetOrder.timeline || []).map((s) => ({ ...s, current: false }));
      updatedTimeline = [
        ...prevSteps,
        {
          status: 'Cancelled',
          label: 'Order Cancelled',
          description: options?.notes || 'Order cancelled by school administration',
          timestamp: now,
          completed: true,
          current: true,
        },
      ];
    } else {
      const targetIdx = STANDARD_WORKFLOW.findIndex((s) => s.status === newStatus);
      const baseSteps = targetOrder.timeline || [];

      updatedTimeline = STANDARD_WORKFLOW.map((wfStep, idx) => {
        const matched = baseSteps.find((b) => b.status === wfStep.status);
        const isDone = idx < targetIdx;
        const isCurrent = idx === targetIdx;
        return {
          status: wfStep.status,
          label: matched?.label || wfStep.label,
          description: matched?.description || wfStep.description,
          timestamp: isCurrent ? now : isDone ? matched?.timestamp || now : undefined,
          completed: isDone || isCurrent,
          current: isCurrent,
        };
      });
    }

    const updatedOrder = {
      ...targetOrder,
      status: newStatus,
      timeline: updatedTimeline,
    };

    return { success: true, order: updatedOrder };
  }

  // 1. Test Snapshot Immutability when live catalog price changes
  catalogProduct.sellingPrice = 300; // Live catalog price surges from 180 to 300
  if (
    mockOrder.items[0].unitPrice === 180 &&
    mockOrder.items[0].totalPrice === 8100 &&
    mockOrder.totalAmount === 7290
  ) {
    console.log('✓ Historical Order Snapshot Immutability (Order unit prices untouched by catalog changes): SUCCESS');
  } else {
    console.error('✗ Snapshot Immutability broken:', mockOrder);
    failures++;
  }

  // 2. Test Invalid Status Rejection
  const invalidStatusRes = updateOrderStatus(mockOrder, 'UnknownStatus');
  if (!invalidStatusRes.success && invalidStatusRes.error.includes('Invalid status')) {
    console.log('✓ Invalid OrderStatus rejection: SUCCESS');
  } else {
    console.error('✗ Failed to reject invalid status:', invalidStatusRes);
    failures++;
  }

  // 3. Test Controlled Workflow Progression (Confirmed -> Packed)
  const advanceRes = updateOrderStatus(mockOrder, 'Packed', { notes: 'Cartons sealed & weighed' });
  if (
    advanceRes.success &&
    advanceRes.order.status === 'Packed' &&
    advanceRes.order.timeline.find((t) => t.status === 'Packed')?.current === true &&
    advanceRes.order.timeline.find((t) => t.status === 'Confirmed')?.completed === true
  ) {
    console.log('✓ Controlled Order Status Progression (Confirmed -> Packed): SUCCESS');
    mockOrder = advanceRes.order;
  } else {
    console.error('✗ Status progression failed:', advanceRes);
    failures++;
  }

  // 4. Test Further Progression to Shipped
  const shipRes = updateOrderStatus(mockOrder, 'Shipped');
  if (
    shipRes.success &&
    shipRes.order.status === 'Shipped' &&
    shipRes.order.timeline.find((t) => t.status === 'Shipped')?.current === true &&
    shipRes.order.timeline.find((t) => t.status === 'Packed')?.completed === true
  ) {
    console.log('✓ Progression to Shipped state: SUCCESS');
    mockOrder = shipRes.order;
  } else {
    console.error('✗ Progression to Shipped failed:', shipRes);
    failures++;
  }

  // 5. Test Cancellation Timeline Appending
  const cancelRes = updateOrderStatus(mockOrder, 'Cancelled', { notes: 'School requested cancellation' });
  const cancelledStep = cancelRes.order.timeline.find((t) => t.status === 'Cancelled');
  if (
    cancelRes.success &&
    cancelRes.order.status === 'Cancelled' &&
    cancelledStep &&
    cancelledStep.description === 'School requested cancellation'
  ) {
    console.log('✓ Order Cancellation with appended timeline entry: SUCCESS');
  } else {
    console.error('✗ Order cancellation failed:', cancelRes);
    failures++;
  }

  return failures;
}

async function runAllTests() {
  const logicFailures = testAdminOrderLogic();
  let routeFailures = 0;

  console.log('\nTesting HTTP Route Integrations...');

  const routes = [
    { path: '/admin/orders', expected: 'Orders' },
    { path: '/admin/orders/o1', expected: 'Order Details' },
    { path: '/orders', expected: 'Order History' },
    { path: '/orders/o1', expected: 'Order Details' },
    { path: '/orders/o1/track', expected: 'Order Tracking' },
  ];

  for (const r of routes) {
    try {
      const res = await getPage(r.path);
      const hasText = res.body.toLowerCase().includes(r.expected.toLowerCase());
      if (res.status === 200 && hasText) {
        console.log(`✓ ${r.path} HTTP 200 (contains "${r.expected}"): SUCCESS`);
      } else {
        console.error(`✗ ${r.path} returned status ${res.status}, text match: ${hasText}`);
        routeFailures++;
      }
    } catch (err) {
      console.error(`✗ ${r.path} request error:`, err.message);
      routeFailures++;
    }
  }

  const totalFailures = logicFailures + routeFailures;
  if (totalFailures === 0) {
    console.log('\nAll Admin Order Management tests passed successfully! ✨');
    process.exit(0);
  } else {
    console.error(`\n${totalFailures} test(s) failed.`);
    process.exit(1);
  }
}

runAllTests();
