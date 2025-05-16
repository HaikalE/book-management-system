import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    title: '',
    category: '',
    keyword: '',
    publisher: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'id',
    sortDir: 'ASC'
  });

  // Memoize fetchBooks function to avoid it being recreated on every render
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await api.getBooks(params);
      
      setBooks(response.data);
      setPagination(response.pagination);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, filters]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filter changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBooks(books.map(book => book.id));
    } else {
      setSelectedBooks([]);
    }
  };

  const handleSelectBook = (e, id) => {
    if (e.target.checked) {
      setSelectedBooks(prev => [...prev, id]);
    } else {
      setSelectedBooks(prev => prev.filter(bookId => bookId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBooks.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedBooks.length} book(s)?`)) {
      try {
        await api.deleteManyBooks(selectedBooks);
        fetchBooks();
        setSelectedBooks([]);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (window.confirm(`Delete ${title}?`)) {
      try {
        await api.deleteBook(id);
        fetchBooks();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={pagination.currentPage === i ? 'active' : ''}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={pagination.currentPage === 1}
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Last
        </button>
      </div>
    );
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <div className="header">
        <h2>Book List</h2>
        <div>
          <button className="button" onClick={() => window.location.href = '/books/new'}>Add New Book</button>
          {selectedBooks.length > 0 && (
            <button className="button delete" onClick={handleDeleteSelected}>Delete Selected ({selectedBooks.length})</button>
          )}
        </div>
      </div>
      
      <div className="filters">
        <input
          type="text"
          name="title"
          placeholder="Filter by title"
          value={filters.title}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="category"
          placeholder="Filter by category"
          value={filters.category}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="keyword"
          placeholder="Filter by keyword"
          value={filters.keyword}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="publisher"
          placeholder="Filter by publisher"
          value={filters.publisher}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="minPrice"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="maxPrice"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
        >
          <option value="id">Sort by ID</option>
          <option value="title">Sort by Title</option>
          <option value="price">Sort by Price</option>
          <option value="stock">Sort by Stock</option>
          <option value="publisher">Sort by Publisher</option>
          <option value="createdAt">Sort by Created Date</option>
        </select>
        <select
          name="sortDir"
          value={filters.sortDir}
          onChange={handleFilterChange}
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
      
      <table className="book-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedBooks.length === books.length && books.length > 0}
              />
            </th>
            <th>No.</th>
            <th>Title</th>
            <th>Description</th>
            <th>Category</th>
            <th>Keywords</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Publisher</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center' }}>No books found</td>
            </tr>
          ) : (
            books.map((book, index) => (
              <tr key={book.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedBooks.includes(book.id)}
                    onChange={(e) => handleSelectBook(e, book.id)}
                  />
                </td>
                <td>{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                <td>{book.title}</td>
                <td>{book.description.length > 50 ? `${book.description.substring(0, 50)}...` : book.description}</td>
                <td>{book.categories?.map(cat => cat.name).join(', ')}</td>
                <td>{book.keywords?.map(kw => kw.name).join(', ')}</td>
                <td>{book.price}</td>
                <td>{book.stock}</td>
                <td>{book.publisher}</td>
                <td>
                  <button onClick={() => window.location.href = `/books/view/${book.id}`}>View</button> |{' '}
                  <button onClick={() => window.location.href = `/books/edit/${book.id}`}>Edit</button> |{' '}
                  <button onClick={() => handleDeleteBook(book.id, book.title)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {renderPagination()}
    </div>
  );
};

export default BookList;