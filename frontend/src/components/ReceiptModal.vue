<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { X, Printer } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

/**
 * 1. INTERFACES
 * Following strict requirement for production-grade data structure
 */
export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  transactionNo: string;
  date: string;
  cashierName: string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  rounding: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  qrData?: string;
}

export interface StoreConfig {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeFooterMessage: string;
}

/**
 * 2. PROPS & EMITS
 */
const props = withDefaults(defineProps<{
    isOpen: boolean;
    receipt: ReceiptData | null;
    store?: StoreConfig;
    paperWidth?: 58 | 80;
}>(), {
    store: () => ({
        storeName: 'MAJOO POS RETAIL',
        storeAddress: 'Jl. Teknologi No. 42, Jakarta Selatan',
        storePhone: '0812-3456-7890',
        storeFooterMessage: 'Terima Kasih Atas Kunjungan Anda'
    }),
    paperWidth: 80
});

const emit = defineEmits<{
    (e: 'close'): void;
}>();

/**
 * 3. HELPERS
 */
const isPrinting = ref(false);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
            hour12: false
        }).format(date);
    } catch (e) {
        return dateStr;
    }
};

/**
 * 4. PRINT LOGIC (Isolated Window)
 * Requirements: No window.print() on full page, extract HTML, inject CSS, auto close.
 */
