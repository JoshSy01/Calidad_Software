import {
	pgTable,
	bigint,
	timestamp,
	varchar,
	doublePrecision,
	text,
	boolean,
	check
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const tipo = pgTable('tipo', {
	idTipo: bigint('id_tipo', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	nombreTipo: text('nombre_tipo'),
	imagenUrl: varchar('imagen_url')
});

export const producto = pgTable(
	'producto',
	{
		idProducto: bigint('id_producto', { mode: 'number' })
			.primaryKey()
			.generatedByDefaultAsIdentity(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		idTipo: bigint('id_tipo', { mode: 'number' }).references(() => tipo.idTipo, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		nombreProducto: varchar('nombre_producto'),
		precio: doublePrecision('precio'),
		linkFoto: varchar('link_foto'),
		estado: boolean('estado')
	},
	(table) => [check('check_producto_precio', sql`${table.precio} IS NULL OR ${table.precio} >= 0`)]
);

export const registro = pgTable(
	'registro',
	{
		idRegistro: bigint('id_registro', { mode: 'number' })
			.primaryKey()
			.generatedByDefaultAsIdentity(),
		fecha: timestamp('fecha', { mode: 'string' }).defaultNow().notNull(),
		idProductos: bigint('id_productos', { mode: 'number' }).array().notNull(),
		idTipo: bigint('id_tipo', { mode: 'number' }).references(() => tipo.idTipo, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		preciosProductos: doublePrecision('precios_productos').array().notNull(),
		cantidadProductos: bigint('cantidad_productos', { mode: 'number' }).array().notNull(),
		porcentajeGanancia: doublePrecision('porcentaje_ganancia'),
		estado: boolean('estado')
	},
	(table) => [
		check(
			'check_registro_ganancia',
			sql`${table.porcentajeGanancia} IS NULL OR (${table.porcentajeGanancia} >= 0 AND ${table.porcentajeGanancia} <= 100)`
		)
	]
);

// Relations
export const tipoRelations = relations(tipo, ({ many }) => ({
	productos: many(producto)
}));

export const productoRelations = relations(producto, ({ one }) => ({
	tipo: one(tipo, {
		fields: [producto.idTipo],
		references: [tipo.idTipo]
	})
}));
