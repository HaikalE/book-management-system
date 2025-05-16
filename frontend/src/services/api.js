import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Books API
export const getBooks = async (params) => {
  const response = await api.get('/books', { params });
  return response.data;
};

export const getBookById = async (id) => {
  const response = await api.get(`/books/${id}`);
  return response.data;
};

export const createBook = async (bookData) => {
  const response = await api.post('/books', bookData);
  return response.data;
};

export const updateBook = async (id, bookData) => {
  const response = await api.put(`/books/${id}`, bookData);
  return response.data;
};

export const deleteBook = async (id) => {
  const response = await api.delete(`/books/${id}`);
  return response.data;
};

export const deleteManyBooks = async (ids) => {
  const response = await api.post('/books/batch/delete', { ids });
  return response.data;
};

// Categories API
export const getCategories = async (params) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

export const getCategoryById = async (id, params) => {
  const response = await api.get(`/categories/${id}`, { params });
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export default {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  deleteManyBooks,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};