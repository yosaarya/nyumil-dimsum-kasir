import { database } from './database.js';
import { formatRupiah, formatDate, showNotification, calculatePercentage } from './utils.js';

// ===== STATISTICS MANAGER =====
class Statistics {
    constructor() {
        this.timeRange = 'today';
        this.startDate = '';
        this.endDate = '';
        this.isInitialized = false;
    }

    // Initialize Statistics
    async init() {
        if (this.isInitialized) return;
        
        await this.setupEventListeners();
        await this.renderStatsSummary();
        await this.renderStatsTable();
        
        this.isInitialized = true;
        console.log('Statistics initialized');
    }

    // Setup Event Listeners
    async setupEventListeners() {
        // Time range filter
        document.getElementById('timeRange')?.addEventListener('change', (e) => {
            this.timeRange = e.target.value;
            this.updateDateInputs();
            this.loadStatistics();
        });

        // Date inputs
        document.getElementById('startDate')?.addEventListener('change', (e) => {
            this.startDate = e.target.value;
            this.loadStatistics();
        });

        document.getElementById('endDate')?.addEventListener('change', (e) => {
            this.endDate = e.target.value;
            this.loadStatistics();
        });

        // Apply filter button
        document.getElementById('applyFilter')?.addEventListener('click', () => {
            this.loadStatistics();
        });

        // Export buttons
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('exportPDF')?.addEventListener('click', () => this.exportPDF());
    }

    // Update Date Inputs based on time range
    updateDateInputs() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (!startDateInput || !endDateInput) return;

        const today = new Date();
        
        switch (this.timeRange) {
            case 'today':
                startDateInput.value = formatDate(today);
                endDateInput.value = formatDate(today);
                startDateInput.style.display = 'none';
                endDateInput.style.display = 'none';
                break;
                
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDateInput.value = formatDate(yesterday);
                endDateInput.value = formatDate(yesterday);
                startDateInput.style.display = 'none';
                endDateInput.style.display = 'none';
                break;
                
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                startDateInput.value = formatDate(weekAgo);
                endDateInput.value = formatDate(today);
                startDateInput.style.display = 'block';
                endDateInput.style.display = 'block';
                break;
                
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                startDateInput.value = formatDate(monthAgo);
                endDateInput.value = formatDate(today);
                startDateInput.style.display = 'block';
                endDateInput.style.display = 'block';
                break;
                
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                startDateInput.value = formatDate(yearAgo);
                endDateInput.value = formatDate(today);
                startDateInput.style.display = 'block';
                endDateInput.style.display = 'block';
                break;
                
            case 'custom':
                startDateInput.style.display = 'block';
                endDateInput.style.display = 'block';
                break;
        }
        
