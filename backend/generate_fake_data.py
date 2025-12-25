"""
InsightAI - Fake Data Generator
Generates sample business data for testing the Text-to-SQL dashboard.
"""
import os
import random
from datetime import datetime, timedelta
from faker import Faker
import psycopg2
from dotenv import load_dotenv

load_dotenv()

fake = Faker()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")


def get_connection():
    """Get database connection from DATABASE_URL."""
    return psycopg2.connect(DATABASE_URL)


def create_tables(conn):
    """Create the sample tables."""
    cursor = conn.cursor()
    
    # Drop existing tables
    cursor.execute("""
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS categories CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
    """)
    
    # Create categories table
    cursor.execute("""
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT
        );
    """)
    
    # Create products table
    cursor.execute("""
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            price DECIMAL(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            rating DECIMAL(2, 1) DEFAULT 3.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create customers table
    cursor.execute("""
        CREATE TABLE customers (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            city VARCHAR(100),
            country VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create orders table
    cursor.execute("""
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES customers(id),
            order_date DATE NOT NULL,
            total_amount DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'pending'
        );
    """)
    
    # Create order_items table
    cursor.execute("""
        CREATE TABLE order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id),
            product_id INTEGER REFERENCES products(id),
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10, 2) NOT NULL
        );
    """)
    
    conn.commit()
    print("✅ Tables created successfully!")


def generate_categories(conn, count=8):
    """Generate sample categories."""
    cursor = conn.cursor()
    categories = [
        ("Electronics", "Phones, laptops, and gadgets"),
        ("Clothing", "Fashion and apparel"),
        ("Home & Garden", "Furniture and home decor"),
        ("Sports", "Sports equipment and gear"),
        ("Books", "Physical and digital books"),
        ("Food & Beverages", "Grocery and drinks"),
        ("Health & Beauty", "Personal care products"),
        ("Toys & Games", "Entertainment for all ages"),
    ]
    
    for name, desc in categories[:count]:
        cursor.execute(
            "INSERT INTO categories (name, description) VALUES (%s, %s)",
            (name, desc)
        )
    
    conn.commit()
    print(f"✅ Generated {count} categories")


def generate_products(conn, count=50):
    """Generate sample products with ratings."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories")
    category_ids = [row[0] for row in cursor.fetchall()]
    
    for _ in range(count):
        # Generate a realistic rating distribution (more 3-5 stars)
        rating = round(random.triangular(1.0, 5.0, 4.0), 1)
        cursor.execute(
            """INSERT INTO products (name, category_id, price, stock_quantity, rating) 
               VALUES (%s, %s, %s, %s, %s)""",
            (
                fake.catch_phrase(),
                random.choice(category_ids),
                round(random.uniform(9.99, 999.99), 2),
                random.randint(0, 500),
                rating
            )
        )
    
    conn.commit()
    print(f"✅ Generated {count} products with ratings")


def generate_customers(conn, count=100):
    """Generate sample customers."""
    cursor = conn.cursor()
    
    for _ in range(count):
        cursor.execute(
            """INSERT INTO customers (first_name, last_name, email, city, country) 
               VALUES (%s, %s, %s, %s, %s)""",
            (
                fake.first_name(),
                fake.last_name(),
                fake.unique.email(),
                fake.city(),
                fake.country()
            )
        )
    
    conn.commit()
    print(f"✅ Generated {count} customers")


def generate_orders(conn, count=500):
    """Generate sample orders with items."""
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM customers")
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id, price FROM products")
    products = cursor.fetchall()
    
    statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    
    for _ in range(count):
        # Random date in the last 2 years
        order_date = fake.date_between(start_date='-2y', end_date='today')
        
        cursor.execute(
            """INSERT INTO orders (customer_id, order_date, status, total_amount) 
               VALUES (%s, %s, %s, 0) RETURNING id""",
            (
                random.choice(customer_ids),
                order_date,
                random.choice(statuses)
            )
        )
        order_id = cursor.fetchone()[0]
        
        # Add 1-5 items per order
        total = 0
        for _ in range(random.randint(1, 5)):
            product = random.choice(products)
            product_id, price = product
            quantity = random.randint(1, 3)
            item_total = float(price) * quantity
            total += item_total
            
            cursor.execute(
                """INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
                   VALUES (%s, %s, %s, %s)""",
                (order_id, product_id, quantity, price)
            )
        
        # Update order total
        cursor.execute(
            "UPDATE orders SET total_amount = %s WHERE id = %s",
            (round(total, 2), order_id)
        )
    
    conn.commit()
    print(f"✅ Generated {count} orders with items")


def main():
    print("🚀 InsightAI Fake Data Generator")
    print("=" * 40)
    
    conn = get_connection()
    
    try:
        create_tables(conn)
        generate_categories(conn)
        generate_products(conn, count=50)
        generate_customers(conn, count=100)
        generate_orders(conn, count=500)
        
        print("=" * 40)
        print("✅ All fake data generated successfully!")
        print("\nSample questions you can now ask:")
        print("  • Show me total sales by category")
        print("  • What are the top 10 customers by revenue?")
        print("  • Display monthly orders trend")
        print("  • How many products are in each category?")
        print("  • Compare average product ratings by category")
        print("  • Show products with rating above 4")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
