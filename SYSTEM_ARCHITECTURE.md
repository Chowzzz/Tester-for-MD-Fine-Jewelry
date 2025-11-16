# System Architecture Overview

## Data Flow Diagram

### Payment Processing Flow
```
User Checkout (md.html)
    ↓
Create Order + Save to localStorage['currentOrder']
    ↓
Navigate to invoice.html
    ↓
Display Order Details
    ↓
Click "Proceed to Payment"
    ↓
Copy to sessionStorage['currentOrder'] + Navigate to payment.html
    ↓
Display Payment Methods
    ↓
User Selects Payment Method
    ↓
Click "Confirm Payment"
    ↓
Save Order to User Profile (localStorage['md_users'] + localStorage['md_currentUser'])
    ↓
Clear Cart (localStorage['md_cart'] = [])
    ↓
Clear Session Data
    ↓
Alert + Redirect to md.html
    ↓
Order Complete
```

## Order Status Lifecycle

```
Order Created (Payment Confirmed)
    ↓
Status = "To Ship" (Admin Responsibility)
    ↓
Admin Panel: Changes to "To Receive" (Admin Panel → Orders Tab)
    ↓
Customer Sees "Order Received" Button
    ↓
Customer Clicks "Order Received"
    ↓
Status = "Completed"
    ↓
Customer Can Rate Order
```

## Storage Architecture

### localStorage (Persistent):
- `md_users[]` - All user accounts with their orders
  ```
  {
    email: "user@example.com",
    fullName: "User Name",
    orders: [
      {
        id: "ORD-123456",
        items: [...],
        total: 5000,
        status: "To Ship|To Receive|Completed",
        date: "11/16/2025",
        paymentMethod: "gcash|bdo|bpi",
        rated: true|false,
        rating: 1-5
      }
    ]
  }
  ```

- `md_currentUser` - Currently logged-in user
- `md_cart[]` - Current shopping cart
- `md_products[]` - Product inventory
- `md_notification_log[]` - Admin notifications
- `md_adminLoggedIn` - Admin session flag
- `md_currentAdmin` - Current admin user

### sessionStorage (Temporary - During Payment):
- `currentOrder` - Order data while processing payment
- `paymentMethod` - Selected payment method
- Cleared after payment confirmation

## Component Responsibilities

### Frontend Components:

**md.html**
- Hero section
- Product browsing
- Cart dropdown
- Wishlist
- Notifications
- Links to checkout

**mdmd.js**
- Product rendering
- Cart management
- Checkout flow
- Order history display
- Order status tracking
- User account management
- Login/register
- Rating system

**invoice.html**
- Display order summary
- Customer details
- Order items
- Total amount
- Button to proceed to payment

**payment.html**
- Payment method selection (GCash, BDO, BPI)
- Order confirmation
- Order saving to user profile
- Cart clearing
- Redirect to home

### Backend Components (Client-Side):

**admin.html**
- Admin dashboard UI
- Order management forms
- Notification forms
- Product management forms

**admin.js**
- Admin authentication
- Dashboard statistics
- Order status management
- Product CRUD
- Customer management
- Notification broadcast
- Order tracking

## Key Features

### 1. Order Status Control
- **System**: Initially sets to "To Ship"
- **Admin**: Can change To Ship ↔ To Receive ↔ Completed
- **Customer**: Can only change To Receive → Completed via "Order Received" button

### 2. Data Persistence
- Order status survives logout/login
- Customer cannot reset order status by logging out
- Admin changes are permanent

### 3. Payment Processing
- Simulated payment (no real gateway needed)
- Supports 3 payment methods
- Order processed same regardless of method

### 4. Admin Capabilities
- View all orders from all customers
- Update order status
- Send notifications
- Manage products
- View customer list
- Track revenue

## Security Considerations

### Current Implementation:
- Simple password-based admin login (demo only)
- Admin credentials stored in localStorage
- No encryption of sensitive data
- Client-side only (no backend)

### For Production:
- Implement server-side authentication
- Use secure tokens/sessions
- Encrypt sensitive data
- Validate data on server
- Implement proper access controls

## Browser Compatibility

- Modern browsers with ES6 support
- localStorage & sessionStorage required
- Tailwind CSS support
- Remix Icons CDN required

## Known Limitations

1. **Single Admin**: Only one admin account supported
2. **No Backend**: No actual payment processing
3. **Local Storage Only**: Data lost if browser cache cleared
4. **Demo Payment**: All payments accepted immediately
5. **No Email**: No email notifications sent
6. **No Multi-User Admin**: Cannot have multiple admins managing same system

## Testing Checklist

- [x] Checkout flow works end-to-end
- [x] Invoice displays correctly
- [x] Payment page shows all methods
- [x] Order saves after payment
- [x] Cart clears after payment
- [x] Admin can change order status
- [x] Customer sees status updates
- [x] Order status persists on reload
- [x] Customer cannot change "To Ship" status
- [x] Notifications appear in admin broadcast

## Performance Considerations

- All data in client memory (no server latency)
- Fast order processing (<100ms)
- Instant status updates
- No database queries needed
- Scalable to thousands of orders (client storage limit ~5-10MB)

## Future Enhancements

1. Backend API integration
2. Real payment gateway (Stripe, PayPal)
3. Email notifications
4. SMS tracking
5. Multiple admin accounts
6. Inventory management
7. Discount codes
8. Return management
9. Analytics dashboard
10. Export orders to CSV
