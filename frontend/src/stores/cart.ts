import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Product {
    id: string;
    name: string;
    price: string | number;
    stock: number;
    category?: { name: string };
    sku: string;
    barcode?: string;
    imageUrl?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    price: number; // Snapshot of price at time of adding
}

export const useCartStore = defineStore('cart', () => {
    const items = ref<CartItem[]>([]);
    const taxRate = ref(0.11); // 11% tax (PPN)
    const discount = ref(0);

    const subtotal = computed(() => {
        return items.value.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    });

    const tax = computed(() => {
        return subtotal.value * taxRate.value;
    });

    const total = computed(() => {
        return subtotal.value + tax.value - discount.value;
    });

    function addItem(product: Product) {
        const existingItem = items.value.find(item => item.product.id === product.id);
        const price = Number(product.price);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            items.value.push({
                product,
                quantity: 1,
                price
            });
        }
    }

    function removeItem(productId: string) {
        const index = items.value.findIndex(item => item.product.id === productId);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }

    function updateQuantity(productId: string, quantity: number) {
        const item = items.value.find(item => item.product.id === productId);
        if (item) {
            if (quantity <= 0) {
                removeItem(productId);
            } else if (quantity <= item.product.stock) {
                item.quantity = quantity;
            } else {
                // Handle stock limit?
                // For now just set to stock limit or ignore
                item.quantity = item.product.stock;
            }
        }
    }

    function clearCart() {
        items.value = [];
        discount.value = 0;
    }

    return {
        items,
        taxRate,
        discount,
        subtotal,
        tax,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
    };
});
