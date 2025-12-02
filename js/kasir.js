// ===== CART SYSTEM =====
let cart = [];
let currentCategory = 'all';

// Initialize Cart
function initCart() {
    console.log('🔍 initCart() called');
    const savedCart = localStorage.getItem('nyumil_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('📦 Cart loaded:', cart.length, 'items');
        updateCartDisplay();
    }
}

// Save Cart
function saveCart() {
    localStorage.setItem('nyumil_cart', JSON.stringify(cart));
}

// Add to Cart - FIXED VERSION
function addToCart(product) {
    console.log('➕ addToCart called with:', product);
    
    // Cek jika product adalah object atau hanya ID
    if (typeof product === 'number' || typeof product === 'string') {
        // Cari produk dari DEFAULT_PRODUCTS
        const productId = parseInt(product);
        const foundProduct = DEFAULT_PRODUCTS.find(p => p.id === productId);
        if (!foundProduct) {
            console.error('❌ Product not found for ID:', product);
            return;
        }
        product = foundProduct;
    }
    
    if (!product || !product.id) {
        console.error('❌ Invalid product:', product);
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            cost: product.cost || 0,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartDisplay();
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`${product.name} ditambahkan ke keranjang`, 'success');
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartDisplay();
        }
    }
}

// Clear Cart
function clearCart() {
    if (cart.length === 0) {
        alert('Keranjang sudah kosong');
        return;
    }
    
    if (confirm('Hapus semua item dari keranjang?')) {
        cart = [];
        saveCart();
        updateCartDisplay();
        alert('Keranjang dikosongkan');
    }
}

// Update Cart Display - FIXED VERSION
function updateCartDisplay() {
    console.log('🛒 updateCartDisplay() called');
    
    // Dapatkan element setiap kali untuk menghindari null reference
    const orderList = document.getElementById('orderList');
    const emptyOrder = document.getElementById('emptyOrder');
    const orderCount = document.getElementById('orderCount');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalAmount = document.getElementById('totalAmount');
    
    // Debug: log status elements
    console.log('Elements status:', {
        orderList: !!orderList,
        emptyOrder: !!emptyOrder,
        orderCount: !!orderCount,
        subtotalAmount: !!subtotalAmount,
        totalAmount: !!totalAmount
    });
    
    // Jika orderList tidak ditemukan, return
    if (!orderList) {
        console.error('❌ orderList not found');
        return;
    }
    
    // Tampilkan/sembunyikan emptyOrder jika ada
    if (emptyOrder) {
        emptyOrder.style.display = cart.length === 0 ? 'flex' : 'none';
    }
    
    // Update order count
    if (orderCount) {
        orderCount.textContent = cart.length;
    }
    
    // Calculate totals
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    // Update amounts
    if (subtotalAmount) {
        subtotalAmount.textContent = formatRupiah(subtotal);
    }
    
    if (totalAmount) {
        totalAmount.textContent = formatRupiah(subtotal);
    }
    
    // Render cart items
    // Hapus semua order-item, tapi jangan hapus emptyOrder jika ada
    const orderItems = orderList.querySelectorAll('.order-item');
    orderItems.forEach(item => item.remove());
    
    if (cart.length > 0) {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ddd;';
            orderItem.innerHTML = `
                <div style="flex: 2;">
                    <strong>${item.name}</strong><br>
                    <small>${formatRupiah(item.price)}</small>
                </div>
                <div style="flex: 1; text-align: center;">
                    <button onclick="updateQuantity(${item.id}, -1)" style="padding: 5px 10px; background: #e63946; color: white; border: none; border-radius: 4px; cursor: pointer;">-</button>
                    <span style="margin: 0 10px; font-weight: bold;">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" style="padding: 5px 10px; background: #2a9d8f; color: white; border: none; border-radius: 4px; cursor: pointer;">+</button>
                </div>
                <div style="flex: 1; text-align: right;">
                    <strong>${formatRupiah(itemTotal)}</strong><br>
                    <button onclick="removeFromCart(${item.id})" style="padding: 3px 8px; font-size: 12px; margin-top: 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">Hapus</button>
                </div>
            `;
            
            orderList.appendChild(orderItem);
        });
    }
    
    console.log('✅ Cart updated:', cart.length, 'items');
}

