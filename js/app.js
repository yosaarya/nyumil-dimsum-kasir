import kasir from './kasir.js';
import statistics from './statistik.js';
import { database } from './database.js';
import { showNotification } from './utils.js';

// ===== MAIN APPLICATION =====
class NyumilKasirApp {
    constructor() {
        this.currentTab = 'pos';
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
    }

    // Initialize Application
    async init() {
        if (this.isInitialized) return;

        try {
            // Initialize database
            await database.init();
            
            // Setup event listeners
            await this.setupEventListeners();
            
            // Initialize modules
            await kasir.init();
            await statistics.init();
            
            // Set initial tab
            this.switchTab('pos');
            
            // Check for updates
            this.checkForUpdates();
            
            this.isInitialized = true;
            console.log('Nyumil Kasir App initialized');
            
            // Show welcome notification
            setTimeout(() => {
                showNotification('Aplikasi Nyumil Dimsum Kasir siap digunakan!');
            }, 1000);
            
        } catch (error) {
            console.error('App initialization failed:', error);
            showNotification('Gagal menginisialisasi aplikasi', 'error');
        }
    }

    // Setup Event Listeners
    async setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Online/Offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            showNotification('Koneksi internet tersedia', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            showNotification('Tidak ada koneksi internet', 'warning');
        });

        // Before unload - save data
        window.addEventListener('beforeunload', (e) => {
            this.saveBeforeUnload();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // PWA install prompt
        this.setupPWAInstall();
    }

    // ===== TAB MANAGEMENT =====
    switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            }
        });

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            }
        });

        this.currentTab = tabId;

        // Load tab-specific data
        switch (tabId) {
            case 'stats':
                statistics.loadStatistics();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'products':
                this.loadProducts();
                break;
        }
    }

    // ===== HISTORY TAB =====
    async loadHistory() {
        const historyContainer = document.getElementById('historyTable');
        if (!historyContainer) return;

        try {
            const transactions = await database.getTransactions();
            
            if (transactions.length === 0) {
                historyContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Belum ada transaksi</p>
                    </div>
                `;
                return;
            }

            // Sort by date (newest first)
            transactions.sort((a, b) => {
                return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
            });

            const tableHTML = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Waktu</th>
                            <th>ID Transaksi</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(transaction => `
                            <tr>
                                <td>${transaction.date}</td>
                                <td>${transaction.time}</td>
                                <td>#${transaction.id}</td>
                                <td>
                                    <div class="transaction-items">
                                        ${transaction.items.map(item => 
                                            `${item.name} (${item.quantity})`
                                        ).join(', ')}
                                    </div>
                                    ${transaction.note ? `<div class="transaction-note">${transaction.note}</div>` : ''}
                                </td>
                                <td>${formatRupiah(transaction.total)}</td>
                                <td>
                                    <button class="btn-icon" onclick="app.viewTransaction(${transaction.id})" title="Lihat">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="app.reprintTransaction(${transaction.id})" title="Cetak Ulang">
                                        <i class="fas fa-print"></i>
                                    </button>
                                    <button class="btn-icon btn-danger" onclick="app.deleteTransaction(${transaction.id})" title="Hapus">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            historyContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error loading history:', error);
            historyContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Gagal memuat riwayat transaksi</p>
                </div>
            `;
        }
    }

    // ===== PRODUCTS TAB =====
    async loadProducts() {
        const productsContainer = document.getElementById('productsTable');
        if (!productsContainer) return;

        try {
            const products = await database.getProducts();
            
            const tableHTML = `
                <div class="products-header">
                    <h3>Daftar Produk</h3>
                    <button class="btn btn-primary" onclick="app.addProduct()">
                        <i class="fas fa-plus"></i> Tambah Produk
                    </button>
                </div>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Kategori</th>
                            <th>Harga</th>
                            <th>HPP</th>
                            <th>Stok</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>
                                    <div class="product-info">
                                        <i class="fas ${product.icon}"></i>
                                        <span>${product.name}</span>
                                    </div>
                                </td>
                                <td>${product.category}</td>
                                <td>${formatRupiah(product.price)}</td>
                                <td>${formatRupiah(product.cost)}</td>
                                <td>
                                    <span class="stock-badge ${product.stock <= 10 ? 'low' : ''}">
                                        ${product.stock || '∞'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="app.editProduct(${product.id})" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon btn-danger" onclick="app.deleteProduct(${product.id})" title="Hapus">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            productsContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error loading products:', error);
            productsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Gagal memuat daftar produk</p>
                </div>
            `;
        }
    }

    // ===== TRANSACTION FUNCTIONS =====
    async viewTransaction(transactionId) {
        try {
            const transaction = await database.getTransaction(transactionId);
            if (!transaction) {
                showNotification('Transaksi tidak ditemukan', 'error');
                return;
            }

            // Show transaction details in modal
            this.showTransactionModal(transaction);
        } catch (error) {
            showNotification('Gagal memuat transaksi', 'error');
        }
    }

    async reprintTransaction(transactionId) {
        try {
            const transaction = await database.getTransaction(transactionId);
            if (!transaction) {
                showNotification('Transaksi tidak ditemukan', 'error');
                return;
            }

            // Generate receipt
            const receiptContent = kasir.generateReceiptContent(transaction, transaction.change || 0);
            kasir.printReceipt(receiptContent);
            
            showNotification('Struk sedang dicetak ulang');
        } catch (error) {
            showNotification('Gagal mencetak ulang', 'error');
        }
    }

    async deleteTransaction(transactionId) {
        if (!confirm('Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        try {
            const success = await database.deleteTransaction(transactionId);
            if (success) {
                showNotification('Transaksi berhasil dihapus');
                this.loadHistory();
            } else {
                showNotification('Gagal menghapus transaksi', 'error');
            }
        } catch (error) {
            showNotification('Gagal menghapus transaksi', 'error');
        }
    }

    // ===== PRODUCT MANAGEMENT =====
    async addProduct() {
        // Show add product modal
        this.showProductModal();
    }

    async editProduct(productId) {
        try {
            const product = await database.getProduct(productId);
            if (!product) {
                showNotification('Produk tidak ditemukan', 'error');
                return;
            }

            // Show edit product modal
            this.showProductModal(product);
        } catch (error) {
            showNotification('Gagal memuat produk', 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Hapus produk ini? Produk yang sudah terjual tidak akan terpengaruh.')) {
            return;
        }

        try {
            const success = await database.deleteProduct(productId);
            if (success) {
                showNotification('Produk berhasil dihapus');
                this.loadProducts();
                kasir.renderProducts();
            } else {
                showNotification('Gagal menghapus produk', 'error');
            }
        } catch (error) {
            showNotification('Gagal menghapus produk', 'error');
        }
    }

    // ===== MODAL FUNCTIONS =====
    showTransactionModal(transaction) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        const itemsHTML = transaction.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatRupiah(item.price)}</td>
                <td>${formatRupiah(item.price * item.quantity)}</td>
            </tr>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detail Transaksi #${transaction.id}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="transaction-details">
                        <div class="detail-row">
                            <span>Tanggal:</span>
                            <span>${transaction.date} ${transaction.time}</span>
                        </div>
                        <div class="detail-row">
                            <span>Metode Pembayaran:</span>
                            <span>${transaction.paymentMethod?.toUpperCase() || 'TUNAI'}</span>
                        </div>
                        ${transaction.note ? `
                            <div class="detail-row">
                                <span>Catatan:</span>
                                <span>${transaction.note}</span>
                            </div>
                        ` : ''}
                        
                        <h3>Items:</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Qty</th>
                                    <th>Harga</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td><strong>${formatRupiah(transaction.total)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div class="summary">
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>${formatRupiah(transaction.subtotal)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Total:</span>
                                <span class="total">${formatRupiah(transaction.total)}</span>
                            </div>
                            ${transaction.cashAmount ? `
                                <div class="summary-row">
                                    <span>Bayar:</span>
                                    <span>${formatRupiah(transaction.cashAmount)}</span>
                                </div>
                                <div class="summary-row">
                                    <span>Kembali:</span>
                                    <span>${formatRupiah(transaction.change || 0)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Tutup</button>
                    <button class="btn btn-primary" onclick="app.reprintTransaction(${transaction.id})">Cetak Ulang</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal on X click
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showProductModal(product = null) {
        const isEdit = product !== null;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Tambah'} Produk</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="productForm">
                        <div class="form-group">
                            <label for="productName">Nama Produk *</label>
                            <input type="text" id="productName" class="form-control" 
                                   value="${product?.name || ''}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productPrice">Harga Jual (Rp) *</label>
                                <input type="number" id="productPrice" class="form-control" 
                                       value="${product?.price || ''}" required min="0">
                            </div>
                            <div class="form-group">
                                <label for="productCost">HPP (Rp) *</label>
                                <input type="number" id="productCost" class="form-control" 
                                       value="${product?.cost || ''}" required min="0">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productCategory">Kategori</label>
                                <select id="productCategory" class="form-control">
                                    <option value="paket" ${product?.category === 'paket' ? 'selected' : ''}>Paket</option>
                                    <option value="satuan" ${product?.category === 'satuan' ? 'selected' : ''}>Satuan</option>
                                    <option value="topping" ${product?.category === 'topping' ? 'selected' : ''}>Topping</option>
                                    <option value="saus" ${product?.category === 'saus' ? 'selected' : ''}>Saus</option>
                                    <option value="lainnya" ${!product?.category || ['paket', 'satuan', 'topping', 'saus'].includes(product?.category) ? '' : 'selected'}>Lainnya</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="productIcon">Icon</label>
                                <select id="productIcon" class="form-control">
                                    <option value="fa-drumstick-bite" ${product?.icon === 'fa-drumstick-bite' ? 'selected' : ''}>🍗 Dimsum</option>
                                    <option value="fa-cheese" ${product?.icon === 'fa-cheese' ? 'selected' : ''}>🧀 Keju</option>
                                    <option value="fa-fish" ${product?.icon === 'fa-fish' ? 'selected' : ''}>🐟 Ikan</option>
                                    <option value="fa-dumpling" ${product?.icon === 'fa-dumpling' ? 'selected' : ''}>🥟 Gyoza</option>
                                    <option value="fa-utensils" ${product?.icon === 'fa-utensils' ? 'selected' : ''}>🍴 Utensil</option>
                                    <option value="fa-wine-bottle" ${product?.icon === 'fa-wine-bottle' ? 'selected' : ''}>🍶 Saus</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="productStock">Stok Awal</label>
                            <input type="number" id="productStock" class="form-control" 
                                   value="${product?.stock || ''}" min="0">
                            <small class="form-text">Kosongkan untuk tidak menggunakan fitur stok</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="productDescription">Deskripsi</label>
                            <textarea id="productDescription" class="form-control" rows="3">${product?.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                    <button class="btn btn-primary" onclick="app.saveProduct(${product?.id || 'null'})">Simpan</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal on X click
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async saveProduct(productId = null) {
        const form = document.getElementById('productForm');
        if (!form || !form.checkValidity()) {
            showNotification('Harap isi semua bidang yang diperlukan', 'error');
            return;
        }

        const productData = {
            name: document.getElementById('productName').value.trim(),
            price: parseInt(document.getElementById('productPrice').value),
            cost: parseInt(document.getElementById('productCost').value),
            category: document.getElementById('productCategory').value,
            icon: document.getElementById('productIcon').value,
            description: document.getElementById('productDescription').value.trim(),
            stock: document.getElementById('productStock').value ? 
                   parseInt(document.getElementById('productStock').value) : undefined
        };

        // Validate
        if (productData.price < productData.cost) {
            showNotification('Harga jual harus lebih besar dari HPP', 'error');
            return;
        }

        try {
            let product;
            if (productId) {
                product = await database.updateProduct(productId, productData);
                showNotification('Produk berhasil diperbarui');
            } else {
                product = await database.addProduct(productData);
                showNotification('Produk berhasil ditambahkan');
            }

            // Close modal
            document.querySelector('.modal.active')?.remove();
            
            // Refresh product lists
            this.loadProducts();
            kasir.renderProducts();

        } catch (error) {
            showNotification('Gagal menyimpan produk', 'error');
        }
    }

    // ===== SETTINGS FUNCTIONS =====
    async showSettings() {
        const settings = await database.getSettings();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Pengaturan</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="settingsForm">
                        <div class="form-group">
                            <label for="businessName">Nama Usaha</label>
                            <input type="text" id="businessName" class="form-control" 
                                   value="${settings.businessName}">
                        </div>
                        
                        <div class="form-group">
                            <label for="businessAddress">Alamat</label>
                            <textarea id="businessAddress" class="form-control" rows="2">${settings.businessAddress}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="taxRate">Pajak (%)</label>
                                <input type="number" id="taxRate" class="form-control" 
                                       value="${settings.taxRate}" min="0" max="100" step="0.1">
                            </div>
                            <div class="form-group">
                                <label for="serviceCharge">Service Charge (%)</label>
                                <input type="number" id="serviceCharge" class="form-control" 
                                       value="${settings.serviceCharge}" min="0" max="100" step="0.1">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="receiptFooter">Footer Struk</label>
                            <textarea id="receiptFooter" class="form-control" rows="2">${settings.receiptFooter}</textarea>
                        </div>
                        
                        <div class="form-check">
                            <input type="checkbox" id="autoPrint" class="form-check-input" 
                                   ${settings.autoPrint ? 'checked' : ''}>
                            <label for="autoPrint" class="form-check-label">Cetak otomatis setelah transaksi</label>
                        </div>
                        
                        <div class="form-check">
                            <input type="checkbox" id="backupReminder" class="form-check-input" 
                                   ${settings.backupReminder ? 'checked' : ''}>
                            <label for="backupReminder" class="form-check-label">Ingatkan backup data</label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                    <button class="btn btn-primary" onclick="app.saveSettings()">Simpan</button>
                    <button class="btn btn-warning" onclick="app.resetSettings()">Reset</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async saveSettings() {
        const settings = {
            businessName: document.getElementById('businessName').value.trim(),
            businessAddress: document.getElementById('businessAddress').value.trim(),
            taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
            serviceCharge: parseFloat(document.getElementById('serviceCharge').value) || 0,
            receiptFooter: document.getElementById('receiptFooter').value.trim(),
            autoPrint: document.getElementById('autoPrint').checked,
            backupReminder: document.getElementById('backupReminder').checked
        };

        try {
            await database.updateSettings(settings);
            document.querySelector('.modal.active')?.remove();
            showNotification('Pengaturan berhasil disimpan');
        } catch (error) {
            showNotification('Gagal menyimpan pengaturan', 'error');
        }
    }

    async resetSettings() {
        if (!confirm('Reset semua pengaturan ke nilai default?')) {
            return;
        }

        try {
            await database.initializeSettings();
            document.querySelector('.modal.active')?.remove();
            showNotification('Pengaturan telah direset');
        } catch (error) {
            showNotification('Gagal mereset pengaturan', 'error');
        }
    }

    // ===== BACKUP FUNCTIONS =====
    async backupData() {
        try {
            const backup = await database.createBackup();
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nyumil-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Backup data berhasil!');
        } catch (error) {
            showNotification('Gagal membuat backup', 'error');
        }
    }

    async restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!confirm('Restore data dari backup? Data saat ini akan diganti.')) {
                return;
            }
            
            try {
                const text = await file.text();
                const backup = JSON.parse(text);
                
                const success = await database.restoreBackup(backup);
                if (success) {
                    showNotification('Data berhasil direstore!');
                    location.reload(); // Reload to apply changes
                } else {
                    showNotification('Gagal restore data', 'error');
                }
            } catch (error) {
                showNotification('File backup tidak valid', 'error');
            }
        };
        
        input.click();
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboardShortcuts(e) {
        // Only handle if not in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case '1':
            case 'F1':
                e.preventDefault();
                this.switchTab('pos');
                break;
                
            case '2':
            case 'F2':
                e.preventDefault();
                this.switchTab('stats');
                break;
                
            case '3':
            case 'F3':
                e.preventDefault();
                this.switchTab('history');
                break;
                
            case '4':
            case 'F4':
                e.preventDefault();
                this.switchTab('products');
                break;
                
            case 'F5':
                e.preventDefault();
                this.loadHistory();
                break;
                
            case 'F6':
                e.preventDefault();
                kasir.clearOrder();
                break;
                
            case 'F7':
                e.preventDefault();
                kasir.checkout();
                break;
                
            case 'F8':
                e.preventDefault();
                this.backupData();
                break;
                
            case 'F9':
                e.preventDefault();
                this.showSettings();
                break;
                
            case 'F12':
                e.preventDefault();
                // Do nothing - prevent dev tools
                break;
        }
    }

    // ===== PWA INSTALL =====
    setupPWAInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.createElement('button');
            installBtn.className = 'pwa-install-btn';
            installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
            installBtn.onclick = () => this.installPWA(deferredPrompt, installBtn);
            
            document.querySelector('.container')?.appendChild(installBtn);
        });
    }

    async installPWA(deferredPrompt, installBtn) {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            installBtn.remove();
            showNotification('Aplikasi berhasil diinstall!');
        }
        
        deferredPrompt = null;
    }

    // ===== UPDATE CHECK =====
    async checkForUpdates() {
        if (!this.isOnline) return;
        
        try {
            const response = await fetch('/version.json');
            const remoteVersion = await response.json();
            const localVersion = localStorage.getItem('app_version');
            
            if (remoteVersion.version !== localVersion) {
                this.showUpdateNotification(remoteVersion);
            }
        } catch (error) {
            // Silent fail - offline or no version file
        }
    }

    showUpdateNotification(version) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>Update tersedia (v${version.version})</span>
                <button class="btn btn-sm btn-primary" onclick="app.applyUpdate()">Update</button>
                <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.remove()">Nanti</button>
            </div>
        `;
        
        document.body.appendChild(notification);
    }

    applyUpdate() {
        localStorage.clear();
        location.reload();
    }

    // ===== UTILITY FUNCTIONS =====
    saveBeforeUnload() {
        // Save any pending data
        database.saveToLocalStorage();
    }

    getAppInfo() {
        return {
            name: 'Nyumil Dimsum Kasir',
            version: '1.0.0',
            database: {
                transactions: database.transactions.length,
                products: database.products.length,
                stats: Object.keys(database.dailyStats).length
            },
            settings: database.settings
        };
    }

    // ===== ERROR HANDLING =====
    setupErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('Global error:', { message, source, lineno, colno, error });
            showNotification('Terjadi kesalahan', 'error');
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showNotification('Terjadi kesalahan sistem', 'error');
        });
    }
}

// ===== GLOBAL FUNCTIONS =====
// Make app functions available globally for onclick handlers
window.app = new NyumilKasirApp();

// Helper function for formatting
window.formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});

// Export app instance
export default window.app;
