<script setup lang="ts">
import { ShoppingBag, X } from 'lucide-vue-next';

defineProps<{
  show: boolean;
  transaction: any;
}>();

const emit = defineEmits(['close']);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID');
};
</script>

<template>
    <Teleport to="body">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="emit('close')"></div>
            
            <div class="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div class="bg-primary p-8 text-white relative">
                    <button @click="emit('close')" class="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X class="w-6 h-6" />
                    </button>
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <ShoppingBag class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payment Receipt</span>
                    </div>
                    <h3 class="text-2xl font-black tracking-tight">{{ transaction?.code }}</h3>
                    <p class="text-sm font-medium opacity-80 mt-1">{{ formatDate(transaction?.createdAt) }}</p>
                </div>

                <div class="p-8 max-h-[60vh] overflow-y-auto">
                    <div class="space-y-6">
                        <div v-for="item in transaction?.items" :key="item.id" class="flex justify-between items-start">
                            <div class="flex-1">
                                <p class="font-bold text-gray-900 text-sm leading-tight">{{ item.product?.name }}</p>
                                <p class="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                    {{ item.quantity }} x {{ formatCurrency(Number(item.price)) }}
                                </p>
                            </div>
                            <p class="font-black text-gray-900 text-sm">
                                {{ formatCurrency(Number(item.price) * item.quantity) }}
                            </p>
                        </div>
                    </div>

                    <div class="mt-8 pt-8 border-t border-gray-100 space-y-3">
                        <div class="flex justify-between text-sm font-bold text-gray-500">
                            <span>Subtotal</span>
                            <span>{{ formatCurrency(Number(transaction?.subtotal)) }}</span>
                        </div>
                        <div class="flex justify-between text-sm font-bold text-gray-500">
                            <span>Tax (10%)</span>
                            <span>{{ formatCurrency(Number(transaction?.tax)) }}</span>
                        </div>
                        <div class="flex justify-between text-xl font-black text-gray-900 pt-3">
                            <span>Total</span>
                            <span class="text-primary">{{ formatCurrency(Number(transaction?.totalAmount)) }}</span>
                        </div>
                    </div>

                    <div class="mt-8 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</p>
                            <p class="text-sm font-bold text-gray-900">{{ transaction?.paymentMethod || 'Unknown' }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cashier</p>
                            <p class="text-sm font-bold text-gray-900">{{ transaction?.cashier?.name || 'Unknown' }}</p>
                        </div>
                    </div>
                </div>

                <div class="p-8 bg-gray-50/50 border-t border-gray-100">
                    <button 
                        @click="emit('close')"
                        class="w-full h-14 rounded-2xl bg-white border-2 border-gray-200 font-bold text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