// ===== PRODUCT DISPLAY =====
function renderProducts() {
    console.log('🎨 renderProducts() called');
    
    const menuGrid = document.getElementById('menuGrid');
    const categoriesContainer = document.getElementById('productCategories');
    
    if (!menuGrid) {
        console.error('❌ menuGrid not found');
        return;
    }
    
    console.log('✅ menuGrid found');
    
    // Get products
    let productsToShow = [];
    if (typeof DEFAULT_PRODUCTS !== 'undefined' && DEFAULT_PRODUCTS.length > 0) {
        productsToShow = DEFAULT_PRODUCTS;
        console.log(`✅ Using DEFAULT_PRODUCTS: ${productsToShow.length} items`);
    } else {
        console.error('❌ DEFAULT_PRODUCTS not found');
        menuGrid.innerHTML = '<div class="error">Data produk tidak ditemukan</div>';
        return;
    }
    
    // Render products - SIMPLE VERSION (tanpa onclick complex)
    let html = '';
    productsToShow.forEach(product => {
        // Gunakan inline event listener yang sederhana
        html += `
            <div class="menu-item" data-product-id="${product.id}">
                <div class="menu-item-content">
                    <div class="menu-icon">
                        <i class="fas ${product.icon}"></i>
                    </div>
                    <h4>${product.name}</h4>
                    <p class="menu-description">${product.description || ''}</p>
                    <p class="price">${formatRupiah(product.price)}</p>
                    <button class="btn-add" data-product-id="${product.id}">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>
            </div>
        `;
    });
    
    menuGrid.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = parseInt(this.getAttribute('data-product-id'));
            const product = productsToShow.find(p => p.id === productId);
            if (product) {
                addToCart(product);
            }
        });
    });
    
    // Juga tambahkan ke parent menu-item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.btn-add')) {
                const productId = parseInt(this.getAttribute('data-product-id'));
                const product = productsToShow.find(p => p.id === productId);
                if (product) {
                    addToCart(product);
                }
            }
        });
    });
    
    console.log(`✅ Rendered ${productsToShow.length} products with event listeners`);
}

