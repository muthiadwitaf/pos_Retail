<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCartStore } from '../stores/cart';
import api from '../api';
import { 
    Search, 
    Plus, 
    Minus, 
    Banknote, 
    Smartphone,
    ShoppingCart,
    Activity,
    X,
    CheckCircle,
    Loader2
} from 'lucide-vue-next';

// Components
import ReceiptModal from '../components/ReceiptModal.vue';
import QrisDisplay from '../components/QrisDisplay.vue';

const cartStore = useCartStore();
const products = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const categories = ref<any[]>([]);

const imagePlaceholder = (name: string) => `https://ui-avatars.com/api/?name=${name}&background=random&size=128`;

const fetchProducts = async () => {
    loading.value = true;
    try {
        const params: any = { limit: 2000 }; // Fetch all products for POS
        if (searchQuery.value) params.search = searchQuery.value;
        if (selectedCategory.value) params.categoryId = selectedCategory.value;

        const response = await api.get('/products', { params });
        products.value = response.data.data.products;
    } catch (error) {
        console.error('Failed to fetch products', error);
    } finally {
        loading.value = false;
    }
};

const fetchCategories = async () => {
    try {
        const response = await api.get('/categories');
        categories.value = response.data.data.categories;
        // Auto-select first category so we don't load ALL products
        if (categories.value.length > 0 && !selectedCategory.value) {
            selectedCategory.value = categories.value[0].id;
            fetchProducts();
        }
    } catch (error) {
        console.error('Failed to fetch categories', error);
    }
};

onMounted(() => {
    fetchCategories();
});

const handleSearch = () => {
    if (searchQuery.value.trim().length >= 3) {
        const exactMatch = products.value.find(p => 
            p.barcode === searchQuery.value.trim() || 
            p.sku === searchQuery.value.trim()
        );
        
        if (exactMatch) {
            cartStore.addItem(exactMatch);
            searchQuery.value = '';
            setTimeout(fetchProducts, 100);
            return;
        }
    }
    fetchProducts();
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

// Checkout State
const isPaymentModalOpen = ref(false);
const paymentMethod = ref<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
const cashAmount = ref<number>(0);
const processingPayment = ref(false);
const paymentError = ref('');

// Step-based payment flow
const currentStep = ref<'SELECTION' | 'PROCESSING_QRIS'>('SELECTION');
const qrisData = ref<{ transactionId: string; qrUrl: string; expiry: string } | null>(null);
const receiptData = ref<any>(null);
const isReceiptModalOpen = ref(false);

const changeAmount = computed(() => {
    return Math.max(0, cashAmount.value - cartStore.total);
});

const openPaymentModal = () => {
    if (cartStore.items.length === 0) return;
    cashAmount.value = 0;
    paymentError.value = '';
    currentStep.value = 'SELECTION';
    isPaymentModalOpen.value = true;
};

const processPayment = async () => {
    processingPayment.value = true;
    paymentError.value = '';
    
    try {
        // Step 1: Create Transaction
        const transactionPayload = {
            items: cartStore.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            })),
            paymentMethod: paymentMethod.value,
            paymentAmount: paymentMethod.value === 'CASH' ? cashAmount.value : 0
        };

        const resTrx = await api.post('/transactions/checkout', transactionPayload);
        const transaction = resTrx.data.data;

        // Step 2: Process with Payment Strategy
        const paymentPayload = {
            transactionId: transaction.id,
            paymentMethod: paymentMethod.value,
            paidAmount: paymentMethod.value === 'CASH' ? cashAmount.value : 0
        };

        const resPayment = await api.post('/payments/process', paymentPayload);
        const paymentResult = resPayment.data.data;

        if (paymentMethod.value === 'CASH') {
            // Map backend response to production-grade ReceiptData structure
            const raw = paymentResult.receiptData;
            receiptData.value = {
                transactionNo: raw.code,
                date: raw.date,
                cashierName: raw.cashier,
                paymentMethod: raw.paymentMethod,
                items: raw.items.map((item: any) => ({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    qty: item.quantity,
                    price: item.price,
                    subtotal: item.total
                })),
                subtotal: raw.subtotal,
                taxRate: 0.11,
                taxAmount: raw.tax,
                rounding: 0,
                total: raw.total,
                paidAmount: raw.paidAmount,
                changeAmount: raw.change,
                qrData: raw.code // Use transaction code as QR fallback if no specific data
            };
            
            isPaymentModalOpen.value = false;
            isReceiptModalOpen.value = true;
            cartStore.clearCart();
            fetchProducts();
        } else if (paymentMethod.value === 'QRIS') {
            qrisData.value = {
                transactionId: transaction.id,
                qrUrl: paymentResult.qrCodeUrl,
                expiry: paymentResult.expiredAt
            };
            currentStep.value = 'PROCESSING_QRIS';
        }
    } catch (error: any) {
        paymentError.value = error.response?.data?.message || 'Gagal memproses pembayaran.';
    } finally {
        processingPayment.value = false;
    }
};

