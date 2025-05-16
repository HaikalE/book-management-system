const { Category, Book, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { includeChildren = 'true', search } = req.query;
    
    // Find only root categories if includeChildren is false
    let where = includeChildren === 'false' ? { parentId: null } : {};
    
    // Add search filter if provided
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    
    const categories = await Category.findAll({
      where,
      include: includeChildren === 'true' ? [
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children'
            }
          ]
        }
      ] : [],
      order: [
        ['name', 'ASC'],
        [{ model: Category, as: 'children' }, 'name', 'ASC'],
        [{ model: Category, as: 'children' }, { model: Category, as: 'children' }, 'name', 'ASC']
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeBooks = 'false' } = req.query;
    
    // Define include based on query parameter
    const include = [];
    
    if (includeBooks === 'true') {
      include.push({
        model: Book,
        as: 'books',
        through: { attributes: [] },
        attributes: ['id', 'title', 'price', 'stock', 'publisher']
      });
    }
    
    include.push({
      model: Category,
      as: 'children',
      include: [
        {
          model: Category,
          as: 'children'
        }
      ]
    });
    
    include.push({
      model: Category,
      as: 'parent'
    });
    
    const category = await Category.findByPk(id, { include });
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: `Category with ID ${id} not found`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve category',
      error: error.message
    });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    // Validate required field
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required'
      });
    }
    
    // Check if parent category exists if parentId is provided
    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({
          status: 'error',
          message: `Parent category with ID ${parentId} not found`
        });
      }
    }
    
    // Create category
    const category = await Category.create({
      name,
      parentId: parentId || null
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    // Find category
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: `Category with ID ${id} not found`
      });
    }
    
    // Validate circular references
    if (parentId) {
      // Check if parent category exists
      const parentCategory = await Category.findByPk(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({
          status: 'error',
          message: `Parent category with ID ${parentId} not found`
        });
      }
      
      // Prevent setting a category as its own parent
      if (parseInt(id) === parseInt(parentId)) {
        return res.status(400).json({
          status: 'error',
          message: 'A category cannot be its own parent'
        });
      }
      
      // Prevent circular references (child becoming parent of its ancestor)
      const childCategories = await findAllChildrenIds(id);
      
      if (childCategories.includes(parseInt(parentId))) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot set a child category as a parent (circular reference)'
        });
      }
    }
    
    // Update category
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    
    await category.update(updateData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findByPk(id, { transaction });
    
    if (!category) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: `Category with ID ${id} not found`
      });
    }
    
    // Get all child categories
    const childCategories = await Category.findAll({
      where: { parentId: id },
      transaction
    });
    
    // Delete category
    await category.destroy({ transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
      data: {
        affectedChildCategories: childCategories.length
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Helper function to find all child category IDs
async function findAllChildrenIds(categoryId) {
  const childIds = [];
  
  async function findChildren(parentId) {
    const children = await Category.findAll({
      where: { parentId },
      attributes: ['id']
    });
    
    for (const child of children) {
      childIds.push(child.id);
      await findChildren(child.id);
    }
  }
  
  await findChildren(categoryId);
  return childIds;
}