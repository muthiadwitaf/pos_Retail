import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import router from '../router';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
    const token = ref<string | null>(localStorage.getItem('token'));
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.role === 'ADMIN');

    async function login(email: string, password: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, user: newUser } = response.data.data;

            token.value = newToken;
            user.value = newUser;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            router.push('/');
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Login failed';
        } finally {
            loading.value = false;
        }
    }

    async function register(name: string, email: string, password: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.post('/auth/register', { name, email, password });
            const { token: newToken, user: newUser } = response.data.data;

            token.value = newToken;
            user.value = newUser;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            router.push('/');
        } catch (err: any) {
            console.error('Registration Error:', err.response?.data || err.message);
            error.value = err.response?.data?.message || 'Registration failed';
        } finally {
            loading.value = false;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    }

    return {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
    };
});
