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
        setCategories(categoriesResponse.data);
        
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
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name === 'parentId' ? parseInt(value) : value)
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
      if (isEditMode) {
        await api.updateCategory(id, formData);
      } else {
        await api.createCategory(formData);
      }
      
      navigate('/categories');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <p>Loading...</p>;
  
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
      findChildren(parseInt(categoryId));
      return childIds;
    };
    
    const childIds = getChildIds(id);
    return categories.filter(cat => cat.id !== parseInt(id) && !childIds.includes(cat.id));
  };
  
  const parentOptions = getParentOptions();
  
  return (
    <div>
      <h2>{isEditMode ? 'Edit Category' : 'Add New Category'}</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Category Name*:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Parent Category:
          </label>
          <select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
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
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Category' : 'Add Category')}
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
              cursor: 'pointer'
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