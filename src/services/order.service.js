import { DbAdapter } from './db.adapter';
import { AdminService } from './admin.service';
import { PRODUCTS, LOGISTICS_INFO, ALL_TOWNS, getDeliveryDaysForTown } from './catalog.service';

// Las constantes PRODUCTS, LOGISTICS_INFO, ALL_TOWNS y getDeliveryDaysForTown se importan ahora de catalog.service.js

/**
 * SERVICIO DE PEDIDOS (OrderService)
 * Gestiona el ciclo de vida de una compra: catálogo, logística y creación.
 */
export const OrderService = {
    getProducts: () => PRODUCTS,
    getLogistics: () => LOGISTICS_INFO,

    /**
     * Crea un nuevo pedido en la base de datos y notifica al administrador.
     * @param {Object} orderData - Toda la info del pedido (productos, total, dirección).
     */
    createOrder: async (orderData) => {
        // Guardamos el pedido usando el adaptador
        const order = await DbAdapter.createOrder(orderData);

        // Notificamos a Ivan (admin) para que sepa que hay trabajo nuevo
        try {
            await AdminService.notifyNewOrder(order);
        } catch (e) {
            console.error('Error al notificar pedido al admin:', e);
        }

        return order;
    },

    getUserOrders: async (userId) => {
        // Delegar en el adaptador (Supabase o Local)
        return await DbAdapter.getUserOrders(userId);
    },

    getRecurringSuggestion: async (userId) => {
        // Ahora es async porque getUserOrders lo es
        const orders = await OrderService.getUserOrders(userId);
        if (orders.length === 0) return null;

        const lastOrder = orders[0];
        const validItems = lastOrder.items.filter(item =>
            PRODUCTS.some(p => p.id === item.id)
        );

        if (validItems.length === 0) return null;

        return {
            items: validItems,
            lastDate: lastOrder.createdAt
        };
    }
};
