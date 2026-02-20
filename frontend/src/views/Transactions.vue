<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { Eye } from 'lucide-vue-next';
import TransactionDetailModal from '../components/TransactionDetailModal.vue';

interface Transaction {
    id: string;
    code: string;
    subtotal: number;
    tax: number;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    cashier?: { name: string };
    items?: any[];
}

const transactions = ref<Transaction[]>([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const showTrxModal = ref(false);
const selectedTrx = ref<Transaction | null>(null);

const fetchTransactions = async () => {
    loading.value = true;
    try {
        const response = await api.get('/transactions/history', {
            params: { page: page.value, limit: 10 }
        });
        transactions.value = response.data.data.transactions;
        totalPages.value = response.data.data.meta.totalPages;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchTransactions();
});

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
};

const openTrxDetail = (trx: Transaction) => {
    selectedTrx.value = trx;
    showTrxModal.value = true;
};
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Sales History</h1>
        <p class="text-gray-500 font-medium">Track and monitor all transactions across your store.</p>
      </div>
    </header>

    <div class="majoo-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Receipt Code
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Date & Time
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Staff In Charge
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Payment Type
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Revenue
              </th>
              <th scope="col" class="relative px-6 py-4 text-right">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
                <td colspan="6" class="px-6 py-12 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-light border-t-primary mx-auto"></div>
                </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
                <td colspan="6" class="px-6 py-12 text-center">
                    <p class="text-gray-400 font-medium">No sales records found for this period.</p>
                </td>
            </tr>
            <tr 
                v-for="trx in transactions" 
                :key="trx.id" 
                @click="openTrxDetail(trx)"
                class="hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              <td class="px-6 py-5 whitespace-nowrap">
                <span class="text-sm font-black text-primary bg-primary-light px-3 py-1 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                  {{ trx.code }}
                </span>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">{{ formatDate(trx.createdAt).split(' ')[0] }}</div>
                <div class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{{ formatDate(trx.createdAt).split(' ')[1] }}</div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                        <span class="text-[10px] font-bold text-gray-500">{{ (trx.cashier?.name || 'U')[0] }}</span>
                    </div>
                    <span class="text-sm font-medium text-gray-700">{{ trx.cashier?.name || 'Unknown' }}</span>
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-[10px] font-bold leading-5 rounded-lg border-2 border-gray-100 text-gray-500 uppercase tracking-widest">
                  {{ trx.paymentMethod }}
                </span>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-black text-gray-900">{{ formatCurrency(Number(trx.totalAmount)) }}</div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                  <button class="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Eye class="w-4 h-4" />
                  </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <div class="text-sm font-medium text-gray-400">
            Showing Page <span class="text-gray-900 font-bold">{{ page }}</span> of {{ totalPages }}
        </div>
        <div class="flex items-center gap-2">
            <button 
                @click.stop="page > 1 && (page--, fetchTransactions())"
                :disabled="page === 1"
                class="h-10 px-4 rounded-xl border-2 border-gray-100 font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
                Previous
            </button>
            <button 
                @click.stop="page < totalPages && (page++, fetchTransactions())"
                :disabled="page === totalPages"
                class="h-10 px-6 rounded-xl bg-primary font-bold text-white shadow-premium hover:bg-primary/90 disabled:opacity-30 transition-all"
            >
                Next
            </button>
        </div>
    </div>

    <!-- Transaction Detail Modal -->
    <TransactionDetailModal 
        :show="showTrxModal" 
        :transaction="selectedTrx" 
        @close="showTrxModal = false" 
    />
  </div>
</template>
