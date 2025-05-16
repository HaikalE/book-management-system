const { Book, Category, Keyword, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to format price to Indonesian Rupiah format
const formatPrice = (price) => {
  // Make sure price is a number and not null or undefined
  const numericPrice = parseFloat(price) || 0;
  
  // Use toLocaleString for proper Indonesian formatting - no need for regex manipulation
  return `Rp. ${numericPrice.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Helper to parse price from Indonesian Rupiah format or regular input
const parsePrice = (price) => {
  if (!price) return 0;
  
  // If price is already a number, return it directly
  if (typeof price === 'number') return price;
  
  // Check if it's in Rupiah format (contains Rp. and possibly . as thousand separator and , as decimal)
  if (typeof price === 'string' && price.includes('Rp.')) {
    // Remove Rp., any dots (thousand separators), and replace comma with dot for decimal
    return parseFloat(price.replace('Rp.', '').replace(/\./g, '').replace(',', '.'));
  }
  
  // If it's a plain number string like "30000", just parse it directly
  return parseFloat(price);
};

// Get all books with filtering, sorting, and pagination
exports.getAllBooks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      title, 
      category, 
      keyword, 
      publisher,
      minPrice,
      maxPrice,
      sortBy = 'id',
      sortDir = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for filtering
    const whereClause = {};
    if (title) {
      whereClause.title = { [Op.like]: `%${title}%` };
    }
    
    if (publisher) {
      whereClause.publisher = { [Op.like]: `%${publisher}%` };
    }
    
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price[Op.gte] = parsePrice(minPrice);
      }
      if (maxPrice) {
        whereClause.price[Op.lte] = parsePrice(maxPrice);
      }
    }

    // Build include for associations
    const include = [
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
        attributes: ['id', 'name'],
        required: !!category,
        where: category ? { name: { [Op.like]: `%${category}%` } } : {}
      },
      {
        model: Keyword,
        as: 'keywords',
        through: { attributes: [] },
        attributes: ['id', 'name'],
        required: !!keyword,
        where: keyword ? { name: { [Op.like]: `%${keyword}%` } } : {}
      }
    ];

    // Validate sortBy field to prevent SQL injection
    const validSortFields = ['id', 'title', 'price', 'stock', 'publisher', 'createdAt', 'updatedAt'];
    const validSortDirs = ['ASC', 'DESC'];
    
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'id';
    const actualSortDir = validSortDirs.includes(sortDir.toUpperCase()) ? sortDir.toUpperCase() : 'ASC';

    // Get books
    const { count, rows: books } = await Book.findAndCountAll({
      where: whereClause,
      include,
      order: [[actualSortBy, actualSortDir]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Format price for response
    const formattedBooks = books.map(book => {
      const plainBook = book.get({ plain: true });
      plainBook.price = formatPrice(plainBook.price);
      return plainBook;
    });

    return res.status(200).json({
      status: 'success',
      data: formattedBooks,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve books',
      error: error.message
    });
  }
};

// Get a single book by ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name']
        },
        {
          model: Keyword,
          as: 'keywords',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: `Book with ID ${id} not found`
      });
    }
    
    // Format price
    const plainBook = book.get({ plain: true });
    plainBook.price = formatPrice(plainBook.price);
    
    return res.status(200).json({
      status: 'success',
      data: plainBook
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve book',
      error: error.message
    });
  }
};

// Create a new book
exports.createBook = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      title, 
      description, 
      price, 
      stock, 
      publisher, 
      categories = [], 
      keywords = [] 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !price || stock === undefined || !publisher) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'All required fields must be provided (title, description, price, stock, publisher)'
      });
    }
    
    // Parse price, making sure to handle both formatted and unformatted input
    // Log original price for debugging
    console.log('Original price input:', price);
    const parsedPrice = parsePrice(price);
    console.log('Parsed price:', parsedPrice);
    
    // Create book
    const book = await Book.create({
      title,
      description,
      price: parsedPrice,
      stock,
      publisher
    }, { transaction });
    
    // Process categories
    if (categories.length > 0) {
      const categoryIds = [];
      
      for (const categoryItem of categories) {
        // Check if category is an ID or a name
        let category;
        
        if (typeof categoryItem === 'number' || !isNaN(categoryItem)) {
          // It's an ID
          category = await Category.findByPk(categoryItem, { transaction });
          if (!category) {
            await transaction.rollback();
            return res.status(404).json({
              status: 'error',
              message: `Category with ID ${categoryItem} not found`
            });
          }
        } else if (typeof categoryItem === 'string') {
          // It's a name, find or create
          [category] = await Category.findOrCreate({
            where: { name: categoryItem },
            transaction
          });
        }
        
        if (category) {
          categoryIds.push(category.id);
        }
      }
      
      await book.setCategories(categoryIds, { transaction });
    }
    
    // Process keywords
    if (keywords.length > 0) {
      const keywordIds = [];
      
      for (const keywordItem of keywords) {
        // Check if keyword is an ID or a name
        let keyword;
        
        if (typeof keywordItem === 'number' || !isNaN(keywordItem)) {
          // It's an ID
          keyword = await Keyword.findByPk(keywordItem, { transaction });
          if (!keyword) {
            await transaction.rollback();
            return res.status(404).json({
              status: 'error',
              message: `Keyword with ID ${keywordItem} not found`
            });
          }
        } else if (typeof keywordItem === 'string') {
          // It's a name, find or create
          [keyword] = await Keyword.findOrCreate({
            where: { name: keywordItem },
            transaction
          });
        }
        
        if (keyword) {
          keywordIds.push(keyword.id);
        }
      }
      
      await book.setKeywords(keywordIds, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch the book with its associations
    const createdBook = await Book.findByPk(book.id, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name']
        },
        {
          model: Keyword,
          as: 'keywords',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Format price
    const plainBook = createdBook.get({ plain: true });
    plainBook.price = formatPrice(plainBook.price);
    
    return res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: plainBook
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create book',
      error: error.message
    });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      price, 
      stock, 
      publisher, 
      categories, 
      keywords 
    } = req.body;
    
    // Find the book
    const book = await Book.findByPk(id, { transaction });
    
    if (!book) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: `Book with ID ${id} not found`
      });
    }
    
    // Update book fields
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      console.log('Update - Original price input:', price);
      updateData.price = parsePrice(price);
      console.log('Update - Parsed price:', updateData.price);
    }
    if (stock !== undefined) updateData.stock = stock;
    if (publisher !== undefined) updateData.publisher = publisher;
    
    await book.update(updateData, { transaction });
    
    // Update categories if provided
    if (categories !== undefined) {
      const categoryIds = [];
      
      for (const categoryItem of categories) {
        let category;
        
        if (typeof categoryItem === 'number' || !isNaN(categoryItem)) {
          category = await Category.findByPk(categoryItem, { transaction });
          if (!category) {
            await transaction.rollback();
            return res.status(404).json({
              status: 'error',
              message: `Category with ID ${categoryItem} not found`
            });
          }
        } else if (typeof categoryItem === 'string') {
          [category] = await Category.findOrCreate({
            where: { name: categoryItem },
            transaction
          });
        }
        
        if (category) {
          categoryIds.push(category.id);
        }
      }
      
      await book.setCategories(categoryIds, { transaction });
    }
    
    // Update keywords if provided
    if (keywords !== undefined) {
      const keywordIds = [];
      
      for (const keywordItem of keywords) {
        let keyword;
        
        if (typeof keywordItem === 'number' || !isNaN(keywordItem)) {
          keyword = await Keyword.findByPk(keywordItem, { transaction });
          if (!keyword) {
            await transaction.rollback();
            return res.status(404).json({
              status: 'error',
              message: `Keyword with ID ${keywordItem} not found`
            });
          }
        } else if (typeof keywordItem === 'string') {
          [keyword] = await Keyword.findOrCreate({
            where: { name: keywordItem },
            transaction
          });
        }
        
        if (keyword) {
          keywordIds.push(keyword.id);
        }
      }
      
      await book.setKeywords(keywordIds, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch the updated book with its associations
    const updatedBook = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name']
        },
        {
          model: Keyword,
          as: 'keywords',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Format price
    const plainBook = updatedBook.get({ plain: true });
    plainBook.price = formatPrice(plainBook.price);
    
    return res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: plainBook
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update book',
      error: error.message
    });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: `Book with ID ${id} not found`
      });
    }
    
    await book.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete book',
      error: error.message
    });
  }
};

// Delete multiple books
exports.deleteManyBooks = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of book IDs to delete'
      });
    }
    
    // Find all books that exist
    const existingBooks = await Book.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      transaction
    });
    
    if (existingBooks.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'None of the specified books were found'
      });
    }
    
    // Delete the books
    const deletedCount = await Book.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      transaction
    });
    
    await transaction.commit();
    
    // Determine which IDs were not found
    const deletedIds = existingBooks.map(book => book.id);
    const notFoundIds = ids.filter(id => !deletedIds.includes(parseInt(id)));
    
    return res.status(200).json({
      status: 'success',
      message: `Successfully deleted ${deletedCount} book(s)`,
      data: {
        deletedCount,
        deletedIds,
        notFoundIds
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete books',
      error: error.message
    });
  }
};