// chart.js - Fungsi untuk membuat diagram dan grafik

import { database } from './database.js';
import { formatRupiah, formatDate, getToday } from './utils.js';

// ===== CHART MANAGER =====
class ChartManager {
    constructor() {
        this.charts = new Map(); // Store chart instances
    }
    
    // Initialize all charts
    async init() {
        await this.initSalesChart();
        await this.initProductChart();
        await this.initHourlyChart();
        await this.initCategoryChart();
    }
    
    // ===== SALES CHART (Pendapatan) =====
    async initSalesChart() {
        const ctx = document.getElementById('salesChart')?.getContext('2d');
        if (!ctx) return;
        
        const data = await this.getSalesData(7); // 7 days
        
        if (this.charts.has('sales')) {
            this.charts.get('sales').destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: data.revenues,
                        borderColor: '#e63946',
                        backgroundColor: 'rgba(230, 57, 70, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Laba',
                        data: data.profits,
                        borderColor: '#2a9d8f',
                        backgroundColor: 'rgba(42, 157, 143, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatRupiah(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                                }
                                if (value >= 1000) {
                                    return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
                                }
                                return 'Rp' + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Jumlah (Rp)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tanggal'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        this.charts.set('sales', chart);
    }
    
    async getSalesData(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        
        const labels = [];
        const revenues = [];
        const profits = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = formatDate(date);
            
            const stats = await database.getDailyStats(dateStr);
            
            // Format label (DD/MM)
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            labels.push(`${day}/${month}`);
            
            revenues.push(stats.revenue);
            profits.push(stats.profit);
        }
        
        return { labels, revenues, profits };
    }
    
