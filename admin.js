document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & DATA ---
    let adminLoggedIn = JSON.parse(localStorage.getItem('md_adminLoggedIn')) || false;
    let adminUsers = JSON.parse(localStorage.getItem('md_admin_users')) || [
        { email: 'admin@mdfine.com', password: 'admin123' }
    ];
    let currentAdminUser = JSON.parse(localStorage.getItem('md_currentAdmin')) || null;
    let products = JSON.parse(localStorage.getItem('md_products')) || [];
    let users = JSON.parse(localStorage.getItem('md_users')) || [];

    // --- DOM ELEMENTS ---
    const loginPage = document.getElementById('login-page');
    const adminDashboard = document.getElementById('admin-dashboard');
    const pageTabs = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');

    // --- UTILITY FUNCTIONS ---
    const showAdminToast = (message, isError = false) => {
        const toast = document.getElementById('admin-toast');
        const icon = document.getElementById('admin-toast-icon');
        const msg = document.getElementById('admin-toast-message');
        
        msg.textContent = message;
        icon.className = isError ? 'ri-error-warning-line mr-2' : 'ri-check-line mr-2';
        toast.style.backgroundColor = isError ? '#ef4444' : '#111827';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const saveAdminData = () => {
        localStorage.setItem('md_admin_users', JSON.stringify(adminUsers));
        localStorage.setItem('md_adminLoggedIn', JSON.stringify(adminLoggedIn));
        localStorage.setItem('md_currentAdmin', JSON.stringify(currentAdminUser));
    };

    // --- LOGIN LOGIC ---
    const setupLoginForm = () => {
        const loginForm = document.getElementById('admin-login-form');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;

            const admin = adminUsers.find(a => a.email === email && a.password === password);
            if (admin) {
                adminLoggedIn = true;
                currentAdminUser = { email: admin.email, lastLogin: new Date().toLocaleString() };
                localStorage.setItem('md_adminLoggedIn', JSON.stringify(adminLoggedIn));
                localStorage.setItem('md_currentAdmin', JSON.stringify(currentAdminUser));
                showAdminToast('Login successful!');
                showDashboard();
            } else {
                showAdminToast('Invalid email or password', true);
            }
        });
    };

    const showDashboard = () => {
        loginPage.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        document.getElementById('admin-user-name').textContent = currentAdminUser.email;
        loadDashboard();
    };

    // --- DASHBOARD ---
    const loadDashboard = () => {
        // Always refresh users/products from storage in case they changed elsewhere
        users = JSON.parse(localStorage.getItem('md_users')) || [];
        products = JSON.parse(localStorage.getItem('md_products')) || products;

        const allOrders = [];
        users.forEach(user => {
            if (user.orders) {
                user.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        customerName: user.fullName,
                        customerEmail: user.email,
                        userId: user.email,
                        // derive numeric timestamp for robust sorting
                        _ts: order.timestamp || (Date.parse(order.date) || 0)
                    });
                });
            }
        });

        const productCount = products.length;
        const orderCount = allOrders.length;
        const customerCount = users.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

        // Update stats
        document.getElementById('stat-products').textContent = productCount;
        document.getElementById('stat-orders').textContent = orderCount;
        document.getElementById('stat-customers').textContent = customerCount;
        document.getElementById('stat-revenue').textContent = `₱${totalRevenue.toFixed(2)}`;

        // Load recent orders (sorted by timestamp desc)
        const recentOrdersDiv = document.getElementById('recent-orders');
        if (allOrders.length > 0) {
            allOrders.sort((a, b) => (b._ts || 0) - (a._ts || 0));
            const recent = allOrders.slice(0, 5);
            recentOrdersDiv.innerHTML = recent.map(order => {
                const displayDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : (isNaN(Date.parse(order.date)) ? order.date : new Date(order.date).toLocaleString());
                return `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                        <p class="font-semibold">${order.id}</p>
                        <p class="text-sm text-gray-600">${order.customerName}</p>
                        <p class="text-xs text-gray-400">${displayDate}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold">₱${order.total.toFixed(2)}</p>
                        <span class="text-xs px-2 py-1 rounded-full ${order.status === 'To Ship' ? 'bg-yellow-100 text-yellow-800' : order.status === 'To Receive' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${order.status}</span>
                    </div>
                </div>
            `}).join('');
        } else {
            recentOrdersDiv.innerHTML = '<p class="text-center text-gray-500 py-6">No orders yet</p>';
        }
    };

    // --- PAGE NAVIGATION ---
    const showPage = (pageName) => {
        pageTabs.forEach(tab => tab.classList.add('hidden'));
        document.getElementById(`page-${pageName}`).classList.remove('hidden');
        
        sidebarBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        const titleMap = {
            dashboard: 'Dashboard',
            products: 'Product Management',
            orders: 'Order Management',
            invoices: 'Invoice Management',
            customers: 'Customer Management',
            notifications: 'Broadcast Notifications',
            settings: 'Admin Settings'
        };
        pageTitle.textContent = titleMap[pageName] || 'Dashboard';

        if (pageName === 'products') loadProducts();
        else if (pageName === 'orders') loadOrders();
        else if (pageName === 'invoices') loadInvoices();
        else if (pageName === 'customers') loadCustomers();
        else if (pageName === 'notifications') loadNotifications();
        else if (pageName === 'settings') loadSettings();
    };

    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });

    // --- PRODUCTS PAGE ---
    const loadProducts = () => {
        const productsTableBody = document.getElementById('products-table-body');
        productsTableBody.innerHTML = products.map(product => `
            <tr>
                <td class="px-6 py-3">${product.id}</td>
                <td class="px-6 py-3">${product.name}</td>
                <td class="px-6 py-3">₱${product.price.toFixed(2)}</td>
                <td class="px-6 py-3">${product.category}</td>
                <td class="px-6 py-3">
                    <button class="action-btn action-btn-edit mr-2" onclick="editProduct(${product.id})">Edit</button>
                    <button class="action-btn action-btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    };

    window.editProduct = (id) => {
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-image').value = product.image;
            // Store product ID in a data attribute
            document.getElementById('product-form').dataset.productId = product.id;
            document.getElementById('product-modal-title').textContent = 'Edit Product';
            document.getElementById('product-modal').classList.remove('hidden');
        }
    };

    window.deleteProduct = (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            products = products.filter(p => p.id !== id);
            localStorage.setItem('md_products', JSON.stringify(products));
            loadProducts();
            showAdminToast('Product deleted successfully');
        }
    };

    // --- ORDERS PAGE ---
    const loadOrders = () => {
        const ordersTableBody = document.getElementById('orders-table-body');
        // Refresh users from storage
        users = JSON.parse(localStorage.getItem('md_users')) || [];
        const allOrders = [];
        users.forEach(user => {
            if (user.orders) {
                user.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        customerName: user.fullName,
                        customerEmail: user.email,
                        userId: user.email,
                        _ts: order.timestamp || (Date.parse(order.date) || 0)
                    });
                });
            }
        });

        // Sort by timestamp desc for consistent ordering
        allOrders.sort((a, b) => (b._ts || 0) - (a._ts || 0));

        if (allOrders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-3 text-center text-gray-500">No orders</td></tr>';
            return;
        }

        ordersTableBody.innerHTML = allOrders.map(order => `
            <tr>
                <td class="px-6 py-3 font-semibold">${order.id}</td>
                <td class="px-6 py-3">${order.customerName}</td>
                <td class="px-6 py-3">₱${order.total.toFixed(2)}</td>
                <td class="px-6 py-3">
                    <select class="px-2 py-1 border rounded text-sm status-select" data-order-id="${order.id}" data-user-email="${order.userId}" onchange="updateOrderStatus(this)">
                        <option value="To Ship" ${order.status === 'To Ship' ? 'selected' : ''}>To Ship</option>
                        <option value="To Receive" ${order.status === 'To Receive' ? 'selected' : ''}>To Receive</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
                <td class="px-6 py-3">${order.timestamp ? new Date(order.timestamp).toLocaleString() : (isNaN(Date.parse(order.date)) ? order.date : new Date(order.date).toLocaleString())}</td>
                <td class="px-6 py-3">
                    ${order.refund_status ? `
                        <select class="px-2 py-1 border rounded text-sm refund-select ${order.refund_status === 'requested' ? 'border-yellow-500' : order.refund_status === 'approved' ? 'border-blue-500' : 'border-green-500'}" data-order-id="${order.id}" data-user-email="${order.userId}" onchange="updateRefundStatus(this)">
                            <option value="">None</option>
                            <option value="requested" ${order.refund_status === 'requested' ? 'selected' : ''}>Requested</option>
                            <option value="approved" ${order.refund_status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="completed" ${order.refund_status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    ` : `<span class="text-xs text-gray-400">No Refund</span>`}
                </td>
                <td class="px-6 py-3">
                    <button class="action-btn action-btn-view" onclick="viewOrderDetails('${order.id}', '${order.userId}')">View</button>
                </td>
            </tr>
        `).join('');
    };

    window.updateOrderStatus = (selectElement) => {
        const orderId = selectElement.dataset.orderId;
        const userEmail = selectElement.dataset.userEmail;
        const newStatus = selectElement.value;

        const user = users.find(u => u.email === userEmail);
        if (user && user.orders) {
            const order = user.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                // Persist users array
                localStorage.setItem('md_users', JSON.stringify(users));

                // If the affected user is currently logged in on the storefront, update md_currentUser too
                try {
                    const currentUser = JSON.parse(localStorage.getItem('md_currentUser')) || null;
                    if (currentUser && currentUser.email === userEmail) {
                        // Find fresh user object from users array and save it as md_currentUser
                        const fresh = users.find(u => u.email === userEmail);
                        if (fresh) {
                            localStorage.setItem('md_currentUser', JSON.stringify(fresh));
                        }
                    }
                } catch (err) {
                    console.error('Failed to sync md_currentUser after admin update', err);
                }

                // Create a targeted notification for the specific user about their order status
                try {
                    const notificationLog = JSON.parse(localStorage.getItem('md_notification_log')) || [];
                    const newNotif = {
                        title: `Order ${orderId} status updated`,
                        message: `Your order ${orderId} status changed to ${newStatus}`,
                        timestamp: new Date().toLocaleString(),
                        targetEmail: userEmail
                    };
                    notificationLog.push(newNotif);
                    localStorage.setItem('md_notification_log', JSON.stringify(notificationLog));
                } catch (err) {
                    console.error('Failed to create notification for user', err);
                }

                showAdminToast(`Order ${orderId} status updated to ${newStatus}`);
                // Refresh orders table so status selects reflect current values
                loadOrders();
            }
        }
    };

    window.updateRefundStatus = (selectElement) => {
        const orderId = selectElement.dataset.orderId;
        const userEmail = selectElement.dataset.userEmail;
        const newRefundStatus = selectElement.value;

        const user = users.find(u => u.email === userEmail);
        if (user && user.orders) {
            const order = user.orders.find(o => o.id === orderId);
            if (order) {
                if (newRefundStatus === '') {
                    delete order.refund_status;
                    showAdminToast(`Refund status cleared for order ${orderId}`);
                } else {
                    order.refund_status = newRefundStatus;
                    showAdminToast(`Order ${orderId} refund status updated to ${newRefundStatus}`);
                }
                // Persist users array
                localStorage.setItem('md_users', JSON.stringify(users));

                // If the affected user is currently logged in on the storefront, update md_currentUser too
                try {
                    const currentUser = JSON.parse(localStorage.getItem('md_currentUser')) || null;
                    if (currentUser && currentUser.email === userEmail) {
                        const fresh = users.find(u => u.email === userEmail);
                        if (fresh) {
                            localStorage.setItem('md_currentUser', JSON.stringify(fresh));
                        }
                    }
                } catch (err) {
                    console.error('Failed to sync md_currentUser after refund update', err);
                }

                // Create a targeted notification for the specific user about their refund status
                try {
                    const notificationLog = JSON.parse(localStorage.getItem('md_notification_log')) || [];
                    let message = '';
                    if (newRefundStatus === 'approved') {
                        message = `Your refund request for order ${orderId} has been approved. The amount ₱${order.total.toFixed(2)} will be processed soon.`;
                    } else if (newRefundStatus === 'completed') {
                        message = `Your refund for order ${orderId} has been completed. Amount ₱${order.total.toFixed(2)} has been returned to your account.`;
                    } else if (newRefundStatus === 'requested') {
                        message = `Your refund request for order ${orderId} has been received and is under review.`;
                    }
                    if (message) {
                        const newNotif = {
                            title: `Refund Status: Order ${orderId}`,
                            message: message,
                            timestamp: Date.now(),
                            targetEmail: userEmail
                        };
                        notificationLog.push(newNotif);
localStorage.setItem('md_notification_log', JSON.stringify(notificationLog));
                    }
                } catch (err) {
                    console.error('Failed to create refund notification for user', err);
                }

                // Refresh orders table
                loadOrders();
            }
        }
    };

    window.viewOrderDetails = (orderId, userEmail) => {
        const user = users.find(u => u.email === userEmail);
        if (user && user.orders) {
            const order = user.orders.find(o => o.id === orderId);
            if (order) {
                const displayDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : (isNaN(Date.parse(order.date)) ? order.date : new Date(order.date).toLocaleString());
                alert(`Order Details:\n\nID: ${orderId}\nCustomer: ${user.fullName}\nEmail: ${user.email}\nTotal: ₱${order.total.toFixed(2)}\nStatus: ${order.status}\nDate: ${displayDate}\nPayment Method: ${order.paymentMethod || 'Not specified'}\n\nItems: ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`);
            }
        }
    };

    // --- INVOICES PAGE ---
    const loadInvoices = () => {
        const invoicesTableBody = document.getElementById('invoices-table-body');
        // Refresh users from storage
        users = JSON.parse(localStorage.getItem('md_users')) || [];
        const allOrders = [];
        users.forEach(user => {
            if (user.orders) {
                user.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        customerName: user.fullName,
                        customerEmail: user.email,
                        _ts: order.timestamp || (Date.parse(order.date) || 0)
                    });
                });
            }
        });

        // Sort by timestamp desc
        allOrders.sort((a, b) => (b._ts || 0) - (a._ts || 0));

        invoicesTableBody.innerHTML = allOrders.map(order => `
            <tr>
                <td class="px-6 py-3 font-semibold">${order.id}</td>
                <td class="px-6 py-3">${order.customerName}</td>
                <td class="px-6 py-3">₱${order.total.toFixed(2)}</td>
                <td class="px-6 py-3">${order.timestamp ? new Date(order.timestamp).toLocaleString() : (isNaN(Date.parse(order.date)) ? order.date : new Date(order.date).toLocaleString())}</td>
                <td class="px-6 py-3">
                    <button class="action-btn action-btn-view">Download Invoice</button>
                </td>
            </tr>
        `).join('');
    };

    // --- CUSTOMERS PAGE ---
    const loadCustomers = () => {
        const customersTableBody = document.getElementById('customers-table-body');
        customersTableBody.innerHTML = users.map(user => {
            const totalSpent = user.orders ? user.orders.reduce((sum, order) => sum + order.total, 0) : 0;
            const orderCount = user.orders ? user.orders.length : 0;
            return `
                <tr>
                    <td class="px-6 py-3">${user.fullName}</td>
                    <td class="px-6 py-3">${user.email}</td>
                    <td class="px-6 py-3">${user.phone}</td>
                    <td class="px-6 py-3">${orderCount}</td>
                    <td class="px-6 py-3 font-semibold">₱${totalSpent.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    };

    // --- NOTIFICATIONS PAGE ---
    const loadNotifications = () => {
        const notificationLog = JSON.parse(localStorage.getItem('md_notification_log')) || [];
        const notificationLogDiv = document.getElementById('notification-log');
        
        if (notificationLog.length === 0) {
            notificationLogDiv.innerHTML = '<p class="text-center text-gray-500 py-4">No notifications sent yet</p>';
        } else {
            notificationLogDiv.innerHTML = notificationLog.slice().reverse().map(notif => `
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="font-semibold text-gray-900">${notif.title}</p>
                    <p class="text-sm text-gray-600 mt-1">${notif.message}</p>
                    <p class="text-xs text-gray-400 mt-2">${notif.timestamp}</p>
                </div>
            `).join('');
        }

        document.getElementById('send-notification-btn').addEventListener('click', () => {
            document.getElementById('notification-modal').classList.remove('hidden');
        });

        document.getElementById('close-notification-modal').addEventListener('click', () => {
            document.getElementById('notification-modal').classList.add('hidden');
        });

        document.getElementById('notification-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('notification-title').value;
            const message = document.getElementById('notification-message').value;

            const newNotification = {
                title: title,
                message: message,
                timestamp: new Date().toLocaleString()
            };

            notificationLog.push(newNotification);
            localStorage.setItem('md_notification_log', JSON.stringify(notificationLog));
            
            showAdminToast('Notification sent to all customers!');
            document.getElementById('notification-form').reset();
            document.getElementById('notification-modal').classList.add('hidden');
            loadNotifications();
        });
    };

    // --- SETTINGS PAGE ---
    const loadSettings = () => {
        document.getElementById('settings-email').textContent = currentAdminUser.email;
        document.getElementById('settings-last-login').textContent = currentAdminUser.lastLogin || 'Never';

        // Render admins list
        const adminsList = document.getElementById('admins-list');
        if (adminUsers && adminUsers.length > 0) {
            adminsList.innerHTML = adminUsers.map(admin => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <div>
                        <p class="font-semibold text-gray-900">${admin.email}</p>
                        <p class="text-xs text-gray-500">Password: ••••••••</p>
                    </div>
                    ${admin.email !== currentAdminUser.email ? `<button class="action-btn action-btn-delete" onclick="deleteAdmin('${admin.email}')">Remove</button>` : `<span class="text-xs font-semibold text-amber-600">Current Admin</span>`}
                </div>
            `).join('');
        } else {
            adminsList.innerHTML = '<p class="text-gray-500 text-sm">No other admin users yet</p>';
        }

        // Add Admin User Button
        const addAdminBtn = document.getElementById('add-admin-btn');
        if (addAdminBtn) {
            addAdminBtn.addEventListener('click', () => {
                const email = prompt('Enter new admin email:');
                if (!email) return;
                
                if (adminUsers.find(a => a.email === email)) {
                    showAdminToast('Admin with this email already exists', true);
                    return;
                }

                const password = prompt('Enter password for this admin:');
                if (!password) return;

                adminUsers.push({ email, password });
                localStorage.setItem('md_admin_users', JSON.stringify(adminUsers));
                showAdminToast(`Admin user ${email} added successfully`);
                loadSettings();
            });
        }
    };

    window.deleteAdmin = (email) => {
        if (email === currentAdminUser.email) {
            showAdminToast('Cannot delete your own admin account', true);
            return;
        }
        
        if (confirm(`Are you sure you want to remove admin user ${email}?`)) {
            adminUsers = adminUsers.filter(a => a.email !== email);
            localStorage.setItem('md_admin_users', JSON.stringify(adminUsers));
            showAdminToast(`Admin user ${email} has been removed`);
            loadSettings();
        }
    };

    // --- PRODUCT FORM ---
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
        // The line below was causing an error because 'product-id' doesn't exist in the form
        // document.getElementById('product-id').value = ''; 
        document.getElementById('product-form').dataset.productId = ''; // Clear the stored ID instead
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-category').value = '';
        document.getElementById('product-description').value = '';
        document.getElementById('product-image').value = '';
        document.getElementById('product-modal-title').textContent = 'Add Product';
        document.getElementById('product-modal').classList.remove('hidden');
    });

    document.getElementById('close-product-modal')?.addEventListener('click', () => {
        document.getElementById('product-modal').classList.add('hidden');
    });

    document.getElementById('product-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = document.getElementById('product-form').dataset.productId;
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const description = document.getElementById('product-description').value;
        const image = document.getElementById('product-image').value;

        if (productId) {
            // Edit existing
            const product = products.find(p => p.id == productId);
            if (product) {
                product.name = name;
                product.price = price;
                product.category = category;
                product.description = description;
                product.image = image;
                showAdminToast('Product updated successfully');
            }
        } else {
            // Add new
            const newId = Math.max(...products.map(p => p.id), 0) + 1;
            products.push({
                id: newId,
                name,
                price,
                category,
                description,
                image
            });
            showAdminToast('Product added successfully');
        }

        localStorage.setItem('md_products', JSON.stringify(products));
        document.getElementById('product-modal').classList.add('hidden');
        document.getElementById('product-form').dataset.productId = '';
        loadProducts();
    });

    // --- LOGOUT ---
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            adminLoggedIn = false;
            currentAdminUser = null;
            localStorage.removeItem('md_adminLoggedIn');
            localStorage.removeItem('md_currentAdmin');
            loginPage.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
            document.getElementById('admin-login-form').reset();
            showAdminToast('Logged out successfully');
        }
    });

    // --- INITIALIZATION ---
    setupLoginForm();

    if (adminLoggedIn && currentAdminUser) {
        showDashboard();
    }
});