const confirmQrisPaid = async () => {
    if (!qrisData.value) return;
    processingPayment.value = true;
    try {
        // Trigger the webhook to mark as PAID
        await api.post('/payments/qris/webhook', { transactionId: qrisData.value.transactionId });

        // Build receipt data for QRIS matching production structure
        receiptData.value = {
            transactionNo: qrisData.value.transactionId.toUpperCase(),
            date: new Date().toISOString(),
            cashierName: 'System / QRIS',
            paymentMethod: 'QRIS',
            items: cartStore.items.map(item => ({
                id: item.product.id,
                name: item.product.name,
                qty: item.quantity,
                price: Number(item.price),
                subtotal: Number(item.price) * item.quantity
            })),
            subtotal: cartStore.subtotal,
            taxRate: 0.11,
            taxAmount: cartStore.tax,
            rounding: 0,
            total: cartStore.total,
            paidAmount: cartStore.total,
            changeAmount: 0,
            qrData: qrisData.value.transactionId
        };

        isPaymentModalOpen.value = false;
        isReceiptModalOpen.value = true;
        cartStore.clearCart();
        fetchProducts();
        currentStep.value = 'SELECTION';
        qrisData.value = null;
    } catch (error: any) {
        paymentError.value = error.response?.data?.message || 'Gagal konfirmasi pembayaran.';
    } finally {
        processingPayment.value = false;
    }
};

const handleQrisPaid = () => {
    // Auto-detected paid via polling
    confirmQrisPaid();
};

const cancelQris = () => {
    currentStep.value = 'SELECTION';
    qrisData.value = null;
};


const quickMoney = [10000, 20000, 50000, 100000];
</script>