    // ===== PRODUCT CHART (Produk Terlaris) =====
    async initProductChart() {
        const ctx = document.getElementById('productChart')?.getContext('2d');
        if (!ctx) return;
        
        const data = await this.getProductData(5); // Top 5 products
        
        if (data.labels.length === 0) {
            ctx.canvas.style.display = 'none';
            return;
        }
        
        ctx.canvas.style.display = 'block';
        
        if (this.charts.has('product')) {
            this.charts.get('product').destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Jumlah Terjual',
                    data: data.quantities,
                    backgroundColor: [
                        'rgba(230, 57, 70, 0.7)',
                        'rgba(69, 123, 157, 0.7)',
                        'rgba(42, 157, 143, 0.7)',
                        'rgba(233, 196, 106, 0.7)',
                        'rgba(244, 162, 97, 0.7)'
                    ],
                    borderColor: [
                        '#e63946',
                        '#457b9d',
                        '#2a9d8f',
                        '#e9c46a',
                        '#f4a261'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Terjual: ${context.raw} pcs`;
                            },
                            afterLabel: function(context) {
                                const revenue = data.revenues[context.dataIndex];
                                const profit = data.profits[context.dataIndex];
                                return [
                                    `Pendapatan: ${formatRupiah(revenue)}`,
                                    `Laba: ${formatRupiah(profit)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Jumlah Terjual (pcs)'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Produk'
                        }
                    }
                }
            }
        });
        
        this.charts.set('product', chart);
    }
    
    async getProductData(limit = 5) {
        const bestSellers = await database.getBestSellingProducts(limit);
        
        return {
            labels: bestSellers.map(p => this.truncateText(p.name, 15)),
            quantities: bestSellers.map(p => p.quantity),
            revenues: bestSellers.map(p => p.revenue),
            profits: bestSellers.map(p => p.profit)
        };
    }
    
    // ===== HOURLY CHART (Per Jam) =====
    async initHourlyChart() {
        const ctx = document.getElementById('hourlyChart')?.getContext('2d');
        if (!ctx) return;
        
        const data = await this.getHourlyData();
        
        if (this.charts.has('hourly')) {
            this.charts.get('hourly').destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Pendapatan per Jam',
                    data: data.revenues,
                    backgroundColor: 'rgba(233, 196, 106, 0.5)',
                    borderColor: '#e9c46a',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Pendapatan: ${formatRupiah(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                                }
                                if (value >= 1000) {
                                    return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
                                }
                                return 'Rp' + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Pendapatan (Rp)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Jam'
                        }
                    }
                }
            }
        });
        
        this.charts.set('hourly', chart);
    }
    
    async getHourlyData() {
        const today = getToday();
        const transactions = await database.getTransactions(today);
        
        // Initialize hourly data (0-23)
        const hourlyRevenue = new Array(24).fill(0);
        const hourlyTransactions = new Array(24).fill(0);
        
        transactions.forEach(transaction => {
            const hour = parseInt(transaction.time.split(':')[0]);
            hourlyRevenue[hour] += transaction.total;
            hourlyTransactions[hour] += 1;
        });
        
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        
        return {
            labels,
            revenues: hourlyRevenue,
            transactions: hourlyTransactions
        };
    }
    
    // ===== CATEGORY CHART (Per Kategori) =====
    async initCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;
        
        const data = await this.getCategoryData();
        
        if (this.charts.has('category')) {
            this.charts.get('category').destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(230, 57, 70, 0.7)',
                        'rgba(69, 123, 157, 0.7)',
                        'rgba(42, 157, 143, 0.7)',
                        'rgba(233, 196, 106, 0.7)',
                        'rgba(244, 162, 97, 0.7)',
                        'rgba(157, 78, 221, 0.7)'
                    ],
                    borderColor: [
                        '#e63946',
                        '#457b9d',
                        '#2a9d8f',
                        '#e9c46a',
                        '#f4a261',
                        '#9d4edd'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} pcs (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        this.charts.set('category', chart);
    }
    
    async getCategoryData() {
        const products = await database.getProducts();
        const stats = await database.getStatsByDateRange(
            getToday(),
            getToday()
        );
        
        const categoryData = {};
        
        // Initialize categories
        const categories = ['paket', 'satuan', 'topping', 'saus'];
        categories.forEach(cat => categoryData[cat] = 0);
        
        // Count items by category
        Object.values(stats.items).forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product && product.category) {
                if (!categoryData[product.category]) {
                    categoryData[product.category] = 0;
                }
                categoryData[product.category] += item.quantity;
            }
        });
        
        const labels = [];
        const values = [];
        
        Object.entries(categoryData).forEach(([category, quantity]) => {
            if (quantity > 0) {
                labels.push(this.getCategoryLabel(category));
                values.push(quantity);
            }
        });
        
        return { labels, values };
    }
    
    // ===== UTILITY FUNCTIONS =====
    getCategoryLabel(category) {
        const labels = {
            'paket': 'Paket',
            'satuan': 'Satuan',
            'topping': 'Topping',
            'saus': 'Saus',
            'minuman': 'Minuman',
            'lainnya': 'Lainnya'
        };
        return labels[category] || category;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    // ===== UPDATE FUNCTIONS =====
    async updateAllCharts() {
        await this.updateSalesChart();
        await this.updateProductChart();
        await this.updateHourlyChart();
        await this.updateCategoryChart();
    }
    
    async updateSalesChart() {
        if (!this.charts.has('sales')) return;
        
        const data = await this.getSalesData(7);
        const chart = this.charts.get('sales');
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.revenues;
        chart.data.datasets[1].data = data.profits;
        chart.update();
    }
    
    async updateProductChart() {
        if (!this.charts.has('product')) return;
        
        const data = await this.getProductData(5);
        const chart = this.charts.get('product');
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.quantities;
        chart.update();
    }
    
    async updateHourlyChart() {
        if (!this.charts.has('hourly')) return;
        
        const data = await this.getHourlyData();
        const chart = this.charts.get('hourly');
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.revenues;
        chart.update();
    }
    
    async updateCategoryChart() {
        if (!this.charts.has('category')) return;
        
        const data = await this.getCategoryData();
        const chart = this.charts.get('category');
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update();
    }
    
    // ===== EXPORT FUNCTIONS =====
    exportChartAsImage(chartId, filename = 'chart') {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = `${filename}-${getToday()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    exportAllCharts() {
        this.charts.forEach((chart, key) => {
            this.exportChartAsImage(chart.canvas.id, key);
        });
    }
    
    // ===== DESTROY FUNCTIONS =====
    destroyAllCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
    
    destroyChart(chartId) {
        if (this.charts.has(chartId)) {
            this.charts.get(chartId).destroy();
            this.charts.delete(chartId);
        }
    }
    
    // ===== CHART DATA FOR TABLES =====
    async getChartDataForTable(chartType) {
        switch (chartType) {
            case 'sales':
                return await this.getSalesData(7);
            case 'product':
                return await this.getProductData(5);
            case 'hourly':
                return await this.getHourlyData();
            case 'category':
                return await this.getCategoryData();
            default:
                return null;
        }
    }
    
    generateTableFromChartData(chartType, data) {
        if (!data) return '';
        
        let table = '<table class="chart-data-table">';
        
        switch (chartType) {
            case 'sales':
                table += '<tr><th>Tanggal</th><th>Pendapatan</th><th>Laba</th></tr>';
                data.labels.forEach((label, i) => {
                    table += `<tr>
                        <td>${label}</td>
                        <td>${formatRupiah(data.revenues[i])}</td>
                        <td>${formatRupiah(data.profits[i])}</td>
                    </tr>`;
                });
                break;
                
            case 'product':
                table += '<tr><th>Produk</th><th>Terjual</th><th>Pendapatan</th><th>Laba</th></tr>';
                data.labels.forEach((label, i) => {
                    table += `<tr>
                        <td>${label}</td>
                        <td>${data.quantities[i]}</td>
                        <td>${formatRupiah(data.revenues[i])}</td>
                        <td>${formatRupiah(data.profits[i])}</td>
                    </tr>`;
                });
                break;
                
            case 'hourly':
                table += '<tr><th>Jam</th><th>Pendapatan</th><th>Transaksi</th></tr>';
                data.labels.forEach((label, i) => {
                    table += `<tr>
                        <td>${label}</td>
                        <td>${formatRupiah(data.revenues[i])}</td>
                        <td>${data.transactions[i]}</td>
                    </tr>`;
                });
                break;
                
            case 'category':
                table += '<tr><th>Kategori</th><th>Jumlah</th><th>Persentase</th></tr>';
                const total = data.values.reduce((a, b) => a + b, 0);
                data.labels.forEach((label, i) => {
                    const percentage = ((data.values[i] / total) * 100).toFixed(1);
                    table += `<tr>
                        <td>${label}</td>
                        <td>${data.values[i]}</td>
                        <td>${percentage}%</td>
                    </tr>`;
                });
                break;
        }
        
        table += '</table>';
        return table;
    }
}

// Create singleton instance
const chartManager = new ChartManager();

// Export the manager
export default chartManager;
