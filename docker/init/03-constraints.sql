-- Restricciones CHECK para garantizar integridad de datos según ciclo PDCA

-- 1. Restricción en producto: precio >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_producto_precio'
    ) THEN
        ALTER TABLE public.producto 
        ADD CONSTRAINT check_producto_precio 
        CHECK (precio IS NULL OR precio >= 0);
    END IF;
END $$;

-- 2. Restricción en registro: porcentaje_ganancia entre 0 y 100
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_registro_ganancia'
    ) THEN
        ALTER TABLE public.registro 
        ADD CONSTRAINT check_registro_ganancia 
        CHECK (porcentaje_ganancia IS NULL OR (porcentaje_ganancia >= 0 AND porcentaje_ganancia <= 100));
    END IF;
END $$;

-- 3. Función y restricción para cantidades (enteros entre 1 y 99)
CREATE OR REPLACE FUNCTION public.check_array_cantidades(arr bigint[])
RETURNS boolean AS $$
BEGIN
    IF arr IS NULL OR array_length(arr, 1) IS NULL OR array_length(arr, 1) = 0 THEN
        RETURN false;
    END IF;
    RETURN (SELECT bool_and(val >= 1 AND val <= 99) FROM unnest(arr) val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_registro_cantidades'
    ) THEN
        ALTER TABLE public.registro 
        ADD CONSTRAINT check_registro_cantidades 
        CHECK (check_array_cantidades(cantidad_productos));
    END IF;
END $$;

-- 4. Función y restricción para precios (precios >= 0)
CREATE OR REPLACE FUNCTION public.check_array_precios(arr double precision[])
RETURNS boolean AS $$
BEGIN
    IF arr IS NULL OR array_length(arr, 1) IS NULL OR array_length(arr, 1) = 0 THEN
        RETURN false;
    END IF;
    RETURN (SELECT bool_and(val >= 0) FROM unnest(arr) val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_registro_precios'
    ) THEN
        ALTER TABLE public.registro 
        ADD CONSTRAINT check_registro_precios 
        CHECK (check_array_precios(precios_productos));
    END IF;
END $$;
