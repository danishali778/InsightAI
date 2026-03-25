"""
Seed script: Creates dummy tables and data in the ecommerce_analytics database.
Run: python seed_database.py
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

SCHEMA = """
-- Drop existing tables (if re-running)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

-- Regions
CREATE TABLE regions (
    region_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL
);

-- Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    region_id INT REFERENCES regions(region_id),
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT REFERENCES categories(category_id),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);
"""

SEED_DATA = """
-- Regions
INSERT INTO regions (name, country) VALUES
('North America', 'USA'),
('Europe', 'Germany'),
('Asia Pacific', 'Japan'),
('South America', 'Brazil'),
('Middle East', 'UAE');

-- Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, gadgets'),
('Clothing', 'Apparel and fashion'),
('Home & Kitchen', 'Furniture, appliances, decor'),
('Books', 'Physical and digital books'),
('Sports', 'Equipment and gear');

-- Customers
INSERT INTO customers (first_name, last_name, email, region_id, joined_at) VALUES
('Alice', 'Johnson', 'alice@example.com', 1, '2024-01-15'),
('Bob', 'Smith', 'bob@example.com', 1, '2024-02-20'),
('Carla', 'Müller', 'carla@example.com', 2, '2024-03-05'),
('Daiki', 'Tanaka', 'daiki@example.com', 3, '2024-03-18'),
('Elena', 'Garcia', 'elena@example.com', 4, '2024-04-10'),
('Faisal', 'Khan', 'faisal@example.com', 5, '2024-05-01'),
('Grace', 'Lee', 'grace@example.com', 3, '2024-05-22'),
('Hassan', 'Ali', 'hassan@example.com', 5, '2024-06-14'),
('Ivy', 'Chen', 'ivy@example.com', 3, '2024-07-03'),
('Jake', 'Williams', 'jake@example.com', 1, '2024-07-29'),
('Kira', 'Novak', 'kira@example.com', 2, '2024-08-11'),
('Luis', 'Pereira', 'luis@example.com', 4, '2024-08-30'),
('Mina', 'Park', 'mina@example.com', 3, '2024-09-15'),
('Noah', 'Brown', 'noah@example.com', 1, '2024-10-01'),
('Olga', 'Petrov', 'olga@example.com', 2, '2024-10-20');

-- Products
INSERT INTO products (name, category_id, price, stock_quantity, created_at) VALUES
('iPhone 15 Pro', 1, 999.99, 150, '2024-01-01'),
('MacBook Air M3', 1, 1299.00, 80, '2024-01-01'),
('Sony WH-1000XM5', 1, 349.99, 200, '2024-02-01'),
('Nike Air Max 90', 2, 129.99, 500, '2024-01-15'),
('Levi''s 501 Jeans', 2, 79.99, 300, '2024-02-01'),
('Patagonia Jacket', 2, 199.99, 120, '2024-03-01'),
('Dyson V15 Vacuum', 3, 649.99, 60, '2024-01-01'),
('KitchenAid Mixer', 3, 379.99, 90, '2024-02-15'),
('IKEA Desk Lamp', 3, 29.99, 800, '2024-01-01'),
('Atomic Habits', 4, 16.99, 1000, '2024-01-01'),
('Dune (Novel)', 4, 14.99, 600, '2024-03-01'),
('Python Crash Course', 4, 39.99, 400, '2024-02-01'),
('Yoga Mat Pro', 5, 49.99, 250, '2024-01-15'),
('Running Shoes X1', 5, 159.99, 180, '2024-04-01'),
('Dumbbells 20kg Set', 5, 89.99, 100, '2024-02-01');

-- Orders (spread across months)
INSERT INTO orders (customer_id, total_amount, status, created_at) VALUES
(1, 1349.98, 'completed', '2024-02-10'),
(2, 129.99, 'completed', '2024-03-05'),
(3, 1299.00, 'completed', '2024-03-20'),
(4, 349.99, 'completed', '2024-04-02'),
(5, 229.98, 'completed', '2024-04-15'),
(1, 649.99, 'completed', '2024-05-01'),
(6, 999.99, 'completed', '2024-05-18'),
(7, 56.98, 'completed', '2024-06-02'),
(8, 379.99, 'completed', '2024-06-22'),
(9, 1299.00, 'completed', '2024-07-10'),
(10, 209.98, 'completed', '2024-07-28'),
(2, 999.99, 'completed', '2024-08-14'),
(11, 169.98, 'completed', '2024-08-30'),
(3, 49.99, 'completed', '2024-09-10'),
(12, 449.98, 'completed', '2024-09-25'),
(4, 79.99, 'shipped', '2024-10-05'),
(13, 1299.00, 'shipped', '2024-10-18'),
(14, 129.99, 'pending', '2024-10-28'),
(15, 539.98, 'pending', '2024-11-02'),
(5, 89.99, 'pending', '2024-11-10');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 999.99), (1, 3, 1, 349.99),
(2, 4, 1, 129.99),
(3, 2, 1, 1299.00),
(4, 3, 1, 349.99),
(5, 5, 1, 79.99), (5, 13, 1, 49.99), (5, 9, 1, 29.99),
(6, 7, 1, 649.99),
(7, 1, 1, 999.99),
(8, 10, 2, 16.99), (8, 11, 1, 14.99),
(9, 8, 1, 379.99),
(10, 2, 1, 1299.00),
(11, 14, 1, 159.99), (11, 13, 1, 49.99),
(12, 1, 1, 999.99),
(13, 6, 1, 199.99),
(14, 13, 1, 49.99),
(15, 3, 1, 349.99), (15, 15, 1, 89.99),
(16, 5, 1, 79.99),
(17, 2, 1, 1299.00),
(18, 4, 1, 129.99),
(19, 7, 1, 649.99),
(20, 15, 1, 89.99);
"""

def main():
    print(f"🔗 Connecting to: {DATABASE_URL.split('@')[1]}")

    with engine.connect() as conn:
        print("📦 Creating tables...")
        conn.execute(text(SCHEMA))
        conn.commit()

        print("🌱 Inserting seed data...")
        conn.execute(text(SEED_DATA))
        conn.commit()

        # Verify
        result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"))
        tables = [row[0] for row in result]
        print(f"\n✅ Done! Created {len(tables)} tables:")
        for t in tables:
            count = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
            print(f"   • {t} — {count} rows")

    print("\n🎉 Database seeded successfully!")


if __name__ == "__main__":
    main()
