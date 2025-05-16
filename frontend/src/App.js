import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import CategoryList from './components/CategoryList';
import api from './services/api';

function App() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Since this is just the API client, we don't need to make actual API calls
        // In a real application, you would fetch data from the API
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Router>
      <div className="container">
        <header className="header">
          <h1>Book Management System</h1>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '20px' }}>
              <li>
                <Link to="/">Books</Link>
              </li>
              <li>
                <Link to="/categories">Categories</Link>
              </li>
            </ul>
          </nav>
        </header>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/categories" element={<CategoryList />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;