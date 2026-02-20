<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();

const handleLogin = async () => {
  if (!email.value || !password.value) return;
  await authStore.login(email.value, password.value);
};
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
    <!-- Left Side: Branding & Illustration -->
    <div class="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#1e5adb]"></div>
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 text-center max-w-sm">
            <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8 transform rotate-12">
                <span class="text-primary text-4xl font-black">M</span>
            </div>
            <h2 class="text-4xl font-black text-white mb-4 tracking-tight">Grow your business with Majoo</h2>
            <p class="text-primary-light font-medium text-lg leading-relaxed opacity-80">
                The most complete point of sale system for retail, F&B, and service businesses.
            </p>
        </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[40px] shadow-2xl md:-ml-12 z-20">
      <div class="max-w-md w-full">
        <div class="mb-12">
            <div class="md:hidden flex items-center gap-2 mb-8">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span class="text-white text-xs font-black">M</span>
                </div>
                <span class="text-xl font-black text-gray-900 tracking-tighter">Majoo POS</span>
            </div>
            <h1 class="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h1>
            <p class="text-gray-500 font-medium">Please enter your workspace credentials.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-8">
          <div v-if="authStore.error" class="bg-red-50 text-danger p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
            <span class="w-2 h-2 rounded-full bg-danger"></span>
            {{ authStore.error }}
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Workspace Email</label>
              <div class="relative group">
                <input
                    v-model="email"
                    type="email"
                    required
                    class="input-majoo pl-4"
                    placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Key</label>
                  <a href="#" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</a>
              </div>
              <input
                v-model="password"
                type="password"
                required
                class="input-majoo pl-4"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary h-14 flex items-center justify-center gap-3 shadow-premium"
          >
            <div v-if="authStore.loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span class="font-bold">{{ authStore.loading ? 'Authenticating...' : 'Secure Sign In' }}</span>
          </button>

          <div class="text-center">
            <p class="text-sm font-medium text-gray-500">
              Not part of a workspace? 
              <router-link to="/register" class="text-primary font-bold hover:underline">Create Organization</router-link>
            </p>
          </div>
        </form>

        <div class="mt-16 pt-8 border-t border-gray-50 flex items-center justify-between">
            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2024 Majoo Indonesia</span>
            <div class="flex gap-4">
                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-400 cursor-pointer transition-colors">Support</span>
                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-400 cursor-pointer transition-colors">Legal</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
