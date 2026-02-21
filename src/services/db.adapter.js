import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Nombres de las claves para almacenamiento local (Fallback)
const USERS_KEY = 'mh_users';
const ORDERS_KEY = 'mh_orders';
const INVENTORY_KEY = 'mh_inventory';
const CURRENT_USER_KEY = 'mandamoshuevos_current_user';

/**
 * ADAPTADOR DE BASE DE DATOS (DbAdapter)
 * 
 * Este es el corazón de la persistencia de Mandahuevos. 
 * Implementa un patrón "Híbrido/Fallback":
 * 1. Si Supabase está configurado (.env con claves válidas), usa la base de datos real en la nube.
 * 2. Si no, usa LocalStorage para que la aplicación sea funcional en modo demo o desarrollo offline.
 */
export const DbAdapter = {
    // --- AUTENTICACIÓN Y USUARIOS ---

    authenticate: async (email, password) => {
        if (!isSupabaseConfigured() && email === 'GranHuevon' && password === 'Huevosde0R0.COM') {
            return { id: 'admin-id', name: 'Gran Huevón', email: 'GranHuevon', role: 'admin' };
        }

        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                const newProfile = {
                    id: data.user.id,
                    email: data.user.email,
                    role: 'user',
                    full_name: data.user.user_metadata?.full_name || '',
                    address: data.user.user_metadata?.address || '',
                    address_2: data.user.user_metadata?.address_2 || '',
                    town: data.user.user_metadata?.town || '',
                    postal_code: data.user.user_metadata?.postal_code || '',
                    dni: data.user.user_metadata?.dni || '',
                    phone: data.user.user_metadata?.phone || '',
                    updated_at: new Date().toISOString()
                };

                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .upsert(newProfile)
                    .select()
                    .single();

                if (!createError) {
                    profile = createdProfile;
                } else {
                    profile = { id: data.user.id, email: data.user.email, role: 'user' };
                }
            }

            return {
                ...profile,
                email: data.user.email,
                accessToken: data.session.access_token
            };

        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            return user || null;
        }
    },

    createUser: async (userData) => {
        if (isSupabaseConfigured()) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name || userData.full_name,
                        address: userData.address,
                        address_2: userData.address_2,
                        town: userData.town,
                        postal_code: userData.postal_code,
                        dni: userData.dni,
                        phone: userData.phone
                    }
                }
            });

            if (authError) throw authError;

            const profileData = {
                id: authData.user.id,
                full_name: userData.name || userData.full_name,
                address: userData.address,
                address_2: userData.address_2,
                town: userData.town,
                postal_code: userData.postal_code,
                dni: userData.dni,
                phone: userData.phone,
                email: userData.email,
                role: 'user',
                updated_at: new Date().toISOString()
            };

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData)
                .select()
                .single();

            if (profileError) console.error('Error creando perfil:', profileError);

            return { ...profile, email: userData.email };
        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            users.push(userData);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return userData;
        }
    },

    getAllProfiles: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });
            return error ? [] : data;
        } else {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        }
    },

    getUserById: async (userId) => {
        if (isSupabaseConfigured()) {
            let query = supabase.from('profiles').select('*');
            if (userId && userId.includes('@')) {
                query = query.eq('email', userId);
            } else {
                query = query.eq('id', userId);
            }

            const { data, error } = await query.single();
            return error ? null : data;
        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            return users.find(u => u.id === userId || u.email === userId) || null;
        }
    },

    updateUser: async (userId, updates) => {
        if (isSupabaseConfigured()) {
            const cleanUpdates = { ...updates };
            if (cleanUpdates.name) {
                if (!cleanUpdates.full_name) cleanUpdates.full_name = cleanUpdates.name;
                delete cleanUpdates.name;
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(cleanUpdates)
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const index = users.findIndex(u => u.id === userId || u.email === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...updates };
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
                const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
                if (currentUser && (currentUser.id === userId || currentUser.email === userId)) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
                }
                return users[index];
            }
            return null;
        }
    },

    updateUserDiscount: async (userId, discountPercent) => {
        if (isSupabaseConfigured()) {
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ discount_percent: discountPercent })
                .eq('id', userId)
                .select()
                .single();
            if (updateError) throw updateError;
            return data;
        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const index = users.findIndex(u => u.id === userId || u.email === userId);
            if (index !== -1) {
                users[index].discount_percent = discountPercent;
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
                return users[index];
            }
            return null;
        }
    },

    // --- PEDIDOS ---

    createOrder: async (orderData) => {
        if (isSupabaseConfigured()) {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id_ref: orderData.userId,
                    total: orderData.total,
                    delivery_date: orderData.deliveryDate,
                    payment_method: orderData.paymentMethod,
                    status: 'pending',
                    invoice_number: orderData.invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                    shipping_address: orderData.shippingAddress,
                    shipping_address_2: orderData.shippingAddress2,
                    shipping_town: orderData.shippingTown,
                    shipping_postal_code: orderData.shippingPostalCode,
                    is_recurring: orderData.isRecurring || false
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            const items = orderData.items.map(item => ({
                order_id: order.id,
                product_id: item.id || item.productId,
                quantity: item.quantity,
                price_at_purchase: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(items);

            if (itemsError) throw itemsError;

            return { ...order, items: orderData.items };
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const newOrder = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: 'pending',
                invoiceNumber: `INV-${new Date().getFullYear()}-${(orders.length + 1).toString().padStart(4, '0')}`,
                isRecurring: orderData.isRecurring || false,
                ...orderData
            };
            orders.push(newOrder);
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
            return newOrder;
        }
    },

    getUserOrders: async (userId) => {
        if (isSupabaseConfigured()) {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id,created_at,total,status,delivery_date,payment_method,invoice_number,shipping_address,shipping_town,is_recurring,order_items(product_id,quantity,price_at_purchase)')
                .eq('user_id_ref', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error obteniendo pedidos del usuario:', error);
                return [];
            }

            return orders.map(o => ({
                id: o.id,
                createdAt: o.created_at,
                total: o.total,
                status: o.status,
                deliveryDate: o.delivery_date,
                paymentMethod: o.payment_method,
                invoiceNumber: o.invoice_number,
                shippingAddress: o.shipping_address,
                shippingTown: o.shipping_town,
                isRecurring: o.is_recurring,
                items: (o.order_items || []).map(i => ({
                    id: i.product_id,
                    name: `Producto ${i.product_id}`,
                    price: i.price_at_purchase,
                    quantity: i.quantity
                }))
            }));
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    },

    getGlobalStats: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('order_items')
                .select('quantity, product_id');
            return error ? [] : data;
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.flatMap(o => o.items);
        }
    },

    // --- ADMINISTRACIÓN ---

    getAllOrders: async () => {
        if (isSupabaseConfigured()) {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id,created_at,total,status,delivery_date,payment_method,invoice_number,user_id_ref,shipping_address,shipping_town,is_recurring,profiles(email),order_items(product_id,quantity,price_at_purchase)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error obteniendo todos los pedidos:', error);
                throw error;
            }

            return orders.map(o => ({
                id: o.id,
                userId: o.user_id_ref,
                createdAt: o.created_at,
                total: o.total,
                status: o.status,
                deliveryDate: o.delivery_date,
                paymentMethod: o.payment_method,
                invoiceNumber: o.invoice_number,
                shippingAddress: o.shipping_address,
                shippingTown: o.shipping_town,
                isRecurring: o.is_recurring,
                items: (o.order_items || []).map(i => ({
                    id: i.product_id,
                    price: i.price_at_purchase,
                    quantity: i.quantity
                }))
            }));
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    },

    updateOrderStatus: async (orderId, newStatus) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const index = orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                orders[index].status = newStatus;
                localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
                return orders[index];
            }
            return null;
        }
    },

    deleteOrder: async (orderId) => {
        if (isSupabaseConfigured()) {
            await supabase.from('order_items').delete().eq('order_id', orderId);
            const { error } = await supabase.from('orders').delete().eq('id', orderId);
            if (error) throw error;
            return true;
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const updatedOrders = orders.filter(o => o.id !== orderId);
            localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
            return true;
        }
    },

    getPendingOrdersCount: async () => {
        if (isSupabaseConfigured()) {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            return error ? 0 : count;
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.filter(o => o.status === 'pending').length;
        }
    },

    getInventory: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('inventory').select('*');
            if (error) throw error;
            return data;
        } else {
            let inventory = JSON.parse(localStorage.getItem('mandamoshuevos_inventory') || '[]');
            if (inventory.length === 0) {
                inventory = [
                    { product_id: 'carton-xxl', stock_quantity: 100, min_stock_alert: 10 },
                    { product_id: 'carton-l', stock_quantity: 100, min_stock_alert: 10 },
                    { product_id: 'carton-m', stock_quantity: 100, min_stock_alert: 10 }
                ];
                localStorage.setItem('mandamoshuevos_inventory', JSON.stringify(inventory));
            }
            return inventory;
        }
    },

    updateStock: async (productId, delta) => {
        if (isSupabaseConfigured()) {
            const { data: item } = await supabase
                .from('inventory')
                .select('stock_quantity')
                .eq('product_id', productId)
                .single();

            const newStock = (item?.stock_quantity || 0) + delta;

            const { data, error } = await supabase
                .from('inventory')
                .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
                .eq('product_id', productId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const inventory = await DbAdapter.getInventory();
            const index = inventory.findIndex(i => i.product_id === productId);
            if (index !== -1) {
                inventory[index].stock_quantity += delta;
                localStorage.setItem('mandamoshuevos_inventory', JSON.stringify(inventory));
                return inventory[index];
            }
            return null;
        }
    },

    updatePassword: async (newPassword) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return true;
        } else {
            const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
            if (user) {
                const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
                const index = users.findIndex(u => u.email === (user.email || user.username));
                if (index !== -1) {
                    users[index].password = newPassword;
                    localStorage.setItem(USERS_KEY, JSON.stringify(users));
                    return true;
                }
            }
            return false;
        }
    },

    resetPasswordEmail: async (email) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            return true;
        } else {
            return true;
        }
    },

    getLowStockCount: async () => {
        if (isSupabaseConfigured()) {
            const inventory = await DbAdapter.getInventory();
            return inventory.filter(i => i.stock_quantity <= i.min_stock_alert).length;
        } else {
            const inventory = await DbAdapter.getInventory();
            return inventory.filter(i => i.stock_quantity <= i.min_stock_alert).length;
        }
    }
};
