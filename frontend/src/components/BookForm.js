import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const BookForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: 0,
    publisher: '',
    categories: [],
    keywords: []
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  
  const isEditMode = !!id;
  
  // Fetch book data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories regardless of mode
        const categoriesResponse = await api.getCategories();
        setCategories(categoriesResponse.data);
        
        if (isEditMode) {
          const bookResponse = await api.getBookById(id);
          const book = bookResponse.data;
          
          // Parse price from format "Rp. 50.000,00" to number format for the form
          let price = book.price;
          if (typeof price === 'string') {
            price = price.replace('Rp. ', '').replace('.', '').replace(',', '.');
          }
          
          setFormData({
            title: book.title || '',
            description: book.description || '',
            price: price || '',
            stock: book.stock || 0,
            publisher: book.publisher || '',
            categories: book.categories?.map(cat => cat.id) || [],
            keywords: book.keywords?.map(kw => kw.name) || []
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value);
    
    setFormData(prev => {
      const categoryExists = prev.categories.includes(categoryId);
      
      if (categoryExists) {
        // Remove the category if it's already selected
        return {
          ...prev,
          categories: prev.categories.filter(id => id !== categoryId)
        };
      } else {
        // Add the category if it's not already selected
        return {
          ...prev,
          categories: [...prev.categories, categoryId]
        };
      }
    });
  };
  
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  const handleRemoveKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(kw => kw !== keyword)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.publisher) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Format price to Rupiah format
      const formattedData = {
        ...formData,
        price: `Rp. ${parseFloat(formData.price).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
      };
      
      if (isEditMode) {
        await api.updateBook(id, formattedData);
      } else {
        await api.createBook(formattedData);
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <p>Loading...</p>;
  
  return (
    <div>
      <h2>{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Book Title*:
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description*:
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Price* (in IDR):
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
            min="0"
            step="0.01"
            required
          />
          <small>Will be formatted as Rp. xx.xxx,xx</small>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Stock*:
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
            min="0"
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Publisher*:
          </label>
          <input
            type="text"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Categories:
          </label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {categories.length === 0 ? (
              <p>No categories available</p>
            ) : (
              categories.map(category => (
                <div key={category.id} style={{ marginBottom: '5px' }}>
                  <label>
                    <input
                      type="checkbox"
                      value={category.id}
                      checked={formData.categories.includes(category.id)}
                      onChange={handleCategoryChange}
                    />
                    {' '}{category.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Keywords:
          </label>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              style={{ flex: 1, padding: '8px', marginRight: '10px' }}
              placeholder="Type a keyword"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {formData.keywords.map(keyword => (
              <div
                key={keyword}
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  style={{
                    marginLeft: '5px',
                    background: 'none',
                    border: 'none',
                    color: 'red',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
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
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Book' : 'Add Book')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
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

export default BookForm;