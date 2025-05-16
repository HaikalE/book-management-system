import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await api.getBookById(id);
        setBook(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.deleteBook(id);
        navigate('/');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!book) return <p>Book not found</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Book Details</h2>
        <div>
          <button 
            onClick={() => navigate(`/books/edit/${id}`)}
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
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{book.title}</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <p><strong>Publisher:</strong> {book.publisher}</p>
          <p><strong>Price:</strong> {book.price}</p>
          <p><strong>Stock:</strong> {book.stock}</p>
          
          <div style={{ marginTop: '20px' }}>
            <p><strong>Categories:</strong></p>
            {book.categories && book.categories.length > 0 ? (
              <ul>
                {book.categories.map(category => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            ) : (
              <p>No categories assigned</p>
            )}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <p><strong>Keywords:</strong></p>
            {book.keywords && book.keywords.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {book.keywords.map(keyword => (
                  <span 
                    key={keyword.id || keyword.name}
                    style={{
                      backgroundColor: '#f0f0f0',
                      padding: '3px 10px',
                      borderRadius: '15px',
                      fontSize: '14px'
                    }}
                  >
                    {keyword.name}
                  </span>
                ))}
              </div>
            ) : (
              <p>No keywords assigned</p>
            )}
          </div>
        </div>
        
        <div>
          <h4>Description:</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{book.description}</p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '8px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Back to Books
        </button>
      </div>
    </div>
  );
};

export default BookDetail;