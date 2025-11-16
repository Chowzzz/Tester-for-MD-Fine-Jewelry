# MD Fine Jewelry - Admin Panel Guide

## 🔐 Admin Panel Access

The admin panel is located at **`admin.html`** and is **restricted to administrators only**.

### Default Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these credentials immediately after first login for security!

---

## 📋 Admin Panel Features

### 1. **Administrator Login**
- Secure login system
- Only authorized admins can access the panel
- Session management with last login tracking
- Demo credentials provided for testing

### 2. **Dashboard**
- Overview statistics:
  - Total Products
  - Total Orders
  - Total Customers
  - Total Revenue
- Recent orders display
- Quick statistics at a glance

### 3. **Product & Category Management**
- View all products with details
- Add new products with:
  - Product name
  - Category (Rings, Necklaces, Earrings, Bracelets)
  - Price (in Philippine Peso)
  - Description
  - Image URL
- Edit existing products
- Delete products from catalog
- Real-time product table updates

### 4. **Order Management**
- View all customer orders
- Order details including:
  - Order ID
  - Customer name & email
  - Order total
  - Order status (To Ship, To Receive, Completed)
  - Order date
- Quick view action for order details
- Status tracking

### 5. **Invoice Generation & Management**
- Generate invoices for orders
- View invoice history
- Download invoices (functionality ready)
- Track invoice amounts and dates
- Invoice details by order

### 6. **Payment Verification**
- Order payment status display
- Integration ready for payment gateway verification
- Order totals and payment history tracking

### 7. **Customer Management**
- View all registered customers
- Customer details:
  - Full name
  - Email address
  - Phone number
  - Number of orders
  - Total amount spent
- Customer statistics
- Purchase history per customer

### 8. **Notification Broadcasting**
- Send notifications to all customers simultaneously
- Notification features:
  - Title and message content
  - Timestamp tracking
  - Recipient count display
  - Notification history log
- View past notifications
- Track all broadcast notifications

### 9. **Admin Settings**
- Manage admin accounts
- View current admin information
- Last login timestamp
- Add new admin users (functionality ready)
- Admin account management

---

## 🚀 How to Use

### Accessing the Admin Panel
1. Click the **"Admin"** button (bottom-left) on the main website, OR
2. Directly navigate to `admin.html`
3. Log in with admin credentials

### Adding a New Product
1. Go to **Products** section
2. Click **"Add Product"** button
3. Fill in product details:
   - Product Name
   - Category
   - Price
   - Description
   - Image URL
4. Click **"Save"**

### Managing Orders
1. Go to **Orders** section
2. View all customer orders in a table
3. Click **"View"** to see order details
4. Orders automatically sync from the main application

### Broadcasting Notifications
1. Go to **Notifications** section
2. Click **"Send Notification"** button
3. Enter:
   - Notification Title
   - Message Content
4. Click **"Send"**
5. View all notification history in the log

### Viewing Customers
1. Go to **Customers** section
2. See all registered customers with:
   - Order count
   - Total spent
   - Contact information

---

## 🔒 Security Features

✅ **Admin-Only Access**: Login required for all admin functions  
✅ **Session Management**: Track admin sessions and login history  
✅ **Data Persistence**: All data stored in localStorage (can be upgraded to backend database)  
✅ **Toast Notifications**: Secure feedback for all operations  
✅ **Role-Based Access**: Only authenticated admins can access admin panel  

---

## 📊 Data Synchronization

The admin panel **automatically syncs** with the main application:
- Products list
- Customer accounts
- Orders history
- User data
- All transactions

---

## 💾 Local Storage Structure

```
md_admins → Admin accounts and credentials
md_products → Product catalog
md_users → Customer accounts
md_notification_log → Broadcasting history
md_orders → Order records (compiled from users)
```

---

## ⚙️ Technical Details

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Storage**: Browser LocalStorage
- **Icons**: Remix Icon Library
- **Styling**: Custom CSS with responsive design
- **Toast Notifications**: Real-time feedback system

---

## 🎯 Recommendations

1. **Change Default Password**: Immediately change admin password after first login
2. **Backup Data**: Regularly export and backup order/customer data
3. **Monitor Orders**: Check orders section daily for new customer purchases
4. **Send Notifications**: Use notification system to keep customers updated
5. **Review Customers**: Monitor customer growth and spending patterns

---

## 📞 Support

For issues or feature requests related to the admin panel, please contact development team.

**Note**: This is a demo admin panel. In production, integrate with:
- Real database (MySQL, PostgreSQL, MongoDB)
- Backend API for secure authentication
- Payment gateway verification system
- Email notification system
- Advanced analytics and reporting

---

**Last Updated**: November 15, 2025  
**Version**: 1.0 Beta
