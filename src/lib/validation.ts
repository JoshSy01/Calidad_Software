/**
 * Módulo de validación estandarizado para TypeScript
 * Reutilizable tanto en cliente (SvelteKit) como en el servidor (Actions/API)
 * Cumple con las especificaciones de calidad del ciclo PDCA.
 */

export interface RegistroFormInput {
	idProductos: (number | string)[];
	preciosProductos: (number | string)[];
	cantidadProductos: (number | string)[];
	porcentajeGanancia?: number | string | null;
	idTipo?: number | string;
	fecha?: string;
}

export interface ValidatedRegistroData {
	idProductos: number[];
	preciosProductos: number[];
	cantidadProductos: number[];
	porcentajeGanancia?: number;
	idTipo?: number;
	fecha?: string;
}

export interface ValidationResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	field?: string;
}

export const VALIDATION_LIMITS = {
	MIN_CANTIDAD: 1,
	MAX_CANTIDAD: 99,
	MIN_PRECIO: 0,
	MAX_PRECIO: 100000,
	MIN_GANANCIA: 0,
	MAX_GANANCIA: 100,
	MIN_YEAR: 2020,
	MAX_YEAR_OFFSET: 1
} as const;

/**
 * Valida un valor individual de cantidad
 * Debe ser un entero positivo entre 1 y 99
 */
export function validateCantidad(qty: unknown): ValidationResult<number> {
	if (qty === null || qty === undefined || qty === '') {
		return { success: false, error: 'La cantidad es requerida.', field: 'cantidad' };
	}

	const rawStr = String(qty).trim();
	// Si contiene punto o coma decimal, rechazar explícitamente
	if (rawStr.includes('.') || rawStr.includes(',')) {
		return {
			success: false,
			error: 'La cantidad no puede contener decimales; debe ser un número entero.',
			field: 'cantidad'
		};
	}

	const num = Number(rawStr);
	if (isNaN(num)) {
		return { success: false, error: 'La cantidad debe ser un número válido.', field: 'cantidad' };
	}

	if (!Number.isInteger(num)) {
		return {
			success: false,
			error: 'La cantidad no puede contener decimales; debe ser un número entero.',
			field: 'cantidad'
		};
	}

	if (num < 0) {
		return {
			success: false,
			error: 'La cantidad no puede ser negativa.',
			field: 'cantidad'
		};
	}

	if (num === 0) {
		return {
			success: false,
			error: 'La cantidad debe ser mayor a 0 (mínimo 1).',
			field: 'cantidad'
		};
	}

	if (num > VALIDATION_LIMITS.MAX_CANTIDAD) {
		return {
			success: false,
			error: `La cantidad no puede superar el límite permitido de ${VALIDATION_LIMITS.MAX_CANTIDAD} unidades.`,
			field: 'cantidad'
		};
	}

	return { success: true, data: num };
}

/**
 * Valida un precio individual
 * Debe ser un número mayor o igual a 0
 */
export function validatePrecio(precio: unknown): ValidationResult<number> {
	if (precio === null || precio === undefined || precio === '') {
		return { success: false, error: 'El precio es requerido.', field: 'precio' };
	}

	const rawStr = String(precio).trim();
	const num = Number(rawStr);
	if (isNaN(num)) {
		return { success: false, error: 'El precio debe ser un número válido.', field: 'precio' };
	}

	if (num < VALIDATION_LIMITS.MIN_PRECIO) {
		return {
			success: false,
			error: 'El precio no puede ser negativo.',
			field: 'precio'
		};
	}

	if (num > VALIDATION_LIMITS.MAX_PRECIO) {
		return {
			success: false,
			error: `El precio no puede superar el límite permitido de $${VALIDATION_LIMITS.MAX_PRECIO.toLocaleString('es-ES')} (precio exorbitante no permitido).`,
			field: 'precio'
		};
	}

	if (rawStr.includes('.')) {
		const decimals = rawStr.split('.')[1];
		if (decimals && decimals.length > 2) {
			return {
				success: false,
				error: 'El precio no puede tener más de 2 decimales.',
				field: 'precio'
			};
		}
	}

	return { success: true, data: Math.round(num * 100) / 100 };
}

/**
 * Valida que una fecha sea coherente y dentro de los rangos operacionales
 * Evita fechas sin sentido (como a más de 100 años en el futuro o fechas arcaicas)
 */