<template>
    <div class="h-full flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
        <!-- Left Panel: Products -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- Header/Filter -->
            <div class="mb-8 space-y-6">
                <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Register POS</h1>
                        <p class="text-gray-500 font-medium">Pilih produk untuk ditambahkan ke pesanan.</p>
                    </div>
                    <div class="relative w-full md:w-80">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input 
                            v-model="searchQuery" 
                            @input="handleSearch"
                            type="text" 
                            placeholder="Cari SKU, barcode atau nama..." 
                            class="input-majoo pl-12 h-12 shadow-sm"
                            autofocus
                        >
                    </div>
                </header>

                <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        v-for="cat in categories" 
                        :key="cat.id"
                        @click="selectedCategory = cat.id; fetchProducts()"
                        :class="[
                            'px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                            selectedCategory === cat.id ? 'bg-primary text-white shadow-premium' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-soft'
                        ]"
                    >
                        {{ cat.name }}
                    </button>
                </div>
            </div>

            <!-- Product Grid -->
            <div class="flex-1 min-h-0">
                <div v-if="loading" class="flex justify-center items-center h-64">
                    <Loader2 class="w-10 h-10 text-primary animate-spin" />
                </div>
                
                <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    <div 
                        v-for="product in products" 
                        :key="product.id"
                        @click="cartStore.addItem(product)"
                        class="majoo-card group cursor-pointer overflow-hidden flex flex-col"
                    >
                        <div class="relative aspect-square bg-gray-50 overflow-hidden">
                            <img :src="product.imageUrl || imagePlaceholder(product.name)" :alt="product.name" class="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500">
                            <div v-if="product.stock <= 10" class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm uppercase tracking-tighter">
                                Stok Rendah
                            </div>
                        </div>
                        <div class="p-4 flex flex-col flex-1">
                            <h3 class="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">{{ product.name }}</h3>
                            <div class="mt-auto">
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{{ product.sku }}</p>
                                <div class="flex justify-between items-end">
                                    <span class="text-lg font-black text-primary">{{ formatCurrency(Number(product.price)) }}</span>
                                    <span class="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">STK: {{ product.stock }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Cart -->
        <aside class="w-full lg:w-[400px] flex flex-col min-h-0">
            <div class="majoo-card h-full flex flex-col shadow-premium border-primary-light/30">
                <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-primary/5 rounded-t-2xl">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                            <ShoppingCart class="w-5 h-5" />
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 leading-none">Keranjang</h2>
                            <p class="text-xs font-bold text-primary mt-1 uppercase tracking-tighter">{{ cartStore.items.length }} Item</p>
                        </div>
                    </div>
                    <button @click="cartStore.clearCart()" class="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Reset</button>
                </div>

                <!-- Cart Items -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <div v-if="cartStore.items.length === 0" class="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                        <ShoppingCart class="w-16 h-16 opacity-10 mb-4" />
                        <p class="font-bold text-gray-400">Keranjang Kosong</p>
                    </div>

                    <div v-else v-for="item in cartStore.items" :key="item.product.id" class="flex gap-4 group">
                        <img :src="item.product.imageUrl || imagePlaceholder(item.product.name)" class="w-16 h-16 rounded-xl object-cover bg-gray-50" />
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-gray-900 truncate pr-2">{{ item.product.name }}</h4>
                            <p class="text-xs font-bold text-primary mb-3">{{ formatCurrency(item.price) }}</p>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center bg-gray-100 rounded-xl p-1">
                                    <button @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)" class="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-gray-600 shadow-sm hover:text-primary transition-all">
                                        <Minus class="w-3 h-3" />
                                    </button>
                                    <span class="w-8 text-center text-xs font-black text-gray-700">{{ item.quantity }}</span>
                                    <button @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)" class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-premium transition-all">
                                        <Plus class="w-3 h-3" />
                                    </button>
                                </div>
                                <span class="text-sm font-black text-gray-900">{{ formatCurrency(item.price * item.quantity) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Totals -->
                <div class="p-6 bg-gray-50/50 rounded-b-2xl border-t border-gray-100 space-y-4">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span class="text-gray-900">{{ formatCurrency(cartStore.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Tax (11%)</span>
                            <span class="text-gray-900">{{ formatCurrency(cartStore.tax) }}</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-end pt-2 border-t border-gray-200">
                        <span class="text-sm font-black text-gray-500 uppercase tracking-widest pb-1">Total</span>
                        <span class="text-2xl font-black text-primary tracking-tighter">{{ formatCurrency(cartStore.total) }}</span>
                    </div>
                    <button @click="openPaymentModal" :disabled="cartStore.items.length === 0" class="w-full h-14 btn-primary text-xl font-black tracking-tight mt-4 shadow-premium">Bayar Sekarang</button>
                </div>
            </div>
        </aside>

        <!-- Payment Modal -->
        <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
            <div class="majoo-card w-full max-w-xl p-0 flex flex-col md:flex-row overflow-hidden shadow-2xl animate-fade-in relative">
                <!-- Close Button -->
                <button @click="isPaymentModalOpen = false" class="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 text-white md:bg-gray-100 md:hover:bg-gray-200 md:text-gray-400 rounded-xl transition-all">
                    <X class="w-5 h-5" />
                </button>

                <!-- Modal Left: Summary -->
                <div class="w-full md:w-56 bg-primary p-8 text-white flex flex-col justify-between overflow-hidden relative">
                    <div class="relative z-10">
                        <h3 class="text-xs font-black uppercase tracking-widest text-white/50 mb-8">Ringkasan</h3>
                        <div class="space-y-6">
                            <div>
                                <p class="text-[10px] font-bold text-white/50 uppercase mb-1">Total Bayar</p>
                                <p class="text-xl font-black tracking-tight leading-none">{{ formatCurrency(cartStore.total) }}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold text-white/50 uppercase mb-1">Total Item</p>
                                <p class="text-sm font-bold">{{ cartStore.items.length }} Produk</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Right: Payment Flow -->
                <div class="flex-1 p-8 bg-white relative min-h-[400px]">
                    <!-- Step 1: Selection & Input -->
                    <template v-if="currentStep === 'SELECTION'">
                        <h4 class="text-lg font-black text-gray-900 mb-6">Pilih Metode Pembayaran</h4>
                        
                        <div class="grid grid-cols-3 gap-4 mb-8">
                            <button 
                                v-for="method in (['CASH', 'QRIS'] as const)"
                                :key="method"
                                @click="paymentMethod = method"
                                :class="['h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all', paymentMethod === method ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400']"
                            >
                                <component :is="method === 'CASH' ? Banknote : Smartphone" class="w-6 h-6" />
                                <span class="text-[10px] font-black uppercase">{{ method }}</span>
                            </button>
                        </div>

                        <div v-if="paymentMethod === 'CASH'" class="space-y-6 slide-up">
                            <div>
                                <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tunai Diterima</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-lg">Rp</span>
                                    <input v-model="cashAmount" type="number" class="input-majoo pl-12 h-14 text-2xl font-black text-gray-900" placeholder="0" />
                                </div>
                            </div>
                            
                            <div class="flex flex-wrap gap-2">
                                <button v-for="amount in quickMoney" :key="amount" @click="cashAmount = amount" class="px-4 py-2 bg-gray-50 hover:bg-primary hover:text-white rounded-xl text-xs font-bold text-gray-500 transition-all border border-gray-100">{{ formatCurrency(amount) }}</button>
                            </div>

                            <div v-if="cashAmount >= cartStore.total" class="bg-secondary/5 p-4 rounded-2xl border border-secondary/20 flex justify-between items-center slide-up">
                                <div>
                                    <p class="text-[10px] font-black text-secondary uppercase mb-1">Kembalian</p>
                                    <p class="text-xl font-black text-secondary">{{ formatCurrency(changeAmount) }}</p>
                                </div>
                                <CheckCircle class="w-6 h-6 text-secondary" />
                            </div>
                        </div>

                        <div v-if="paymentError" class="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{{ paymentError }}</div>

                        <button @click="processPayment" :disabled="processingPayment || (paymentMethod === 'CASH' && cashAmount < cartStore.total)" class="w-full h-14 btn-primary text-lg font-black tracking-tight shadow-premium mt-8">
                            <template v-if="processingPayment">
                                <Activity class="w-5 h-5 animate-spin mx-auto" />
                            </template>
                            <template v-else>
                                {{ paymentMethod === 'CASH' ? 'Selesaikan Tunai' : 'Bayar dengan QRIS' }}
                            </template>
                        </button>
                    </template>

                    <!-- Step 2: QRIS Processing -->
                    <template v-else-if="currentStep === 'PROCESSING_QRIS' && qrisData">
                        <QrisDisplay 
                            :transaction-id="qrisData.transactionId" 
                            :qr-url="qrisData.qrUrl" 
                            :expiry-date="qrisData.expiry"
                            @paid="handleQrisPaid"
                            @cancel="cancelQris"
                        />
                    </template>
                </div>
            </div>
        </div>

        <!-- External Components -->
        <ReceiptModal :is-open="isReceiptModalOpen" :receipt="receiptData" @close="isReceiptModalOpen = false" />
    </div>
</template>

<style scoped>
.slide-up { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
