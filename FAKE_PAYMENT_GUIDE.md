# 🧪 Fake Payment Portal Guide

Your CriceCo project now includes a **completely fake/mock payment portal**. Perfect for testing and development!

## Features

✅ **No Real Transactions** - All payments are simulated  
✅ **Realistic UI** - Looks like a real payment gateway  
✅ **Test Failure Flow** - Simulate payment failures for testing  
✅ **Full Card Entry** - Enter card details (not validated, purely for UX testing)  
✅ **Processing Animations** - Loading states and animations  
✅ **Success/Failure Pages** - Complete payment flow  

## How to Test

### Step 1: Start All Services

#### Backend (Terminal 1)
```bash
cd backend
npm run dev
```

#### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

#### AI Service (Terminal 3)
```bash
cd ai-service
uvicorn app.main:app --reload
```

### Step 2: Complete Booking Flow

1. **Browse Matches** → Go to home page and select a match
2. **Select Seat** → Click on a seat in the seat grid
3. **Book Seat** → Click "Book Now"
4. **Capture Biometric** → Take a photo or use webcam
5. **Enter Payment Details** → Click "🧪 Enter Test Payment Details"
6. **Test Payment Portal** → The payment modal will appear

### Step 3: Test Payment Portal

**Default Test Card (Pre-filled):**
- **Card Number:** 4111111111111111
- **Expiry:** 12/25
- **CVV:** 123
- **Name:** Test User

**To Simulate Success:**
- Just click "Pay ₹{amount}"
- Wait for processing animation
- You'll see success page
- Ticket will be created automatically

**To Simulate Failure:**
- Check the box "Simulate payment failure (for testing)"
- Click "Pay ₹{amount}"
- Wait for processing
- You'll see failure page with retry option

### Step 4: Verify Ticket Creation

After successful payment:
- Go to **"My Tickets"** page
- You should see your newly created ticket
- It will show:
  - Match name
  - Seat number
  - Payment ID
  - Ticket price

## Testing Scenarios

### Scenario 1: Successful Payment
1. Select a seat
2. Capture biometric
3. Leave "Simulate failure" unchecked
4. Enter any card details
5. Click "Pay"
6. ✅ Ticket created


### Scenario 2: Failed Payment
1. Select a seat
2. Capture biometric
3. **Check "Simulate failure"**
4. Click "Pay"
5. See failure page
6. Click "Try Again"
7. Uncheck failure
8. Complete payment successfully

### Scenario 3: Cancelled Payment
1. Select a seat
2. Capture biometric
3. Click "Pay"
4. Click "Cancel" in payment modal
5. Payment modal closes
6. ❌ No ticket created

## Payment Modal Features

### Visual Elements
- **Blue gradient button** - Primary action
- **Loading spinner** - Processing indicator
- **Success checkmark** - Payment complete
- **Error icon** - Payment failed
- **Test mode badge** - Shows "🔒 Test mode - No real transactions"

### Input Fields
- **Cardholder Name** - Any text allowed
- **Card Number** - Auto-formats with spaces
- **Expiry** - Format MM/YY
- **CVV** - 3 digits only

### Auto-fill
- Card number, expiry, and CVV are pre-filled with test values
- Can be changed to any valid format for testing

## Database Records

All test payments are recorded in the `Payments` table:
- `order_id` - Order ID (format: `order_{matchId}_{seatId}_{timestamp}`)
- `payment_id` - Payment ID (format: `pay_{timestamp}`)
- `status` - 'pending', 'completed', or 'failed'
- `amount` - Ticket price
- `created_at` - When payment was initiated

## Common Test Cases

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Happy Path | Select seat → Biometric → Pay (no failure checked) | Ticket created, status 'completed' |
| Payment Failure | Select seat → Biometric → Pay (failure checked) | See failure screen, can retry |
| Cancel Payment | Select seat → Biometric → Click Cancel | No ticket created |
| Multiple Payments | Complete payment → Select different seat → Pay again | Multiple tickets in "My Tickets" |
| Different Amounts | Select different seats (different prices) → Pay | Correct prices charged |

## Troubleshooting

**Payment Modal Doesn't Appear**
- Check browser console for errors
- Ensure backend is running on port 5000
- Check network tab in DevTools

**Card Formatting Issue**
- Auto-formats to 4 digits + space (e.g., 4111 1111 1111 1111)
- Can paste 16-digit number directly

**Payment Success But No Ticket**
- Check database if payment status is 'completed'
- Verify `confirm-booking` endpoint is called after payment
- Check browser console for errors

**Biometric Capture Failed**
- Ensure camera/webcam is allowed
- Check browser permissions
- Try refreshing page



## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── PaymentGateway.jsx      ← Handles payment initialization
│   │   └── FakePaymentModal.jsx    ← Fake payment UI component
│   └── pages/
│       └── Checkout.jsx             ← Integrates payment flow

backend/
├── src/
│   └── controllers/
│       └── paymentController.js    ← Mock payment logic
└── .env                            ← Environment configuration
```

## Notes

- **No Real Money**: All payments are simulated locally
- **No Internet Required**: Works completely offline
- **Learning Purpose**: Perfect for understanding payment flows
- **Pure Fake**: All payments are simulated locally
- **Database Safe**: Test data is clearly marked with `mock_` prefix

---

**Happy Testing!** 🎉

Have questions? Check the browser console for detailed logs!
