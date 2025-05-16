import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await api.getCategoryById(id, { includeBooks: 'true' });
        setCategory(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all child categories.')) {
      try {
        await api.deleteCategory(id);
        navigate('/categories');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    if (!categories || categories.length === 0) return null;

    return (
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {categories.map(cat => (
          <li key={cat.id} style={{ marginLeft: level * 20, marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {level > 0 && <span style={{ marginRight: '5px' }}>└─</span>}
              <span>{cat.name}</span>
            </div>
            {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!category) return <p>Category not found</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Category Details</h2>
        <div>
          <button 
            onClick={() => navigate(`/categories/edit/${id}`)}
            style={{
              marginRight: '10px',
              padding: '8px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button 
            onClick={handleDelete}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{category.name}</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <p><strong>Parent Category:</strong> {category.parent ? category.parent.name : 'None (Root Category)'}</p>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Child Categories:</h4>
            {category.children && category.children.length > 0 ? (
              renderCategoryTree(category.children)
            ) : (
              <p>No child categories</p>
            )}
          </div>
        </div>
        
        <div>
          <h4>Books in this Category:</h4>
          {category.books && category.books.length > 0 ? (
            <ul>
              {category.books.map(book => (
                <li key={book.id} style={{ marginBottom: '10px' }}>
                  <a 
                    href={`/books/view/${book.id}`}
                    style={{ textDecoration: 'none', color: '#2196F3' }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/books/view/${book.id}`);
                    }}
                  >
                    {book.title}
                  </a>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Price: {book.price} | Stock: {book.stock}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No books in this category</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/categories')}
          style={{
            padding: '8px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Back to Categories
        </button>
      </div>
    </div>
  );
};

export default CategoryDetail;