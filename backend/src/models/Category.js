'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Category name is required'
        }
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'Categories',
    timestamps: true
  });

  Category.associate = function(models) {
    // Self-referencing - ParentCategory has many ChildCategories
    Category.hasMany(models.Category, { 
      as: 'children', 
      foreignKey: 'parentId',
      onDelete: 'CASCADE'
    });
    
    // Self-referencing - ChildCategory belongs to a ParentCategory
    Category.belongsTo(models.Category, { 
      as: 'parent', 
      foreignKey: 'parentId'
    });

    // Category can have many Books
    Category.belongsToMany(models.Book, {
      through: 'BookCategories',
      as: 'books',
      foreignKey: 'categoryId'
    });
  };

  /**
   * @swagger
   * components:
   *   schemas:
   *     Category:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated id of the category
   *         name:
   *           type: string
   *           description: The category name
   *         parentId:
   *           type: integer
   *           description: The parent category id (null if it's a root category)
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date the category was created
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date the category was last updated
   */
  return Category;
};