INSERT INTO products (id, title, description, price)
VALUES ('179e3289-2f77-4189-81d4-18b7f20e5e45', 'iPhone11', 'Description for iPhone11', 100),
       ('531fb673-80c9-4fd2-b538-eaf382fd8c89', 'iPhone12', 'Description for iPhone12', 200),
       ('531fb673-80c9-4fd2-b538-eaf382fd8c88', 'iPhone13', 'Description for iPhone13', 300);

-- Insert data into the stock table
INSERT INTO stock (product_id, count)
VALUES ('179e3289-2f77-4189-81d4-18b7f20e5e45', 10),
       ('531fb673-80c9-4fd2-b538-eaf382fd8c89', 5),
       ('531fb673-80c9-4fd2-b538-eaf382fd8c88', 8);
