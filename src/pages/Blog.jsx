
import { Egg, CookingPot, Heartbeat, Article, Calendar, ArrowLeft } from 'phosphor-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Base de Datos Estática de Artículos (Legacy/Simulada)
 * En una fase futura, esto podría migrarse a una tabla 'posts' en Supabase.
 */
const POSTS_POOL = [
    {
        id: 1,
        title: "Beneficios del Huevo: El Superalimento que Necesitas",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Superalimento",
        excerpt: "Rico en proteínas, vitaminas y minerales. Descubre por qué es esencial en tu dieta diaria.",
        content: `
            <p>El huevo es considerado uno de los alimentos más nutritivos del planeta. Un solo huevo grande contiene increíbles cantidades de nutrientes esenciales como vitamina A, folato, vitamina B5, vitamina B12, vitamina B2, fósforo y selenio. Y todo esto con solo 77 calorías, 6 gramos de proteína de calidad y 5 gramos de grasas saludables.</p>

            <h3>1. Perfil Nutricional Completo</h3>
            <p>Contiene un poco de casi todos los nutrientes que necesitamos. De hecho, si son huevos enriquecidos con Omega-3 o de gallinas de pastoreo, son aún más ricos en nutrientes y ácidos grasos beneficiosos.</p>
            
            <h3>2. Alto en Colesterol, pero no afecta al negativo</h3>
            <p>Es cierto que los huevos tienen mucho colesterol, pero es importante entender que el colesterol en la dieta no necesariamente eleva el colesterol en la sangre. En el 70% de las personas, los huevos no aumentan el colesterol en absoluto.</p>

            <h3>3. Contienen Colina: Un Nutriente Esencial</h3>
            <p>La colina es un nutriente que la mayoría de las personas no consumen en cantidad suficiente. Es increíblemente importante para la salud del cerebro y se usa para construir membranas celulares.</p>
        `
    },
    {
        id: 2,
        title: "Receta Maestra: Tortilla de Patatas Perfecta",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Tortilla+Perfecta",
        excerpt: "El secreto de la abuela para que quede jugosa por dentro y dorada por fuera.",
        content: `
            <p>La tortilla de patatas es el emblema de la gastronomía española. Aunque parece simple, tiene sus trucos para conseguir esa textura melosa perfecta.</p>

            <h3>Ingredientes</h3>
            <ul>
                <li>4 Patatas medianas (tipo Monalisa o Kennebec)</li>
                <li>6 Huevos L de MandamosHuevos (frescos)</li>
                <li>1 Cebolla mediana (¡Sí, con cebolla!)</li>
                <li>Aceite de Oliva Virgen Extra</li>
                <li>Sal al gusto</li>
            </ul>

            <h3>El Truco del Chef</h3>
            <p>El secreto no es freír las patatas a fuego fuerte, sino confitarlas lentamente en aceite no muy caliente. Y lo más importante: una vez mezcladas las patatas escurridas con el huevo batido, <strong>deja reposar la mezcla 10 minutos</strong> antes de cuajarla. La patata absorberá el huevo y quedará increíblemente cremosa.</p>
        `
    },
    {
        id: 3,
        title: "¿Qué significa el código del huevo?",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Codigo+Huevo",
        excerpt: "Aprende a leer la matrícula de los huevos y elige con consciencia ética.",
        content: `
            <p>Todos los huevos comercializados en la UE llevan impreso un código en su cáscara. Este código es como el DNI del huevo y nos da toda la información sobre su origen.</p>
            
            <h3>El Primer Dígito: La clave de todo</h3>
            <ul>
                <li><strong>0 - Producción Ecológica:</strong> Gallinas al aire libre con alimentación bio.</li>
                <li><strong>1 - Camperas:</strong> Gallinas con acceso al aire libre.</li>
                <li><strong>2 - Suelo:</strong> Gallinas en naves cerradas pero sueltas.</li>
                <li><strong>3 - Jaulas:</strong> Sistema que en MandamosHuevos NO utilizamos.</li>
            </ul>
        `
    },
    {
        id: 4,
        title: "Cómo conservar los huevos frescos más tiempo",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Conservacion",
        excerpt: "Trucos sencillos para mantener la calidad y seguridad de tus huevos en casa.",
        content: `
            <p>Conservar los huevos correctamente es fundamental. Aquí te dejamos las reglas de oro:</p>
            
            <h3>No lavar hasta usar</h3>
            <p>Los huevos tienen una cutícula natural que tapa los poros y evita que entren bacterias. Si los lavas al llegar a casa, eliminas esa barrera. Lávalos solo justo antes de cocinarlos.</p>
            
            <h3>En la nevera, pero no en la puerta</h3>
            <p>La puerta es la zona con más cambios de temperatura. Lo ideal es guardarlos en una balda interior en su propio cartón.</p>
        `
    },
    {
        id: 5,
        title: "Huevos Escalfados (Poché) sin Miedo",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Huevos+Poche",
        excerpt: "Técnica infalible para conseguir esa yema líquida y clara sedosa de restaurante.",
        content: `
            <p>El huevo escalfado parece difícil, pero con este truco te saldrá siempre bien.</p>
            
            <h3>El Método del Remolino</h3>
            <p>Pon agua a hervir con un chorrito de vinagre. Cuando hierva, baja el fuego para que no borbotee fuerte. Crea un remolino con una cuchara y deja caer el huevo (previamente cascado en un bol) en el centro del remolino. Cocina 3 minutos exactos y saca con espumadera.</p>
            
            <h3>El Truco del Colador</h3>
            <p>Otra técnica es poner el huevo crudo en un colador fino unos segundos para que suelte la parte más líquida de la clara. Así te quedará una forma mucho más redonda y perfecta.</p>
        `
    },
    {
        id: 6,
        title: "Mitos sobre el Huevo y el Colesterol",
        image: "https://placehold.co/800x400/1e293b/fbbf24?text=Mitos+Colesterol",
        excerpt: "¿Cuántos huevos puedo comer a la semana? La ciencia responde.",
        content: `
            <p>Durante décadas se limitó el consumo de huevos a 2 o 3 por semana. Hoy la ciencia ha desmentido este mito.</p>
            
            <h3>La Evidencia Actual</h3>
            <p>Estudios recientes de la Universidad de Harvard y otros centros de investigación concluyen que el consumo de hasta un huevo al día no aumenta el riesgo de enfermedades cardiovasculares en personas sanas.</p>
            
            <p>El problema no es el huevo, sino con qué lo acompañamos (bacon, fritos, harinas refinadas). Un huevo cocido, escalfado o en tortilla es una de las proteínas más saludables que existen.</p>
        `
    }
];

