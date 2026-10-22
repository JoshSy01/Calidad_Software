import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { producto, tipo, registro } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { 
    CLOUDINARY_CLOUD_NAME, 
    CLOUDINARY_API_KEY, 
    CLOUDINARY_API_SECRET 
} from '$env/static/private';


cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});


export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const [productos, tipos] = await Promise.all([
		db.query.producto.findMany({
			with: { tipo: true },
			orderBy: (p, { desc }) => [desc(p.createdAt)]
		}),
		db.select().from(tipo)
	]);

	return { user: locals.user, productos, tipos };
};

export const actions: Actions = {
	logout: async ({ request }) => {
		const response = await auth.api.signOut({
			headers: request.headers,
			asResponse: true
		});
		if (response.ok) {
			redirect(302, '/login');
		}
	},

	agregarProducto: async ({ request }) => {
		const data = await request.formData();
		const nombreProducto = data.get('nombre_producto')?.toString().trim();
		const precioRaw = data.get('precio')?.toString().trim();
		const idTipoRaw = data.get("tipoSelected")?.toString();
        const archivo = data.get('imagen');
		let linkFoto = null;
		const estado = true;


        if (archivo && archivo instanceof File) {
            // Verificar que el archivo no esté vacío
            if (archivo.size === 0) {
                return fail(400, { error: 'El archivo de imagen está vacío.' });
            }

            // Intentar subir a Cloudinary
            try {
                const buffer = Buffer.from(await archivo.arrayBuffer());
                
                // Convertir a Base64
                const base64File = `data:${archivo.type};base64,${buffer.toString('base64')}`;
                
                // Subir a Cloudinary
                const uploadResult = await cloudinary.uploader.upload(base64File, {
                    folder: 'yogurts',
                    resource_type: 'image'
                });
                
                linkFoto = uploadResult.secure_url;
            } catch (error) {
                console.error('Error subiendo imagen a Cloudinary:', error);
                return fail(500, { error: 'Error al subir la imagen. Por favor intenta de nuevo.' });
            }
        }

		if (!nombreProducto) return fail(400, { error: 'El nombre del producto es requerido.' });

		const precio = precioRaw ? parseFloat(precioRaw) : null;
		const idTipo = idTipoRaw ? parseInt(idTipoRaw) : null;

		if (precio !== null && isNaN(precio))
			return fail(400, { error: 'El precio debe ser un número válido.' });

		await db.insert(producto).values({
			nombreProducto,
			precio,
			idTipo,
			linkFoto,
			estado
		});

		

		return { success: true };
	},

	eliminarProducto: async ({ request }) => {
		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		await db.update(producto).set({ estado: false }).where(eq(producto.idProducto, id));
		return { success: true };
	},

	activarProducto: async ({ request }) => {
		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		await db.update(producto).set({ estado: true }).where(eq(producto.idProducto, id));
		return { success: true };
	},

	editarPrecio: async ({ request }) => {
		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		const precioRaw = data.get('precio')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		const precio = precioRaw ? parseFloat(precioRaw) : null;

		if (precio !== null && isNaN(precio)) return fail(400, { error: 'El precio debe ser un número válido.' });

		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		await db.update(producto).set({ precio }).where(eq(producto.idProducto, id));
		return { success: true }; 
	},

	//Agregar Registro a la base de datos
	agregarRegistro: async ({ request }) => {
		const data = await request.formData();
		const idProductosRaw = data.get('id_producto')?.toString();
		const idTipoRaw = data.get('id_tipo')?.toString();
		const fechaRaw = data.get('fecha')?.toString();
		const preciosProductosRaw = data.get('precios_productos')?.toString();
		const cantidadProductosRaw = data.get('cantidad_productos')?.toString();
		const porcentajeGananciaRaw = data.get('porcentaje_ganancia')?.toString();
		const estadoRaw = data.get('estado')?.toString();

		if (!idProductosRaw || !preciosProductosRaw || !cantidadProductosRaw) {
			return fail(400, { error: 'No se enviaron productos para el registro.' });
		}

		try {
			const idProductosArray = idProductosRaw.split(',').map(Number);
			const preciosProductosArray = preciosProductosRaw.split(',').map(Number);
			const cantidadProductosArray = cantidadProductosRaw.split(',').map(Number);
			const idTipo = idTipoRaw ? parseInt(idTipoRaw) : 1;
			const porcentajeGanancia = porcentajeGananciaRaw ? Number(porcentajeGananciaRaw) : undefined;
			const fecha = fechaRaw || new Date().toISOString().slice(0, 19).replace('T', ' ');
			const estado = estadoRaw !== undefined ? estadoRaw === 'true' : true;

			await db.insert(registro).values({
				fecha,
				idProductos: idProductosArray,
				idTipo,
				preciosProductos: preciosProductosArray,
				cantidadProductos: cantidadProductosArray,
				porcentajeGanancia,
				estado
			});

			return { success: true };
		} catch (error) {
			console.error('Error al agregar registro:', error);
			return fail(500, { error: 'Ocurrió un error al guardar el registro en la base de datos.' });
		}
	}
};
