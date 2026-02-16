
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Claves de LocalStorage
const USERS_KEY = 'mandahuevos_users';
const ORDERS_KEY = 'mandahuevos_orders';
const CURRENT_USER_KEY = 'mandahuevos_current_user';

export const DbAdapter = {
    // --- AUTENTICACIÓN Y USUARIOS ---

    // Autenticar (Login)
    authenticate: async (email, password) => {
        // ADMIN MOCK BYPASS (Solo en modo local pto)
        // Si estamos en Supabase, queremos login REAL para tener token válido
        if (!isSupabaseConfigured() && email === 'GranHuevon' && password === 'Huevosde0R0.COM') {
            return { id: 'admin-id', name: 'Gran Huevón', email: 'GranHuevon', role: 'admin' };
        }

        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Obtener perfil completo
            let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            // AUTORECUPERACIÓN: Si el perfil no existe (usuario antiguo o fallo de trigger), crearlo ahora.
            if (profileError || !profile) {
                console.warn("Perfil no encontrado, intentando autorecuperación...", profileError);
                const newProfile = {
                    id: data.user.id,
                    email: data.user.email,
                    role: 'user',
                    full_name: data.user.user_metadata?.full_name || '',
                    address: data.user.user_metadata?.address || '',
                    dni: data.user.user_metadata?.dni || '',
                    phone: data.user.user_metadata?.phone || '',
                    updated_at: new Date().toISOString()
                };

                // Intentar insertar
                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .upsert(newProfile)
                    .select()
                    .single();

                if (!createError) {
                    profile = createdProfile;
                } else {
                    // Si falla la creación, seguimos solo con los datos básicos de Auth para no bloquear el login
                    console.error("Fallo al autorecuperar perfil:", createError);
                    profile = { id: data.user.id, email: data.user.email, role: 'user' };
                }
            }

            return {
                ...profile,
                email: data.user.email,
                accessToken: data.session.access_token
            };

        } else {
            // MODO LOCAL
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (!user && email === 'test@demo.com' && password === 'test') {
                return { id: 'test-id', name: 'Usuario Prueba', email: 'test@demo.com', role: 'user' };
            }
            return user || null;
        }
    },

    // Crear Usuario (Registro)
    createUser: async (userData) => {
        if (isSupabaseConfigured()) {
            // 1. Registrar en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name || userData.full_name,
                        address: userData.address,
                        dni: userData.dni,
                        phone: userData.phone
                    }
                }
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario. Verifica tu email si es necesario.');
            }

            // 2. Crear o Actualizar Perfil en tabla 'profiles'
            // Usamos UPSERT para que funcione tanto si el Trigger corrió (update) como si no (insert)
            const profileData = {
                id: authData.user.id,
                full_name: userData.name || userData.full_name,
                address: userData.address,
                dni: userData.dni,
                phone: userData.phone,
                email: userData.email,
                role: 'user', // Siempre user por defecto al registrarse
                updated_at: new Date().toISOString()
            };

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData)
                .select()
                .single();

            if (profileError) {
                console.error('Error creando/actualizando perfil:', profileError);
                // No lanzamos error fatal si ya existe el usuario en Auth, intentamos recuperar
            }

            return { ...profile, email: userData.email };

        } else {
            // MODO LOCAL
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            users.push(userData);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return userData;
        }
    },

    // Obtener todos los perfiles (Admin)
    getAllProfiles: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true }); // Fallback to name sort as updated_at might be missing
            // .order('updated_at', { ascending: false, nullsFirst: false }); 
            if (error) {
                console.error("Error fetching profiles:", error);
                return [];
            }
            return data;
        } else {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        }
    },

    // Obtener usuario por ID
    getUserById: async (userId) => {
        if (isSupabaseConfigured()) {
            let query = supabase.from('profiles').select('*');

            // Detectar si userId es un email (contiene '@') o un UUID
            if (userId && userId.includes('@')) {
                query = query.eq('email', userId);
            } else {
                query = query.eq('id', userId);
            }

            const { data, error } = await query.single();
            if (error) {
                console.warn("Error fetching user profile:", error);
                return null;
            }
            return data;
        } else {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            return users.find(u => u.id === userId || u.email === userId) || null;
        }
    },

    updateUser: async (userId, updates) => {
        if (isSupabaseConfigured()) {
            // Limpieza: Supabase usa 'full_name', no 'name'
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
            // Local mode support
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
            // Insertar cabecera pedido
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id_ref: orderData.userId,
                    total: orderData.total,
                    delivery_date: orderData.deliveryDate,
                    payment_method: orderData.paymentMethod,
                    status: 'pending',
                    invoice_number: orderData.invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, // Fallback generador básico
                    shipping_address: orderData.shippingAddress, // NEW: Shipping Logic
                    shipping_town: orderData.shippingTown       // NEW: Shipping Logic
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Insertar items
            const items = orderData.items.map(item => ({
                order_id: order.id,
                product_id: item.id || item.productId, // Manejar ambas estructuras
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
                ...orderData // This already spreads shippingAddress and shippingTown
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
                .select(`
                    id, created_at, total, status, delivery_date, payment_method, invoice_number,
                    shipping_address, shipping_town,
                    order_items ( product_id, quantity, price_at_purchase )
                `)
                .eq('user_id_ref', userId)
                .order('created_at', { ascending: false });

            if (error) return [];

            return orders.map(o => ({
                id: o.id,
                createdAt: o.created_at,
                total: o.total,
                status: o.status,
                deliveryDate: o.delivery_date,
                paymentMethod: o.payment_method,
                invoiceNumber: o.invoice_number || `INV-${new Date(o.created_at).getFullYear()}-${o.id.slice(0, 4)}`,
                shippingAddress: o.shipping_address,
                shippingTown: o.shipping_town,
                items: o.order_items.map(i => ({
                    id: i.product_id,
                    name: `Producto ${i.product_id}`, // Mejorar si products disponibles
                    price: i.price_at_purchase,
                    quantity: i.quantity
                }))
            }));

        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    },

    // Método auxiliar para lógica de sugerencias
    getRecurringSuggestion: async () => {
        // ... Logica simple o compleja, por ahora simplificada ...
        return null;
    },

    getGlobalStats: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('order_items')
                .select('quantity, product_id');

            if (error) return { totalEggs: 0 };

            // Importar PRODUCTS dinamicamente o pasarlos? Mejor usar una constante local o hardcoded para evitar dependencias circulares si DbAdapter es base
            // Como PRODUCTS está en order.service, y OrderService usa DbAdapter, hay riesgo.
            // Para simplicidad, asumo que el componente que llama pasará el catálogo o haré un cálculo genérico.
            // Pero aquí necesito saber cuántos huevos por producto hay.
            return data; // Devuelvo los datos crudos para que el componente calcule
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const allItems = orders.flatMap(o => o.items);
            return allItems;
        }
    },
    // --- ADMINISTRACIÓN ---

    // Obtener todos los pedidos del sistema (Solo Admin)
    getAllOrders: async () => {
        if (isSupabaseConfigured()) {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id, created_at, total, status, delivery_date, payment_method, invoice_number, user_id_ref,
                    shipping_address, shipping_town,
                    order_items ( product_id, quantity, price_at_purchase )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

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
                items: o.order_items.map(i => ({
                    id: i.product_id,
                    price: i.price_at_purchase,
                    quantity: i.quantity
                }))
            }));
        } else {
            return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    },

    // Actualizar estado de un pedido
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

    // Eliminar Pedido (Admin)
    deleteOrder: async (orderId) => {
        if (isSupabaseConfigured()) {
            // Eliminar items primero (cascade debería encargarse, pero por seguridad)
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', orderId);

            if (itemsError) console.warn("Error borrando items:", itemsError);

            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

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
            if (error) {
                console.warn("Error counting pending orders:", error);
                return 0;
            }
            return count;
        } else {
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            return orders.filter(o => o.status === 'pending').length;
        }
    },

    // --- INVENTARIO ---
    getInventory: async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('inventory')
                .select('*');
            if (error) throw error;
            return data;
        } else {
            const inventory = JSON.parse(localStorage.getItem('mandahuevos_inventory') || '[]');
            if (inventory.length === 0) {
                // Mock inicial local
                return [
                    { product_id: 'carton-xxl', stock_quantity: 100, min_stock_alert: 10 },
                    { product_id: 'carton-l', stock_quantity: 100, min_stock_alert: 10 },
                    { product_id: 'carton-m', stock_quantity: 100, min_stock_alert: 10 }
                ];
            }
            return inventory;
        }
    },

    updateStock: async (productId, delta) => {
        if (isSupabaseConfigured()) {
            // Obtener stock actual
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
                localStorage.setItem('mandahuevos_inventory', JSON.stringify(inventory));
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
            // Modo local: actualizar usuario en array
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
    }
};