// ===== CHECKOUT PROCESS - IMPROVED VERSION =====
function checkout() {
    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }
    
    // Calculate totals
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const profit = cart.reduce((sum, item) => {
        const itemCost = item.cost || 0;
        return sum + ((item.price - itemCost) * item.quantity);
    }, 0);
    
    // Show confirmation with details
    const itemList = cart.map(item => 
        `${item.name} x${item.quantity} = ${formatRupiah(item.price * item.quantity)}`
    ).join('\n');
    
    const confirmMessage = `
💳 KONFIRMASI PEMBAYARAN

${itemList}

━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatRupiah(total)}
Total: ${formatRupiah(total)}

Lakukan pembayaran dan cetak struk?
    `.trim();
    
    if (confirm(confirmMessage)) {
        // Create transaction with proper structure
        const transactionId = Date.now();
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const transaction = {
            id: transactionId,
            date: today,
            time: now,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                cost: item.cost || 0,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: total,
            total: total,
            profit: profit
        };
        
        console.log('💾 Saving transaction:', transaction);
        
        // ===== SAVE TO LOCALSTORAGE =====
        
        // 1. Save to transactions (for history)
        const transactions = JSON.parse(localStorage.getItem('nyumil_transactions') || '[]');
        transactions.push(transaction);
        localStorage.setItem('nyumil_transactions', JSON.stringify(transactions));
        console.log('✅ Transactions saved:', transactions.length);
        
        // 2. Save to dailyStats (for statistics)
        const dailyStats = JSON.parse(localStorage.getItem('nyumil_dailyStats') || '{}');
        
        // Initialize today's stats if not exists
        if (!dailyStats[today]) {
            dailyStats[today] = {
                revenue: 0,
                transactions: 0,
                itemsSold: 0,
                profit: 0,
                items: {}
            };
        }
        
        // Update today's stats
        dailyStats[today].revenue += total;
        dailyStats[today].transactions += 1;
        dailyStats[today].profit += profit;
        
        // Update items sold
        transaction.items.forEach(item => {
            dailyStats[today].itemsSold += item.quantity;
            
            // Initialize item stats if not exists
            if (!dailyStats[today].items[item.id]) {
                dailyStats[today].items[item.id] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0,
                    profit: 0
                };
            }
            
            // Update item stats
            dailyStats[today].items[item.id].quantity += item.quantity;
            dailyStats[today].items[item.id].revenue += item.total;
            dailyStats[today].items[item.id].profit += (item.price - item.cost) * item.quantity;
        });
        
        localStorage.setItem('nyumil_dailyStats', JSON.stringify(dailyStats));
        console.log('✅ Daily stats updated:', dailyStats[today]);
        
        // ===== SHOW SUCCESS MESSAGE & OPTION TO PRINT =====
        
        const successMessage = `
✅ TRANSAKSI BERHASIL!

ID Transaksi: #${transactionId}
Tanggal: ${today} ${now}
Total: ${formatRupiah(total)}

Cetak struk sekarang?
        `.trim();
        
        if (confirm(successMessage)) {
            // Print receipt
            printReceipt(transaction);
        } else {
            // Show notification if available
            if (typeof showNotification === 'function') {
                showNotification(`Transaksi #${transactionId} berhasil!`, 'success');
            }
        }
        
        // ===== RESET CART =====
        cart = [];
        saveCart();
        updateCartDisplay();
        
        // ===== AUTO-REFRESH STATISTICS IF STATS TAB IS ACTIVE =====
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.dataset.tab === 'stats') {
            console.log('🔄 Stats tab is active, refreshing statistics...');
            
            // Wait a moment for data to be saved
            setTimeout(() => {
                // Try to load statistics via app module
                if (typeof app !== 'undefined' && typeof app.loadStatisticsTab === 'function') {
                    app.loadStatisticsTab();
                } 
                // Try to load via statistik module
                else if (typeof loadStatistics === 'function') {
                    loadStatistics();
                }
            }, 300);
        }
    }
}

