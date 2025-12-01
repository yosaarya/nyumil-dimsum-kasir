import { formatRupiah, getToday, calculateTotal, calculateTotalCost } from './utils.js';

// ===== DATABASE CONFIGURATION =====
const DB_CONFIG = {
    name: 'nyumil_dimsum_db',
    version: 1,
    stores: {
        transactions: '++id, date, total, profit',
        products: '++id, name, price, cost, category',
        stats: 'date, revenue, transactions, itemsSold, profit',
        settings: 'key, value'
    }
};

// ===== PRODUCTS DATA =====
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Dimsum Ori Mentai (Small 3pcs)", price: 18000, cost: 10000, icon: "fa-drumstick-bite", category: "paket", description: "Dimsum 3 + Saus Mentai + Topping + Packaging", stock: 100 },
    { id: 2, name: "Dimsum Ori Mentai (Medium 6pcs)", price: 28000, cost: 15000, icon: "fa-drumstick-bite", category: "paket", description: "Dimsum 6 + Saus Mentai + Topping + Packaging", stock: 100 },
    { id: 3, name: "Dimsum Ori Mentai (Large 16pcs)", price: 75000, cost: 40000, icon: "fa-drumstick-bite", category: "paket", description: "Dimsum 16 + Saus Mentai + Topping + Packaging", stock: 100 },
    { id: 4, name: "Dimmoza Mentai (Small 3pcs)", price: 21000, cost: 11500, icon: "fa-cheese", category: "paket", description: "DSM + Mozzarella", stock: 100 },
    { id: 5, name: "Dimsum Mentai Cheesy (Small 3pcs)", price: 21000, cost: 11500, icon: "fa-cheese", category: "paket", description: "DSM + Mozzarella", stock: 100 },
    { id: 6, name: "Dimsum Mentai Double Cheesy (Small 3pcs)", price: 24000, cost: 13000, icon: "fa-cheese", category: "paket", description: "DSM + Double Mozzarella", stock: 100 },
    { id: 7, name: "Dimsum Mentai Tobiko Cheesy (Small 3pcs)", price: 23000, cost: 12500, icon: "fa-fish", category: "paket", description: "DSM + Mozza + Tobiko", stock: 100 },
    { id: 8, name: "Gyoza Mentai (Small 5pcs)", price: 18000, cost: 10000, icon: "fa-dumpling", category: "paket", description: "Gyoza 5 + Saus Mentai + Topping + Packaging", stock: 100 },
    { id: 9, name: "Gyoza Mentai (Medium 8pcs)", price: 24000, cost: 13000, icon: "fa-dumpling", category: "paket", description: "Gyoza 8 + Saus Mentai + Topping + Packaging", stock: 100 },
    { id: 10, name: "Dimsum Ori (Satuan)", price: 3000, cost: 1500, icon: "fa-utensils", category: "satuan", description: "", stock: 1000 },
    { id: 11, name: "Dimmoza (Satuan)", price: 4000, cost: 2000, icon: "fa-cheese", category: "satuan", description: "", stock: 1000 },
    { id: 12, name: "Gyoza (Satuan)", price: 2000, cost: 1000, icon: "fa-dumpling", category: "satuan", description: "", stock: 1000 },
    { id: 13, name: "Mozzarella", price: 1000, cost: 500, icon: "fa-cheese", category: "topping", description: "", stock: 1000 },
    { id: 14, name: "Tobiko", price: 3000, cost: 1500, icon: "fa-fish", category: "topping", description: "", stock: 500 },
    { id: 15, name: "Creamy Bolognese 50ml", price: 7000, cost: 3500, icon: "fa-wine-bottle", category: "saus", description: "", stock: 200 },
    { id: 16, name: "Creamy Bolognese 80ml", price: 10000, cost: 5000, icon: "fa-wine-bottle", category: "saus", description: "", stock: 200 }
];

// ===== DATABASE FUNCTIONS =====
class Database {
    constructor() {
        this.db = null;
        this.products = [];
        this.transactions = [];
        this.dailyStats = {};
        this.settings = {};
        this.orderCounter = 1000;
    }

