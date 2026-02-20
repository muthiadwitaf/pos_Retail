<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { DollarSign, ShoppingBag, AlertTriangle, Activity, BarChart3 } from 'lucide-vue-next';
import api from '../api';
import { Doughnut, Bar, Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';

ChartJS.register(
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, Filler
);

const loading = ref(true);
const chartsLoading = ref(true);

const stats = ref([
    { name: 'Total Revenue', value: '0', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Transactions', value: '0', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Low Stock Items', value: '0', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Active Products', value: '0', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
]);

// Chart data
const salesByCategory = ref<any[]>([]);
const salesByHour = ref<any[]>([]);
const salesByMonth = ref<any[]>([]);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

// -- Chart Configs --

const CHART_COLORS = [
    '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

const categoryChartData = computed(() => ({
    labels: salesByCategory.value.map(s => s.category),
    datasets: [{
        data: salesByCategory.value.map(s => s.total),
        backgroundColor: CHART_COLORS.slice(0, salesByCategory.value.length),
        borderWidth: 0,
        hoverOffset: 8
    }]
}));

const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 10,
                font: { size: 11, weight: 'bold' as const, family: 'Inter, sans-serif' }
            }
        },
        tooltip: {
            callbacks: {
                label: (ctx: any) => {
                    const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const pct = ((ctx.raw / total) * 100).toFixed(1);
                    return ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
                }
            }
        }
    },
    cutout: '65%'
};

// Build full 24-hour labels
const hourlyChartData = computed(() => {
    const hourMap = new Map<number, number>();
    salesByHour.value.forEach(s => hourMap.set(s.hour, s.total));

    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 0; i < 24; i++) {
        labels.push(`${String(i).padStart(2, '0')}:00`);
        data.push(hourMap.get(i) || 0);
    }

    return {
        labels,
        datasets: [{
            label: 'Revenue',
            data,
            backgroundColor: data.map((_, i) => {
                const now = new Date().getHours();
                return i === now ? '#4F46E5' : 'rgba(79, 70, 229, 0.15)';
            }),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 24
        }]
    };
});

const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx: any) => ` Revenue: ${formatCurrency(ctx.raw)}`
            }
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 9, weight: 'bold' as const }, maxRotation: 0, color: '#9CA3AF' }
        },
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.03)' },
            ticks: {
                font: { size: 10 },
                color: '#9CA3AF',
                callback: (v: any) => {
                    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                    return v;
                }
            }
        }
    }
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthlyChartData = computed(() => {
    const labels = salesByMonth.value.map(s => {
        const [y, m] = s.month.split('-');
        return `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`;
    });
    const data = salesByMonth.value.map(s => s.total);

    return {
        labels,
        datasets: [{
            label: 'Monthly Revenue',
            data,
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#4F46E5',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
        }]
    };
});

const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx: any) => ` Revenue: ${formatCurrency(ctx.raw)}`
            }
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' as const }, color: '#9CA3AF' }
        },
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.03)' },
            ticks: {
                font: { size: 10 },
                color: '#9CA3AF',
                callback: (v: any) => {
                    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                    return v;
                }
            }
        }
    }
};

// -- Data Fetching --

const fetchDashboardData = async () => {
    try {
        const response = await api.get('/dashboard/stats');
        const data = response.data.data;

        if (stats.value[0]) stats.value[0].value = formatCurrency(Number(data?.totalRevenue ?? 0));
        if (stats.value[1]) stats.value[1].value = (data?.totalTransactions ?? 0).toString();
        if (stats.value[2]) stats.value[2].value = (data?.lowStockCount ?? 0).toString();
        if (stats.value[3]) stats.value[3].value = (data?.totalProducts ?? 0).toString();
    } catch (error) {
        console.error('Failed to fetch dashboard data', error);
    } finally {
        loading.value = false;
    }
};

const fetchChartData = async () => {
    try {
        const response = await api.get('/dashboard/charts');
        const data = response.data.data;

        salesByCategory.value = data?.salesByCategory ?? [];
        salesByHour.value = data?.salesByHour ?? [];
        salesByMonth.value = data?.salesByMonth ?? [];
    } catch (error) {
        console.error('Failed to fetch chart data', error);
    } finally {
        chartsLoading.value = false;
    }
};

onMounted(() => {
    fetchDashboardData();
    fetchChartData();
});
</script>

<template>
    <div class="space-y-10">
        <header>
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p class="text-gray-500 mt-1 font-medium">Monitoring your business performance in real-time.</p>
        </header>

        <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-light border-t-primary"></div>
        </div>

        <!-- Stats Cards -->
        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="item in stats" :key="item.name" class="majoo-card p-6 flex flex-col justify-between">
                <div class="flex items-center justify-between mb-4">
                    <div :class="[item.bg, 'rounded-xl p-3']">
                        <component :is="item.icon" :class="[item.color, 'h-6 w-6']" />
                    </div>
                    <Activity class="w-4 h-4 text-gray-300" />
                </div>
                <div>
                    <dt class="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">{{ item.name }}</dt>
                    <dd class="text-2xl font-bold text-gray-900 tracking-tight">{{ item.value }}</dd>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div v-if="!loading" class="space-y-8">
            <!-- Row 1: Category Doughnut + Hourly Bar -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <!-- Category Doughnut -->
                <div class="majoo-card p-6 lg:col-span-2">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BarChart3 class="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-900">Sales by Category</h3>
                            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Revenue Distribution</p>
                        </div>
                    </div>
                    <div v-if="chartsLoading" class="h-64 flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-light border-t-primary"></div>
                    </div>
                    <div v-else-if="salesByCategory.length === 0" class="h-64 flex items-center justify-center text-gray-400 text-sm font-medium">
                        No category data available
                    </div>
                    <div v-else class="h-64">
                        <Doughnut :data="categoryChartData" :options="categoryChartOptions" />
                    </div>
                </div>

                <!-- Hourly Bar Chart -->
                <div class="majoo-card p-6 lg:col-span-3">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Activity class="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-gray-900">Hourly Sales</h3>
                                <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Today's Transaction Pattern</p>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg uppercase tracking-widest">Live Today</span>
                    </div>
                    <div v-if="chartsLoading" class="h-64 flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-light border-t-primary"></div>
                    </div>
                    <div v-else class="h-64">
                        <Bar :data="hourlyChartData" :options="hourlyChartOptions" />
                    </div>
                </div>
            </div>

            <!-- Row 2: Monthly Line Chart -->
            <div class="majoo-card p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <DollarSign class="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-900">Monthly Revenue</h3>
                            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Last 12 Months Trend</p>
                        </div>
                    </div>
                </div>
                <div v-if="chartsLoading" class="h-72 flex items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-light border-t-primary"></div>
                </div>
                <div v-else-if="salesByMonth.length === 0" class="h-72 flex items-center justify-center text-gray-400 text-sm font-medium">
                    No monthly data available yet
                </div>
                <div v-else class="h-72">
                    <Line :data="monthlyChartData" :options="monthlyChartOptions" />
                </div>
            </div>
        </div>
    </div>
</template>
