<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  History, 
  Layers, 
  LogOut,
  Menu
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isSidebarOpen = ref(true);

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Transactions', href: '/transactions', icon: History },
  { name: 'Stock', href: '/stock', icon: Layers },
];

const handleLogout = () => {
  authStore.logout();
};
</script>

<template>
  <div class="flex h-screen bg-background font-sans">
    <!-- Sidebar -->
    <aside 
      :class="[
        'bg-white border-r border-gray-100 text-gray-800 flex flex-col transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <div class="flex items-center justify-between h-20 px-6">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">M</span>
            </div>
            <span v-if="isSidebarOpen" class="text-xl font-bold tracking-tight text-gray-900">Majoo<span class="text-primary">POS</span></span>
        </div>
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 rounded-xl hover:bg-gray-50 text-gray-400">
            <Menu class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            route.path === item.href ? 'bg-primary-light text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200'
          ]"
        >
          <component :is="item.icon" :class="[route.path === item.href ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600', 'mr-4 flex-shrink-0 h-5 w-5']" />
          <span v-if="isSidebarOpen">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-4 bg-gray-50/50 m-4 rounded-2xl border border-gray-100">
        <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
                <img class="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-sm" src="https://ui-avatars.com/api/?name=Admin+User&background=2367F6&color=fff" alt="" />
            </div>
            <div v-if="isSidebarOpen" class="min-w-0 flex-1">
                <p class="text-sm font-bold text-gray-900 truncate">{{ authStore.user?.name || 'User' }}</p>
                <p class="text-xs font-medium text-gray-500 truncate">{{ authStore.user?.role || 'Role' }}</p>
            </div>
            <button v-if="isSidebarOpen" @click="handleLogout" class="p-2 text-gray-400 hover:text-danger-dark hover:bg-red-50 rounded-lg transition-colors">
                <LogOut class="w-4 h-4" />
            </button>
        </div>
        <button v-if="!isSidebarOpen" @click="handleLogout" class="mt-2 w-full flex justify-center p-2 text-gray-400 hover:text-danger rounded-lg">
            <LogOut class="w-5 h-5" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto bg-background">
      <div class="p-8">
        <div class="max-w-[1600px] mx-auto">
            <router-view></router-view>
        </div>
      </div>
    </main>
  </div>
</template>