        this.startDate = startDateInput.value;
        this.endDate = endDateInput.value;
    }

    // ===== LOAD STATISTICS =====
    async loadStatistics() {
        await this.renderStatsSummary();
        await this.renderStatsTable();
        await this.renderCharts();
    }

    // ===== STATS SUMMARY =====
    async renderStatsSummary() {
        const stats = await this.getFilteredStats();
        
        // Update summary cards
        this.updateElement('todayRevenue', formatRupiah(stats.revenue));
        this.updateElement('todayOrders', stats.transactions.toString());
        this.updateElement('avgOrderValue', formatRupiah(stats.transactions > 0 ? stats.revenue / stats.transactions : 0));
        this.updateElement('totalProfit', formatRupiah(stats.profit));
        
        // Find best selling product
        const bestSeller = await this.getBestSeller();
        this.updateElement('bestSeller', bestSeller ? bestSeller.name : '-');
    }

    async getFilteredStats() {
        let stats;
        
        switch (this.timeRange) {
            case 'today':
                const today = formatDate(new Date());
                stats = await database.getDailyStats(today);
                break;
                
            case 'yesterday':
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                stats = await database.getDailyStats(formatDate(yesterday));
                break;
                
            default:
                stats = await database.getStatsByDateRange(this.startDate, this.endDate);
        }
        
        return stats;
    }

    async getBestSeller() {
        const stats = await this.getFilteredStats();
        const items = Object.values(stats.items);
        
        if (items.length === 0) return null;
        
        return items.reduce((best, current) => 
            current.quantity > best.quantity ? current : best
        );
    }

    // ===== STATS TABLE =====
    async renderStatsTable() {
        const statsContainer = document.getElementById('statsTable');
        if (!statsContainer) return;

        const stats = await this.getFilteredStats();
        const items = Object.values(stats.items);
        
        if (items.length === 0) {
            statsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Tidak ada data untuk periode ini</p>
                </div>
            `;
            return;
        }

        // Sort by quantity sold
        items.sort((a, b) => b.quantity - a.quantity);

        const tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Terjual</th>
                        <th>Pendapatan</th>
                        <th>Laba</th>
                        <th>Margin</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${formatRupiah(item.revenue)}</td>
                            <td>${formatRupiah(item.profit)}</td>
                            <td>${calculatePercentage(item.profit, item.revenue)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>${stats.itemsSold}</strong></td>
                        <td><strong>${formatRupiah(stats.revenue)}</strong></td>
                        <td><strong>${formatRupiah(stats.profit)}</strong></td>
                        <td><strong>${calculatePercentage(stats.profit, stats.revenue)}%</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;

        statsContainer.innerHTML = tableHTML;
    }

    // ===== CHARTS =====
    async renderCharts() {
        await this.renderRevenueChart();
        await this.renderProductChart();
        await this.renderHourlyChart();
    }

    async renderRevenueChart() {
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (!ctx) return;

        // Get data for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        const dates = [];
        const revenues = [];
        const profits = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = formatDate(date);
            
            const stats = await database.getDailyStats(dateStr);
            
            dates.push(dateStr.split('-')[2]); // Just the day
            revenues.push(stats.revenue);
            profits.push(stats.profit);
        }

        // Create or update chart
        if (window.revenueChart) {
            window.revenueChart.destroy();
        }

        window.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: revenues,
                        borderColor: '#457b9d',
                        backgroundColor: 'rgba(69, 123, 157, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Laba',
                        data: profits,
                        borderColor: '#2a9d8f',
                        backgroundColor: 'rgba(42, 157, 143, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Pendapatan & Laba 7 Hari Terakhir'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp' + (value/1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    async renderProductChart() {
        const ctx = document.getElementById('productChart')?.getContext('2d');
        if (!ctx) return;

        const bestSellers = await database.getBestSellingProducts(5);
        
        if (bestSellers.length === 0) {
            ctx.canvas.style.display = 'none';
            return;
        }

        ctx.canvas.style.display = 'block';

        const labels = bestSellers.map(item => 
            item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name
        );
        const data = bestSellers.map(item => item.quantity);
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#9d4edd'];

        if (window.productChart) {
            window.productChart.destroy();
        }

        window.productChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Terjual',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c + 'CC'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '5 Produk Terlaris'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Jumlah Terjual'
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
    }

    async renderHourlyChart() {
        const ctx = document.getElementById('hourlyChart')?.getContext('2d');
        if (!ctx) return;

        // Get today's transactions
        const today = formatDate(new Date());
        const transactions = await database.getTransactions(today);
        
        // Group by hour
        const hourlyData = Array(24).fill(0);
        
        transactions.forEach(transaction => {
            const hour = parseInt(transaction.time.split(':')[0]);
            hourlyData[hour] += transaction.total;
        });

        // Create labels for hours
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);

        if (window.hourlyChart) {
            window.hourlyChart.destroy();
        }

        window.hourlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendapatan per Jam',
                    data: hourlyData,
                    backgroundColor: 'rgba(233, 196, 106, 0.5)',
                    borderColor: '#e9c46a',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Pendapatan per Jam (Hari Ini)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp' + (value/1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    // ===== EXPORT FUNCTIONS =====
    async exportCSV() {
        try {
            const csv = await database.exportToCSV('transactions');
            const today = formatDate(new Date());
            const filename = `nyumil-transaksi-${today}.csv`;
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Data berhasil diexport ke CSV');
        } catch (error) {
            showNotification('Gagal export data', 'error');
            console.error('Export error:', error);
        }
    }

    async exportPDF() {
        // This would require a PDF library like jsPDF
        // For now, show message
        showNotification('Fitur PDF akan segera tersedia', 'warning');
    }

    // ===== REPORT FUNCTIONS =====
    async generateDailyReport(date = null) {
        const reportDate = date || formatDate(new Date());
        const stats = await database.getDailyStats(reportDate);
        const transactions = await database.getTransactions(reportDate);
        
        return {
            date: reportDate,
            summary: stats,
            transactions: transactions,
            bestSeller: await this.getBestSeller(),
            averageOrder: stats.transactions > 0 ? stats.revenue / stats.transactions : 0
        };
    }

    async generateMonthlyReport(year, month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        
        const stats = await database.getStatsByDateRange(startDate, endDate);
        const transactions = [];
        
        // Get all transactions for the month
        for (let day = 1; day <= 31; day++) {
            const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayTransactions = await database.getTransactions(date);
            transactions.push(...dayTransactions);
        }
        
        return {
            period: `${month}/${year}`,
            summary: stats,
            totalTransactions: transactions.length,
            dailyAverage: stats.revenue / 30, // Approximate
            bestSellers: await database.getBestSellingProducts(10)
        };
    }

    // ===== COMPARISON FUNCTIONS =====
    async comparePeriods(period1, period2) {
        const stats1 = await database.getStatsByDateRange(period1.start, period1.end);
        const stats2 = await database.getStatsByDateRange(period2.start, period2.end);
        
        return {
            period1: stats1,
            period2: stats2,
            revenueChange: stats2.revenue - stats1.revenue,
            revenueChangePercent: calculatePercentage(stats2.revenue - stats1.revenue, stats1.revenue),
            transactionChange: stats2.transactions - stats1.transactions,
            profitChange: stats2.profit - stats1.profit,
            profitChangePercent: calculatePercentage(stats2.profit - stats1.profit, stats1.profit)
        };
    }

    // ===== PREDICTION FUNCTIONS =====
    async predictNextDay() {
        // Get last 7 days data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const stats = await database.getStatsByDateRange(formatDate(startDate), formatDate(endDate));
        
        // Simple average prediction
        const avgRevenue = stats.revenue / 7;
        const avgTransactions = stats.transactions / 7;
        const avgProfit = stats.profit / 7;
        
        return {
            predictedRevenue: Math.round(avgRevenue),
            predictedTransactions: Math.round(avgTransactions),
            predictedProfit: Math.round(avgProfit),
            confidence: 0.7 // Simple confidence score
        };
    }

    // ===== UTILITY FUNCTIONS =====
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // ===== DATA CLEANUP =====
    async cleanupOldData(daysToKeep = 365) {
        try {
            await database.clearOldData(daysToKeep);
            showNotification(`Data lebih dari ${daysToKeep} hari telah dibersihkan`);
            await this.loadStatistics();
        } catch (error) {
            showNotification('Gagal membersihkan data', 'error');
        }
    }
}

// Create singleton instance
const statistics = new Statistics();

// Export functions
export default statistics;
