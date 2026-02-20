<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

interface StockMovement {
    id: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
    createdAt: string;
    product: {
        name: string;
        sku: string;
    };
}

const movements = ref<StockMovement[]>([]);
const loading = ref(false);

const fetchMovements = async () => {
    loading.value = true;
    try {
        const response = await api.get('/stocks');
        movements.value = response.data.data.movements;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchMovements();
});

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
};
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Stock Movement Log</h1>
        <p class="text-gray-500 font-medium">Detailed tracking of inventory ins and outs.</p>
      </div>
    </header>

    <div class="majoo-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Timestamp
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Product Details
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Flow Type
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Quantity
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Reference / Reason
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
                <td colspan="5" class="px-6 py-12 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-light border-t-primary mx-auto"></div>
                </td>
            </tr>
            <tr v-else-if="movements.length === 0">
                <td colspan="5" class="px-6 py-12 text-center">
                    <p class="text-gray-400 font-medium">No movement records found.</p>
                </td>
            </tr>
            <tr v-for="item in movements" :key="item.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">{{ formatDate(item.createdAt).split(' ')[0] }}</div>
                <div class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{{ formatDate(item.createdAt).split(' ')[1] }}</div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900 leading-tight">
                  {{ item.product.name }}
                </div>
                <div class="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                  SKU: {{ item.product.sku }}
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <span 
                    :class="[
                        'px-3 py-1 inline-flex text-[10px] font-black leading-5 rounded-lg border-2 uppercase tracking-widest',
                        item.type === 'IN' ? 'border-primary-light text-primary bg-primary-light/30' : 
                        item.type === 'OUT' ? 'border-red-50 text-danger bg-red-50/30' :
                        'border-gray-100 text-gray-500 bg-gray-50'
                    ]"
                >
                    {{ item.type }}
                </span>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div :class="['flex items-center gap-1 text-sm font-black', item.type === 'IN' ? 'text-primary' : 'text-danger']">
                    <ArrowUp v-if="item.type === 'IN'" class="h-4 w-4" />
                    <ArrowDown v-else class="h-4 w-4" />
                    {{ item.type === 'IN' ? '+' : '-' }}{{ item.quantity.toLocaleString() }}
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-500 max-w-xs truncate">
                    {{ item.reason || 'No description provided' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
