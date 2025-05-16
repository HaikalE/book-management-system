import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use separate debounce timers for each filter
  const titleTimerRef = useRef(null);
  const categoryTimerRef = useRef(null);
  const keywordTimerRef = useRef(null);
  const publisherTimerRef = useRef(null);
  const minPriceTimerRef = useRef(null);
  const maxPriceTimerRef = useRef(null);

  // Store the latest filter values that have been applied
  const appliedFilters = useRef({
    ...filters,
    page: pagination.currentPage,
    limit: pagination.itemsPerPage
  });

  // Track API requests to prevent multiple simultaneous requests
  const isLoadingRef = useRef(false);

  // Fetch books with error handling
  const fetchBooks = useCallback(async () => {
    // If already loading, skip this request
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      // Prepare query parameters using the latest applied filters
      const params = { ...appliedFilters.current };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      console.log('Fetching books with params:', params);
      
      const response = await api.getBooks(params);
      
      setBooks(response.data || []);
      setPagination(response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message || 'Failed to load books. Please try again later.');
      setBooks([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // No dependencies to prevent infinite rerenders

  // Apply filter changes with debouncing
  const applyFilter = useCallback((name, value) => {
    appliedFilters.current = {
      ...appliedFilters.current,
      [name]: value,
      // Reset to page 1 when filters change (except sorting)
      ...(name !== 'sortBy' && name !== 'sortDir' ? { page: 1 } : {})
    };
    
    fetchBooks();
  }, [fetchBooks]);

  // Handle filter changes with debouncing
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Update the filter state immediately for responsive UI
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Clear any existing timer for this filter
    let timerRef;
    switch (name) {
      case 'title': timerRef = titleTimerRef; break;
      case 'category': timerRef = categoryTimerRef; break;
      case 'keyword': timerRef = keywordTimerRef; break;
      case 'publisher': timerRef = publisherTimerRef; break;
      case 'minPrice': timerRef = minPriceTimerRef; break;
      case 'maxPrice': timerRef = maxPriceTimerRef; break;
      default: timerRef = null;
    }
    
    if (timerRef && timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // For sort fields, apply immediately without debounce
    if (name === 'sortBy' || name === 'sortDir') {
      applyFilter(name, value);
      return;
    }
    
    // Debounce other filters (500ms delay)
    timerRef.current = setTimeout(() => {
      applyFilter(name, value);
    }, 500);
  };

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    appliedFilters.current.page = page;
    fetchBooks();
  }, [fetchBooks]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchBooks();
    
    // Cleanup timers on unmount
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
      if (publisherTimerRef.current) clearTimeout(publisherTimerRef.current);
      if (minPriceTimerRef.current) clearTimeout(minPriceTimerRef.current);
      if (maxPriceTimerRef.current) clearTimeout(maxPriceTimerRef.current);
    };
  }, [fetchBooks]);

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
        setError(err.message || 'Failed to delete books');
      }
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (window.confirm(`Delete ${title}?`)) {
      try {
        await api.deleteBook(id);
        fetchBooks();
      } catch (err) {
        setError(err.message || 'Failed to delete book');
      }
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (pagination.totalPages - endPage < Math.floor(maxVisiblePages / 2)) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
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

  return (
    <div>
      <div className="header">
        <h2>Book List</h2>
        <div>
          <button 
            className="button" 
            onClick={() => window.location.href = '/books/new'}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add New Book
          </button>
          {selectedBooks.length > 0 && (
            <button 
              className="button delete" 
              onClick={handleDeleteSelected}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                padding: '10px 20px',
                marginLeft: '10px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete Selected ({selectedBooks.length})
            </button>
          )}
        </div>
      </div>
      
      <div className="filters" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          name="title"
          placeholder="Filter by title"
          value={filters.title}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          name="category"
          placeholder="Filter by category"
          value={filters.category}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          name="keyword"
          placeholder="Filter by keyword"
          value={filters.keyword}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          name="publisher"
          placeholder="Filter by publisher"
          value={filters.publisher}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          name="minPrice"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          name="maxPrice"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px 15px', 
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
          <p>Make sure the backend server is running at http://localhost:3001</p>
          <button 
            onClick={fetchBooks}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '5px 10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          margin: '20px 0'
        }}>
          <p>Loading books...</p>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            This might take a moment. Please make sure the backend server is running.
          </p>
        </div>
      ) : (
        <>
          {books.length === 0 && !error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              margin: '20px 0'
            }}>
              <p>No books found matching your criteria.</p>
              <p>Try adjusting your filters or add a new book.</p>
            </div>
          ) : (
            <>
              <table className="book-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedBooks.length === books.length && books.length > 0}
                      />
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>No.</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Keywords</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Stock</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Publisher</th>
                    <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr key={book.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book.id)}
                          onChange={(e) => handleSelectBook(e, book.id)}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.title}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.description.length > 50 ? `${book.description.substring(0, 50)}...` : book.description}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.categories?.map(cat => cat.name).join(', ')}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.keywords?.map(kw => kw.name).join(', ')}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.price}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.stock}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{book.publisher}</td>
                      <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                        <button 
                          onClick={() => window.location.href = `/books/view/${book.id}`}
                          style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', marginRight: '5px' }}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => window.location.href = `/books/edit/${book.id}`}
                          style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', marginRight: '5px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {renderPagination()}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BookList;