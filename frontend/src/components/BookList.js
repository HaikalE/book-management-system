import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// This component assumes Tailwind CSS is available in the project
// You may need to install Tailwind CSS: npm install -D tailwindcss postcss autoprefixer
// And configure it according to the docs: https://tailwindcss.com/docs/guides/create-react-app

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Book Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.href = '/books/new'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
            aria-label="Add new book"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Book
          </button>
          
          {selectedBooks.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
              aria-label="Delete selected books"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete Selected ({selectedBooks.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="bg-white p-4 mb-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Search & Filter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="mb-0">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="Filter by title"
              value={filters.title}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <input
              id="category"
              type="text"
              name="category"
              placeholder="Filter by category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              id="keyword"
              type="text"
              name="keyword"
              placeholder="Filter by keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">Penerbit</label>
            <input
              id="publisher"
              type="text"
              name="publisher"
              placeholder="Filter by publisher"
              value={filters.publisher}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">Harga Min</label>
            <input
              id="minPrice"
              type="text"
              name="minPrice"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">Harga Max</label>
            <input
              id="maxPrice"
              type="text"
              name="maxPrice"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Sorting options */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full sm:w-1/2">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="id">Sort by ID</option>
              <option value="title">Sort by Title</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
              <option value="publisher">Sort by Publisher</option>
              <option value="createdAt">Sort by Created Date</option>
            </select>
          </div>
          
          <div className="w-full sm:w-1/2">
            <label htmlFor="sortDir" className="block text-sm font-medium text-gray-700 mb-1">Sort Direction</label>
            <select
              id="sortDir"
              name="sortDir"
              value={filters.sortDir}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>
        
        {/* Search button */}
        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => fetchBooks()} 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Search
          </button>
        </div>
      </div>
      
      {/* Error handling */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-1">Make sure the backend server is running at http://localhost:3001</p>
              </div>
              <div className="mt-3">
                <button 
                  onClick={fetchBooks}
                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md transition duration-150 ease-in-out text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading books...</p>
          <p className="text-sm text-gray-500 mt-2">
            This might take a moment. Please make sure the backend server is running.
          </p>
        </div>
      ) : (
        <>
          {/* Empty state */}
          {books.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-600">No books found matching your criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or add a new book.</p>
              <button 
                onClick={() => window.location.href = '/books/new'} 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Book
              </button>
            </div>
          ) : (
            <>
              {/* Book table */}
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onChange={handleSelectAll}
                            checked={selectedBooks.length === books.length && books.length > 0}
                            aria-label="Select all books"
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul Buku</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerbit</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((book, index) => (
                      <tr key={book.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedBooks.includes(book.id)}
                            onChange={(e) => handleSelectBook(e, book.id)}
                            aria-label={`Select ${book.title}`}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {book.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-sm truncate">
                          {book.description.length > 50 ? `${book.description.substring(0, 50)}...` : book.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {book.categories?.map(cat => cat.name).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {book.keywords?.map(kw => (
                            <span key={kw.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1">
                              {kw.name}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {book.price}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${book.stock > 10 ? 'bg-green-100 text-green-800' : book.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {book.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {book.publisher}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => window.location.href = `/books/view/${book.id}`}
                              className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out"
                              aria-label={`View ${book.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => window.location.href = `/books/edit/${book.id}`}
                              className="text-yellow-600 hover:text-yellow-900 transition duration-150 ease-in-out"
                              aria-label={`Edit ${book.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
                              aria-label={`Delete ${book.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 sm:px-6 rounded-lg shadow-sm mt-4">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{books.length > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}</span> to <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">First</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Render page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          pagination.currentPage - 2 + i,
                          pagination.totalPages - Math.min(4, pagination.totalPages) + i
                        ));
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === pageNum ? 'bg-blue-50 border-blue-500 text-blue-600 z-10' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Last</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L15.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BookList;