<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { Plus, Edit, Trash2, Search, X, Package } from 'lucide-vue-next';

// Interfaces
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category?: Category;
  categoryId: string;
  imageUrl?: string;
}

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalProducts = ref(0);
const pageLimit = 20;

const isModalOpen = ref(false);
const editingProduct = ref<Product | null>(null);
const errorMsg = ref('');

const formData = ref({
  name: '',
  sku: '',
  barcode: '',
  price: 0,
  stock: 0,
  categoryId: '',
  imageUrl: '',
});

const fetchCategories = async () => {
    try {
        const response = await api.get('/categories');
        categories.value = response.data.data.categories;
    } catch (error) {
        console.error(error);
    }
};

const fetchProducts = async () => {
    loading.value = true;
    try {
        const params: any = { page: currentPage.value, limit: pageLimit };
        if (searchQuery.value) params.search = searchQuery.value;
        const response = await api.get('/products', { params });
        products.value = response.data.data.products;
        const meta = response.data.data.meta;
        if (meta) {
            totalPages.value = meta.totalPages || 1;
            totalProducts.value = meta.total || 0;
        }
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchProducts();
};

onMounted(() => {
    fetchCategories();
    fetchProducts();
});

const openModal = (product: Product | null = null) => {
    editingProduct.value = product;
    if (product) {
        formData.value = {
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            price: Number(product.price),
            stock: product.stock,
            categoryId: product.categoryId || (product.category?.id || ''),
            imageUrl: product.imageUrl || '',
        };
    } else {
        formData.value = {
            name: '',
            sku: '',
            barcode: '',
            price: 0,
            stock: 0,
            categoryId: '',
            imageUrl: '',
        };
    }
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    editingProduct.value = null;
    errorMsg.value = '';
};

const handleSubmit = async () => {
    try {
        const payload = { ...formData.value };
        if (editingProduct.value) {
            await api.patch(`/products/${editingProduct.value.id}`, payload);
        } else {
            await api.post('/products', payload);
        }
        closeModal();
        fetchProducts();
    } catch (error: any) {
        errorMsg.value = error.response?.data?.message || 'Operation failed. Please check the product details.';
    }
};

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await api.delete(`/products/${id}`);
        fetchProducts();
    } catch (error: any) {
        errorMsg.value = error.response?.data?.message || 'Delete failed. Product may have active transactions.';
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Product Management</h1>
        <p class="text-gray-500 font-medium">Manage your inventory, pricing, and stock levels.</p>
      </div>
      <button
        @click="openModal()"
        type="button"
        class="btn-primary h-12 flex items-center justify-center gap-2 shadow-premium px-6"
      >
        <Plus class="w-5 h-5" />
        Add New Product
      </button>
    </header>

    <!-- Search & Filter Tool -->
    <div class="majoo-card p-4">
        <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
                v-model="searchQuery"
                @input="fetchProducts"
                type="text"
                class="input-majoo pl-12 h-12 bg-gray-50/50 border-none shadow-inner"
                placeholder="Search products by name, SKU, or barcode..."
            />
        </div>
    </div>

    <!-- Table Container -->
    <div class="majoo-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Product Info
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Category
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Price
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                Inventory
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                SKU
              </th>
              <th scope="col" class="px-6 py-4 text-right">
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
            <tr v-else-if="products.length === 0">
                <td colspan="6" class="px-6 py-12 text-center">
                    <Package class="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p class="text-gray-400 font-medium">No products found in the catalog.</p>
                </td>
            </tr>
            <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="flex-shrink-0">
                    <img class="h-12 w-12 rounded-xl object-cover shadow-sm ring-1 ring-gray-100" :src="product.imageUrl || `https://ui-avatars.com/api/?name=${product.name}&background=random`" alt="" />
                  </div>
                  <div>
                    <div class="text-sm font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                      {{ product.name }}
                    </div>
                    <div class="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1 bg-gray-100 inline-block px-1.5 py-0.5 rounded">
                      BARCODE: {{ product.barcode || 'N/A' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-[10px] font-bold leading-5 rounded-lg bg-primary-light text-primary uppercase tracking-widest">
                  {{ product.category?.name || 'Default' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-black text-gray-900">{{ formatCurrency(Number(product.price)) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-2">
                    <span :class="['font-black', product.stock <= 10 ? 'text-danger' : 'text-gray-700']">
                        {{ product.stock.toLocaleString() }}
                    </span>
                    <span v-if="product.stock <= 10" class="flex h-2 w-2 rounded-full bg-danger animate-pulse"></span>
                </div>
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5" v-if="product.stock <= 10">Critical Stock</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <code class="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">{{ product.sku }}</code>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button @click="openModal(product)" class="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-all">
                        <Edit class="w-4 h-4" />
                    </button>
                    <button @click="handleDelete(product.id)" class="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 class="w-4 h-4" />
                    </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-xs font-bold text-gray-400">Showing {{ (currentPage - 1) * pageLimit + 1 }}-{{ Math.min(currentPage * pageLimit, totalProducts) }} of {{ totalProducts }} products</p>
          <div class="flex items-center gap-2">
              <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="px-3 py-2 text-xs font-bold rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Prev</button>
              <template v-for="p in totalPages" :key="p">
                  <button v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)" @click="goToPage(p)" :class="['px-3 py-2 text-xs font-bold rounded-lg transition-all', p === currentPage ? 'bg-primary text-white shadow-premium' : 'border border-gray-100 hover:bg-gray-50 text-gray-500']">
                      {{ p }}
                  </button>
                  <span v-else-if="p === currentPage - 3 || p === currentPage + 3" class="text-gray-300 text-xs">...</span>
              </template>
              <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="px-3 py-2 text-xs font-bold rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next</button>
          </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
        <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div class="majoo-card w-full max-w-lg shadow-2xl scale-in overflow-hidden">
            <div class="p-6 border-b border-gray-50 flex items-center justify-between bg-primary/5">
              <h3 class="text-xl font-bold text-gray-900">
                {{ editingProduct ? 'Modify Product' : 'Register New Product' }}
              </h3>
              <button @click="closeModal" class="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white shadow-sm transition-all">
                <X class="w-5 h-5" />
              </button>
            </div>
            
            <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                    <input v-model="formData.name" type="text" required class="input-majoo" placeholder="e.g. Arabica Coffee 250g" />
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Inventory SKU</label>
                        <input v-model="formData.sku" type="text" required class="input-majoo" placeholder="COF-001" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Barcode EAN</label>
                        <input v-model="formData.barcode" type="text" class="input-majoo" placeholder="Optional" />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retail Price</label>
                        <input v-model="formData.price" type="number" required class="input-majoo" placeholder="0" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Initial Stock</label>
                        <input v-model="formData.stock" type="number" required class="input-majoo" placeholder="0" />
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department / Category</label>
                    <select v-model="formData.categoryId" required class="input-majoo appearance-none">
                        <option value="" disabled>Select Department</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Image URI</label>
                    <input v-model="formData.imageUrl" type="text" placeholder="https://..." class="input-majoo" />
                </div>
                
                <div v-if="errorMsg" class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
                    {{ errorMsg }}
                </div>
                <div class="pt-4 flex gap-4">
                    <button type="button" @click="closeModal" class="flex-1 px-4 py-4 rounded-xl border-2 border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                    <button type="submit" class="flex-[2] btn-primary shadow-premium py-4">
                        {{ editingProduct ? 'Sync Changes' : 'Create Product' }}
                    </button>
                </div>
            </form>
          </div>
        </div>
    </Teleport>
  </div>
</template>
