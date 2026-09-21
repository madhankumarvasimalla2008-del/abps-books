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

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function testCategoryLogic() {
  console.log('Testing Admin Category Logic & Validation Rules...');
  let failures = 0;

  // Mock initial categories
  let categories = [
    {
      id: 'c1',
      name: 'Textbooks',
      slug: 'textbooks',
      description: 'Prescribed NCERT and CBSE core textbooks.',
      bookCount: 12,
      gradeLevels: ['Class 1', 'Class 2', 'Class 10'],
    },
    {
      id: 'c2',
      name: 'Reference Books',
      slug: 'reference-books',
      description: 'Supplementary reference material.',
      bookCount: 8,
      gradeLevels: ['Class 11 - Science', 'Class 12 - Science'],
    },
  ];

  // Mock products referencing category
  const products = [
    { id: 'p1', title: 'Mathematics 10', category: 'Textbooks', categoryId: 'c1' },
    { id: 'p2', title: 'Physics 12', category: 'Reference Books', categoryId: 'c2' },
  ];

  // Helper simulated addCategory
  function addCategory(input) {
    const trimmedName = input.name?.trim() || '';
    if (!trimmedName) {
      return { success: false, error: 'Category name is required.' };
    }
    if (trimmedName.length < 2) {
      return { success: false, error: 'Category name must be at least 2 characters.' };
    }

    const duplicateName = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      return {
        success: false,
        error: `A category with the name "${trimmedName}" already exists.`,
      };
    }

    const slug = (input.slug?.trim() || generateSlug(trimmedName)) || `cat-${Date.now()}`;
    const duplicateSlug = categories.some(
      (c) => c.slug.toLowerCase() === slug.toLowerCase()
    );
    if (duplicateSlug) {
      return {
        success: false,
        error: `A category with the slug "${slug}" already exists.`,
      };
    }

    const newCat = {
      id: `c${Date.now()}`,
      name: trimmedName,
      slug,
      description: input.description?.trim() || '',
      bookCount: 0,
      gradeLevels: input.gradeLevels || [],
    };
    categories.push(newCat);
    return { success: true, category: newCat };
  }

  // Helper simulated updateCategory
  function updateCategory(id, updates) {
    const existing = categories.find((c) => c.id === id);
    if (!existing) {
      return { success: false, error: 'Category not found.' };
    }

    const trimmedName = updates.name !== undefined ? updates.name.trim() : existing.name;
    if (!trimmedName) {
      return { success: false, error: 'Category name cannot be empty.' };
    }

    const duplicateName = categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      return {
        success: false,
        error: `Another category with the name "${trimmedName}" already exists.`,
      };
    }

    const slug =
      updates.slug !== undefined
        ? updates.slug.trim() || generateSlug(trimmedName)
        : existing.slug;

    const duplicateSlug = categories.some(
      (c) => c.id !== id && c.slug.toLowerCase() === slug.toLowerCase()
    );
    if (duplicateSlug) {
      return {
        success: false,
        error: `Another category with the slug "${slug}" already exists.`,
      };
    }

    Object.assign(existing, {
      name: trimmedName,
      slug,
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      gradeLevels: updates.gradeLevels !== undefined ? updates.gradeLevels : existing.gradeLevels,
    });

    return { success: true, category: existing };
  }

  // Helper simulated deleteCategory with reference protection
  function deleteCategory(id) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) {
      return { success: false, error: 'Category not found.' };
    }

    const isReferenced = products.some(
      (p) => p.categoryId === id || p.category?.toLowerCase() === cat.name.toLowerCase()
    );

    if (isReferenced) {
      return {
        success: false,
        error: 'Cannot delete category with active product references. Please reassign products first.',
      };
    }

    categories = categories.filter((c) => c.id !== id);
    return { success: true };
  }

  // 1. Test Valid Category Creation
  const createRes1 = addCategory({
    name: 'Workbooks & Activity Kits',
    description: 'Practical exercise books and worksheets.',
    gradeLevels: ['Class 1', 'Class 2'],
  });
  if (createRes1.success && createRes1.category.slug === 'workbooks-activity-kits') {
    console.log('✓ Valid category creation and slug auto-generation: SUCCESS');
  } else {
    console.error('✗ Valid category creation: FAILED', createRes1);
    failures++;
  }

  // 2. Test Duplicate Name Protection
  const createResDupName = addCategory({
    name: 'textbooks', // case-insensitive match
    description: 'Duplicate test',
  });
  if (!createResDupName.success && createResDupName.error.includes('already exists')) {
    console.log('✓ Duplicate category name rejection: SUCCESS');
  } else {
    console.error('✗ Duplicate category name protection: FAILED', createResDupName);
    failures++;
  }

  // 3. Test Duplicate Slug Protection
  const createResDupSlug = addCategory({
    name: 'Unique Name',
    slug: 'textbooks',
    description: 'Duplicate slug test',
  });
  if (!createResDupSlug.success && createResDupSlug.error.includes('slug')) {
    console.log('✓ Duplicate category slug rejection: SUCCESS');
  } else {
    console.error('✗ Duplicate category slug protection: FAILED', createResDupSlug);
    failures++;
  }

  // 4. Test Category Update
  const updateRes = updateCategory(createRes1.category.id, {
    name: 'Workbooks & Practical Manuals',
    description: 'Updated description for practical kits.',
  });
  if (updateRes.success && updateRes.category.name === 'Workbooks & Practical Manuals') {
    console.log('✓ Category update: SUCCESS');
  } else {
    console.error('✗ Category update: FAILED', updateRes);
    failures++;
  }

  // 5. Test Reference Safety on Deletion (Category c1 has active product references)
  const deleteReferencedRes = deleteCategory('c1');
  if (!deleteReferencedRes.success && deleteReferencedRes.error.includes('active product references')) {
    console.log('✓ Safe deletion guard (preventing deletion of referenced category): SUCCESS');
  } else {
    console.error('✗ Safe deletion guard failed to block deletion of referenced category: FAILED', deleteReferencedRes);
    failures++;
  }

  // 6. Test Deletion of Unreferenced Category
  const deleteUnreferencedRes = deleteCategory(createRes1.category.id);
  if (deleteUnreferencedRes.success && !categories.some((c) => c.id === createRes1.category.id)) {
    console.log('✓ Safe deletion of unreferenced category: SUCCESS');
  } else {
    console.error('✗ Safe deletion of unreferenced category: FAILED', deleteUnreferencedRes);
    failures++;
  }

  return failures;
}

