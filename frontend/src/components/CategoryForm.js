import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    parentId: ''
  });
  
  const isEditMode = !!id;
  
  // Fetch category data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all categories for parent selection
        const categoriesResponse = await api.getCategories();
        setCategories(categoriesResponse.data || []);
        
        if (isEditMode) {
          const categoryResponse = await api.getCategoryById(id);
          const category = categoryResponse.data;
          
          setFormData({
            name: category.name || '',
            parentId: category.parentId || ''
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error fetching data');
        setLoading(false);
        console.error('Fetch error:', err);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name === 'parentId' && value ? parseInt(value, 10) : value)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Category name is required');
      return;
    }
    
    // Prevent circular references
    if (formData.parentId && formData.parentId.toString() === id) {
      setError('A category cannot be its own parent');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const dataToSubmit = {
        ...formData,
        // Convert empty string to null for backend
        parentId: formData.parentId === '' ? null : formData.parentId
      };
      
      console.log('Submitting data:', dataToSubmit);
      
      if (isEditMode) {
        await api.updateCategory(id, dataToSubmit);
      } else {
        await api.createCategory(dataToSubmit);
      }
      
      navigate('/categories');
    } catch (err) {
      setError(err.message || 'Error saving category');
      setIsSubmitting(false);
      console.error('Submit error:', err);
    }
  };
  
  // Filter out current category and its children from parent options
  const getParentOptions = () => {
    if (!isEditMode) return categories;
    
    // Helper function to get all child IDs
    const getChildIds = (categoryId) => {
      const childIds = [];
      const findChildren = (parentId) => {
        const children = categories.filter(cat => cat.parentId === parentId);
        children.forEach(child => {
          childIds.push(child.id);
          findChildren(child.id);
        });
      };
      findChildren(parseInt(id, 10));
      return childIds;
    };
    
    const childIds = getChildIds(id);
    return categories.filter(cat => cat.id !== parseInt(id, 10) && !childIds.includes(cat.id));
  };
  
  const parentOptions = getParentOptions();
  
  return (
    <div>
      <h2>{isEditMode ? 'Edit Category' : 'Add New Category'}</h2>
      
      {error && (
        <div 
          style={{ 
            color: 'white', 
            backgroundColor: '#f44336',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '4px' 
          }}
        >
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="categoryName"
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold' 
            }}
          >
            Category Name*:
          </label>
          <input
            id="categoryName"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="parentCategory"
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold' 
            }}
          >
            Parent Category:
          </label>
          <select
            id="parentCategory"
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              boxSizing: 'border-box',
              height: '38px' // Fixed height to prevent size differences
            }}
          >
            <option value="">None (Root Category)</option>
            {parentOptions.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Saving...' : 'Add Category'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/categories')}
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;