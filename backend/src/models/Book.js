'use strict';

module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Book title is required'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Book description is required'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Price must be a number'
        },
        min: {
          args: [0],
          msg: 'Price must be greater than or equal to 0'
        }
      },
      get() {
        const value = this.getDataValue('price');
        return value ? parseFloat(value) : null;
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Stock must be an integer'
        },
        min: {
          args: [0],
          msg: 'Stock must be greater than or equal to 0'
        }
      }
    },
    publisher: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Publisher is required'
        }
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
    tableName: 'Books',
    timestamps: true
  });

  Book.associate = function(models) {
    // Book can have many Categories
    Book.belongsToMany(models.Category, {
      through: 'BookCategories',
      as: 'categories',
      foreignKey: 'bookId'
    });

    // Book can have many Keywords
    Book.belongsToMany(models.Keyword, {
      through: 'BookKeywords',
      as: 'keywords',
      foreignKey: 'bookId'
    });
  };

  /**
   * @swagger
   * components:
   *   schemas:
   *     Book:
   *       type: object
   *       required:
   *         - title
   *         - description
   *         - price
   *         - stock
   *         - publisher
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated id of the book
   *         title:
   *           type: string
   *           description: The book title
   *         description:
   *           type: string
   *           description: The book description
   *         price:
   *           type: number
   *           format: decimal
   *           description: The book price
   *         stock:
   *           type: integer
   *           description: The book stock quantity
   *         publisher:
   *           type: string
   *           description: The book publisher
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date the book was created
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date the book was last updated
   */
  return Book;
};