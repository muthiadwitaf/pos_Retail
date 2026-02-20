<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Smartphone, Timer, CheckCircle, Activity, AlertCircle, ArrowLeft } from 'lucide-vue-next';
import api from '../api';

const props = defineProps<{
    transactionId: string;
    qrUrl: string;
    expiryDate: string;
}>();

const emit = defineEmits(['paid', 'cancel', 'expired']);

const status = ref<'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'>('PENDING');
const timeLeft = ref(0);
let pollingInterval: any = null;
let timerInterval: any = null;

const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const expiry = new Date(props.expiryDate).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000));
    timeLeft.value = diff;
    if (diff === 0) {
        status.value = 'EXPIRED';
        emit('expired');
        stopPolling();
    }
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const checkStatus = async () => {
    try {
        const response = await api.get(`/payments/status/${props.transactionId}`);
        if (response.data.data.status === 'PAID') {
            status.value = 'PAID';
            stopPolling();
            setTimeout(() => emit('paid'), 1500);
        }
    } catch (error) {
        console.error('Failed to check payment status', error);
    }
};

const startPolling = () => {
    pollingInterval = setInterval(checkStatus, 3000);
    timerInterval = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
};

const stopPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (timerInterval) clearInterval(timerInterval);
};

onMounted(() => {
    startPolling();
});

onUnmounted(() => {
    stopPolling();
});

const progress = computed(() => {
    const total = 15 * 60;
    return (timeLeft.value / total) * 100;
});
</script>

<template>
    <div class="flex flex-col items-center py-4 space-y-6">
        <!-- Success State -->
        <div v-if="status === 'PAID'" class="text-center py-10 scale-in">
            <div class="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle class="w-16 h-16" />
            </div>
            <h3 class="text-2xl font-black text-gray-900">Pembayaran Berhasil!</h3>
            <p class="text-gray-500 font-medium mt-2">Menyiapkan struk belanja Anda...</p>
        </div>

        <!-- Pending State (QR Display) -->
        <template v-else>
            <div class="relative group">
                <!-- QR Code Container -->
                <div class="bg-white p-4 rounded-[2.5rem] shadow-xl border-4 border-primary-light/30 transition-all group-hover:shadow-2xl">
                    <img :src="props.qrUrl" alt="QRIS Code" class="w-64 h-64 rounded-xl" />
                    
                    <!-- Expired Overlay -->
                    <div v-if="status === 'EXPIRED'" class="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center">
                        <AlertCircle class="w-16 h-16 text-red-500 mb-4" />
                        <h4 class="text-lg font-black text-gray-900">QR Kadaluarsa</h4>
                        <p class="text-sm text-gray-500 mb-4">Silakan buat ulang pembayaran.</p>
                        <button @click="emit('cancel')" class="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">Ulangi</button>
                    </div>
                </div>

                <!-- Floating QRIS Logo -->
                <div class="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center p-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/1200px-Logo_QRIS.svg.png" alt="QRIS" class="w-full object-contain" />
                </div>
            </div>

            <!-- Timer & Status -->
            <div class="w-full max-w-[280px] space-y-4">
                <div class="flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                    <div class="flex items-center gap-2">
                        <Timer class="w-4 h-4" />
                        <span>Batas Waktu</span>
                    </div>
                    <span :class="timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'">{{ formatTime(timeLeft) }}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-primary transition-all duration-1000" 
                        :style="{ width: `${progress}%` }"
                    ></div>
                </div>

                <!-- Status Indicator -->
                <div class="bg-primary/5 rounded-2xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
                        <Smartphone class="w-5 h-5 text-primary" />
                        <Activity class="w-3 h-3 text-secondary absolute -top-1 -right-1 animate-ping" />
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Status</p>
                        <p class="text-sm font-bold text-gray-700 mt-1">Menunggu Pembayaran...</p>
                    </div>
                </div>
            </div>

            <p class="text-xs text-center text-gray-400 font-medium px-8 leading-relaxed">
                Silakan scan kode QR di atas menggunakan aplikasi m-banking atau e-wallet Anda.
            </p>

            <!-- Action Buttons -->
            <div v-if="status !== 'EXPIRED'" class="w-full max-w-[280px] space-y-3 pt-2">
                <button 
                    @click="emit('paid')"
                    class="w-full h-12 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-black text-sm tracking-tight shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle class="w-5 h-5" />
                    Pelanggan Sudah Bayar
                </button>
                <button 
                    @click="emit('cancel')"
                    class="w-full h-12 bg-white hover:bg-gray-50 text-gray-500 rounded-2xl font-bold text-sm border-2 border-gray-100 transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft class="w-4 h-4" />
                    Ganti Metode Pembayaran
                </button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.scale-in {
    animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
