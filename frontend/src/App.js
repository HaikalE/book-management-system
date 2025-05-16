import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import CategoryList from './components/CategoryList';

function App() {
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

        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/categories" element={<CategoryList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;