const handlePrint = async () => {
    if (!props.receipt) return;
    isPrinting.value = true;

    await nextTick();
    const receiptContent = document.getElementById('receipt-print-content');
    if (!receiptContent) return;

    // Open isolated print window
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
        alert('Please allow popups to print the receipt.');
        isPrinting.value = false;
        return;
    }

    // Prepare styles for thermal printer
    const styles = `
        <style>
            @page { 
                margin: 0; 
                size: ${props.paperWidth === 58 ? '58mm 210mm' : '80mm 297mm'};
            }
            body { 
                margin: 0; 
                padding: 4mm; 
                font-family: 'Courier New', Courier, monospace; 
                font-size: ${props.paperWidth === 58 ? '10px' : '12px'};
                line-height: 1.2;
                width: ${props.paperWidth}mm;
                color: #000;
                background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .uppercase { text-transform: uppercase; }
            .font-bold { font-weight: bold; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            .item-row { margin-bottom: 6px; }
            .item-meta { display: flex; justify-content: space-between; font-size: 0.9em; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total-final { font-size: 1.2em; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .qr-container { display: flex; justify-content: center; margin-top: 15px; }
            .footer { margin-top: 15px; font-size: 0.8em; }
            img { max-width: 100%; height: auto; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            @media print {
                body { padding: 4mm; }
            }
        </style>
    `;

    // Inject content and styles
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Receipt ${props.receipt.transactionNo}</title>
                ${styles}
            </head>
            <body>
                ${receiptContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.focus();
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                <\/script>
            </body>
        </html>
    `);

    printWindow.document.close();
    isPrinting.value = false;
};
</script>

<template>
    <Teleport to="body">
        <!-- Overlay -->
        <div v-if="isOpen && receipt" 
             class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 transition-all duration-300">
            
            <!-- Modal Container -->
            <div class="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col scale-in h-[90vh]">
                
                <!-- Modal Header (Web Only) -->
                <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-primary/5">
                    <div>
                        <h3 class="text-xl font-black text-gray-900 tracking-tight">Payment Completed</h3>
                        <p class="text-xs font-bold text-primary uppercase tracking-widest mt-1">Transaction Success</p>
                    </div>
                    <button @click="emit('close')" class="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm transition-all text-gray-400 hover:text-gray-900">
                        <X class="w-6 h-6" />
                    </button>
                </div>

                <!-- Receipt Viewport -->
                <div class="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    <!-- Real Receipt Mockup -->
                    <div id="receipt-print-content" class="bg-white shadow-lg mx-auto p-6 font-mono text-gray-800"
                         :style="{ width: paperWidth === 58 ? '300px' : '400px' }">
                        
                        <!-- Store Info -->
                        <div class="text-center space-y-1 mb-6">
                            <h2 class="text-xl font-bold uppercase tracking-tighter">{{ store.storeName }}</h2>
                            <p class="text-[11px] leading-tight">{{ store.storeAddress }}</p>
                            <p class="text-[11px]">Tel: {{ store.storePhone }}</p>
                        </div>

                        <div class="dashed-line"></div>

                        <!-- Transaction Metadata -->
                        <div class="text-[11px] space-y-1">
                            <div class="flex justify-between">
                                <span>NO : {{ receipt.transactionNo }}</span>
                                <span>{{ formatDate(receipt.date) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>KASIR : {{ receipt.cashierName }}</span>
                                <span class="uppercase">Metode : {{ receipt.paymentMethod }}</span>
                            </div>
                        </div>

                        <div class="dashed-line"></div>

                        <!-- Item List Header -->
                        <div class="text-[11px] font-bold mb-2 flex justify-between">
                            <span>ITEM DESCRIPTION</span>
                            <span>TOTAL</span>
                        </div>

                        <!-- Items -->
                        <div class="space-y-3 mb-4">
                            <div v-for="(item, index) in receipt.items" :key="item.id" class="text-[11px] item-row">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1 pr-4">
                                        <span class="mr-1">{{ index + 1 }}.</span>
                                        <span class="font-bold">{{ item.name }}</span>
                                    </div>
                                    <span class="font-bold whitespace-nowrap">{{ formatCurrency(item.subtotal) }}</span>
                                </div>
                                <div class="text-[10px] text-gray-600 pl-4">
                                    {{ item.qty }} x {{ formatCurrency(item.price) }}
                                </div>
                            </div>
                        </div>

                        <div class="dashed-line"></div>

                        <!-- Totals Section -->
                        <div class="text-[11px] space-y-2">
                            <div class="flex justify-between">
                                <span>SUBTOTAL</span>
                                <span>{{ formatCurrency(receipt.subtotal) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>PAJAK ({{ Math.round(receipt.taxRate * 100) }}%)</span>
                                <span>{{ formatCurrency(receipt.taxAmount) }}</span>
                            </div>
                            <div v-if="receipt.rounding !== 0" class="flex justify-between">
                                <span>PEMBULATAN</span>
                                <span>{{ formatCurrency(receipt.rounding) }}</span>
                            </div>
                            <div class="flex justify-between font-bold text-sm total-final">
                                <span>TOTAL</span>
                                <span>{{ formatCurrency(receipt.total) }}</span>
                            </div>
                        </div>

                        <div class="dashed-line"></div>

                        <!-- Payment Details -->
                        <div class="text-[11px] space-y-1">
                            <div class="flex justify-between">
                                <span class="uppercase">BAYAR</span>
                                <span>{{ formatCurrency(receipt.paidAmount) }}</span>
                            </div>
                            <div class="flex justify-between font-bold" :class="receipt.changeAmount > 0 ? 'text-blue-600' : ''">
                                <span class="uppercase">KEMBALI</span>
                                <span>{{ formatCurrency(receipt.changeAmount) }}</span>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="text-center mt-8 space-y-4">
                            <p class="text-[10px] font-bold uppercase tracking-widest">{{ store.storeFooterMessage }}</p>
                            
                            <!-- QR Code Requirement -->
                            <div v-if="receipt.qrData" class="qr-container flex flex-col items-center gap-2">
                                <qrcode-vue :value="receipt.qrData" :size="paperWidth === 58 ? 80 : 100" level="H" />
                                <span class="text-[8px] text-gray-400">Scan for digital receipt</span>
                            </div>

                            <div class="text-[8px] text-gray-300 italic">Powered by Majoo Production POS</div>
                        </div>
                    </div>
                </div>

                <!-- Action Footer -->
                <div class="p-8 bg-white border-t border-gray-100 flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-4">
                        <button @click="paperWidth = 58" 
                                :class="[
                                    'h-12 rounded-2xl border-2 font-bold text-xs transition-all',
                                    paperWidth === 58 ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                                ]">
                            Thermal 58mm
                        </button>
                        <button @click="paperWidth = 80"
                                :class="[
                                    'h-12 rounded-2xl border-2 font-bold text-xs transition-all',
                                    paperWidth === 80 ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                                ]">
                            Thermal 80mm
                        </button>
                    </div>
                    
                    <div class="flex gap-4">
                        <button @click="emit('close')" 
                                class="flex-1 h-14 rounded-2xl border-2 border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">
                            Selesai
                        </button>
                        <button @click="handlePrint" 
                                :disabled="isPrinting"
                                class="flex-[2] h-14 bg-primary text-white rounded-2xl font-black shadow-premium flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50">
                            <template v-if="isPrinting">
                                <div class="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                Printing...
                            </template>
                            <template v-else>
                                <Printer class="w-6 h-6" />
                                PRINT STRUK
                            </template>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* CSS Reset for Mono font rendering */
#receipt-print-content {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.dashed-line {
    border-top: 1px dashed #e5e7eb;
    margin: 1rem 0;
}

.scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Hide scrollbar for cleaner look */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
    .max-w-lg {
        max-width: 100%;
        height: 100vh;
        border-radius: 0;
    }
}
</style>