    // Initialize Database
    async init() {
        try {
            await this.loadFromLocalStorage();
            await this.initializeProducts();
            await this.initializeSettings();
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            return false;
        }
    }

    // Load from LocalStorage
    async loadFromLocalStorage() {
        try {
            // Load transactions
            const transactionsJson = localStorage.getItem('nyumil_transactions');
            this.transactions = transactionsJson ? JSON.parse(transactionsJson) : [];

            // Load daily stats
            const statsJson = localStorage.getItem('nyumil_dailyStats');
            this.dailyStats = statsJson ? JSON.parse(statsJson) : {};

            // Load settings
            const settingsJson = localStorage.getItem('nyumil_settings');
            this.settings = settingsJson ? JSON.parse(settingsJson) : {};

            // Load products
            const productsJson = localStorage.getItem('nyumil_products');
            this.products = productsJson ? JSON.parse(productsJson) : [];

            // Load order counter
            const counter = localStorage.getItem('nyumil_orderCounter');
            this.orderCounter = counter ? parseInt(counter) : 1000;

            return true;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return false;
        }
    }

    // Save to LocalStorage
    async saveToLocalStorage() {
        try {
            localStorage.setItem('nyumil_transactions', JSON.stringify(this.transactions));
            localStorage.setItem('nyumil_dailyStats', JSON.stringify(this.dailyStats));
            localStorage.setItem('nyumil_settings', JSON.stringify(this.settings));
            localStorage.setItem('nyumil_products', JSON.stringify(this.products));
            localStorage.setItem('nyumil_orderCounter', this.orderCounter.toString());
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Initialize Products
    async initializeProducts() {
        if (this.products.length === 0) {
            this.products = [...DEFAULT_PRODUCTS];
            await this.saveToLocalStorage();
        }
    }

    // Initialize Settings
    async initializeSettings() {
        if (Object.keys(this.settings).length === 0) {
            this.settings = {
                businessName: 'Nyumil Dimsum',
                businessAddress: 'Jl. Dimsum Lezat No. 123',
                businessPhone: '(021) 555-7890',
                taxRate: 0,
                serviceCharge: 0,
                receiptFooter: 'Terima kasih atas pesanannya!',
                autoPrint: false,
                backupReminder: true
            };
            await this.saveToLocalStorage();
        }
    }

    // ===== PRODUCT CRUD =====
    async getProducts() {
        return this.products;
    }

    async getProduct(id) {
        return this.products.find(product => product.id === id);
    }

    async addProduct(product) {
        const newProduct = {
            ...product,
            id: this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1
        };
        this.products.push(newProduct);
        await this.saveToLocalStorage();
        return newProduct;
    }

    async updateProduct(id, updates) {
        const index = this.products.findIndex(product => product.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            await this.saveToLocalStorage();
            return this.products[index];
        }
        return null;
    }

    async deleteProduct(id) {
        const index = this.products.findIndex(product => product.id === id);
        if (index !== -1) {
            this.products.splice(index, 1);
            await this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // ===== TRANSACTION CRUD =====
    async getTransactions(dateFilter = null) {
        if (dateFilter) {
            return this.transactions.filter(transaction => transaction.date === dateFilter);
        }
        return this.transactions;
    }

    async getTransaction(id) {
        return this.transactions.find(transaction => transaction.id === id);
    }

    async addTransaction(transactionData) {
        const today = getToday();
        const transaction = {
            id: this.orderCounter++,
            date: today,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            ...transactionData,
            items: transactionData.items.map(item => ({
                ...item,
                total: item.price * item.quantity,
                profit: (item.price - item.cost) * item.quantity
            })),
            subtotal: calculateTotal(transactionData.items),
            total: calculateTotal(transactionData.items),
            profit: calculateTotalProfit(transactionData.items)
        };

        this.transactions.push(transaction);

        // Update daily stats
        if (!this.dailyStats[today]) {
            this.dailyStats[today] = {
                revenue: 0,
                transactions: 0,
                itemsSold: 0,
                profit: 0,
                items: {}
            };
        }

        this.dailyStats[today].revenue += transaction.total;
        this.dailyStats[today].transactions += 1;
        this.dailyStats[today].profit += transaction.profit;

        // Update product stats
        transaction.items.forEach(item => {
            this.dailyStats[today].itemsSold += item.quantity;

            if (!this.dailyStats[today].items[item.id]) {
                this.dailyStats[today].items[item.id] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0,
                    profit: 0
                };
            }

            this.dailyStats[today].items[item.id].quantity += item.quantity;
            this.dailyStats[today].items[item.id].revenue += item.price * item.quantity;
            this.dailyStats[today].items[item.id].profit += (item.price - item.cost) * item.quantity;

            // Update product stock
            const product = this.products.find(p => p.id === item.id);
            if (product && product.stock !== undefined) {
                product.stock -= item.quantity;
            }
        });

        await this.saveToLocalStorage();
        return transaction;
    }

    async deleteTransaction(id) {
        const index = this.transactions.findIndex(transaction => transaction.id === id);
        if (index !== -1) {
            const transaction = this.transactions[index];
            
            // Reverse stats update
            if (this.dailyStats[transaction.date]) {
                this.dailyStats[transaction.date].revenue -= transaction.total;
                this.dailyStats[transaction.date].transactions -= 1;
                this.dailyStats[transaction.date].profit -= transaction.profit;

                // Reverse product stats
                transaction.items.forEach(item => {
                    this.dailyStats[transaction.date].itemsSold -= item.quantity;
                    
                    if (this.dailyStats[transaction.date].items[item.id]) {
                        this.dailyStats[transaction.date].items[item.id].quantity -= item.quantity;
                        this.dailyStats[transaction.date].items[item.id].revenue -= item.price * item.quantity;
                        this.dailyStats[transaction.date].items[item.id].profit -= (item.price - item.cost) * item.quantity;
                    }

                    // Restore product stock
                    const product = this.products.find(p => p.id === item.id);
                    if (product && product.stock !== undefined) {
                        product.stock += item.quantity;
                    }
                });
            }

            this.transactions.splice(index, 1);
            await this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // ===== STATISTICS FUNCTIONS =====
    async getDailyStats(date) {
        return this.dailyStats[date] || {
            revenue: 0,
            transactions: 0,
            itemsSold: 0,
            profit: 0,
            items: {}
        };
    }

    async getStatsByDateRange(startDate, endDate) {
        const stats = {
            revenue: 0,
            transactions: 0,
            itemsSold: 0,
            profit: 0,
            items: {}
        };

        Object.entries(this.dailyStats).forEach(([date, dayStats]) => {
            if (date >= startDate && date <= endDate) {
                stats.revenue += dayStats.revenue;
                stats.transactions += dayStats.transactions;
                stats.itemsSold += dayStats.itemsSold;
                stats.profit += dayStats.profit;

                // Merge item stats
                Object.entries(dayStats.items).forEach(([id, itemStats]) => {
                    if (!stats.items[id]) {
                        stats.items[id] = { ...itemStats };
                    } else {
                        stats.items[id].quantity += itemStats.quantity;
                        stats.items[id].revenue += itemStats.revenue;
                        stats.items[id].profit += itemStats.profit;
                    }
                });
            }
        });

        return stats;
    }

    async getBestSellingProducts(limit = 5) {
        const allItems = {};
        
        Object.values(this.dailyStats).forEach(dayStats => {
            Object.entries(dayStats.items).forEach(([id, itemStats]) => {
                if (!allItems[id]) {
                    allItems[id] = { ...itemStats };
                } else {
                    allItems[id].quantity += itemStats.quantity;
                    allItems[id].revenue += itemStats.revenue;
                    allItems[id].profit += itemStats.profit;
                }
            });
        });

        return Object.values(allItems)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }

    // ===== SETTINGS FUNCTIONS =====
    async getSettings() {
        return this.settings;
    }

    async getSetting(key) {
        return this.settings[key];
    }

    async updateSettings(updates) {
        this.settings = { ...this.settings, ...updates };
        await this.saveToLocalStorage();
        return this.settings;
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        await this.saveToLocalStorage();
        return value;
    }

    // ===== BACKUP & RESTORE =====
    async createBackup() {
        return {
            transactions: this.transactions,
            dailyStats: this.dailyStats,
            products: this.products,
            settings: this.settings,
            orderCounter: this.orderCounter,
            backupDate: new Date().toISOString()
        };
    }

    async restoreBackup(backupData) {
        try {
            this.transactions = backupData.transactions || [];
            this.dailyStats = backupData.dailyStats || {};
            this.products = backupData.products || [];
            this.settings = backupData.settings || {};
            this.orderCounter = backupData.orderCounter || 1000;
            
            await this.saveToLocalStorage();
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    async exportToCSV(type = 'transactions') {
        let csv = '';
        
        switch (type) {
            case 'transactions':
                csv = this.exportTransactionsToCSV();
                break;
            case 'products':
                csv = this.exportProductsToCSV();
                break;
            case 'stats':
                csv = this.exportStatsToCSV();
                break;
            default:
                csv = this.exportAllToCSV();
        }
        
        return csv;
    }

    exportTransactionsToCSV() {
        const headers = ['ID', 'Tanggal', 'Waktu', 'Items', 'Subtotal', 'Total', 'Laba', 'Catatan'];
        const rows = this.transactions.map(transaction => [
            transaction.id,
            transaction.date,
            transaction.time,
            transaction.items.map(item => `${item.name} (${item.quantity})`).join('; '),
            formatRupiah(transaction.subtotal),
            formatRupiah(transaction.total),
            formatRupiah(transaction.profit),
            transaction.note || ''
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    exportProductsToCSV() {
        const headers = ['ID', 'Nama', 'Kategori', 'Harga', 'HPP', 'Stok', 'Deskripsi'];
        const rows = this.products.map(product => [
            product.id,
            product.name,
            product.category,
            product.price,
            product.cost,
            product.stock || 0,
            product.description || ''
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    exportStatsToCSV() {
        const headers = ['Tanggal', 'Pendapatan', 'Transaksi', 'Item Terjual', 'Laba'];
        const rows = Object.entries(this.dailyStats).map(([date, stats]) => [
            date,
            stats.revenue,
            stats.transactions,
            stats.itemsSold,
            stats.profit
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    exportAllToCSV() {
        const transactions = this.exportTransactionsToCSV();
        const products = this.exportProductsToCSV();
        const stats = this.exportStatsToCSV();
        
        return `=== TRANSAKSI ===\n${transactions}\n\n=== PRODUK ===\n${products}\n\n=== STATISTIK ===\n${stats}`;
    }

    // ===== CLEANUP FUNCTIONS =====
    async clearAllData() {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
            this.transactions = [];
            this.dailyStats = {};
            this.orderCounter = 1000;
            
            await this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    async clearOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        // Filter transactions
        this.transactions = this.transactions.filter(transaction => transaction.date >= cutoffDateStr);

        // Filter daily stats
        const filteredStats = {};
        Object.entries(this.dailyStats).forEach(([date, stats]) => {
            if (date >= cutoffDateStr) {
                filteredStats[date] = stats;
            }
        });
        this.dailyStats = filteredStats;

        await this.saveToLocalStorage();
        return true;
    }

    // ===== VALIDATION FUNCTIONS =====
    validateProduct(product) {
        const errors = [];
        
        if (!product.name || product.name.trim() === '') {
            errors.push('Nama produk harus diisi');
        }
        
        if (!product.price || product.price <= 0) {
            errors.push('Harga produk harus lebih dari 0');
        }
        
        if (!product.cost || product.cost < 0) {
            errors.push('HPP produk tidak boleh negatif');
        }
        
        if (product.price < product.cost) {
            errors.push('Harga jual harus lebih besar dari HPP');
        }
        
        return errors;
    }

    validateTransaction(transaction) {
        const errors = [];
        
        if (!transaction.items || transaction.items.length === 0) {
            errors.push('Transaksi harus memiliki minimal 1 item');
        }
        
        transaction.items.forEach((item, index) => {
            if (!item.id || !item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Jumlah harus lebih dari 0`);
            }
        });
        
        return errors;
    }
}

// Create singleton instance
const database = new Database();

// Export functions
export {
    database,
    DEFAULT_PRODUCTS
};
