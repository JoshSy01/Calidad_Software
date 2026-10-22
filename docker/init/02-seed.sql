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
