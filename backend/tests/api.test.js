const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/models');

// Close database connection after tests
afterAll(async () => {
  await sequelize.close();
});

// Test book endpoints
describe('Book API', () => {
  let createdBookId;
  let createdCategoryId;

  // Create a test category before testing books
  beforeAll(async () => {
    const categoryResponse = await request(app)
      .post('/api/categories')
      .send({ name: 'Test Category' });

    createdCategoryId = categoryResponse.body.data.id;
  });

  // Test creating a book
  test('Should create a new book', async () => {
    const bookData = {
      title: 'Test Book',
      description: 'This is a test book',
      price: 'Rp. 50.000,00',
      stock: 10,
      publisher: 'Test Publisher',
      categories: [createdCategoryId],
      keywords: ['test', 'book']
    };

    const response = await request(app)
      .post('/api/books')
      .send(bookData)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.title).toBe(bookData.title);
    expect(response.body.data.categories).toHaveLength(1);
    expect(response.body.data.keywords).toHaveLength(2);
    
    createdBookId = response.body.data.id;
  });

  // Test getting all books
  test('Should get all books', async () => {
    const response = await request(app)
      .get('/api/books')
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toHaveProperty('totalItems');
  });

  // Test getting a book by id
  test('Should get a book by id', async () => {
    const response = await request(app)
      .get(`/api/books/${createdBookId}`)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(createdBookId);
  });

  // Test updating a book
  test('Should update a book', async () => {
    const updateData = {
      title: 'Updated Book Title',
      stock: 20
    };

    const response = await request(app)
      .put(`/api/books/${createdBookId}`)
      .send(updateData)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe(updateData.title);
    expect(response.body.data.stock).toBe(updateData.stock);
  });

  // Test deleting a book
  test('Should delete a book', async () => {
    const response = await request(app)
      .delete(`/api/books/${createdBookId}`)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('deleted successfully');
  });
});

// Test category endpoints
describe('Category API', () => {
  let rootCategoryId;
  let childCategoryId;

  // Test creating a category
  test('Should create a root category', async () => {
    const categoryData = {
      name: 'Root Test Category'
    };

    const response = await request(app)
      .post('/api/categories')
      .send(categoryData)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(categoryData.name);
    
    rootCategoryId = response.body.data.id;
  });

  // Test creating a child category
  test('Should create a child category', async () => {
    const categoryData = {
      name: 'Child Test Category',
      parentId: rootCategoryId
    };

    const response = await request(app)
      .post('/api/categories')
      .send(categoryData)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(categoryData.name);
    expect(response.body.data.parentId).toBe(rootCategoryId);
    
    childCategoryId = response.body.data.id;
  });

  // Test getting all categories
  test('Should get all categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data).toBeInstanceOf(Array);
  });

  // Test getting a category by id
  test('Should get a category by id with children', async () => {
    const response = await request(app)
      .get(`/api/categories/${rootCategoryId}`)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(rootCategoryId);
    expect(response.body.data.children).toBeInstanceOf(Array);
    expect(response.body.data.children.length).toBeGreaterThan(0);
  });

  // Test updating a category
  test('Should update a category', async () => {
    const updateData = {
      name: 'Updated Category Name'
    };

    const response = await request(app)
      .put(`/api/categories/${childCategoryId}`)
      .send(updateData)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data.name).toBe(updateData.name);
  });

  // Test deleting a category
  test('Should delete a category', async () => {
    const response = await request(app)
      .delete(`/api/categories/${childCategoryId}`)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('deleted successfully');

    // Also delete the root category
    await request(app)
      .delete(`/api/categories/${rootCategoryId}`)
      .expect(200);
  });
});