import { database } from './database.js';
import { formatRupiah, showNotification, calculateTotal, calculateTotalProfit } from './utils.js';

// ===== KASIR STATE =====
class Kasir {
    constructor() {
        this.currentOrder = [];
        this.orderNote = '';
        this.selectedCategory = 'all';
        this.isInitialized = false;
    }

    // Initialize Kasir
    async init() {
        if (this.isInitialized) return;
        
        await this.setupEventListeners();
        await this.renderCategories();
        await this.renderProducts();
        
        this.isInitialized = true;
        console.log('Kasir initialized');
    }

    // Setup Event Listeners
    async setupEventListeners() {
        // Category buttons
        document.getElementById('productCategories')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.selectCategory(e.target.dataset.category);
            }
        });

        // Order actions
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearOrder());
        document.getElementById('checkoutBtn')?.addEventListener('click', () => this.checkout());
        
        // Print receipt
        document.getElementById('printReceiptBtn')?.addEventListener('click', () => this.printReceipt());
    }

    // ===== CATEGORY FUNCTIONS =====
    async renderCategories() {
        const categoriesContainer = document.getElementById('productCategories');
        if (!categoriesContainer) return;

        const products = await database.getProducts();
        const categories = ['all', ...new Set(products.map(p => p.category))];
        
        categoriesContainer.innerHTML = categories.map(category => `
            <button class="category-btn ${category === this.selectedCategory ? 'active' : ''}" 
                    data-category="${category}">
                ${this.getCategoryLabel(category)}
            </button>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'all': 'Semua',
            'paket': 'Paket',
            'satuan': 'Satuan',
            'topping': 'Topping',
            'saus': 'Saus'
        };
        return labels[category] || category;
    }

    selectCategory(category) {
        this.selectedCategory = category;
        this.renderCategories();
        this.renderProducts();
    }

    // ===== PRODUCT FUNCTIONS =====
    async renderProducts() {
        const productsGrid = document.getElementById('menuGrid');
        if (!productsGrid) return;

        const products = await database.getProducts();
        const filteredProducts = this.selectedCategory === 'all' 
            ? products 
            : products.filter(p => p.category === this.selectedCategory);

        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="menu-item" data-id="${product.id}">
                <div class="menu-icon">
                    <i class="fas ${product.icon}"></i>
                </div>
                <div class="menu-name">${product.name}</div>
                <div class="menu-price">${formatRupiah(product.price)}</div>
                ${product.stock !== undefined ? `
                    <div class="menu-stock ${product.stock <= 10 ? 'low-stock' : ''}">
                        Stok: ${product.stock}
                    </div>
                ` : ''}
                <div class="menu-cost">HPP: ${formatRupiah(product.cost)}</div>
            </div>
        `).join('');

        // Add click event to products
        productsGrid.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                this.addToOrder(productId);
            });
        });
    }

    // ===== ORDER FUNCTIONS =====
    async addToOrder(productId, quantity = 1) {
        const product = await database.getProduct(productId);
        if (!product) {
            showNotification('Produk tidak ditemukan', 'error');
            return;
        }

        // Check stock
        if (product.stock !== undefined && product.stock < quantity) {
            showNotification(`Stok ${product.name} tidak mencukupi!`, 'error');
            return;
        }

        const existingItem = this.currentOrder.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.currentOrder.push({
                ...product,
                quantity: quantity
            });
        }

        this.updateOrderDisplay();
        showNotification(`${product.name} ditambahkan ke pesanan`);
    }

    updateOrderDisplay() {
        const orderList = document.getElementById('orderList');
        const emptyOrder = document.getElementById('emptyOrder');
        const orderCount = document.getElementById('orderCount');
        const subtotalAmount = document.getElementById('subtotalAmount');
        const totalAmount = document.getElementById('totalAmount');

        if (!orderList || !emptyOrder) return;

        // Clear order list
        orderList.innerHTML = '';

        if (this.currentOrder.length === 0) {
            emptyOrder.style.display = 'flex';
            orderList.appendChild(emptyOrder);
            orderCount.textContent = '0';
            subtotalAmount.textContent = formatRupiah(0);
            totalAmount.textContent = formatRupiah(0);
            return;
        }

        emptyOrder.style.display = 'none';

        let subtotal = 0;
        let totalItems = 0;

        // Render order items
        this.currentOrder.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            totalItems += item.quantity;

            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        <span>${formatRupiah(item.price)} × ${item.quantity}</span>
                        <span>${formatRupiah(itemTotal)}</span>
                    </div>
                </div>
                <div class="item-controls">
                    <button class="qty-btn decrease" data-index="${index}">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn increase" data-index="${index}">+</button>
                </div>
                <div class="item-total">${formatRupiah(itemTotal)}</div>
            `;

            orderList.appendChild(orderItem);
        });

        // Add event listeners for quantity controls
        orderList.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const isIncrease = e.target.classList.contains('increase');
                this.updateQuantity(index, isIncrease ? 1 : -1);
            });
        });

        // Update summary
        orderCount.textContent = totalItems.toString();
        subtotalAmount.textContent = formatR

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

        // ===== Tambahkan baris ini di bagian PALING AKHIR file kasir.js =====
export default new Kasir();

