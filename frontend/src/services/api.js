import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Books API
const getBooksApi = async (params) => {
  const response = await api.get('/books', { params });
  return response.data;
};

const getBookByIdApi = async (id) => {
  const response = await api.get(`/books/${id}`);
  return response.data;
};

const createBookApi = async (bookData) => {
  const response = await api.post('/books', bookData);
  return response.data;
};

const updateBookApi = async (id, bookData) => {
  const response = await api.put(`/books/${id}`, bookData);
  return response.data;
};

const deleteBookApi = async (id) => {
  const response = await api.delete(`/books/${id}`);
  return response.data;
};

const deleteManyBooksApi = async (ids) => {
  const response = await api.post('/books/batch/delete', { ids });
  return response.data;
};

// Categories API
const getCategoriesApi = async (params) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

const getCategoryByIdApi = async (id, params) => {
  const response = await api.get(`/categories/${id}`, { params });
  return response.data;
};

const createCategoryApi = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

const updateCategoryApi = async (id, categoryData) => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

const deleteCategoryApi = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// Create API object
const apiService = {
  getBooks: getBooksApi,
  getBookById: getBookByIdApi,
  createBook: createBookApi,
  updateBook: updateBookApi,
  deleteBook: deleteBookApi,
  deleteManyBooks: deleteManyBooksApi,
  getCategories: getCategoriesApi,
  getCategoryById: getCategoryByIdApi,
  createCategory: createCategoryApi,
  updateCategory: updateCategoryApi,
  deleteCategory: deleteCategoryApi,
};

export default apiService;