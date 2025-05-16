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
            // Remove "Rp. ", replace dots, replace comma with dot
            price = price.replace('Rp. ', '').replace(/\./g, '').replace(',', '.');
          }
          
          console.log('Original price from API:', book.price);
          console.log('Parsed price for form:', price);
          
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
        console.error('Error fetching data:', err);
        setError(err.message || 'Error loading data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For price, make sure it's a valid number input
    if (name === 'price') {
      // Allow only numbers and decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value, 10);
    
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
      // Make sure price is a number before submitting
      const numericPrice = parseFloat(formData.price);
      
      if (isNaN(numericPrice)) {
        throw new Error('Price must be a valid number');
      }
      
      console.log('Submitting price:', numericPrice);
      
      // Send just the numeric price without formatting
      const dataToSubmit = {
        ...formData,
        price: numericPrice
      };
      
      if (isEditMode) {
        await api.updateBook(id, dataToSubmit);
      } else {
        await api.createBook(dataToSubmit);
      }
      
      navigate('/');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Error saving book');
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <p>Loading...</p>;
  
  return (
    <div>
      <h2>{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
      
      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#f44336',
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="bookTitle"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Book Title*:
          </label>
          <input
            id="bookTitle"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="bookDescription"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Description*:
          </label>
          <textarea
            id="bookDescription"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="bookPrice"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Price* (in IDR):
          </label>
          <input
            id="bookPrice"
            type="text"
            name="price"
            value={formData.price}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <small style={{ color: '#666' }}>
            Enter the full price without formatting (e.g., "30000" for Rp. 30.000,00)
          </small>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="bookStock"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Stock*:
          </label>
          <input
            id="bookStock"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="bookPublisher"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Publisher*:
          </label>
          <input
            id="bookPublisher"
            type="text"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Categories:
          </label>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            padding: '10px',
            borderRadius: '4px'
          }}>
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
          <label 
            htmlFor="bookKeywords"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Keywords:
          </label>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <input
              id="bookKeywords"
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '8px', 
                marginRight: '10px',
                borderRadius: '4px', 
                border: '1px solid #ccc'
              }}
              placeholder="Type a keyword"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
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
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              fontWeight: 'bold'
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

export default BookForm;