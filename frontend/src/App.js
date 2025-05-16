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
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-emerald-600">SAMA Book Management System</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-700 hover:text-emerald-600 hover:border-emerald-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Books
                  </Link>
                  <Link
                    to="/categories"
                    className="border-transparent text-gray-700 hover:text-emerald-600 hover:border-emerald-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Categories
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          <div className="sm:hidden" id="mobile-menu">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="text-gray-700 hover:bg-gray-50 hover:text-emerald-600 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              >
                Books
              </Link>
              <Link
                to="/categories"
                className="text-gray-700 hover:bg-gray-50 hover:text-emerald-600 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              >
                Categories
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>
    </Router>
  );
}

export default App;