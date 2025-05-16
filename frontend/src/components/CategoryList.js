import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [includeChildren, setIncludeChildren] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [search, includeChildren]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const params = {
        includeChildren: includeChildren.toString(),
        search: search || undefined
      };
      
      const response = await api.getCategories(params);
      
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This will also delete all child categories.`)) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        <tr>
          <td>{category.id}</td>
          <td style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && '└─ '}
            {category.name}
          </td>
          <td>{category.parent ? category.parent.name : 'None'}</td>
          <td>
            <a href={`/categories/edit/${category.id}`}>View</a> |{' '}
            <a href={`/categories/edit/${category.id}`}>Edit</a> |{' '}
            <a href="#" onClick={() => handleDelete(category.id, category.name)}>Delete</a>
          </td>
        </tr>
        {category.children && category.children.length > 0 && 
          renderCategoryTree(category.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <div className="header">
        <h2>Category List</h2>
        <button className="button" onClick={() => window.location.href = '/categories/new'}>Add New Category</button>
      </div>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search categories"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={includeChildren}
            onChange={() => setIncludeChildren(!includeChildren)}
          />
          Include child categories
        </label>
      </div>
      
      <table className="book-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category Name</th>
            <th>Parent Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>No categories found</td>
            </tr>
          ) : (
            renderCategoryTree(categories)
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryList;