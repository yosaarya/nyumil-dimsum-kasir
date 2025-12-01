// ===== UTILITY FUNCTIONS =====

// Format Currency (Rupiah)
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format Date
export function formatDate(date, withTime = false) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    
    if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('id-ID', options);
}

// Get Today's Date
export function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Get Current Time
export function getCurrentTime() {
    return new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Show Notification
export function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

// Confirm Dialog
export function confirmDialog(message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelBtn">Batal</button>
                    <button class="btn btn-danger" id="confirmBtn">Ya</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
        
        modal.querySelector('#confirmBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(true);
        });
    });
}

// Debounce Function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate Unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calculate Profit
export function calculateProfit(price, cost, quantity = 1) {
    return (price - cost) * quantity;
}

// Calculate Total
export function calculateTotal(items) {
    return items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Calculate Total Cost
export function calculateTotalCost(items) {
    return items.reduce((total, item) => {
        return total + (item.cost * item.quantity);
    }, 0);
}

// Calculate Total Profit
export function calculateTotalProfit(items) {
    return items.reduce((total, item) => {
        return total + ((item.price - item.cost) * item.quantity);
    }, 0);
}

// Validate Email
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Phone Number
export function isValidPhone(phone) {
    const re = /^[0-9]{10,13}$/;
    return re.test(phone);
}

// Format Phone Number
export function formatPhone(phone) {
    return phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

// Get Query Parameter
export function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Set Query Parameter
export function setQueryParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// Remove Query Parameter
export function removeQueryParam(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.pushState({}, '', url);
}

// Copy to Clipboard
export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch(() => false);
}

// Download File
export function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Read File
export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Parse CSV
export function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentline = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j].trim()] = currentline[j] ? currentline[j].trim() : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

// Export to CSV
export function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    downloadFile(filename, csv, 'text/csv');
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => 
            JSON.stringify(row[header] || '')
        ).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

// Group By
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

// Sort By
export function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// Filter Array
export function filterArray(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (Array.isArray(value)) {
                return value.includes(item[key]);
            }
            return item[key] === value;
        });
    });
}

// Calculate Average
export function calculateAverage(array, key) {
    if (array.length === 0) return 0;
    const sum = array.reduce((total, item) => total + (item[key] || 0), 0);
    return sum / array.length;
}

// Calculate Sum
export function calculateSum(array, key) {
    return array.reduce((total, item) => total + (item[key] || 0), 0);
}

// Calculate Percentage
export function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
}

// Generate Random Color
export function generateRandomColor() {
    const colors = [
        '#e63946', '#457b9d', '#2a9d8f', 
        '#e9c46a', '#f4a261', '#9d4edd',
        '#ff6b6b', '#48cae4', '#52b788'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Format Number with Commas
export function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Truncate Text
export function truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Get File Extension
export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Is Image File
export function isImageFile(filename) {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return extensions.includes(getFileExtension(filename));
}

// Is PDF File
export function isPDFFile(filename) {
    return getFileExtension(filename) === 'pdf';
}

// Is Excel File
export function isExcelFile(filename) {
    const extensions = ['xls', 'xlsx', 'csv'];
    return extensions.includes(getFileExtension(filename));
}

// Delay Function
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry Function
export async function retry(fn, retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await delay(delayMs);
        }
    }
}

// Throttle Function
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
