/**
 * ============================================================================
 * ABPS Book Distribution Platform — Development Database Seed Script
 * ============================================================================
 * ⚠️ WARNING: LOCAL DEVELOPMENT FIXTURES ONLY.
 * DO NOT RUN THIS SCRIPT AGAINST STAGING OR PRODUCTION ENVIRONMENTS.
 *
 * This script contains synthetic, fictional demo fixtures (branches, demo
 * staff/customer identities, catalog items, inventory, POs, orders, and UPI
 * transaction mocks). For staging environments, use: scripts/seed-staging.ts
 * ============================================================================
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables BEFORE importing database modules
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  console.error('   Please provide DATABASE_URL in .env.local or execution environment.');
  process.exit(1);
}

async function seed() {
  const { db, client } = await import('../src/db');
  const {
    roles,
    authUsers,
    userRoles,
    customerProfiles,
    staffProfiles,
    branches,
    customerAddresses,
    categories,
    products,
    inventory,
    inventoryMovements,
    suppliers,
    purchaseOrders,
    purchaseOrderItems,
    purchaseOrderReceipts,
    orders,
    orderItems,
    orderShippingAddresses,
    orderStatusHistory,
    payments,
    paymentAttempts,
    transactions,
    refunds,
    shipments,
    shipmentMilestones,
    notifications,
  } = await import('../src/db/schema');

  try {
    console.log('🌱 Starting database seeding with synthetic test data...\n');

  // 1. Roles
  console.log('1️⃣ Seeding Roles...');
  const rolesList = [
    { id: 'admin', name: 'Central Administrator', description: 'Full system-wide administrative access' },
    { id: 'branch_admin', name: 'Branch Administrator', description: 'School campus coordinator and branch order manager' },
    { id: 'warehouse', name: 'Warehouse Manager', description: 'Inventory stock, inward/outward logistics management' },
    { id: 'sales', name: 'Sales Representative', description: 'Institutional accounts and bulk quotation specialist' },
    { id: 'customer', name: 'School Staff / Teacher', description: 'Standard school staff ordering educational material' },
  ];

  for (const r of rolesList) {
    await db.insert(roles).values(r).onConflictDoNothing();
  }
  console.log(`   ✓ Seeded ${rolesList.length} roles`);

  // 2. Business Branches
  console.log('2️⃣ Seeding School Branches...');
  const branchesList = [
    {
      code: 'ABPS-RNK',
      name: 'Aditya Birla Public School, Renukoot',
      addressLine1: 'Hindalco Colony, Renukoot',
      addressLine2: 'District Sonbhadra',
      city: 'Renukoot',
      state: 'Uttar Pradesh',
      pincode: '231217',
      zone: 'North' as const,
      contactEmail: 'abps.renukoot@adityabirla.com',
      contactPhone: '+91 5446 252 033',
      status: 'active' as const,
    },
    {
      code: 'ABPS-NGD',
      name: 'Aditya Birla Public School, Nagda',
      addressLine1: 'Birlagram, Nagda',
      addressLine2: 'District Ujjain',
      city: 'Nagda',
      state: 'Madhya Pradesh',
      pincode: '456331',
      zone: 'Central' as const,
      contactEmail: 'abps.nagda@adityabirla.com',
      contactPhone: '+91 7366 246 120',
      status: 'active' as const,
    },
    {
      code: 'ABPS-KRC',
      name: 'Aditya Birla Public School, Kharach',
      addressLine1: 'Kharach, Kosamba',
      addressLine2: 'District Bharuch',
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '394120',
      zone: 'West' as const,
      contactEmail: 'abps.kharach@adityabirla.com',
      contactPhone: '+91 2646 270 400',
      status: 'active' as const,
    },
    {
      code: 'ABPS-HKD',
      name: 'Aditya Birla Public School, Hirakud',
      addressLine1: 'Post Box No. 1, Hirakud',
      addressLine2: 'District Sambalpur',
      city: 'Hirakud',
      state: 'Odisha',
      pincode: '768016',
      zone: 'East' as const,
      contactEmail: 'abps.hirakud@adityabirla.com',
      contactPhone: '+91 663 248 1144',
      status: 'active' as const,
    },
    {
      code: 'ABPS-VRM',
      name: 'Aditya Birla Public School, Veraval',
      addressLine1: 'Junagadh Road, Veraval',
      addressLine2: 'District Gir Somnath',
      city: 'Veraval',
      state: 'Gujarat',
      pincode: '362266',
      zone: 'West' as const,
      contactEmail: 'abps.veraval@adityabirla.com',
      contactPhone: '+91 2876 248 000',
      status: 'active' as const,
    },
  ];

  const seededBranches = [];
  for (const b of branchesList) {
    const [branch] = await db.insert(branches).values(b).onConflictDoUpdate({
      target: branches.code,
      set: { name: b.name, contactPhone: b.contactPhone },
    }).returning();
    seededBranches.push(branch);
  }
  console.log(`   ✓ Seeded ${seededBranches.length} branches`);

  // 3. Auth Users & Profiles (No passwords stored)
  console.log('3️⃣ Seeding Synthetic Business Identity Users...');
  const usersList = [
    {
      email: 'admin@abps-books.internal',
      fullName: 'Vikramaditya Singhania',
      phone: '+91 98765 43210',
      role: 'admin',
      isStaff: true,
      branchIdx: 0,
      employeeCode: 'ABPS-EMP-001',
      department: 'Central Operations',
    },
    {
      email: 'coordinator.nagda@abps-books.internal',
      fullName: 'Dr. Sunita Pathak',
      phone: '+91 98765 43211',
      role: 'branch_admin',
      isStaff: true,
      branchIdx: 1,
      employeeCode: 'ABPS-EMP-042',
      department: 'Academic Coordination',
    },
    {
      email: 'warehouse.lead@abps-books.internal',
      fullName: 'Gopal Krishna Menon',
      phone: '+91 98765 43212',
      role: 'warehouse',
      isStaff: true,
      branchIdx: 0,
      employeeCode: 'ABPS-EMP-108',
      department: 'Central Fulfillment',
    },
    {
      email: 'teacher.renukoot@abps-books.internal',
      fullName: 'Pooja Deshmukh',
      phone: '+91 98765 43213',
      role: 'customer',
      isStaff: false,
      branchIdx: 0,
      designation: 'Senior Science Teacher',
    },
    {
      email: 'sales.lead@abps-books.internal',
      fullName: 'Arjun Nambiar',
      phone: '+91 98765 43214',
      role: 'sales',
      isStaff: true,
      branchIdx: 2,
      employeeCode: 'ABPS-EMP-019',
      department: 'Institutional Accounts',
    },
  ];

  const seededUsers = [];
  for (const u of usersList) {
    const [user] = await db.insert(authUsers).values({
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      isActive: true,
      emailVerifiedAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: authUsers.email,
      set: { fullName: u.fullName, phone: u.phone },
    }).returning();

    // Link user role
    await db.insert(userRoles).values({
      userId: user.id,
      roleId: u.role,
    }).onConflictDoNothing();

    // Profiles
    if (u.isStaff) {
      await db.insert(staffProfiles).values({
        userId: user.id,
        assignedBranchId: seededBranches[u.branchIdx]?.id,
        department: u.department,
        employeeCode: u.employeeCode,
      }).onConflictDoNothing();
    } else {
      await db.insert(customerProfiles).values({
        userId: user.id,
        defaultBranchId: seededBranches[u.branchIdx]?.id,
        designation: u.designation,
      }).onConflictDoNothing();

      // Seed Customer Address
      await db.insert(customerAddresses).values({
        userId: user.id,
        title: 'School Campus Residence',
        recipientName: u.fullName,
        recipientPhone: u.phone,
        addressLine1: 'Faculty Quarters B-12',
        addressLine2: 'ABPS Campus, Hindalco Colony',
        city: 'Renukoot',
        state: 'Uttar Pradesh',
        pincode: '231217',
        isDefault: true,
      }).onConflictDoNothing();
    }

    seededUsers.push({ ...user, role: u.role });
  }
  console.log(`   ✓ Seeded ${seededUsers.length} users with associated profiles`);

  // 4. Categories
  console.log('4️⃣ Seeding Catalog Categories...');
  const categoriesList = [
    {
      name: 'Primary School (Grades 1-5)',
      slug: 'primary-grades-1-5',
      description: 'Foundational literacy, numeracy, and environmental studies for classes 1 to 5',
      gradeLevels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
      displayOrder: 1,
    },
    {
      name: 'Middle School (Grades 6-8)',
      slug: 'middle-grades-6-8',
      description: 'Core CBSE aligned curriculum books for middle school classes 6 to 8',
      gradeLevels: ['Grade 6', 'Grade 7', 'Grade 8'],
      displayOrder: 2,
    },
    {
      name: 'Secondary (Grades 9-10)',
      slug: 'secondary-grades-9-10',
      description: 'Board curriculum textbooks, lab manuals, and exemplar problem guides for Class 9 and 10',
      gradeLevels: ['Grade 9', 'Grade 10'],
      displayOrder: 3,
    },
    {
      name: 'Senior Secondary (Grades 11-12)',
      slug: 'senior-secondary-grades-11-12',
      description: 'Science, Commerce, and Humanities textbooks with competitive exam reference series',
      gradeLevels: ['Grade 11', 'Grade 12'],
      displayOrder: 4,
    },
  ];

  const seededCategories = [];
  for (const c of categoriesList) {
    const [cat] = await db.insert(categories).values(c).onConflictDoUpdate({
      target: categories.slug,
      set: { name: c.name, description: c.description },
    }).returning();
    seededCategories.push(cat);
  }
  console.log(`   ✓ Seeded ${seededCategories.length} categories`);

  // 5. Products
  console.log('5️⃣ Seeding Catalog Products...');
  const productsList = [
    {
      title: 'NCERT Mathematics Class 10',
      isbn: '978-8174506344',
      sku: 'ABPS-BK-MTH10',
      categoryIdx: 2,
      publisher: 'NCERT Publishing Division',
      author: 'NCERT Editorial Board',
      edition: '2026 Revised Edition',
      academicYear: '2026-2027',
      grade: 'Grade 10',
      subject: 'Mathematics',
      description: 'Official CBSE prescribed textbook for Class 10 Mathematics covers Real Numbers, Polynomials, and Trigonometry.',
      language: 'English',
      pages: 312,
      weightGrams: 420,
      mrp: '180.00',
      sellingPrice: '162.00',
      bulkDiscountPercent: '12.00',
      bulkThreshold: 25,
      isFeatured: true,
      isAbpsApproved: true,
      status: 'in_stock' as const,
    },
    {
      title: 'NCERT Science Textbook Class 10',
      isbn: '978-8174506481',
      sku: 'ABPS-BK-SCI10',
      categoryIdx: 2,
      publisher: 'NCERT Publishing Division',
      author: 'NCERT Editorial Board',
      edition: '2026 Revised Edition',
      academicYear: '2026-2027',
      grade: 'Grade 10',
      subject: 'Science',
      description: 'Comprehensive physics, chemistry, and biology textbook for CBSE Class 10 board examination preparation.',
      language: 'English',
      pages: 280,
      weightGrams: 390,
      mrp: '195.00',
      sellingPrice: '175.50',
      bulkDiscountPercent: '10.00',
      bulkThreshold: 30,
      isFeatured: true,
      isAbpsApproved: true,
      status: 'in_stock' as const,
    },
    {
      title: 'CBSE Physics Class 12 - Part 1 & 2',
      isbn: '978-8174505088',
      sku: 'ABPS-BK-PHY12',
      categoryIdx: 3,
      publisher: 'NCERT Publishing Division',
      author: 'NCERT Editorial Board',
      edition: '2026 Edition',
      academicYear: '2026-2027',
      grade: 'Grade 12',
      subject: 'Physics',
      description: 'Standard senior secondary physics covering Electrostatics, Magnetism, Optics, and Modern Physics.',
      language: 'English',
      pages: 450,
      weightGrams: 580,
      mrp: '320.00',
      sellingPrice: '288.00',
      bulkDiscountPercent: '15.00',
      bulkThreshold: 20,
      isFeatured: true,
      isAbpsApproved: true,
      status: 'in_stock' as const,
    },
    {
      title: 'Honey Dew English Textbook Class 8',
      isbn: '978-8174508126',
      sku: 'ABPS-BK-ENG08',
      categoryIdx: 1,
      publisher: 'Oxford University Press',
      author: 'OUP & NCERT Panel',
      edition: '10th Edition',
      academicYear: '2026-2027',
      grade: 'Grade 8',
      subject: 'English',
      description: 'Middle school English reader comprising prose, poetry, and foundational grammar exercises.',
      language: 'English',
      pages: 168,
      weightGrams: 260,
      mrp: '140.00',
      sellingPrice: '126.00',
      bulkDiscountPercent: '8.00',
      bulkThreshold: 40,
      isFeatured: false,
      isAbpsApproved: true,
      status: 'in_stock' as const,
    },
    {
      title: 'Environmental Studies: Looking Around Class 4',
      isbn: '978-8174507013',
      sku: 'ABPS-BK-EVS04',
      categoryIdx: 0,
      publisher: 'Cambridge University Press',
      author: 'Primary Education Cell',
      edition: '7th Edition',
      academicYear: '2026-2027',
      grade: 'Grade 4',
      subject: 'Environmental Studies',
      description: 'Engaging primary grade workbook focused on nature, community living, ecology, and daily sciences.',
      language: 'English',
      pages: 196,
      weightGrams: 310,
      mrp: '155.00',
      sellingPrice: '139.50',
      bulkDiscountPercent: '10.00',
      bulkThreshold: 50,
      isFeatured: false,
      isAbpsApproved: true,
      status: 'in_stock' as const,
    },
  ];

  const seededProducts = [];
  for (const p of productsList) {
    const categoryId = seededCategories[p.categoryIdx].id;
    const [prod] = await db.insert(products).values({
      title: p.title,
      isbn: p.isbn,
      sku: p.sku,
      categoryId,
      publisher: p.publisher,
      author: p.author,
      edition: p.edition,
      academicYear: p.academicYear,
      grade: p.grade,
      subject: p.subject,
      description: p.description,
      language: p.language,
      pages: p.pages,
      weightGrams: p.weightGrams,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      bulkDiscountPercent: p.bulkDiscountPercent,
      bulkThreshold: p.bulkThreshold,
      isFeatured: p.isFeatured,
      isAbpsApproved: p.isAbpsApproved,
      status: p.status,
    }).onConflictDoUpdate({
      target: products.sku,
      set: { sellingPrice: p.sellingPrice, mrp: p.mrp },
    }).returning();
    seededProducts.push(prod);
  }
  console.log(`   ✓ Seeded ${seededProducts.length} products`);

  // 6. Inventory & Stock Tracking
  console.log('6️⃣ Seeding Branch Inventory & Movement Logs...');
  for (const branch of seededBranches) {
    for (const prod of seededProducts) {
      const [inv] = await db.insert(inventory).values({
        branchId: branch.id,
        productId: prod.id,
        quantityOnHand: 150,
        reservedQuantity: 10,
        reorderThreshold: 20,
        aisleLocation: 'Aisle-3',
        rackLocation: 'Rack-B',
        shelfLocation: 'Shelf-2',
        binLocation: 'BIN-104',
      }).onConflictDoUpdate({
        target: [inventory.branchId, inventory.productId],
        set: { quantityOnHand: 150, reservedQuantity: 10 },
      }).returning();

      // Seed an initial inward movement audit log
      await db.insert(inventoryMovements).values({
        inventoryId: inv.id,
        branchId: branch.id,
        productId: prod.id,
        movementType: 'Inward (PO)',
        quantity: 150,
        previousQuantity: 0,
        newQuantity: 150,
        referenceType: 'initial_seed',
        referenceId: 'PO-INIT-2026',
        notes: 'Initial academic year stock replenishment',
        performedBy: seededUsers[0].id,
      }).onConflictDoNothing();
    }
  }
  console.log(`   ✓ Seeded inventory entries across all branches`);

  // 7. Suppliers & Procurement
  console.log('7️⃣ Seeding Suppliers and Purchase Orders...');
  const suppliersList = [
    {
      name: 'NCERT Official Distribution House',
      contactPerson: 'Harish Chandra Verma',
      email: 'orders@ncert-distribution.in',
      phone: '+91 11 2656 2708',
      addressLine1: 'Sri Aurobindo Marg',
      addressLine2: 'Adchini',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      gstNumber: '07AAACN1234F1Z5',
      paymentTerms: 'Net 30 Days',
      status: 'active' as const,
    },
    {
      name: 'Oxford University Press India',
      contactPerson: 'Radhika Sen',
      email: 'institutional.sales@oup.com',
      phone: '+91 120 458 8100',
      addressLine1: 'YMCA Library Building',
      addressLine2: 'Jai Singh Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      gstNumber: '07AAABO5678G2Z1',
      paymentTerms: 'Net 45 Days',
      status: 'active' as const,
    },
  ];

  const seededSuppliers = [];
  for (const s of suppliersList) {
    const [sup] = await db.insert(suppliers).values(s).returning();
    seededSuppliers.push(sup);
  }

  // Seed Purchase Order
  const [po1] = await db.insert(purchaseOrders).values({
    poNumber: 'PO-2026-001',
    supplierId: seededSuppliers[0].id,
    targetBranchId: seededBranches[0].id,
    status: 'Completed',
    totalAmount: '45000.00',
    notes: 'Annual Grade 10 & 12 bulk textbook intake for Renukoot Campus',
    createdById: seededUsers[0].id,
    expectedDeliveryDate: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: purchaseOrders.poNumber,
    set: { totalAmount: '45000.00' },
  }).returning();

  await db.insert(purchaseOrderItems).values([
    {
      purchaseOrderId: po1.id,
      productId: seededProducts[0].id,
      quantityOrdered: 150,
      quantityReceived: 150,
      unitCost: '140.00',
      totalCost: '21000.00',
    },
    {
      purchaseOrderId: po1.id,
      productId: seededProducts[1].id,
      quantityOrdered: 150,
      quantityReceived: 150,
      unitCost: '160.00',
      totalCost: '24000.00',
    },
  ]).onConflictDoNothing();

  await db.insert(purchaseOrderReceipts).values({
    purchaseOrderId: po1.id,
    receiptNumber: 'GRN-2026-089',
    receivedById: seededUsers[2].id,
    notes: 'All 300 textbooks verified in pristine physical condition.',
  }).onConflictDoNothing();
  console.log(`   ✓ Seeded ${seededSuppliers.length} suppliers and purchase order lifecycle records`);

  // 8. Orders, Items, Shipping Address, and Order Status History
  console.log('8️⃣ Seeding Customer Orders & Lifecycle Snapshots...');
  const [demoOrder] = await db.insert(orders).values({
    orderNumber: 'ORD-2026-1001',
    userId: seededUsers[3].id, // Pooja Deshmukh
    branchId: seededBranches[0].id, // Renukoot
    status: 'Processing',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    upiSubMethod: 'intent',
    upiApp: 'phonepe',
    paymentReference: 'UPI-982341029314',
    subtotalAmount: '1620.00',
    discountAmount: '162.00',
    shippingFee: '0.00',
    taxAmount: '0.00',
    totalAmount: '1458.00',
    currency: 'INR',
    customerNotes: 'Please deliver before morning assembly on Monday.',
    internalNotes: 'Staff priority delivery for class 10 mathematics batch.',
  }).onConflictDoUpdate({
    target: orders.orderNumber,
    set: { paymentStatus: 'Paid', status: 'Processing' },
  }).returning();

  // Order Items with freeze snapshot
  await db.insert(orderItems).values([
    {
      orderId: demoOrder.id,
      productId: seededProducts[0].id,
      quantity: 5,
      unitMrp: seededProducts[0].mrp,
      unitPrice: seededProducts[0].sellingPrice,
      discountPercent: '10.00',
      totalPrice: '729.00',
      titleSnapshot: seededProducts[0].title,
      isbnSnapshot: seededProducts[0].isbn,
      skuSnapshot: seededProducts[0].sku,
      publisherSnapshot: seededProducts[0].publisher,
    },
    {
      orderId: demoOrder.id,
      productId: seededProducts[1].id,
      quantity: 5,
      unitMrp: seededProducts[1].mrp,
      unitPrice: seededProducts[1].sellingPrice,
      discountPercent: '10.00',
      totalPrice: '729.00',
      titleSnapshot: seededProducts[1].title,
      isbnSnapshot: seededProducts[1].isbn,
      skuSnapshot: seededProducts[1].sku,
      publisherSnapshot: seededProducts[1].publisher,
    },
  ]).onConflictDoNothing();

  // Order Shipping Address Snapshot
  await db.insert(orderShippingAddresses).values({
    orderId: demoOrder.id,
    recipientName: 'Pooja Deshmukh',
    recipientPhone: '+91 98765 43213',
    addressLine1: 'Faculty Quarters B-12',
    addressLine2: 'ABPS Campus, Hindalco Colony',
    landmark: 'Opposite Senior Science Lab',
    city: 'Renukoot',
    state: 'Uttar Pradesh',
    pincode: '231217',
  }).onConflictDoNothing();

  // Order Status History
  await db.insert(orderStatusHistory).values([
    {
      orderId: demoOrder.id,
      previousStatus: null,
      newStatus: 'Pending',
      notes: 'Order placed by school coordinator.',
      changedById: seededUsers[3].id,
    },
    {
      orderId: demoOrder.id,
      previousStatus: 'Pending',
      newStatus: 'Confirmed',
      notes: 'Payment confirmed via PhonePe UPI Intent.',
      changedById: seededUsers[0].id,
    },
    {
      orderId: demoOrder.id,
      previousStatus: 'Confirmed',
      newStatus: 'Processing',
      notes: 'Dispatched to warehouse packing station.',
      changedById: seededUsers[2].id,
    },
  ]).onConflictDoNothing();
  console.log(`   ✓ Seeded order ${demoOrder.orderNumber} with items, address snapshot, and audit timeline`);

  // 9. Financial Transaction Ledger & Payments
  console.log('9️⃣ Seeding Payments & Financial Transaction Ledger...');
  const [paymentRecord] = await db.insert(payments).values({
    orderId: demoOrder.id,
    amount: '1458.00',
    currency: 'INR',
    status: 'Paid',
    paymentMethod: 'UPI',
    upiSubMethod: 'intent',
    upiApp: 'phonepe',
    gatewayOrderId: 'order_abps_mock_001',
    gatewayPaymentId: 'pay_abps_mock_upi_001',
    gatewaySignature: 'sig_mock_verified_hash_982374',
    idempotencyKey: 'idem_ord_2026_1001_pay_01',
    payerVpa: 'pooja.deshmukh@okhdfcbank',
    payerPhone: '+91 98765 43213',
    receiptNumber: 'RCP-2026-1001',
    notes: 'Digital UPI settlement completed successfully.',
  }).onConflictDoNothing().returning();

  if (paymentRecord) {
    await db.insert(paymentAttempts).values({
      paymentId: paymentRecord.id,
      attemptNumber: 1,
      method: 'UPI',
      status: 'Paid',
      idempotencyKey: 'idem_ord_2026_1001_pay_01',
      gatewayResponse: JSON.stringify({
        status: 'authorized',
        upi_rrn: '409238910234',
        auth_code: 'AUTH9872',
      }),
      errorMessage: null,
    }).onConflictDoNothing();

    await db.insert(transactions).values({
      orderId: demoOrder.id,
      paymentId: paymentRecord.id,
      transactionNumber: 'TXN-2026-0001',
      type: 'Payment',
      status: 'Successful',
      amount: '1458.00',
      method: 'UPI',
      referenceNumber: 'UPI-982341029314',
      notes: 'Customer digital payment cleared for order ORD-2026-1001',
    }).onConflictDoNothing();
  }
  console.log(`   ✓ Seeded payment and financial audit transaction record`);

  // 10. Logistics & Shipments
  console.log('🔟 Seeding Logistics Shipments & Milestones...');
  const [shipmentRecord] = await db.insert(shipments).values({
    orderId: demoOrder.id,
    trackingNumber: 'TRK-ABPS-892341',
    carrier: 'BlueDart Express',
    status: 'In Transit',
    originBranchId: seededBranches[0].id,
    destinationAddress: 'Faculty Quarters B-12, ABPS Campus, Renukoot, Uttar Pradesh - 231217',
    estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    notes: 'Direct campus dispatch via regional courier partner.',
  }).onConflictDoNothing().returning();

  if (shipmentRecord) {
    await db.insert(shipmentMilestones).values([
      {
        shipmentId: shipmentRecord.id,
        status: 'Created',
        location: 'Renukoot Central Hub',
        description: 'Shipping label generated and package packed.',
      },
      {
        shipmentId: shipmentRecord.id,
        status: 'In Transit',
        location: 'Varanasi Logistics Sorting Facility',
        description: 'Package in transit to destination feeder station.',
      },
    ]).onConflictDoNothing();
  }
  console.log(`   ✓ Seeded shipment tracking and milestone updates`);

  // 11. Notifications
  console.log('1️⃣1️⃣ Seeding Notifications...');
  await db.insert(notifications).values([
    {
      userId: seededUsers[3].id,
      title: 'Order Confirmed & Payment Received',
      message: 'Your order ORD-2026-1001 has been confirmed and is currently being processed.',
      type: 'order',
      severity: 'success',
      actionUrl: '/orders/ORD-2026-1001',
      isRead: false,
    },
    {
      userId: seededUsers[0].id,
      title: 'Low Stock Alert: NCERT Science Class 10',
      message: 'Inventory level at Nagda Branch has dropped near the reorder threshold (25 units remaining).',
      type: 'inventory',
      severity: 'warning',
      actionUrl: '/admin/inventory',
      isRead: false,
    },
  ]).onConflictDoNothing();
  console.log(`   ✓ Seeded user notifications`);

  console.log('\n✨ Database seeding completed successfully! 🎉');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
