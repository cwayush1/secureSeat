# Bank Transaction Details Table

## SQL Schema for Supabase

Run this SQL in your Supabase SQL Editor to create the Bank table:

```sql
-- Create Bank/Payment Method Details Table
CREATE TABLE IF NOT EXISTS Bank (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    payment_id INT NOT NULL REFERENCES Payments(id) ON DELETE CASCADE,
    
    -- Card Holder Information
    card_holder_name VARCHAR(255) NOT NULL,
    
    -- Bank Information
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(20),
    branch_name VARCHAR(255),
    ifsc_code VARCHAR(11),
    
    -- Card Information
    card_id VARCHAR(255) UNIQUE,
    card_number VARCHAR(20) NOT NULL, -- Last 4 digits will be shown, full stored encrypted in production
    card_type VARCHAR(50), -- Visa, Mastercard, RuPay, etc
    expiry_month INT,
    expiry_year INT,
    cvv VARCHAR(10), -- Only in test mode, never store in production!
    
    -- Transaction Information
    transaction_reference VARCHAR(255) UNIQUE,
    transaction_amount DECIMAL(10, 2) NOT NULL,
    transaction_currency VARCHAR(3) DEFAULT 'INR',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Account Details
    account_holder_name VARCHAR(255),
    account_number VARCHAR(255),
    account_type VARCHAR(50), -- Savings, Current, etc
    
    -- Additional Info
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for faster queries
    INDEX idx_user_id (user_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_card_number (card_number),
    INDEX idx_transaction_date (transaction_date)
);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_bank_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_updated_at
BEFORE UPDATE ON Bank
FOR EACH ROW
EXECUTE FUNCTION update_bank_timestamp();
```

## Table Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key, unique identifier |
| `user_id` | INT | Foreign key to Users table |
| `payment_id` | INT | Foreign key to Payments table |
| `card_holder_name` | VARCHAR(255) | Name on the card |
| `bank_name` | VARCHAR(255) | Name of the bank |
| `bank_code` | VARCHAR(20) | Bank code/swift code |
| `branch_name` | VARCHAR(255) | Branch name |
| `ifsc_code` | VARCHAR(11) | IFSC code (Indian banking) |
| `card_id` | VARCHAR(255) | Unique card identifier |
| `card_number` | VARCHAR(20) | Card number (last 4 digits) |
| `card_type` | VARCHAR(50) | Visa, Mastercard, RuPay, etc |
| `expiry_month` | INT | Card expiry month (1-12) |
| `expiry_year` | INT | Card expiry year (YYYY) |
| `cvv` | VARCHAR(10) | Card verification value (test only!) |
| `transaction_reference` | VARCHAR(255) | Unique transaction reference |
| `transaction_amount` | DECIMAL(10,2) | Amount of transaction |
| `transaction_currency` | VARCHAR(3) | Currency code (INR, USD, etc) |
| `account_holder_name` | VARCHAR(255) | Bank account holder name |
| `account_number` | VARCHAR(255) | Bank account number |
| `account_type` | VARCHAR(50) | Account type (Savings/Current) |
| `phone_number` | VARCHAR(20) | Customer phone number |
| `email` | VARCHAR(255) | Customer email |
| `address` | TEXT | Customer address |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

## How to Use

### 1. In Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL above
5. Click **Execute**

Expected output: `Query successfully executed`

### 2. Verify Table Creation:
```sql
SELECT * FROM Bank LIMIT 1;
```

### 3. View Table Structure:
```sql
\d Bank
```

---

## Backend Integration

Update the `createPaymentOrder` or `verifyPayment` endpoint to save bank details:

```javascript
// Example: Save bank details when payment is verified
const saveBankDetails = async (req, res) => {
    const { 
        cardHolderName, 
        bankName, 
        cardNumber, 
        cardType,
        expiryMonth,
        expiryYear,
        cvv,
        paymentId,
        amount
    } = req.body;
    
    const userId = req.user.id;
    
    try {
        const bankRecord = await dbPool.query(
            `INSERT INTO Bank (
                user_id, payment_id, card_holder_name, bank_name, card_number,
                card_type, expiry_month, expiry_year, cvv, 
                transaction_amount, transaction_reference, transaction_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING id`,
            [
                userId, paymentId, cardHolderName, bankName, 
                cardNumber.slice(-4), // Store only last 4 digits!
                cardType, expiryMonth, expiryYear, cvv,
                amount, `txn_${Date.now()}`
            ]
        );
        
        res.status(201).json({
            message: 'Bank details saved',
            bankId: bankRecord.rows[0].id
        });
    } catch (error) {
        console.error('Error saving bank details:', error);
        res.status(500).json({ 
            message: 'Failed to save bank details',
            error: error.message 
        });
    }
};
```

---

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **NEVER store full card numbers** - Only store last 4 digits
2. **NEVER store CVV** - Should only be used for verification and immediately discarded
3. **Encrypt sensitive data** - Use encryption for card numbers, expiry dates
4. **Use HTTPS only** - All payment data must be transmitted over secure channels
5. **PCI DSS Compliance** - Follow Payment Card Industry Data Security Standard
6. **Database backups** - Ensure backups are encrypted and secure

For this project (FAKE PAYMENTS), these security measures are not critical, but include them for educational purposes.

---

## Test Data

You can insert test data:

```sql
INSERT INTO Bank (
    user_id, payment_id, card_holder_name, bank_name, card_number,
    card_type, expiry_month, expiry_year, transaction_amount,
    transaction_reference, transaction_date
) VALUES (
    8, 10, 'John Doe', 'HDFC Bank', '1111',
    'Visa', 12, 2025, 3044.00,
    'txn_1776625000000', NOW()
);
```

Query all bank details:
```sql
SELECT * FROM Bank ORDER BY created_at DESC;
```