export function validateFecha(fecha: unknown): ValidationResult<string> {
	if (fecha === null || fecha === undefined || fecha === '') {
		return { success: true, data: undefined };
	}

	const rawStr = String(fecha).trim();
	// Limpieza de formato para Date parsing
	const normalized = rawStr.includes('T') ? rawStr : rawStr.replace(' ', 'T');
	const d = new Date(normalized);

	if (isNaN(d.getTime())) {
		return {
			success: false,
			error: 'La fecha ingresada no tiene un formato válido.',
			field: 'fecha'
		};
	}

	const year = d.getFullYear();
	const currentYear = new Date().getFullYear();
	const minYear = VALIDATION_LIMITS.MIN_YEAR;
	const maxYear = currentYear + VALIDATION_LIMITS.MAX_YEAR_OFFSET;

	if (year < minYear) {
		return {
			success: false,
			error: `La fecha (${year}) no es válida. No se admiten fechas anteriores al año ${minYear}.`,
			field: 'fecha'
		};
	}

	if (year > maxYear) {
		return {
			success: false,
			error: `La fecha (${year}) no tiene sentido. No se admiten fechas a más de 1 año en el futuro (máx. ${maxYear}).`,
			field: 'fecha'
		};
	}

	return { success: true, data: rawStr };
}

/**
 * Valida el porcentaje de ganancia
 * Opcional, pero si se define debe estar entre 0 y 100
 */
export function validatePorcentajeGanancia(
	ganancia: unknown
): ValidationResult<number | undefined> {
	if (ganancia === undefined || ganancia === null || ganancia === '') {
		return { success: true, data: undefined };
	}

	const num = Number(ganancia);
	if (isNaN(num)) {
		return {
			success: false,
			error: 'El porcentaje de ganancia debe ser un número válido.',
			field: 'porcentaje_ganancia'
		};
	}

	if (num < VALIDATION_LIMITS.MIN_GANANCIA) {
		return {
			success: false,
			error: 'El porcentaje de ganancia no puede ser negativo.',
			field: 'porcentaje_ganancia'
		};
	}

	if (num > VALIDATION_LIMITS.MAX_GANANCIA) {
		return {
			success: false,
			error: `El porcentaje de ganancia no puede ser superior al ${VALIDATION_LIMITS.MAX_GANANCIA}%.`,
			field: 'porcentaje_ganancia'
		};
	}

	return { success: true, data: num };
}

/**
 * Valida la estructura completa enviada para registrar una venta/producción
 */
export function validateRegistroPayload(
	input: RegistroFormInput
): ValidationResult<ValidatedRegistroData> {
	if (!input.idProductos || !Array.isArray(input.idProductos) || input.idProductos.length === 0) {
		return { success: false, error: 'No se seleccionaron productos para el registro.' };
	}

	if (
		!input.preciosProductos ||
		!Array.isArray(input.preciosProductos) ||
		input.preciosProductos.length === 0
	) {
		return { success: false, error: 'No se enviaron los precios de los productos.' };
	}

	if (
		!input.cantidadProductos ||
		!Array.isArray(input.cantidadProductos) ||
		input.cantidadProductos.length === 0
	) {
		return { success: false, error: 'No se enviaron las cantidades de los productos.' };
	}

	if (
		input.idProductos.length !== input.preciosProductos.length ||
		input.idProductos.length !== input.cantidadProductos.length
	) {
		return {
			success: false,
			error: 'Las listas de productos, precios y cantidades deben tener la misma longitud.'
		};
	}

	const idProductos: number[] = [];
	const preciosProductos: number[] = [];
	const cantidadProductos: number[] = [];

	for (let i = 0; i < input.idProductos.length; i++) {
		const id = Number(input.idProductos[i]);
		if (isNaN(id) || id <= 0) {
			return {
				success: false,
				error: `ID de producto inválido en posición ${i + 1}.`,
				field: 'id_producto'
			};
		}
		idProductos.push(id);

		const precioResult = validatePrecio(input.preciosProductos[i]);
		if (!precioResult.success) {
			return { success: false, error: precioResult.error, field: precioResult.field };
		}
		preciosProductos.push(precioResult.data!);

		const cantidadResult = validateCantidad(input.cantidadProductos[i]);
		if (!cantidadResult.success) {
			return { success: false, error: cantidadResult.error, field: cantidadResult.field };
		}
		cantidadProductos.push(cantidadResult.data!);
	}

	const gananciaResult = validatePorcentajeGanancia(input.porcentajeGanancia);
	if (!gananciaResult.success) {
		return { success: false, error: gananciaResult.error, field: gananciaResult.field };
	}

	let fechaValidada: string | undefined = undefined;
	if (input.fecha) {
		const fechaResult = validateFecha(input.fecha);
		if (!fechaResult.success) {
			return { success: false, error: fechaResult.error, field: fechaResult.field };
		}
		fechaValidada = fechaResult.data;
	}

	return {
		success: true,
		data: {
			idProductos,
			preciosProductos,
			cantidadProductos,
			porcentajeGanancia: gananciaResult.data,
			idTipo: input.idTipo ? Number(input.idTipo) : undefined,
			fecha: fechaValidada
		}
	};
}
