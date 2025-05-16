import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    parentId: '',
    includeChildren: true,
    sortBy: 'id',
    sortDir: 'ASC'
  });

  // Use separate debounce timers for each filter
  const nameTimerRef = useRef(null);
  const parentIdTimerRef = useRef(null);
  
  // Store the latest filter values that have been applied
  const appliedFilters = useRef({
    ...filters
  });

  // Track API requests to prevent multiple simultaneous requests
  const isLoadingRef = useRef(false);

  // Fetch categories with error handling
  const fetchCategories = useCallback(async () => {
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
      
      console.log('Fetching categories with params:', params);
      
      const response = await api.getCategories(params);
      
      setCategories(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load categories. Please try again later.');
      setCategories([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // No dependencies to prevent infinite rerenders

  // Apply filter changes with debouncing
  const applyFilter = useCallback((name, value) => {
    appliedFilters.current = {
      ...appliedFilters.current,
      [name]: value
    };
    
    fetchCategories();
  }, [fetchCategories]);

  // Handle filter changes with debouncing
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Update the filter state immediately for responsive UI
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Clear any existing timer for this filter
    let timerRef;
    switch (name) {
      case 'name': timerRef = nameTimerRef; break;
      case 'parentId': timerRef = parentIdTimerRef; break;
      default: timerRef = null;
    }
    
    if (timerRef && timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // For sort fields and checkbox, apply immediately without debounce
    if (name === 'sortBy' || name === 'sortDir' || name === 'includeChildren') {
      applyFilter(name, name === 'includeChildren' ? e.target.checked : value);
      return;
    }
    
    // Debounce other filters (500ms delay)
    timerRef.current = setTimeout(() => {
      applyFilter(name, value);
    }, 500);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchCategories();
    
    // Cleanup timers on unmount
    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
      if (parentIdTimerRef.current) clearTimeout(parentIdTimerRef.current);
    };
  }, [fetchCategories]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCategories(categories.map(category => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (e, id) => {
    if (e.target.checked) {
      setSelectedCategories(prev => [...prev, id]);
    } else {
      setSelectedCategories(prev => prev.filter(categoryId => categoryId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCategories.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} category(ies)?`)) {
      try {
        // Implement the batch delete API call for categories
        // await api.deleteManyCategories(selectedCategories);
        // Since this API might not exist yet, we'll delete categories one by one
        for (const id of selectedCategories) {
          await api.deleteCategory(id);
        }
        fetchCategories();
        setSelectedCategories([]);
      } catch (err) {
        setError(err.message || 'Failed to delete categories');
      }
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Delete ${name}? This will also delete all child categories.`)) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  const renderCategoryTree = (categories, parentPath = '', level = 0) => {
    return categories.map((category, index) => {
      const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;
      
      return (
        <React.Fragment key={category.id}>
          <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={selectedCategories.includes(category.id)}
                onChange={(e) => handleSelectCategory(e, category.id)}
                aria-label={`Select ${category.name}`}
              />
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {category.id}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>
              {level > 0 && (
                <span className="text-gray-400 mr-1">└─</span>
              )}
              {category.name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
              {currentPath}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
              {category.parent ? category.parent.name : 'None'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = `/categories/view/${category.id}`}
                  className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out"
                  aria-label={`View ${category.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => window.location.href = `/categories/edit/${category.id}`}
                  className="text-yellow-600 hover:text-yellow-900 transition duration-150 ease-in-out"
                  aria-label={`Edit ${category.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
                  aria-label={`Delete ${category.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          {category.children && category.children.length > 0 && 
            renderCategoryTree(category.children, currentPath, level + 1)
          }
        </React.Fragment>
      );
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Category Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.href = '/categories/new'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
            aria-label="Add new category"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Category
          </button>
          
          {selectedCategories.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
              aria-label="Delete selected categories"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete Selected ({selectedCategories.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="bg-white p-4 mb-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Search & Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mb-0">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Filter by name"
              value={filters.name}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0">
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <input
              id="parentId"
              type="text"
              name="parentId"
              placeholder="Filter by parent ID"
              value={filters.parentId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-0 flex items-center">
            <label className="flex items-center cursor-pointer mt-6">
              <input
                type="checkbox"
                name="includeChildren"
                checked={filters.includeChildren}
                onChange={handleFilterChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Include child categories</span>
            </label>
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
              <option value="name">Sort by Name</option>
              <option value="parentId">Sort by Parent ID</option>
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
            onClick={() => fetchCategories()} 
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
                  onClick={fetchCategories}
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
          <p className="text-gray-600">Loading categories...</p>
          <p className="text-sm text-gray-500 mt-2">
            This might take a moment. Please make sure the backend server is running.
          </p>
        </div>
      ) : (
        <>
          {/* Empty state */}
          {categories.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-gray-600">No categories found matching your criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or add a new category.</p>
              <button 
                onClick={() => window.location.href = '/categories/new'} 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-150 ease-in-out text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Category
              </button>
            </div>
          ) : (
            <>
              {/* Categories table */}
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
                            checked={selectedCategories.length === categories.length && categories.length > 0}
                            aria-label="Select all categories"
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {renderCategoryTree(categories)}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryList;