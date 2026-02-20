import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import MainLayout from '../layouts/MainLayout.vue';
import POS from '../views/POS.vue';
import Products from '../views/Products.vue';
import Transactions from '../views/Transactions.vue';
import Categories from '../views/Categories.vue';
import Stock from '../views/Stock.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: Login,
            meta: { guest: true }
        },
        {
            path: '/register',
            name: 'Register',
            component: Register,
            meta: { guest: true }
        },
        {
            path: '/',
            component: MainLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'Dashboard',
                    component: Dashboard
                },
                { path: 'pos', name: 'POS', component: POS },
                {
                    path: 'products',
                    name: 'Products',
                    component: Products
                },
                {
                    path: 'categories',
                    name: 'Categories',
                    component: Categories
                },
                {
                    path: 'transactions',
                    name: 'Transactions',
                    component: Transactions
                },
                {
                    path: 'stock',
                    name: 'Stock',
                    component: Stock
                },
            ]
        }
    ],
});

router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.meta.guest && authStore.isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
