-- Fix database schema to ensure price is stored correctly
USE book_management;

-- Change price column in Books table to use DECIMAL(12,2)
ALTER TABLE Books MODIFY COLUMN price DECIMAL(12,2) NOT NULL;

-- This is a cleanup query that can be run if there are already incorrect price values in the database
-- It will update any existing prices that may have been stored incorrectly
UPDATE Books SET price = price * 100 WHERE price < 1 AND price > 0;
