<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import api from '../api';
import { 
  Plus, Edit, Trash2, X, ChevronRight, 
  Image as ImageIcon, Layers, ArrowLeft, 
  Package, Search, ChevronLeft 
} from 'lucide-vue-next';

interface SubCategory {
    id: string;
    name: string;
    imageUrl?: string;
    parentId: string;
}

interface ParentCategory {
    id: string;
    name: string;
    imageUrl?: string;
    children: SubCategory[];
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string;
}

const tree = ref<ParentCategory[]>([]);
const loading = ref(false);
const productsLoading = ref(false);
const selectedParent = ref<ParentCategory | null>(null);
const selectedSub = ref<SubCategory | null>(null);

// Products state
const products = ref<Product[]>([]);
const productMeta = ref({ total: 0, page: 1, limit: 12, totalPages: 1 });
const searchQuery = ref('');

// Modal state
const isModalOpen = ref(false);
const modalMode = ref<'parent' | 'child' | 'product'>('parent');
const editingCategory = ref<ParentCategory | SubCategory | null>(null);
const formName = ref('');
const formImageUrl = ref('');
const errorMsg = ref('');

const selectedChildren = computed(() => selectedParent.value?.children ?? []);

const fetchTree = async () => {
    loading.value = true;
    try {
        const res = await api.get('/categories/tree');
        tree.value = res.data.data.tree;
        
        // Restore selection if possible
        if (selectedParent.value) {
            selectedParent.value = tree.value.find(p => p.id === selectedParent.value!.id) || tree.value[0] || null;
        } else {
            selectedParent.value = tree.value[0] || null;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const fetchProducts = async (page = 1) => {
    if (!selectedSub.value) return;
    productsLoading.value = true;
    try {
        const res = await api.get('/products', {
            params: {
                categoryId: selectedSub.value.id,
                page: page,
                limit: productMeta.value.limit,
                search: searchQuery.value
            }
        });
        products.value = res.data.data.products;
        productMeta.value = res.data.data.meta;
    } catch (e) {
        console.error(e);
    } finally {
        productsLoading.value = false;
    }
};

onMounted(fetchTree);

const selectParent = (p: ParentCategory) => {
    selectedParent.value = p;
    selectedSub.value = null; // Clear sub-category view
    products.value = [];
};

const selectSub = (sub: SubCategory) => {
    selectedSub.value = sub;
    productMeta.value.page = 1;
    fetchProducts(1);
};

const goBackToSubs = () => {
    selectedSub.value = null;
    products.value = [];
};

watch(searchQuery, () => {
    if (selectedSub.value) {
        productMeta.value.page = 1;
        fetchProducts(1);
    }
});

// Modal Logic
const openAddParent = () => {
    modalMode.value = 'parent';
    editingCategory.value = null;
    formName.value = '';
    formImageUrl.value = '';
    isModalOpen.value = true;
};

const openAddChild = () => {
    modalMode.value = 'child';
    editingCategory.value = null;
    formName.value = '';
    formImageUrl.value = '';
    isModalOpen.value = true;
};

const openEdit = (cat: ParentCategory | SubCategory, mode: 'parent' | 'child') => {
    modalMode.value = mode;
    editingCategory.value = cat;
    formName.value = cat.name;
    formImageUrl.value = cat.imageUrl || '';
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    editingCategory.value = null;
    errorMsg.value = '';
};

const handleSubmit = async () => {
    try {
        const payload: any = { name: formName.value };
        if (formImageUrl.value) payload.imageUrl = formImageUrl.value;

        if (editingCategory.value) {
            await api.patch(`/categories/${editingCategory.value.id}`, payload);
        } else {
            if (modalMode.value === 'child' && selectedParent.value) {
                payload.parentId = selectedParent.value.id;
            }
            await api.post('/categories', payload);
        }
        closeModal();
        await fetchTree();
    } catch (e: any) {
        errorMsg.value = e.response?.data?.message || 'Operasi gagal.';
    }
};

const handleDelete = async (id: string, isParent: boolean) => {
    const msg = isParent
        ? 'Hapus kategori utama dan semua sub-kategorinya?'
        : 'Hapus sub-kategori ini?';
    if (!confirm(msg)) return;
    try {
        await api.delete(`/categories/${id}`);
        if (isParent && selectedParent.value?.id === id) selectedParent.value = null;
        if (!isParent && selectedSub.value?.id === id) selectedSub.value = null;
        await fetchTree();
    } catch (e: any) {
        alert(e.response?.data?.message || 'Gagal menghapus.');
    }
};

const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers class="w-5 h-5 text-primary" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Kategori</h1>
        </div>
        <p class="text-gray-500 font-medium ml-[52px]">Telusuri hierarki kategori dan produk.</p>
      </div>
      <div v-if="!selectedSub" class="flex gap-3">
        <button @click="openAddParent" class="h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all">
          <Plus class="w-4 h-4" />
          Kategori Utama
        </button>
        <button @click="openAddChild" :disabled="!selectedParent" class="btn-primary h-11 flex items-center gap-2 px-5 shadow-premium disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus class="w-4 h-4" />
          Sub Kategori
        </button>
      </div>
    </header>

    <!-- Main Content Grid -->
    <div class="majoo-card overflow-hidden flex" style="min-height: 600px;">

      <!-- LEFT PANEL: Parent Categories (Fixed Width) -->
      <div class="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 overflow-y-auto">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori Utama</p>
          <button v-if="loading" class="animate-spin text-primary"><Layers class="w-3 h-3" /></button>
        </div>
        <ul>
          <li
            v-for="parent in tree"
            :key="parent.id"
            @click="selectParent(parent)"
            :class="[
              'group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-4',
              selectedParent?.id === parent.id
                ? 'border-primary bg-white text-primary font-bold shadow-sm'
                : 'border-transparent hover:bg-white hover:text-primary text-gray-700 font-semibold'
            ]"
          >
            <div class="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-50">
              <img v-if="parent.imageUrl" :src="parent.imageUrl" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center"><ImageIcon class="w-3 h-3 text-gray-300" /></div>
            </div>
            <span class="flex-1 text-sm leading-tight">{{ parent.name }}</span>
            <div class="flex items-center opacity-0 group-hover:opacity-100 transition-all">
               <button @click.stop="openEdit(parent, 'parent')" class="p-1 hover:text-primary"><Edit class="w-3 h-3" /></button>
               <button @click.stop="handleDelete(parent.id, true)" class="p-1 hover:text-red-500"><Trash2 class="w-3 h-3" /></button>
            </div>
          </li>
        </ul>
      </div>

      <!-- RIGHT PANEL: CONTENT -->
      <div class="flex-1 flex flex-col bg-white">
        
        <!-- RIGHT PANEL HEADER / BREADCRUMB -->
        <div class="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div class="flex items-center gap-3">
            <button v-if="selectedSub" @click="goBackToSubs" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-all">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div>
              <nav class="flex items-center gap-1 text-[10px] font-bold text-gray-300 uppercase tracking-tighter mb-0.5">
                <span>{{ selectedParent?.name || 'Pilih Kategori' }}</span>
                <ChevronRight v-if="selectedSub" class="w-3 h-3" />
                <span v-if="selectedSub" class="text-primary">{{ selectedSub.name }}</span>
              </nav>
              <h2 class="text-xl font-bold text-gray-900 leading-none">
                {{ selectedSub ? selectedSub.name : (selectedParent ? 'Sub-Kategori' : 'Kategori Utama') }}
              </h2>
            </div>
          </div>
          
          <!-- Search for Products -->
          <div v-if="selectedSub" class="relative group">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari produk..." 
              class="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-48 transition-all"
            />
          </div>
        </div>

        <!-- VIEW 1: SELECT CATEGORY MSG -->
        <div v-if="!selectedParent" class="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-50">
          <Layers class="w-16 h-16 text-gray-200 mb-4" />
          <h3 class="text-lg font-bold text-gray-400">Silakan pilih kategori utama</h3>
          <p class="text-sm text-gray-300">Gunakan daftar di sebelah kiri untuk menavigasi.</p>
        </div>

        <!-- VIEW 2: SUB-CATEGORY GRID -->
        <div v-else-if="!selectedSub" class="flex-1 p-6">
          <div v-if="selectedChildren.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <p class="text-gray-400 font-medium mb-3">Belum ada sub-kategori untuk {{ selectedParent.name }}</p>
            <button @click="openAddChild" class="text-primary font-bold hover:underline flex items-center gap-2">
              <Plus class="w-4 h-4" /> Tambah Sub-Kategori
            </button>
          </div>
          <div v-else class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div 
              v-for="sub in selectedChildren" 
              :key="sub.id"
              @click="selectSub(sub)"
              class="group cursor-pointer space-y-3"
            >
              <div class="aspect-square rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 group-hover:border-primary/40 group-hover:shadow-xl transition-all relative">
                <img v-if="sub.imageUrl" :src="sub.imageUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div v-else class="w-full h-full flex items-center justify-center"><ImageIcon class="w-8 h-8 text-gray-200" /></div>
                
                <!-- Action Buttons overlapping image -->
                <div class="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button @click.stop="openEdit(sub, 'child')" class="w-8 h-8 rounded-lg bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-primary"><Edit class="w-4 h-4" /></button>
                  <button @click.stop="handleDelete(sub.id, false)" class="w-8 h-8 rounded-lg bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-red-500"><Trash2 class="w-4 h-4" /></button>
                </div>
                
                <div class="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="bg-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-primary tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform">Lihat Produk</span>
                </div>
              </div>
              <p class="text-xs font-black text-center text-gray-700 uppercase tracking-wide group-hover:text-primary transition-colors">{{ sub.name }}</p>
            </div>
          </div>
        </div>

        <!-- VIEW 3: PRODUCTS GRID -->
        <div v-else class="flex-1 flex flex-col">
          <!-- Products Area -->
          <div v-if="productsLoading" class="flex-1 flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
          
          <div v-else-if="products.length === 0" class="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <Package class="w-16 h-16 text-gray-100 mb-4" />
            <h3 class="text-gray-400 font-bold">Produk Tidak Ditemukan</h3>
            <p class="text-sm text-gray-300">Belum ada stok atau hasil pencarian nihil.</p>
          </div>

          <div v-else class="flex-1 p-6">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
              <div v-for="p in products" :key="p.id" class="majoo-card p-3 group hover:border-primary/20 transition-all">
                <div class="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 border border-gray-100">
                  <img v-if="p.imageUrl" :src="p.imageUrl" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div v-else class="w-full h-full flex items-center justify-center"><Package class="w-8 h-8 text-gray-100" /></div>
                </div>
                <div class="space-y-1">
                  <p class="text-[9px] font-black text-primary/40 uppercase tracking-tighter">{{ p.sku }}</p>
                  <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{{ p.name }}</h4>
                  <div class="flex items-center justify-between pt-1">
                    <span class="text-xs font-black text-gray-900">{{ formatPrice(p.price) }}</span>
                    <span :class="['text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase', p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500']">
                      Stock: {{ p.stock }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Pagination -->
            <div v-if="productMeta.totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
              <button 
                @click="fetchProducts(productMeta.page - 1)" 
                :disabled="productMeta.page === 1"
                class="p-2 rounded-lg border border-gray-100 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <div class="flex items-center gap-1">
                <span class="text-sm font-bold text-gray-900">{{ productMeta.page }}</span>
                <span class="text-sm text-gray-300">dari</span>
                <span class="text-sm font-bold text-gray-900">{{ productMeta.totalPages }}</span>
              </div>
              <button 
                @click="fetchProducts(productMeta.page + 1)" 
                :disabled="productMeta.page === productMeta.totalPages"
                class="p-2 rounded-lg border border-gray-100 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Modal (CRUD) -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
        <div class="majoo-card w-full max-w-md shadow-2xl scale-in overflow-hidden">
          <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-primary/5">
            <h3 class="text-lg font-bold text-gray-900">
              {{ editingCategory ? 'Edit Kategori' : (modalMode === 'parent' ? 'Kategori Utama Baru' : `Sub-Kategori Baru untuk ${selectedParent?.name}`) }}
            </h3>
            <button @click="closeModal" class="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white transition-all"><X class="w-5 h-5" /></button>
          </div>
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <div class="w-full h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
              <img v-if="formImageUrl" :src="formImageUrl" class="w-full h-full object-cover" />
              <div v-else class="text-gray-200 flex flex-col items-center gap-1"><ImageIcon class="w-8 h-8" /><span class="text-[10px] uppercase font-bold tracking-widest">Image Preview</span></div>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Kategori</label>
              <input v-model="formName" type="text" required class="input-majoo w-full" placeholder="e.g. Makanan Ringan" />
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">URL Gambar (Opsional)</label>
              <input v-model="formImageUrl" type="url" class="input-majoo w-full" placeholder="https://..." />
            </div>
            <p v-if="errorMsg" class="text-xs text-red-500 font-bold px-2">{{ errorMsg }}</p>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 py-3 rounded-xl border-2 border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all">Batal</button>
              <button type="submit" class="flex-[2] btn-primary shadow-premium py-3">Simpan Perubahan</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.majoo-card {
  @apply bg-white rounded-[32px] border border-gray-100 shadow-premium;
}
.shadow-premium {
  box-shadow: 0 20px 50px rgba(0,0,0,0.03);
}
.scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #f1f1f1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #e1e1e1;
}
</style>
