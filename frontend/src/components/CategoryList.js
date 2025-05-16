import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [includeChildren, setIncludeChildren] = useState(true);

  // Use timer ref for debounce
  const searchTimerRef = useRef(null);
  
  // Track API requests to prevent multiple simultaneous requests
  const isLoadingRef = useRef(false);
  
  // Store the latest search value that has been applied
  const appliedSearchRef = useRef('');
  const appliedIncludeChildrenRef = useRef(includeChildren);

  // Fetch categories with error handling
  const fetchCategories = useCallback(async () => {
    // If already loading, skip this request
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const params = {
        includeChildren: appliedIncludeChildrenRef.current.toString(),
        search: appliedSearchRef.current || undefined
      };
      
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
  }, []);

  // Apply search term with debouncing
  const applySearch = useCallback((searchTerm) => {
    appliedSearchRef.current = searchTerm;
    fetchCategories();
  }, [fetchCategories]);

  // Apply include children change
  const applyIncludeChildren = useCallback((value) => {
    appliedIncludeChildrenRef.current = value;
    fetchCategories();
  }, [fetchCategories]);

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Debounce search (500ms delay)
    searchTimerRef.current = setTimeout(() => {
      applySearch(value);
    }, 500);
  };

  // Handle include children changes
  const handleIncludeChildrenChange = () => {
    const newValue = !includeChildren;
    setIncludeChildren(newValue);
    applyIncludeChildren(newValue);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchCategories();
    
    // Cleanup timer on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchCategories]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This will also delete all child categories.`)) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        <tr style={{ backgroundColor: level % 2 === 0 ? '#f9f9f9' : 'white' }}>
          <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{category.id}</td>
          <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', paddingLeft: `${level * 20 + 12}px` }}>
            {level > 0 && '└─ '}
            {category.name}
          </td>
          <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{category.parent ? category.parent.name : 'None'}</td>
          <td style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
            <button 
              onClick={() => window.location.href = `/categories/view/${category.id}`}
              style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', marginRight: '5px' }}
            >
              View
            </button>
            <button 
              onClick={() => window.location.href = `/categories/edit/${category.id}`}
              style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', marginRight: '5px' }}
            >
              Edit
            </button>
            <button 
              onClick={() => handleDelete(category.id, category.name)}
              style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}
            >
              Delete
            </button>
          </td>
        </tr>
        {category.children && category.children.length > 0 && 
          renderCategoryTree(category.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Category List</h2>
        <button 
          className="button" 
          onClick={() => window.location.href = '/categories/new'}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add New Category
        </button>
      </div>
      
      <div className="filters" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <input
          type="text"
          placeholder="Search categories"
          value={search}
          onChange={handleSearchChange}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', flexGrow: 1 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeChildren}
            onChange={handleIncludeChildrenChange}
          />
          Include child categories
        </label>
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
            onClick={fetchCategories}
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
          <p>Loading categories...</p>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            This might take a moment. Please make sure the backend server is running.
          </p>
        </div>
      ) : (
        <>
          {categories.length === 0 && !error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              margin: '20px 0'
            }}>
              <p>No categories found.</p>
              <p>Try adjusting your search or add a new category.</p>
            </div>
          ) : (
            <table className="book-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Category Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Parent Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderCategoryTree(categories)}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryList;