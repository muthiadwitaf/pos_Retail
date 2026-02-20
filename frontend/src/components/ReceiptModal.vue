<script setup lang="ts">
import { X, Printer, CheckCircle } from 'lucide-vue-next';

const props = defineProps<{
    isOpen: boolean;
    receipt: {
        code: string;
        date: string;
        items: any[];
        subtotal: number;
        tax: number;
        total: number;
        paidAmount: number;
        change: number;
        cashier: string;
        paymentMethod?: string;
    } | null;
}>();

const emit = defineEmits(['close']);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const handlePrint = () => {
    window.print();
};
</script>

<template>
    <div v-if="isOpen && receipt" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-in print:shadow-none print:rounded-none">
            <!-- Header -->
            <div class="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
                <h3 class="text-xl font-black text-gray-900">Payment Success</h3>
                <button @click="emit('close')" class="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X class="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <!-- Receipt Content -->
            <div class="flex-1 overflow-y-auto p-8 font-mono text-sm text-gray-800 space-y-6" id="receipt-print">
                <div class="text-center space-y-2">
                    <div class="flex justify-center mb-4 print:hidden">
                        <div class="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                            <CheckCircle class="w-10 h-10" />
                        </div>
                    </div>
                    <h2 class="text-2xl font-black tracking-tighter uppercase">MAJOO POS RETAIL</h2>
                    <p class="text-xs text-gray-500">Jl. Teknologi No. 42, Jakarta Selatan</p>
                    <p class="text-xs text-gray-500">{{ formatDate(receipt.date) }}</p>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-4">
                    <p class="text-xs flex justify-between">
                        <span>Invoice:</span>
                        <span class="font-bold">{{ receipt.code }}</span>
                    </p>
                    <p class="text-xs flex justify-between">
                        <span>Cashier:</span>
                        <span>{{ receipt.cashier }}</span>
                    </p>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-4 space-y-3">
                    <div v-for="item in receipt.items" :key="item.name" class="flex justify-between items-start gap-4">
                        <div class="flex-1">
                            <p class="font-bold">{{ item.name }}</p>
                            <p class="text-xs text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.price) }}</p>
                        </div>
                        <span class="font-bold">{{ formatCurrency(item.total) }}</span>
                    </div>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-4 space-y-2">
                    <div class="flex justify-between">
                        <span>Subtotal</span>
                        <span>{{ formatCurrency(receipt.subtotal) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Tax (11%)</span>
                        <span>{{ formatCurrency(receipt.tax) }}</span>
                    </div>
                    <div class="flex justify-between text-lg font-black pt-2">
                        <span>TOTAL</span>
                        <span>{{ formatCurrency(receipt.total) }}</span>
                    </div>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-4 space-y-1">
                    <div class="flex justify-between items-center mb-2">
                        <span class="uppercase">Metode</span>
                        <span class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg" :class="receipt.paymentMethod === 'QRIS' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'">
                            {{ receipt.paymentMethod || 'CASH' }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="uppercase">Paid Amount</span>
                        <span>{{ formatCurrency(receipt.paidAmount) }}</span>
                    </div>
                    <div v-if="receipt.change > 0" class="flex justify-between font-bold text-secondary">
                        <span class="uppercase">Change</span>
                        <span>{{ formatCurrency(receipt.change) }}</span>
                    </div>
                </div>

                <div class="text-center pt-8 border-t border-dashed border-gray-300">
                    <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Terima Kasih Atas Kunjungan Anda</p>
                    <p class="text-[10px] text-gray-400 mt-1 italic">Powered by Majoo Clone</p>
                </div>
            </div>

            <!-- Footer Actions (always visible, sticky at bottom) -->
            <div class="p-6 bg-gray-50 border-t border-gray-100 space-y-3 print:hidden">
                <button @click="emit('close')" class="w-full h-14 btn-primary rounded-2xl font-black shadow-premium text-lg flex items-center justify-center gap-2">
                    <CheckCircle class="w-6 h-6" />
                    OK - Selesai
                </button>
                <button @click="handlePrint" class="w-full h-12 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all text-sm">
                    <Printer class="w-4 h-4" />
                    Print Struk
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@media print {
    .fixed {
        position: static;
        background: white;
    }
    .bg-white {
        width: 100%;
        max-width: none;
        box-shadow: none;
    }
    #receipt-print {
        padding: 0;
    }
}

.scale-in {
    animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
