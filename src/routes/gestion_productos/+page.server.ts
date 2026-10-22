import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { producto, tipo, registro } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { validateRegistroPayload, validatePrecio } from '$lib/validation';
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

	agregarProducto: async ({ request, locals }) => {
		// Cláusula de guarda de autenticación
		const session = locals.auth
			? locals.auth()
			: locals.session
				? { user: locals.user, session: locals.session }
				: null;
		if (!locals.user || !session) {
			return fail(401, { error: 'No autorizado. Se requiere iniciar sesión.' });
		}

		const data = await request.formData();
		const nombreProducto = data.get('nombre_producto')?.toString().trim();
		const precioRaw = data.get('precio')?.toString().trim();
		const idTipoRaw = data.get('tipoSelected')?.toString();
		const archivo = data.get('imagen');
		let linkFoto = null;
		const estado = true;

		if (archivo && archivo instanceof File) {
			if (archivo.size === 0) {
				return fail(400, { error: 'El archivo de imagen está vacío.' });
			}

			try {
				const buffer = Buffer.from(await archivo.arrayBuffer());
				const base64File = `data:${archivo.type};base64,${buffer.toString('base64')}`;

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

		let precio: number | null = null;
		if (precioRaw) {
			const precioCheck = validatePrecio(precioRaw);
			if (!precioCheck.success) {
				return fail(400, { error: precioCheck.error });
			}
			precio = precioCheck.data!;
		}

		const idTipo = idTipoRaw ? parseInt(idTipoRaw) : null;

		await db.insert(producto).values({
			nombreProducto,
			precio,
			idTipo,
			linkFoto,
			estado
		});

		return { success: true };
	},

	eliminarProducto: async ({ request, locals }) => {
		// Cláusula de guarda de autenticación
		const session = locals.auth
			? locals.auth()
			: locals.session
				? { user: locals.user, session: locals.session }
				: null;
		if (!locals.user || !session) {
			return fail(401, { error: 'No autorizado. Se requiere iniciar sesión.' });
		}

		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		await db.update(producto).set({ estado: false }).where(eq(producto.idProducto, id));
		return { success: true };
	},

	activarProducto: async ({ request, locals }) => {
		// Cláusula de guarda de autenticación
		const session = locals.auth
			? locals.auth()
			: locals.session
				? { user: locals.user, session: locals.session }
				: null;
		if (!locals.user || !session) {
			return fail(401, { error: 'No autorizado. Se requiere iniciar sesión.' });
		}

		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		await db.update(producto).set({ estado: true }).where(eq(producto.idProducto, id));
		return { success: true };
	},

	editarPrecio: async ({ request, locals }) => {
		// Cláusula de guarda de autenticación
		const session = locals.auth
			? locals.auth()
			: locals.session
				? { user: locals.user, session: locals.session }
				: null;
		if (!locals.user || !session) {
			return fail(401, { error: 'No autorizado. Se requiere iniciar sesión.' });
		}

		const data = await request.formData();
		const idRaw = data.get('id_producto')?.toString();
		const precioRaw = data.get('precio')?.toString();
		if (!idRaw) return fail(400, { error: 'ID de producto inválido.' });

		const id = parseInt(idRaw);
		if (isNaN(id)) return fail(400, { error: 'ID de producto inválido.' });

		const precioCheck = validatePrecio(precioRaw);
		if (!precioCheck.success) {
			return fail(400, { error: precioCheck.error });
		}
		const precio = precioCheck.data!;

		await db.update(producto).set({ precio }).where(eq(producto.idProducto, id));
		return { success: true };
	},

	// Agregar Registro a la base de datos (con cláusula de guarda y validación de tipos/rangos PDCA)
	agregarRegistro: async ({ request, locals }) => {
		// 1. Cláusula de guarda: si locals.auth() o sesión no es válida, se interrumpe el flujo
		const session = locals.auth
			? locals.auth()
			: locals.session
				? { user: locals.user, session: locals.session }
				: null;
		if (!locals.user || !session) {
			return fail(401, {
				error: 'No autorizado. Se requiere una sesión válida para registrar ventas.'
			});
		}

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

		const idProductosArray = idProductosRaw.split(',').map((s) => s.trim());
		const preciosProductosArray = preciosProductosRaw.split(',').map((s) => s.trim());
		const cantidadProductosArray = cantidadProductosRaw.split(',').map((s) => s.trim());

		// 2. Parseo y validación de tipos y rangos utilizando el esquema común en TypeScript
		const validation = validateRegistroPayload({
			idProductos: idProductosArray,
			preciosProductos: preciosProductosArray,
			cantidadProductos: cantidadProductosArray,
			porcentajeGanancia:
				porcentajeGananciaRaw !== undefined && porcentajeGananciaRaw !== ''
					? porcentajeGananciaRaw
					: null,
			idTipo: idTipoRaw ? parseInt(idTipoRaw) : 1,
			fecha: fechaRaw
		});

		if (!validation.success) {
			return fail(400, { error: validation.error });
		}

		const { idProductos, preciosProductos, cantidadProductos, porcentajeGanancia } =
			validation.data!;
		const idTipo = validation.data!.idTipo ?? 1;
		const fecha = validation.data!.fecha || new Date().toISOString().slice(0, 19).replace('T', ' ');
		const estado = estadoRaw !== undefined ? estadoRaw === 'true' : true;

		try {
			// 3. Verificación del flag activo = true en la consulta del producto antes de completar la transacción en Drizzle
			const dbProductos = await db
				.select()
				.from(producto)
				.where(inArray(producto.idProducto, idProductos));

			if (dbProductos.length !== idProductos.length) {
				return fail(400, { error: 'Uno o más productos seleccionados no existen en el sistema.' });
			}

			const productoInactivo = dbProductos.find((p) => !p.estado);
			if (productoInactivo) {
				return fail(400, {
					error: `El producto "${productoInactivo.nombreProducto}" se encuentra inactivo y no puede registrarse.`
				});
			}

			// Inserción en Drizzle con datos verificados
			await db.insert(registro).values({
				fecha,
				idProductos,
				idTipo,
				preciosProductos,
				cantidadProductos,
				porcentajeGanancia,
				estado
			});

			return { success: true };
		} catch (error: any) {
			console.error('Error al agregar registro:', error);
			if (error?.message?.includes('violates check constraint')) {
				return fail(400, {
					error: 'Los datos violan las restricciones de integridad y rangos de la base de datos.'
				});
			}
			return fail(500, { error: 'Ocurrió un error al guardar el registro en la base de datos.' });
		}
	}
};
