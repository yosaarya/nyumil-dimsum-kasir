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

        // ===== Tambahkan baris ini di bagian PALING AKHIR file kasir.js =====
export default new Kasir();