/**
 * Componente Blog
 * 
 * Gestiona la visualización de artículos informativos y recetas.
 * Utiliza parámetros de búsqueda (URL Search Params) para determinar si mostrar
 * el listado general o un artículo específico.
 */
export function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const postId = searchParams.get('post'); // ID del artículo seleccionado vía URL

    // Memorizamos el listado para evitar re-calculos innecesarios
    const weeklyPosts = useMemo(() => {
        return POSTS_POOL;
    }, []);

    // Busca el objeto del post si hay un ID activo en la URL
    const selectedPost = useMemo(() => {
        if (!postId) return null;
        return weeklyPosts.find(p => p.id === parseInt(postId));
    }, [postId, weeklyPosts]);

    if (selectedPost) {
        return (
            <div>
                <button
                    onClick={() => setSearchParams({})}
                    style={{ marginBottom: '2rem', background: 'transparent', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} /> Volver al Blog
                </button>

                <article className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ height: '300px', width: '100%', overflow: 'hidden' }}>
                        <img
                            src={selectedPost.image}
                            alt={selectedPost.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div style={{ padding: '3rem' }}>
                        <h1 style={{ color: 'var(--color-accent-primary)', fontSize: '2.5rem', marginBottom: '2rem' }}>{selectedPost.title}</h1>
                        <div
                            className="blog-content"
                            style={{ lineHeight: 1.8, color: 'var(--color-text-primary)', fontSize: '1.1rem' }}
                            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                        />
                    </div>
                </article>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Article /> Blog de MandamosHuevos
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {weeklyPosts.map((post) => (
                    <div
                        key={post.id}
                        className="glass-card"
                        style={{ padding: 0, transition: 'transform 0.2s', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        onClick={() => setSearchParams({ post: post.id })}
                    >
                        <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                            <img
                                src={post.image}
                                alt={post.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                            />
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{post.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6, flex: 1 }}>
                                {post.excerpt}
                            </p>
                            <span style={{ color: 'var(--color-accent-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: 'auto' }}>
                                Leer artículo completo &rarr;
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
