# Book Management System

A RESTful API for book management with React frontend and Node.js backend.

## Features

- CRUD operations for books and book categories
- Parent-child relationship for book categories
- Multiple category assignment for books
- Multiple keyword assignment for books
- Multiple data deletion
- Search, filter, and sorting functionality
- Price format: Rp. 10.000,00

## Tech Stack

- **Backend**:
  - Node.js
  - Express.js
  - MySQL
  - Sequelize ORM
  - Swagger for API documentation

- **Frontend**:
  - React
  - React Router
  - Axios

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- MySQL (v5.7 or later)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your database settings in the `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASS=your_mysql_password
   DB_NAME=book_management
   DB_PORT=3306
   ```

5. Create the database:
   ```sql
   CREATE DATABASE book_management;
   ```

6. Run migrations to set up database tables:
   ```bash
   npm run migrate
   ```

7. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

8. The backend API will be available at: `http://localhost:3001`
   - API Documentation: `http://localhost:3001/api-docs`

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file for the frontend:
   ```bash
   echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
   ```

4. Start the React development server:
   ```bash
   npm start
   ```

5. The frontend will be available at: `http://localhost:3000`

## API Documentation

The API documentation is available at `http://localhost:3001/api-docs` when the server is running.

### Main API Endpoints

#### Books API

- `GET /api/books` - Get all books with filtering, sorting, and pagination
- `GET /api/books/:id` - Get a book by ID
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book
- `POST /api/books/batch/delete` - Delete multiple books

#### Categories API

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a category by ID
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

## Database Schema

### Categories
- `id` (PK)
- `name`
- `parentId` (FK to Categories)
- `createdAt`
- `updatedAt`

### Books
- `id` (PK)
- `title`
- `description`
- `price`
- `stock`
- `publisher`
- `createdAt`
- `updatedAt`

### Keywords
- `id` (PK)
- `name`
- `createdAt`
- `updatedAt`

### BookCategories
- `id` (PK)
- `bookId` (FK to Books)
- `categoryId` (FK to Categories)
- `createdAt`
- `updatedAt`

### BookKeywords
- `id` (PK)
- `bookId` (FK to Books)
- `keywordId` (FK to Keywords)
- `createdAt`
- `updatedAt`

## Security Features

- Input validation using express-validator
- SQL injection protection with parameterized queries
- XSS protection with helmet
- CORS configuration
- Transaction-based database operations
- Error handling middleware

## License

MIT