// ===== PRINT THERMAL RECEIPT =====
function printReceipt(transaction) {
    console.log('🖨️ Printing receipt for transaction:', transaction.id);
    
    // Buat jendela baru untuk print
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
        alert('Popup diblokir! Izinkan popup untuk mencetak struk.');
        return;
    }
    
    // Format waktu
    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.split(':').slice(0, 2).join(':');
    };
    
    // Hitung total item
    const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Buat konten HTML untuk struk
    const receiptHTML = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Struk Transaksi #${transaction.id}</title>
            
            <!-- Load your existing print.css -->
            <link rel="stylesheet" href="css/print.css">
            <link rel="stylesheet" href="css/style.css">
            
            <!-- Thermal printer specific styles -->
            <style>
                /* Thermal printer optimization */
                body {
                    font-family: 'Courier New', monospace !important;
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                    width: 80mm !important;
                    margin: 0 auto !important;
                    padding: 5mm !important;
                    background: white !important;
                    color: black !important;
                }
                
                .receipt-container {
                    width: 100% !important;
                    max-width: 80mm !important;
                    margin: 0 auto !important;
                }
                
                .receipt-header {
                    text-align: center;
                    margin-bottom: 10px;
                    padding-bottom: 5px;
                    border-bottom: 1px dashed #000;
                }
                
                .business-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                }
                
                .business-info {
                    font-size: 10px;
                    margin-bottom: 5px;
                }
                
                .transaction-info {
                    margin: 8px 0;
                    display: flex;
                    justify-content: space-between;
                }
                
                .items-table {
                    width: 100%;
                    margin: 10px 0;
                    border-collapse: collapse;
                }
                
                .items-table td {
                    padding: 3px 0;
                    border-bottom: 1px dashed #ccc;
                    vertical-align: top;
                }
                
                .item-name {
                    width: 55%;
                }
                
                .item-qty {
                    width: 15%;
                    text-align: center;
                }
                
                .item-price {
                    width: 30%;
                    text-align: right;
                }
                
                .summary {
                    margin: 10px 0;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                }
                
                .total-row {
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px dashed #000;
                    font-size: 10px;
                }
                
                .thank-you {
                    margin: 10px 0;
                    text-align: center;
                    font-weight: bold;
                }
                
                .barcode {
                    text-align: center;
                    margin: 10px 0;
                    font-family: 'Courier New', monospace;
                }
                
                .divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                
                /* Print specific styles */
                @media print {
                    @page {
                        margin: 0;
                        padding: 0;
                        size: 80mm auto;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 5mm !important;
                        width: 80mm !important;
                        font-size: 10px !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .print-btn {
                        display: none !important;
                    }
                }
                
                /* Preview mode styles */
                .print-btn {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 20px;
                    background: #e63946;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .print-btn:hover {
                    background: #c1121f;
                }
                
                .receipt-preview {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="receipt-preview">
                    <!-- Header -->
                    <div class="receipt-header">
                        <div class="business-name">NYUMIL DIMSUM</div>
                        <div class="business-info">
                            Jl. Dimsum Lezat No. 123<br>
                            Telp: (021) 555-7890
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <!-- Transaction Info -->
                    <div class="transaction-info">
                        <div>
                            <div><strong>TRANSAKSI #${transaction.id}</strong></div>
                            <div>${transaction.date} ${formatTime(transaction.time)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div>Kasir: Admin</div>
                            <div>Total Item: ${totalItems}</div>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <!-- Items List -->
                    <table class="items-table">
                        <thead>
                            <tr>
                                <td class="item-name"><strong>ITEM</strong></td>
                                <td class="item-qty"><strong>QTY</strong></td>
                                <td class="item-price"><strong>HARGA</strong></td>
                            </tr>
                        </thead>
                        <tbody>
                            ${transaction.items.map(item => `
                                <tr>
                                    <td class="item-name">${item.name}</td>
                                    <td class="item-qty">${item.quantity}</td>
                                    <td class="item-price">${formatRupiah(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="divider"></div>
                    
                    <!-- Summary -->
                    <div class="summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>${formatRupiah(transaction.subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Total Item:</span>
                            <span>${totalItems} item</span>
                        </div>
                        <div class="summary-row total-row">
                            <span>TOTAL:</span>
                            <span>${formatRupiah(transaction.total)}</span>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <!-- Barcode -->
                    <div class="barcode">
                        <div style="font-family: monospace; font-size: 16px; letter-spacing: 2px;">
                            * ${transaction.id} *
                        </div>
                        <div style="font-size: 9px; margin-top: 2px;">
                            ID: ${transaction.id}
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        <div class="thank-you">TERIMA KASIH</div>
                        <div>Struk ini sebagai bukti pembayaran</div>
                        <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
                    </div>
                </div>
                
                <!-- Print Button -->
                <button class="print-btn" onclick="window.print();">
                    <i class="fas fa-print"></i> CETAK STRUK
                </button>
                
                <button class="print-btn" onclick="window.close();" style="background: #666;">
                    <i class="fas fa-times"></i> TUTUP
                </button>
            </div>
            
            <script>
                // Auto-print after 500ms if user doesn't cancel
                setTimeout(() => {
                    if (!window.printTriggered) {
                        window.print();
                        window.printTriggered = true;
                        
                        // Close window after printing (with delay for print dialog)
                        setTimeout(() => {
                            if (!window.closed) {
                                window.close();
                            }
                        }, 1000);
                    }
                }, 500);
                
                // Mark as printed when print dialog is opened
                window.onbeforeprint = function() {
                    window.printTriggered = true;
                };
            </script>
        </body>
        </html>
    `;
    
    // Write HTML to the new window
    printWindow.document.open();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Focus on the print window
    printWindow.focus();
}

// ===== INITIALIZATION =====
function initKasir() {
    console.log('🚀 initKasir() called');
    
    initCart();
    
    // Delay sedikit untuk memastikan DOM siap
    setTimeout(() => {
        renderProducts();
        
        // Setup event listeners untuk buttons
        const clearBtn = document.getElementById('clearBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', clearCart);
            console.log('✅ clearBtn event listener added');
        }
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkout);
            console.log('✅ checkoutBtn event listener added');
        }
        
        console.log('🎉 Kasir system initialized successfully');
    }, 100);
}
