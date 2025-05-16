'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookKeywords', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Books',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      keywordId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Keywords',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint for bookId and keywordId
    await queryInterface.addConstraint('BookKeywords', {
      fields: ['bookId', 'keywordId'],
      type: 'unique',
      name: 'unique_book_keyword'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BookKeywords');
  }
};