async function runAllTests() {
  const logicFailures = testCategoryLogic();
  let routeFailures = 0;

  console.log('\nTesting HTTP Route Integrations...');

  // 1. Admin Categories page
  try {
    const resAdminCat = await getPage('/admin/categories');
    if (resAdminCat.status === 200 && resAdminCat.body.includes('Categories')) {
      console.log('✓ /admin/categories HTTP 200: SUCCESS');
    } else {
      console.error(`✗ /admin/categories returned ${resAdminCat.status}`);
      routeFailures++;
    }
  } catch (err) {
    console.error('✗ /admin/categories route error:', err.message);
    routeFailures++;
  }

  // 2. Customer Categories page
  try {
    const resCustCat = await getPage('/categories');
    if (resCustCat.status === 200 && (resCustCat.body.includes('Categories') || resCustCat.body.includes('Classifications'))) {
      console.log('✓ /categories HTTP 200: SUCCESS');
    } else {
      console.error(`✗ /categories returned ${resCustCat.status}`);
      routeFailures++;
    }
  } catch (err) {
    console.error('✗ /categories route error:', err.message);
    routeFailures++;
  }

  // 3. Customer Books Catalog page
  try {
    const resBooks = await getPage('/books');
    if (resBooks.status === 200 && resBooks.body.includes('Catalog')) {
      console.log('✓ /books HTTP 200: SUCCESS');
    } else {
      console.error(`✗ /books returned ${resBooks.status}`);
      routeFailures++;
    }
  } catch (err) {
    console.error('✗ /books route error:', err.message);
    routeFailures++;
  }

  // 4. Admin Products page
  try {
    const resProducts = await getPage('/admin/products');
    if (resProducts.status === 200) {
      console.log('✓ /admin/products HTTP 200: SUCCESS');
    } else {
      console.error(`✗ /admin/products returned ${resProducts.status}`);
      routeFailures++;
    }
  } catch (err) {
    console.error('✗ /admin/products route error:', err.message);
    routeFailures++;
  }

  const totalFailures = logicFailures + routeFailures;
  if (totalFailures === 0) {
    console.log('\nAll Admin Category Management tests passed successfully! ✨');
    process.exit(0);
  } else {
    console.error(`\n${totalFailures} test(s) failed.`);
    process.exit(1);
  }
}

runAllTests();
