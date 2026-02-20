<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const authStore = useAuthStore();

const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
        authStore.error = 'Passwords do not match';
        return;
    }
    await authStore.register(name.value, email.value, password.value);
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
            <h2 class="text-4xl font-black text-white mb-4 tracking-tight">Step into the Future of Retail</h2>
            <p class="text-primary-light font-medium text-lg leading-relaxed opacity-80">
                Join thousands of businesses scaling their operations with Majoo's ecosystem.
            </p>
        </div>
    </div>

    <!-- Right Side: Registration Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[40px] shadow-2xl md:-ml-12 z-20">
      <div class="max-w-md w-full">
        <div class="mb-10">
            <div class="md:hidden flex items-center gap-2 mb-8">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span class="text-white text-xs font-black">M</span>
                </div>
                <span class="text-xl font-black text-gray-900 tracking-tighter">Majoo POS</span>
            </div>
            <h1 class="text-4xl font-black text-gray-900 tracking-tight mb-2">Create Account</h1>
            <p class="text-gray-500 font-medium">Start your 14-day free trial today.</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div v-if="authStore.error" class="bg-red-50 text-danger p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
            <span class="w-2 h-2 rounded-full bg-danger"></span>
            {{ authStore.error }}
          </div>

          <div class="space-y-5">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                v-model="name"
                type="text"
                required
                class="input-majoo"
                placeholder="Manager Name"
              />
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Business Email</label>
              <input
                v-model="email"
                type="email"
                required
                class="input-majoo"
                placeholder="store@domain.com"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <input
                    v-model="password"
                    type="password"
                    required
                    class="input-majoo"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm</label>
                  <input
                    v-model="confirmPassword"
                    type="password"
                    required
                    class="input-majoo"
                    placeholder="••••••••"
                  />
                </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary h-14 flex items-center justify-center gap-3 shadow-premium mt-4"
          >
            <div v-if="authStore.loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span class="font-bold">{{ authStore.loading ? 'Creating Account...' : 'Get Started Now' }}</span>
          </button>

          <div class="text-center pt-2">
            <p class="text-sm font-medium text-gray-500">
              Already have an account? 
              <router-link to="/login" class="text-primary font-bold hover:underline">Sign In</router-link>
            </p>
          </div>
        </form>

        <div class="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between">
            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2024 Majoo Indonesia</span>
            <div class="flex gap-4">
                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-400 cursor-pointer transition-colors">TOS</span>
                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
