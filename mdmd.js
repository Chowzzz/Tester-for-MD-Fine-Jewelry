document.addEventListener('DOMContentLoaded', () => {

    // --- STATE & DATA ---
    let cart = JSON.parse(localStorage.getItem('md_cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('md_wishlist')) || [];
    let isLoggedIn = JSON.parse(localStorage.getItem('md_isLoggedIn')) || false;
    let currentUser = JSON.parse(localStorage.getItem('md_currentUser')) || null;
    let users = JSON.parse(localStorage.getItem('md_users')) || []; // Load users from localStorage
    let productRatings = JSON.parse(localStorage.getItem('md_product_ratings')) || {};
    let orders = [];
    let notificationLog = JSON.parse(localStorage.getItem('md_notification_log')) || [];
    let seenNotifications = JSON.parse(localStorage.getItem('md_seen_notifications')) || [];
    
    // --- FIX: Initialize 'products' to an empty array ---
    // This was the source of the error. 'products' was used in the 'else'
    // block below before it was ever defined, causing the script to crash.
    let products = [];

    // Load products from localStorage if available (admin panel writes to `md_products`)
    try {
        const storedProducts = JSON.parse(localStorage.getItem('md_products'));
        if (Array.isArray(storedProducts) && storedProducts.length > 0) {
            products = storedProducts;
        } else {
            // This 'else' block now works because 'products' is defined as []
            localStorage.setItem('md_products', JSON.stringify(products));
        }
    } catch (err) {
        // If parsing fails, ensure 'products' is still a valid array
        // and reset it in localStorage for consistency.
        console.error("Failed to parse products from localStorage:", err);
        products = [];
        localStorage.setItem('md_products', JSON.stringify(products));
    }

    // --- DOM Elements ---
    const checkoutPage = document.getElementById('checkout-page');
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');


    // --- RENDER FUNCTIONS ---
    const renderProductCard = (product) => {
        const isInWishlist = wishlist.some(item => item.id === product.id);
        const heartIconClass = isInWishlist ? 'ri-heart-fill text-primary' : 'ri-heart-line';
        const activeClass = isInWishlist ? 'active' : '';
        const ratingDetails = getProductRatingDetails(product.id);

        const renderStars = (rating) => {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="ri-star-fill"></i>';
                } else if (i - 0.5 <= rating) {
                    stars += '<i class="ri-star-half-fill"></i>';
                } else {
                    stars += '<i class="ri-star-line"></i>';
                }
            }
            return stars;
        };

        return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden group flex flex-col">
            <div class="relative h-64 overflow-hidden">
                ${mkImg(product.image, product.name, 'w-full h-full object-cover object-top transition-all duration-500')}
                <button class="wishlist-toggle ${activeClass} absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md cursor-pointer hover:bg-primary hover:text-white transition-colors" data-product-id="${product.id}">
                    <i class="${heartIconClass}"></i>
                </button>
                <div class="quick-view absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 transition-opacity duration-300">
                    <button class="quick-view-btn bg-white text-gray-900 py-2 px-4 rounded-button font-medium hover:bg-primary hover:text-white transition-colors whitespace-nowrap" data-product-id="${product.id}">Quick View</button>
                </div>
            </div>
            <div class="p-4 text-center flex-grow flex flex-col">
                <h3 class="text-lg font-medium text-gray-900 mb-1 flex-grow">${product.name}</h3>
                <p class="text-primary font-medium mb-2">₱${product.price.toFixed(2)}</p>
                <div class="flex items-center justify-center gap-1 text-amber-500 text-sm mb-3">
                    ${ratingDetails.count > 0 ? `${renderStars(ratingDetails.average)} <span class="text-gray-500 text-xs ml-1">(${ratingDetails.count})</span>` : '<span class="text-xs text-gray-400 h-[20px] flex items-center">No reviews yet</span>'}
                </div>
                 <button class="add-to-cart-btn mt-auto w-full bg-gray-900 text-white py-2 rounded-button hover:bg-primary transition-colors whitespace-nowrap" data-product-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
    }

    // --- UTILITY FUNCTIONS ---
    const showToast = (message, isError = false) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.querySelector('#toast-message').textContent = message;
        toast.querySelector('#toast-icon').className = isError ? 'ri-error-warning-line mr-2' : 'ri-check-line mr-2';
        toast.style.backgroundColor = isError ? '#ef4444' : '#111827';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const displayNewNotifications = () => {
        // Only consider notifications relevant to the current user (or global notifications without targetEmail)
        const relevant = notificationLog.filter(n => !n.targetEmail || (currentUser && n.targetEmail === currentUser.email));
        const unseenNotifs = relevant.filter(notif => !seenNotifications.includes(notif.timestamp));

        if (unseenNotifs.length > 0) {
            unseenNotifs.forEach(notif => {
                // Show toast for each new notification
                showToast(`📢 ${notif.title}: ${notif.message}`);
                seenNotifications.push(notif.timestamp);
            });
            localStorage.setItem('md_seen_notifications', JSON.stringify(seenNotifications));
        }
    };

    const updateNotificationBell = () => {
        const notificationBell = document.getElementById('notification-bell-count');
        if (notificationBell) {
            // Count only relevant notifications for the current user
            const relevant = notificationLog.filter(n => !n.targetEmail || (currentUser && n.targetEmail === currentUser.email));
            const unseenCount = relevant.filter(n => !seenNotifications.includes(n.timestamp)).length;
            if (unseenCount > 0) {
                notificationBell.textContent = unseenCount;
                notificationBell.classList.remove('hidden');
            } else {
                notificationBell.classList.add('hidden');
            }
        }
    };

    const saveData = () => {
        localStorage.setItem('md_users', JSON.stringify(users));
        localStorage.setItem('md_cart', JSON.stringify(cart));
        localStorage.setItem('md_wishlist', JSON.stringify(wishlist));
        localStorage.setItem('md_isLoggedIn', JSON.stringify(isLoggedIn));
        localStorage.setItem('md_currentUser', JSON.stringify(currentUser));
        // Persist product list so admin changes reflect on the main site
        try {
            localStorage.setItem('md_products', JSON.stringify(products));
        } catch (err) {
            console.error('Failed saving products to localStorage', err);
        }
    };

    const getProductRatingDetails = (productId) => {
        let allRatings = [];
        users.forEach(user => {
            if (user.orders) {
                user.orders.forEach(order => {
                    // Check if the order is rated and contains the product
                    if (order.rated && order.rating && order.items.some(item => item.id === productId)) {
                        // The current structure has one rating per order.
                        // We'll associate this rating with every product in that order.
                        allRatings.push(order.rating);
                    }
                });
            }
        });

        if (allRatings.length === 0) {
            return { average: 0, count: 0 };
        }

        const sum = allRatings.reduce((acc, rating) => acc + rating, 0);
        const average = sum / allRatings.length;

        return {
            average: average,
            count: allRatings.length
        };
    };

    // --- IMAGE HELPERS ---
    // Create image tag with onerror fallback attempts for various likely paths
    const mkImg = (src, alt = '', cls = '') => {
        const safeSrc = src || '';
        const encoded = encodeURIComponent(safeSrc);
        return `<img src="${safeSrc}" alt="${alt}" class="${cls}" onerror="window.__md_handleImgError(this,'${encoded}')">`;
    };

    // Generate candidate paths to try when an image fails to load
    window.__md_imgCandidates = (orig) => {
        const candidates = [];
        if (!orig) return candidates;
        candidates.push(orig);
        // If it's not an absolute URL, try some relative prefixes commonly used in this project
        if (!/^https?:\/\//i.test(orig) && !orig.startsWith('/')) {
            candidates.push('./' + orig);
            candidates.push('TESTER/' + orig);
            candidates.push('TESTER/TESTER/' + orig);
            candidates.push('assets/' + orig);
            candidates.push('images/' + orig);
            candidates.push('assets/images/' + orig);
            candidates.push('../TESTER/' + orig);
        }
        // Ensure unique and encoded
        return Array.from(new Set(candidates)).map(c => encodeURI(c));
    };

    // Try the next candidate path on error; if exhausted, replace with a simple SVG placeholder
    window.__md_handleImgError = (imgEl, encoded) => {
        try {
            const orig = decodeURIComponent(encoded || '');
            const candidates = window.__md_imgCandidates(orig);
            const tries = parseInt(imgEl.dataset._try || '0', 10);
            const nextIndex = tries + 1;
            if (nextIndex < candidates.length) {
                imgEl.dataset._try = String(nextIndex);
                imgEl.src = candidates[nextIndex];
                return;
            }
        } catch (err) {
            // ignore and fallthrough to placeholder
        }
        imgEl.onerror = null;
        imgEl.dataset._try = '0';
        imgEl.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9CA3AF" font-family="Arial, Helvetica, sans-serif" font-size="18">Image not available</text></svg>`);
    };

    // --- CART LOGIC ---
    const updateCart = () => {
        const cartCount = document.getElementById('cart-count');
        const cartHeader = document.getElementById('cart-header');
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartFooter = document.getElementById('cart-footer');

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartHeader.textContent = `Your Cart (${totalItems})`;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="text-center text-gray-500">Your cart is empty.</p>`;
            cartFooter.classList.add('hidden');
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="flex items-center gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                    <div class="w-16 h-16 bg-gray-100 rounded overflow-hidden">${mkImg(item.image, item.name, 'w-full h-full object-cover')}</div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium">${item.name}</h4>
                        <p class="text-xs text-gray-500">₱${item.price.toFixed(2)}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button class="cart-qty-minus w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors text-xs" data-index="${index}">−</button>
                            <span class="cart-qty-display text-xs font-medium" data-index="${index}">${item.quantity}</span>
                            <button class="cart-qty-plus w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors text-xs" data-index="${index}">+</button>
                            <span class="text-xs text-gray-500 ml-auto">₱${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                    <button class="remove-from-cart-btn text-gray-400 hover:text-red-500 transition-colors" data-index="${index}" title="Remove from cart"><i class="ri-delete-bin-line"></i></button>
                </div>`).join('');
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartSubtotal.textContent = `₱${subtotal.toFixed(2)}`;
            cartFooter.classList.remove('hidden');
        }
        saveData();
    };
    
    // --- WISHLIST LOGIC ---
    const updateWishlist = () => {
        const wishlistCount = document.getElementById('wishlist-count');
        const wishlistHeader = document.getElementById('wishlist-header');
        const wishlistItemsContainer = document.getElementById('wishlist-items-container');

        wishlistCount.textContent = wishlist.length;
        wishlistHeader.textContent = `Your Wishlist (${wishlist.length})`;

        if (wishlist.length === 0) {
            wishlistItemsContainer.innerHTML = `<p class="text-center text-gray-500">Your wishlist is empty.</p>`;
        } else {
            wishlistItemsContainer.innerHTML = wishlist.map(item => `
                <div class="flex items-center gap-3">
                    <div class="w-16 h-16 bg-gray-100 rounded overflow-hidden">${mkImg(item.image, item.name, 'w-full h-full object-cover')}</div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium">${item.name}</h4>
                        <p class="text-xs text-primary">₱${item.price.toFixed(2)}</p>
                    </div>
                    <button class="remove-from-wishlist-btn text-gray-400 hover:text-red-500 transition-colors" data-product-id="${item.id}"><i class="ri-close-line ri-lg"></i></button>
                </div>`).join('');
        }
        saveData();
    };
    
    const rerenderProductViews = () => {
        const renderGrid = (gridId, productsToRender) => {
            const grid = document.getElementById(gridId);
            if(grid) grid.innerHTML = productsToRender.map(renderProductCard).join('');
        };
        renderGrid('new-arrivals-grid', products.slice(0, 8));
        if (!document.getElementById('new-arrivals-modal').classList.contains('hidden')) {
            renderGrid('all-new-arrivals-grid', products);
        }
        if (!document.getElementById('collection-modal').classList.contains('hidden')) {
            const currentCategory = document.getElementById('collection-modal-title').textContent.split(' ')[0].toLowerCase();
            renderGrid('collection-modal-grid', products.filter(p => p.category === currentCategory));
        }
        if (!document.getElementById('wishlist-modal').classList.contains('hidden')) {
            renderGrid('wishlist-modal-grid', wishlist);
        }
    }

    // --- MODAL LOGIC ---
    const openModal = (modal) => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    };
    
    // --- ACCOUNT & LOGIN MODAL CONTENT RENDERERS ---
    const accountModalContent = document.getElementById('account-modal-content');

    const renderLoginForm = () => {
        accountModalContent.innerHTML = `
            <h3 class="text-2xl font-bold text-center mb-6">Login</h3>
            <form id="login-form" class="space-y-4">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-button font-medium hover:bg-opacity-90 transition-colors">Login</button>
                <p class="text-center text-sm text-gray-600">
                    Need an account? <button type="button" id="show-register-form" class="font-medium text-primary hover:underline">Register</button>
                </p>
            </form>
        `;
    };

    const renderRegisterForm = () => {
        accountModalContent.innerHTML = `
            <h3 class="text-2xl font-bold text-center mb-6">Create Account</h3>
            <form id="register-form" class="space-y-4">
                <div>
                    <label for="reg-name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="reg-name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="reg-email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="reg-email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="reg-address" class="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" id="reg-address" required placeholder="Street, City, Postal Code" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="reg-phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="reg-phone" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="reg-password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="reg-password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-button font-medium hover:bg-opacity-90 transition-colors">Register</button>
                <p class="text-center text-sm text-gray-600">
                    Already have an account? <button type="button" id="show-login-form" class="font-medium text-primary hover:underline">Login</button>
                </p>
            </form>
        `;
    };

    const renderOrderHistory = () => {
        const orderStatuses = ['To Ship', 'To Receive', 'Completed'];
        const getStatusIndex = (status) => orderStatuses.indexOf(status);

        const getActionForOrder = (order) => {
            switch (order.status) {
                case 'To Ship':
                    return `<button class="order-action-btn bg-gray-200 text-gray-600 py-1 px-3 rounded-button text-sm cursor-not-allowed" disabled>Processing</button>`;
                case 'To Receive':
                    return `<button class="order-action-btn bg-primary text-white py-1 px-3 rounded-button text-sm" data-order-id="${order.id}" data-action="confirm-receipt">Order Received</button>`;
                case 'Completed':
                    if (order.refund_status === 'approved' || order.refund_status === 'completed') {
                        return `<div class="text-center"><span class="text-xs font-semibold ${order.refund_status === 'approved' ? 'text-blue-600' : 'text-green-600'}">${order.refund_status === 'approved' ? 'Refund Approved' : 'Refund Completed'}</span></div>`;
                    }
                    if (order.refund_status === 'requested') {
                        return `<div class="text-center"><span class="text-xs font-semibold text-yellow-600">Refund Requested</span></div>`;
                    }
                    return order.rated ? `<div class="flex items-center gap-1 text-amber-500">${Array(order.rating).fill(0).map(() => '<i class="ri-star-fill"></i>').join('')}<span class="text-xs text-gray-500 ml-1">(${order.rating})</span></div>` : `<button class="order-action-btn border border-primary text-primary py-1 px-3 rounded-button text-sm" data-order-id="${order.id}" data-action="rate-order">Rate</button>`;
                default:
                    return '';
            }
        };

        accountModalContent.innerHTML = `
            <h3 class="text-2xl font-bold mb-6">Order History</h3>
            <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                ${currentUser && currentUser.orders && currentUser.orders.length > 0 ? [...currentUser.orders].reverse().map(order => {
                    const currentStatusIndex = getStatusIndex(order.status);
                    return `
                    <div class="border rounded-lg p-4">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <span class="font-bold text-primary">#${order.id}</span>
                                <span class="text-sm text-gray-500 ml-2">${order.timestamp ? new Date(order.timestamp).toLocaleString() : (isNaN(Date.parse(order.date)) ? order.date : new Date(order.date).toLocaleString())}</span>
                            </div>
                            <span class="font-semibold text-sm text-primary">${order.status.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        
                        <!-- Order Items -->
                        <div class="mb-4 border-t pt-4 space-y-3">
                            ${order.items.map(item => `
                                                <div class="flex items-center gap-3 text-sm">
                                                    ${mkImg(item.image, item.name, 'w-12 h-12 object-cover rounded-md')}
                                                    <div class="flex-1">
                                                        <p class="font-medium">${item.name}</p>
                                                        <p class="text-gray-500">Qty: ${item.quantity}</p>
                                                    </div>
                                                    <p class="font-medium">₱${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            `).join('')}
                        </div>

                        <!-- Progress Bar -->
                        <div class="my-4">
                            <div class="flex justify-between text-xs text-gray-500">
                                ${orderStatuses.map(s => `<span>${s}</span>`).join('')}
                            </div>
                            <div class="relative mt-1">
                                <div class="h-1 bg-gray-200 rounded-full"></div>
                                <div class="absolute top-0 left-0 h-1 bg-primary rounded-full" style="width: ${currentStatusIndex / (orderStatuses.length - 1) * 100}%"></div>
                                <div class="absolute -top-1 flex w-full justify-between">
                                    ${orderStatuses.map((s, i) => `<div class="w-3 h-3 rounded-full ${i <= currentStatusIndex ? 'bg-primary' : 'bg-gray-300'}"></div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end items-center border-t pt-4 mt-4 gap-4">
                            <p class="text-lg">Total: <span class="font-bold text-gray-800">₱${(order.total).toFixed(2)}</span></p>
                            <div class="ml-auto flex items-center gap-3">
                                ${order.status === 'Completed' && !order.refund_status ? `<button class="order-action-btn bg-red-600 text-white py-1 px-3 rounded-button text-sm hover:bg-red-700" data-order-id="${order.id}" data-action="request-refund">Request Refund</button>` : ''}
                                ${getActionForOrder(order)}
                            </div>
                        </div>
                    </div>
                `}).join('') : '<p class="text-center text-gray-500 py-8">You have no orders yet.</p>'}
            </div>
        `;
    };

    const renderRatingModal = (orderId) => {
        const order = currentUser.orders.find(o => o.id === orderId);
        if (!order) return;

        const ratingModal = document.getElementById('rating-modal');
        const content = document.getElementById('rating-modal-content');

        content.innerHTML = `
            <button id="close-rating-modal-btn" class="absolute top-3 right-4 text-gray-400 hover:text-gray-600"><i class="ri-close-line ri-xl"></i></button>
            <h3 class="text-2xl font-bold mb-4">Rate Your Purchase</h3>
            <div class="mb-4 border-b pb-4">
                ${order.items.map(item => `
                    <div class="flex items-center gap-3 text-sm">
                        ${mkImg(item.image, item.name, 'w-12 h-12 object-cover rounded-md')}
                        <p class="font-medium flex-1">${item.name}</p>
                    </div>
                `).join('')}
            </div>
            <form id="rating-form" data-order-id="${orderId}">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <div class="rating-stars flex items-center text-3xl" data-rating="0">
                        <i class="star ri-star-line" data-value="1"></i>
                        <i class="star ri-star-line" data-value="2"></i>
                        <i class="star ri-star-line" data-value="3"></i>
                        <i class="star ri-star-line" data-value="4"></i>
                        <i class="star ri-star-line" data-value="5"></i>
                    </div>
                </div>
                <div class="mb-6">
                    <label for="review-text" class="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                    <textarea id="review-text" rows="4" class="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="Tell us about your experience..."></textarea>
                </div>
                <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-button font-medium hover:bg-opacity-90 transition-colors">Submit Review</button>
            </form>
        `;
        openModal(ratingModal);
    };

    const renderSettings = () => {
        accountModalContent.innerHTML = `
            <h3 class="text-2xl font-bold mb-6">Account Settings</h3>
            <form id="settings-form" class="space-y-4">
                 <div>
                    <label for="settings-name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="settings-name" value="${currentUser.fullName}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="settings-email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="settings-email" value="${currentUser.email}" readonly class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm bg-gray-100">
                </div>
                <div>
                    <label for="settings-address" class="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" id="settings-address" value="${currentUser.address || ''}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label for="settings-phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="settings-phone" value="${currentUser.phone || ''}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <div class="border-t pt-4">
                    <label for="settings-password" class="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" id="settings-password" placeholder="Leave blank to keep current password" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                 <div>
                    <label for="settings-confirm-password" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input type="password" id="settings-confirm-password" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-button shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                </div>
                <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-button font-medium hover:bg-opacity-90 transition-colors">Save Changes</button>
            </form>
        `;
    };
    const updateAccountDropdownUI = () => {
         const dropdown = document.getElementById('account-dropdown');
        if (isLoggedIn && currentUser) {
            dropdown.innerHTML = `
                <h3 class="font-medium text-gray-800 mb-1 px-1">Welcome, ${currentUser.name}!</h3>
                <p class="text-xs text-gray-500 mb-3 px-1">A fine day for jewelry.</p>
                <ul class="space-y-1">
                    <li><button id="order-history-btn" class="block w-full text-left py-2 px-1 text-gray-600 hover:text-primary transition-colors">Order History</button></li>
                    <li><button id="wishlist-btn" class="block w-full text-left py-2 px-1 text-gray-600 hover:text-primary transition-colors">My Wishlist</button></li>
                    <li><button id="settings-btn" class="block w-full text-left py-2 px-1 text-gray-600 hover:text-primary transition-colors">Settings</button></li>
                    <li><button id="logout-btn" class="block w-full text-left py-2 px-1 text-gray-600 hover:text-primary transition-colors">Logout</button></li>
                </ul>
            `;
        } else {
            dropdown.innerHTML = `
                <h3 class="font-medium text-gray-800 mb-3">My Account</h3>
                <ul class="space-y-2">
                    <li><button id="login-register-btn" class="block w-full text-left py-1 text-gray-600 hover:text-primary transition-colors">Login / Register</button></li>
                </ul>
                <p class="text-xs text-gray-400 mt-3">Login to access your orders and wishlist.</p>
            `;
        }
    };
    
    // --- CHECKOUT & VIEW LOGIC ---
    const showQuickView = (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const modal = document.getElementById('quick-view-modal');
        const content = document.getElementById('quick-view-modal-content');

        const isInWishlist = wishlist.some(item => item.id === product.id);
        const heartIconClass = isInWishlist ? 'ri-heart-fill text-primary' : 'ri-heart-line';
        const activeClass = isInWishlist ? 'active' : '';

        const ratingDetails = getProductRatingDetails(product.id);
        const renderStars = (rating) => {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="ri-star-fill"></i>';
                } else if (i - 0.5 <= rating) {
                    stars += '<i class="ri-star-half-fill"></i>';
                } else {
                    stars += '<i class="ri-star-line"></i>';
                }
            }
            return stars;
        };

        content.innerHTML = `
            <button id="close-quick-view-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"><i class="ri-close-line ri-2x"></i></button>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-gray-100 rounded-lg overflow-hidden">${mkImg(product.image, product.name, 'w-full h-full object-cover')}</div>
                <div>
                    <h4 class="text-2xl font-medium text-gray-900 mb-2">${product.name}</h4>
                    <p class="text-xl text-primary font-medium mb-2">₱${product.price.toFixed(2)}</p>
                    <div class="flex items-center gap-2 text-amber-500 mb-4">
                        ${ratingDetails.count > 0 ? `${renderStars(ratingDetails.average)} <span class="text-gray-600 text-sm ml-1">${ratingDetails.average.toFixed(1)} (${ratingDetails.count} reviews)</span>` : '<span class="text-sm text-gray-500">No reviews yet</span>'}
                    </div>
                    <p class="text-gray-700 mb-6">${product.description}</p>
                    <div class="mb-6">
                        <label class="block text-gray-700 font-medium mb-2">Quantity</label>
                        <div class="flex w-32 h-10">
                            <button class="quantity-minus w-10 h-10 border border-gray-300 flex items-center justify-center rounded-l-button hover:bg-gray-100 transition-colors">-</button>
                            <input type="number" value="1" min="1" class="quantity-input w-12 h-10 border-t border-b border-gray-300 text-center focus:outline-none">
                            <button class="quantity-plus w-10 h-10 border border-gray-300 flex items-center justify-center rounded-r-button hover:bg-gray-100 transition-colors">+</button>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button class="add-to-cart-btn flex-1 bg-gray-800 text-white py-3 px-6 rounded-button font-medium hover:bg-gray-600 transition-colors" data-product-id="${product.id}">Add to Cart</button>
                        <button class="buy-now-btn flex-1 bg-primary text-white py-3 px-6 rounded-button font-medium hover:bg-opacity-90 transition-colors" data-product-id="${product.id}">Buy Now</button>
                    </div>
                     <div class="mt-4">
                        <button class="wishlist-toggle ${activeClass} flex items-center justify-center gap-2 w-full border border-gray-300 py-3 px-6 rounded-button hover:bg-gray-50 transition-colors" data-product-id="${product.id}">
                            <i class="${heartIconClass}"></i>
                            <span>${isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                        </button>
                    </div>
                </div>
            </div>`;
        openModal(modal);
    };
    
    let currentCheckoutItems = [];
    const showCheckout = (items) => {
        if (!items || items.length === 0) {
            showToast("Your cart is empty.", true);
            return;
        }
        currentCheckoutItems = items;

        let subtotal = 0;
            const itemsHtml = items.map(item => {
            subtotal += item.price * item.quantity;
            return `
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden relative">
                    ${mkImg(item.image, item.name, 'w-full h-full object-cover')}
                    <span class="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white text-sm rounded-full flex items-center justify-center">${item.quantity}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium">${item.name}</h4>
                </div>
                <p class="font-medium">₱${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `;}).join('');
        
        document.getElementById('checkout-summary-items').innerHTML = itemsHtml;
    document.getElementById('checkout-subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `₱${subtotal.toFixed(2)}`; // Assuming no shipping for now

        // Pre-fill form if user is logged in
        if (isLoggedIn && currentUser) {
            document.getElementById('checkout-email').value = currentUser.email || '';
            const nameParts = currentUser.fullName.split(' ');
            document.getElementById('checkout-first-name').value = nameParts[0] || '';
            document.getElementById('checkout-last-name').value = nameParts.slice(1).join(' ') || '';
            document.getElementById('checkout-address').value = currentUser.address || '';
            document.getElementById('checkout-phone').value = currentUser.phone || '';
        } else {
            // Clear fields for guest
            document.getElementById('checkout-email').value = '';
            document.getElementById('checkout-first-name').value = '';
            document.getElementById('checkout-last-name').value = '';
            document.getElementById('checkout-address').value = '';
            document.getElementById('checkout-phone').value = '';
            document.getElementById('checkout-postal-code').value = '';
            document.getElementById('checkout-city').value = '';
        }

        mainContent.classList.add('hidden');
        header.classList.add('hidden');
        footer.classList.add('hidden');
        checkoutPage.classList.remove('hidden');
        checkoutPage.classList.add('block');
        window.scrollTo(0, 0);
    };

    const hideCheckout = () => {
        mainContent.classList.remove('hidden');
        header.classList.remove('hidden');
        footer.classList.remove('hidden');
        checkoutPage.classList.add('hidden');
        checkoutPage.classList.remove('block');
    };

    const showCollectionModal = (category) => {
        const modal = document.getElementById('collection-modal');
        document.getElementById('collection-modal-title').textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`;
        const filteredProducts = products.filter(p => p.category === category);
        document.getElementById('collection-modal-grid').innerHTML = filteredProducts.map(renderProductCard).join('');
        openModal(modal);
    };

    const showWishlistModal = () => {
        const modal = document.getElementById('wishlist-modal');
        const gridEl = document.getElementById('wishlist-modal-grid');
        if (wishlist.length > 0) {
             gridEl.innerHTML = wishlist.map(renderProductCard).join('');
        } else {
             gridEl.innerHTML = `<p class="text-center text-gray-500 col-span-full py-10">Your wishlist is empty.</p>`;
        }
        openModal(modal);
    };

    const showViewCartModal = () => {
        const modal = document.getElementById('view-cart-modal');
        const cartItemsEl = document.getElementById('view-cart-items');
        const subtotalEl = document.getElementById('view-cart-subtotal');
        const totalEl = document.getElementById('view-cart-total');

        if (cart.length === 0) {
            cartItemsEl.innerHTML = `<p class="text-center text-gray-500 py-8">Your cart is empty.</p>`;
            subtotalEl.textContent = `₱0.00`;
            totalEl.textContent = `₱0.00`;
        } else {
            cartItemsEl.innerHTML = cart.map((item, index) => `
                <div class="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                    <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">${mkImg(item.image, item.name, 'w-full h-full object-cover')}</div>
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900 mb-1">${item.name}</h4>
                        <p class="text-sm text-gray-600 mb-2">₱${item.price.toFixed(2)} each</p>
                        <div class="flex items-center gap-2">
                            <button class="view-cart-qty-minus w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm" data-index="${index}">−</button>
                            <span class="view-cart-qty-display text-sm font-medium w-8 text-center" data-index="${index}">${item.quantity}</span>
                            <button class="view-cart-qty-plus w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm" data-index="${index}">+</button>
                            <span class="ml-auto text-sm font-medium">₱${(item.price * item.quantity).toFixed(2)}</span>
                            <button class="view-cart-remove-btn text-gray-400 hover:text-red-500 transition-colors" data-index="${index}" title="Remove item"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </div>
                </div>`).join('');
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
            totalEl.textContent = `₱${subtotal.toFixed(2)}`;
        }
        openModal(modal);
    };

    const renderNotificationsDropdown = () => {
        const container = document.getElementById('notification-items-container');
        // Show only notifications relevant to the current user (or global announcements)
        const relevant = notificationLog.filter(n => !n.targetEmail || (currentUser && n.targetEmail === currentUser.email));
        if (relevant.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 text-sm">No announcements</p>`;
        } else {
            container.innerHTML = relevant.slice().reverse().map(notif => {
                const isSeen = seenNotifications.includes(notif.timestamp);
                return `
                <div class="p-3 ${isSeen ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-200'} rounded-lg">
                    <p class="font-medium text-gray-900 text-sm">${notif.title}</p>
                    <p class="text-xs text-gray-600 mt-1">${notif.message}</p>
                    <p class="text-xs text-gray-400 mt-2">${notif.timestamp}</p>
                </div>
            `}).join('');
        }
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        const headerToggles = { 'search-btn': 'search-bar', 'account-btn': 'account-dropdown', 'notification-btn': 'notification-dropdown', 'wishlist-btn-header': 'wishlist-dropdown', 'cart-btn': 'cart-dropdown' };
        document.addEventListener('click', (e) => {
            if (e.target.closest(Object.values(headerToggles).map(v => `#${v}`).join(', '))) return;
            const clickedButtonId = e.target.closest('button')?.id;
            const openDropdownId = headerToggles[clickedButtonId];
            Object.values(headerToggles).forEach(id => {
                if(id !== openDropdownId) document.getElementById(id).classList.remove('show');
            });
            if (openDropdownId) document.getElementById(openDropdownId).classList.toggle('show');
        });

        const triggerLogin = () => {
            renderLoginForm();
            openModal(document.getElementById('account-modal'));
        };

        // Render notifications when bell is clicked
        document.getElementById('notification-btn').addEventListener('click', () => {
            renderNotificationsDropdown();
        });

        document.body.addEventListener('click', (e) => {
            // Add to cart
            if (e.target.closest('.add-to-cart-btn')) {
                const btn = e.target.closest('.add-to-cart-btn');
                const quickViewContent = btn.closest('#quick-view-modal-content');

                if (!isLoggedIn) {
                    if (quickViewContent) {
                        closeModal(document.getElementById('quick-view-modal'));
                    }
                    showToast('Please log in to add items to your cart.', true);
                    triggerLogin();
                    return;
                }
                
                const productId = parseInt(btn.dataset.productId);
                const quantity = quickViewContent ? parseInt(quickViewContent.querySelector('.quantity-input').value) : 1;
                
                const product = products.find(p => p.id === productId);
                if (product) {
                    const existingItem = cart.find(item => item.id === productId);
                    if (existingItem) existingItem.quantity += quantity;
                    else cart.push({ ...product, quantity });
                    updateCart();
                    showToast(`${product.name} added to cart.`);
                    
                    if (quickViewContent) {
                        closeModal(document.getElementById('quick-view-modal'));
                    }
                }
            }

            // Buy Now
            if (e.target.closest('.buy-now-btn')) {
                const btn = e.target.closest('.buy-now-btn');
                const productId = parseInt(btn.dataset.productId);
                const quickViewContent = btn.closest('#quick-view-modal-content');
                const quantity = quickViewContent ? parseInt(quickViewContent.querySelector('.quantity-input').value) : 1;
                const product = products.find(p => p.id === productId);
                if (product) {
                    if (quickViewContent) {
                       closeModal(document.getElementById('quick-view-modal'));
                    }
                    showCheckout([{...product, quantity}]);
                }
            }
            
            // Header checkout button
            if (e.target.closest('#header-checkout-btn')) {
                e.preventDefault();
                showCheckout(cart);
            }

            // View Cart Modal Proceed to Checkout
            if (e.target.closest('#proceed-to-checkout-btn')) {
                closeModal(document.getElementById('view-cart-modal'));
                showCheckout(cart);
            }

            // View Cart Modal Continue Shopping
            if (e.target.closest('#continue-shopping-btn')) {
                closeModal(document.getElementById('view-cart-modal'));
            }

            // Remove from cart
            if (e.target.closest('.remove-from-cart-btn')) {
                cart.splice(parseInt(e.target.closest('.remove-from-cart-btn').dataset.index), 1);
                updateCart();
                showToast(`Item removed from cart.`, true);
            }

            // Cart quantity decrease
            if (e.target.closest('.cart-qty-minus')) {
                const index = parseInt(e.target.closest('.cart-qty-minus').dataset.index);
                if (cart[index] && cart[index].quantity > 1) {
                    cart[index].quantity--;
                    updateCart();
                    showToast(`${cart[index].name} quantity decreased.`);
                }
            }
            // Cart quantity increase
            if (e.target.closest('.cart-qty-plus')) {
                const index = parseInt(e.target.closest('.cart-qty-plus').dataset.index);
                if (cart[index]) {
                    cart[index].quantity++;
                    updateCart();
                    showToast(`${cart[index].name} quantity increased.`);
                }
            }

            // View Cart Modal quantity decrease
            if (e.target.closest('.view-cart-qty-minus')) {
                const index = parseInt(e.target.closest('.view-cart-qty-minus').dataset.index);
                if (cart[index] && cart[index].quantity > 1) {
                    cart[index].quantity--;
                    showViewCartModal();
                    updateCart();
                    showToast(`${cart[index].name} quantity decreased.`);
                }
            }

            // View Cart Modal quantity increase
            if (e.target.closest('.view-cart-qty-plus')) {
                const index = parseInt(e.target.closest('.view-cart-qty-plus').dataset.index);
                if (cart[index]) {
                    cart[index].quantity++;
                    showViewCartModal();
                    updateCart();
                    showToast(`${cart[index].name} quantity increased.`);
                }
            }

            // View Cart Modal remove item
            if (e.target.closest('.view-cart-remove-btn')) {
                const index = parseInt(e.target.closest('.view-cart-remove-btn').dataset.index);
                const itemName = cart[index]?.name || 'Item';
                cart.splice(index, 1);
                updateCart();
                showViewCartModal();
                showToast(`${itemName} removed from cart.`, true);
            }

            // Wishlist toggle
            if (e.target.closest('.wishlist-toggle')) {
                const btn = e.target.closest('.wishlist-toggle');
                const productId = parseInt(btn.dataset.productId);
                const product = products.find(p => p.id === productId);
                if (!product) return;
                const itemIndex = wishlist.findIndex(item => item.id === productId);
                if (itemIndex > -1) { 
                    wishlist.splice(itemIndex, 1);
                    showToast(`${product.name} removed from wishlist.`, true);
                } else { 
                    wishlist.push(product);
                    showToast(`${product.name} added to wishlist.`);
                }
                updateWishlist();
                rerenderProductViews();

                // If inside quick view, re-render it
                if (btn.closest('#quick-view-modal-content')) {
                    showQuickView(productId);
                }
            }
            
            // Remove from wishlist dropdown
            if (e.target.closest('.remove-from-wishlist-btn')) {
                const productId = parseInt(e.target.closest('.remove-from-wishlist-btn').dataset.productId);
                wishlist = wishlist.filter(item => item.id !== productId);
                updateWishlist();
                rerenderProductViews();
            }
            
            // Modals & Account
            if (e.target.closest('.quick-view-btn')) {
                const parentModal = e.target.closest('#collection-modal, #new-arrivals-modal, #wishlist-modal');
                if (parentModal) {
                    closeModal(parentModal);
                }
                showQuickView(parseInt(e.target.closest('.quick-view-btn').dataset.productId));
            }
            if (e.target.closest('#view-all-arrivals-btn')) {
                document.getElementById('all-new-arrivals-grid').innerHTML = products.map(renderProductCard).join('');
                openModal(document.getElementById('new-arrivals-modal'));
            }
            if (e.target.closest('#view-cart-btn')) {
                document.getElementById('cart-dropdown').classList.remove('show');
                showViewCartModal();
            }
            if (e.target.closest('.explore-btn')) showCollectionModal(e.target.closest('.explore-btn').dataset.category);
            if (e.target.closest('#wishlist-btn')) isLoggedIn ? showWishlistModal() : triggerLogin();
            if (e.target.closest('#login-register-btn, #checkout-login-btn')) { e.preventDefault(); triggerLogin(); }
            
            // Account Dropdown Actions
            if (e.target.closest('#logout-btn')) {
                isLoggedIn = false;
                currentUser = null;
                cart = []; // Clear cart on logout
                wishlist = []; // Clear wishlist on logout
                updateCart();
                updateWishlist(); // Update wishlist UI
                updateAccountDropdownUI();
                showToast("You have been logged out.");
                document.getElementById('account-dropdown').classList.remove('show');
                saveData();
                // Ensure checkout view is hidden and return user to home page
                try { hideCheckout(); } catch (err) { /* ignore if not available */ }
                // Reload or navigate to the homepage so UI resets for logged-out user
                window.location.href = 'md.html';
            }
            if (e.target.closest('#order-history-btn')) {
                document.getElementById('account-dropdown').classList.remove('show');
                isLoggedIn ? (renderOrderHistory(), openModal(document.getElementById('account-modal'))) : triggerLogin();
            }
            if (e.target.closest('#settings-btn')) {
                document.getElementById('account-dropdown').classList.remove('show');
                isLoggedIn ? (renderSettings(), openModal(document.getElementById('account-modal'))) : triggerLogin();
            }

            // Order Action Buttons
            if (e.target.closest('.order-action-btn')) {
                const btn = e.target.closest('.order-action-btn');
                const orderId = btn.dataset.orderId;
                const action = btn.dataset.action;
                
                const userIndex = users.findIndex(u => u.email === currentUser.email);
                if (userIndex === -1) return;

                const orderIndex = users[userIndex].orders.findIndex(o => o.id === orderId);
                if (orderIndex === -1) return;

                if (action === 'confirm-receipt') {
                    users[userIndex].orders[orderIndex].status = 'Completed';
                    showToast('Order marked as received! Thank you for your purchase. ✓');
                } else if (action === 'rate-order') {
                    closeModal(document.getElementById('account-modal'));
                    renderRatingModal(orderId);
                    return; // Prevent re-rendering history just yet
                } else if (action === 'request-refund') {
                    users[userIndex].orders[orderIndex].refund_status = 'requested';
                    showToast('Refund request submitted. Please wait for admin approval.');
                    // Notify admin about refund request
                    try {
                        const notif = {
                            title: `Refund Request: Order ${orderId}`,
                            message: `${currentUser.fullName} (${currentUser.email}) requested a refund for order ${orderId}`,
                            timestamp: Date.now(),
                            type: 'refund_request'
                        };
                        notificationLog.push(notif);
                        localStorage.setItem('md_notification_log', JSON.stringify(notificationLog));
                    } catch (err) { console.error('Failed to log refund request', err); }
                }
                currentUser = users[userIndex]; // Update currentUser
                saveData();
                renderOrderHistory(); // Re-render the order history view
            }

            // Rating Modal Star Interaction
            if (e.target.matches('.rating-stars .star')) {
                const star = e.target;
                const ratingContainer = star.parentElement;
                const rating = parseInt(star.dataset.value);
                ratingContainer.dataset.rating = rating;

                Array.from(ratingContainer.children).forEach(s => {
                    const sValue = parseInt(s.dataset.value);
                    if (sValue <= rating) {
                        s.classList.remove('ri-star-line');
                        s.classList.add('ri-star-fill', 'selected');
                    } else {
                        s.classList.add('ri-star-line');
                        s.classList.remove('ri-star-fill', 'selected');
                    }
                });
            }

            // Close Modals
            const modalsToClose = ['#close-quick-view-btn', '#close-arrivals-modal-btn', '#close-collection-modal-btn', '#close-wishlist-modal-btn', '#close-account-modal-btn', '#close-rating-modal-btn', '#close-view-cart-modal-btn'];
            if(e.target.closest(modalsToClose.join(','))) closeModal(e.target.closest('.fixed'));
            
            // Checkout page controls
            if (e.target.closest('#back-to-shop-btn')) hideCheckout();
            if (e.target.closest('#pay-now-btn')) {
                const total = currentCheckoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const orderId = `MD${Date.now().toString().slice(-5)}`;
                let customerDetails = {};

                if (isLoggedIn) {
                    customerDetails = {
                        name: currentUser.fullName,
                        email: currentUser.email,
                        address: currentUser.address
                    };
                    const newOrder = {
                        id: orderId,
                        date: new Date().toISOString(),
                        timestamp: Date.now(),
                        total: total,
                        status: 'To Ship', // Initial status after payment
                        items: currentCheckoutItems,
                        rated: false,
                        rating: 0,
                        review: ''
                    };
                    // Find the user in the main 'users' array and update them
                    const userIndex = users.findIndex(u => u.email === currentUser.email);
                    if (userIndex > -1) {
                        if (!users[userIndex].orders) {
                            users[userIndex].orders = [];
                        }
                        users[userIndex].orders.push(newOrder);
                        currentUser = users[userIndex]; // Refresh currentUser with new order
                    }
                    
                    cart = []; // Clear the main cart if checkout is from cart
                    updateCart();
                    saveData();
                } else {
                    // Guest checkout validation
                    const email = document.getElementById('checkout-email').value;
                    const firstName = document.getElementById('checkout-first-name').value;
                    const lastName = document.getElementById('checkout-last-name').value;
                    const address = document.getElementById('checkout-address').value;
                    const city = document.getElementById('checkout-city').value;
                    const postalCode = document.getElementById('checkout-postal-code').value;
                    const phone = document.getElementById('checkout-phone').value;

                    if (!email || !firstName || !lastName || !address || !city || !postalCode || !phone) {
                        showToast('You have to fill up first before proceed to check out', true);
                        return; // Stop execution
                    }
                    customerDetails = {
                        name: `${firstName} ${lastName}`,
                        email: email,
                        address: `${address}, ${city}, ${postalCode}`
                    };
                }

                // Store order details for invoice page and redirect
                const orderForInvoice = {
                    items: currentCheckoutItems,
                    total: total,
                    customer: customerDetails,
                    orderId: orderId
                };
                localStorage.setItem('currentOrder', JSON.stringify(orderForInvoice));
                window.location.href = 'invoice.html';
            }

            // Form switching & quantity buttons
            if (e.target.closest('#show-register-form')) renderRegisterForm();
            if (e.target.closest('#show-login-form')) renderLoginForm();
            if (e.target.closest('.quantity-minus')) { const input = e.target.closest('.quantity-minus').nextElementSibling; if (input.value > 1) input.value--; }
            if (e.target.closest('.quantity-plus')) e.target.closest('.quantity-plus').previousElementSibling.value++;
        });
        
        // Form Submissions
        document.body.addEventListener('submit', e => {
            e.preventDefault();
            const formId = e.target.id;
            const accountModal = document.getElementById('account-modal');
            
            if (formId === 'login-form') {
                const email = e.target.querySelector('#email').value;
                const password = e.target.querySelector('#password').value;
                if (!email || !password) {
                    showToast('Please enter both email and password.', true);
                    return;
                }
                const foundUser = users.find(user => user.email === email && user.password === password);
                if (foundUser) {
                    isLoggedIn = true;
                    currentUser = foundUser;
                    // Do not modify order statuses automatically on login.
                    // Status changes must come from admin actions or explicit user actions.
                    updateAccountDropdownUI();
                    closeModal(accountModal);

                    // If user just registered in this session, we already created a
                    // targeted welcome notification; skip the generic welcome-back
                    // toast to avoid duplicate/ordering confusion.
                    let justRegisteredEmail = null;
                    try { justRegisteredEmail = sessionStorage.getItem('md_justRegistered'); } catch (err) { /* ignore */ }
                    if (!justRegisteredEmail || justRegisteredEmail !== foundUser.email) {
                        showToast(`Welcome back, ${currentUser.name}! 👋`);
                    } else {
                        // Clear the flag so future logins show the normal toast
                        try { sessionStorage.removeItem('md_justRegistered'); } catch (err) { /* ignore */ }
                    }

                    saveData();
                } else {
                    showToast('Invalid email or password. Please try again.', true);
                }
            } else if (formId === 'register-form') {
                const fullName = e.target.querySelector('#reg-name').value;
                const email = e.target.querySelector('#reg-email').value;
                const address = e.target.querySelector('#reg-address').value;
                const phone = e.target.querySelector('#reg-phone').value;
                const password = e.target.querySelector('#reg-password').value;

                if (!fullName || !email || !address || !phone || !password) {
                    showToast('Please fill in all fields to create an account.', true);
                    return;
                }
                if (users.some(user => user.email === email)) {
                    showToast('An account with this email already exists. Please log in instead.', true);
                    return;
                }
                users.push({ 
                    fullName, 
                    name: fullName.split(' ')[0], 
                    email, 
                    address, 
                    phone,
                    password, // Save password
                    orders: [] 
                });
                saveData();

                // Create a targeted welcome notification for the new user
                try {
                    const notificationLogLocal = JSON.parse(localStorage.getItem('md_notification_log')) || [];
                    const welcomeNotif = {
                        title: 'Welcome to MD Fine Jewelry',
                        message: `Thanks for joining, ${fullName.split(' ')[0]}!`,
                        timestamp: new Date().toLocaleString(),
                        targetEmail: email
                    };
                    notificationLogLocal.push(welcomeNotif);
                    localStorage.setItem('md_notification_log', JSON.stringify(notificationLogLocal));
                } catch (err) {
                    console.error('Failed to create welcome notification', err);
                }

                // Mark this session as a just-registered user so the login handler
                // can avoid duplicating the welcome toast (they already get a targeted notification).
                try {
                    sessionStorage.setItem('md_justRegistered', email);
                } catch (err) {
                    // ignore if sessionStorage isn't available
                }

                showToast('Account created successfully! 🎉 Please log in to continue.');
                renderLoginForm();
            } else if (formId === 'newsletter-form') {
                showToast('Thank you for subscribing!');
                e.target.reset();
            } else if (formId === 'rating-form') {
                const orderId = e.target.dataset.orderId;
                const rating = parseInt(e.target.querySelector('.rating-stars').dataset.rating);
                const review = e.target.querySelector('#review-text').value;

                if (rating === 0) {
                    showToast('Please select a star rating.', true);
                    return;
                }

                const userIndex = users.findIndex(u => u.email === currentUser.email);
                const orderIndex = users[userIndex].orders.findIndex(o => o.id === orderId);

                if (userIndex > -1 && orderIndex > -1) {
                    users[userIndex].orders[orderIndex].rated = true;
                    users[userIndex].orders[orderIndex].rating = rating;
                    users[userIndex].orders[orderIndex].review = review;
                    
                    currentUser = users[userIndex];
                    saveData();
                    
                    closeModal(document.getElementById('rating-modal'));
                    // Re-render product views to show new rating
                    rerenderProductViews(); 
                    openModal(document.getElementById('account-modal')); // Re-open account modal
                    renderOrderHistory();
                    showToast('Thank you for your feedback!');
                }
            } else if (formId === 'settings-form') {
                const newFullName = e.target.querySelector('#settings-name').value;
                const newAddress = e.target.querySelector('#settings-address').value;
                const newPhone = e.target.querySelector('#settings-phone').value;
                const newPassword = e.target.querySelector('#settings-password').value;
                const confirmPassword = e.target.querySelector('#settings-confirm-password').value;

                if (!newFullName || !newAddress || !newPhone) {
                    showToast('Please fill in all required fields.', true);
                    return;
                }

                let passwordChanged = false;
                if (newPassword) {
                    if (newPassword !== confirmPassword) {
                        showToast('New passwords do not match. Please try again.', true);
                        return;
                    }
                    if (newPassword.length < 6) {
                        showToast('Password must be at least 6 characters long.', true);
                        return;
                    }
                    passwordChanged = true;
                }
                
                // Update the user in the main users array
                const userIndex = users.findIndex(u => u.email === currentUser.email);
                if(userIndex > -1) {
                    users[userIndex].fullName = newFullName;
                    users[userIndex].name = newFullName.split(' ')[0];
                    users[userIndex].address = newAddress;
                    users[userIndex].phone = newPhone;
                    if (passwordChanged) {
                        users[userIndex].password = newPassword;
                    }
                }

                // Update the currentUser object as well
                currentUser.fullName = newFullName;
                currentUser.name = newFullName.split(' ')[0];
                currentUser.address = newAddress;
                currentUser.phone = newPhone;
                if (passwordChanged) {
                    currentUser.password = newPassword;
                }

                updateAccountDropdownUI();
                closeModal(accountModal);
                showToast('Settings saved successfully!');
                saveData();
            }
        });

        // Search Logic
        document.getElementById('search-input').addEventListener('input', (e) => {
             const searchTerm = e.target.value.toLowerCase();
             const resultsContainer = document.getElementById('search-results');
             if (searchTerm.length < 2) {
                 resultsContainer.innerHTML = '';
                 return;
             }
             const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
             if (filtered.length > 0) {
                 resultsContainer.innerHTML = filtered.map(p => `
                          <a href="#" class="search-result-item flex items-center gap-3 p-2 rounded-md hover:bg-gray-100" data-product-id="${p.id}">
                              ${mkImg(p.image, p.name, 'w-10 h-10 object-cover rounded')}
                              <div>
                        <p class="text-sm font-medium text-gray-800">${p.name}</p>
                             <p class="text-xs text-primary">₱${p.price.toFixed(2)}</p>
                              </div>
                          </a>`).join('');
             } else {
                 resultsContainer.innerHTML = `<p class="p-2 text-sm text-gray-500">No products found.</p>`;
             }
        });

        // Add event listener for search result clicks
        document.getElementById('search-results').addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                e.preventDefault();
                const productId = parseInt(item.dataset.productId);
                // Close search
                document.getElementById('search-bar').classList.remove('show');
                document.getElementById('search-input').value = '';
                document.getElementById('search-results').innerHTML = '';
                // Open quick view
                showQuickView(productId);
            }
        });
    };

    // --- INITIALIZATION ---
    const init = () => {
        // Only render products if the grid exists
        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid) {
            newArrivalsGrid.innerHTML = products.slice(0, 8).map(renderProductCard).join('');
        }
        updateCart();
        updateWishlist();
        updateAccountDropdownUI();
        updateNotificationBell();
        displayNewNotifications();
        setupEventListeners();
        
        // Check for new notifications every 2 seconds
        setInterval(() => {
            // Refresh stored data that may be changed elsewhere
            notificationLog = JSON.parse(localStorage.getItem('md_notification_log')) || [];
            // Refresh currentUser in case admin updated it
            currentUser = JSON.parse(localStorage.getItem('md_currentUser')) || currentUser;
            users = JSON.parse(localStorage.getItem('md_users')) || users;
            updateNotificationBell();
            displayNewNotifications();
        }, 2000);
    };

    // Run the init function only if the main script is being loaded
    // (i.e., not on payment.html or invoice.html)
    if (document.getElementById('new-arrivals-grid')) {
        init();
    }
});