import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import CategoryList from './components/CategoryList';
import BookForm from './components/BookForm';
import CategoryForm from './components/CategoryForm';
import BookDetail from './components/BookDetail';
import CategoryDetail from './components/CategoryDetail';

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
          {/* Book Routes */}
          <Route path="/" element={<BookList />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/edit/:id" element={<BookForm />} />
          <Route path="/books/view/:id" element={<BookDetail />} />
          
          {/* Category Routes */}
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/new" element={<CategoryForm />} />
          <Route path="/categories/edit/:id" element={<CategoryForm />} />
          <Route path="/categories/view/:id" element={<CategoryDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;