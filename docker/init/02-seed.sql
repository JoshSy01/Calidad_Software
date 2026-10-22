-- Usuario de pruebas inicial para desarrollo y testing
INSERT INTO public."user" (id, name, email, email_verified, created_at, updated_at)
VALUES (
    'test_user_001',
    'Usuario de Pruebas',
    'joshuajvb0@gmail.com',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.account (
    id,
    issuer,
    account_id,
    provider_id,
    user_id,
    password,
    created_at,
    updated_at
) VALUES (
    'test_account_001',
    'local:credential',
    'test_user_001',
    'credential',
    'test_user_001',
    '7a34b3179a7398421508fd8181087230:856b11bc1b2742ab9de2994c151d17437501286f28d706f101139bc401b9cce86909c345d7894770666cffada4a318ffbc26d9c672223307ee91eb7d776ecc28',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Tipos / Categorías por defecto
INSERT INTO public.tipo (id_tipo, nombre_tipo, imagen_url)
VALUES 
    (1, 'Yogurt', 'https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/yogurt.png'),
    (2, 'Proteínas', 'https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/proteinas.png')
ON CONFLICT (id_tipo) DO UPDATE 
SET nombre_tipo = EXCLUDED.nombre_tipo, imagen_url = EXCLUDED.imagen_url;

-- Productos de prueba (incluye el producto del caso de estudio PDCA)
INSERT INTO public.producto (id_producto, created_at, id_tipo, nombre_producto, precio, link_foto, estado)
VALUES 
    (1, NOW(), 1, 'Yogurt natural de prueba', 2.50, NULL, true),
    (2, NOW(), 1, 'Yogurt con Fresa 1L', 3.00, NULL, true),
    (3, NOW(), 2, 'Proteína Whey Chocolate', 25.00, NULL, true)
ON CONFLICT (id_producto) DO UPDATE
SET nombre_producto = EXCLUDED.nombre_producto, precio = EXCLUDED.precio, estado = EXCLUDED.estado;

-- Actualizar secuencias para evitar conflictos en nuevos registros
SELECT setval('public.tipo_id_tipo_seq', COALESCE((SELECT MAX(id_tipo) FROM public.tipo), 1));
SELECT setval('public.producto_id_producto_seq', COALESCE((SELECT MAX(id_producto) FROM public.producto), 1));
SELECT setval('public.registro_id_registro_seq', COALESCE((SELECT MAX(id_registro) FROM public.registro), 1));
