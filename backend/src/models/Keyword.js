'use strict';

module.exports = (sequelize, DataTypes) => {
  const Keyword = sequelize.define('Keyword', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Keyword name is required'
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
    tableName: 'Keywords',
    timestamps: true
  });

  Keyword.associate = function(models) {
    // Keyword can be associated with many Books
    Keyword.belongsToMany(models.Book, {
      through: 'BookKeywords',
      as: 'books',
      foreignKey: 'keywordId'
    });
  };

  /**
   * @swagger
   * components:
   *   schemas:
   *     Keyword:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated id of the keyword
   *         name:
   *           type: string
   *           description: The keyword name
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date the keyword was created
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date the keyword was last updated
   */
  return Keyword;
};