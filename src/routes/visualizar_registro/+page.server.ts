import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { producto, tipo, registro } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const [registros, productos, tipos] = await Promise.all([
        db.select().from(registro).orderBy(desc(registro.fecha)),
        db.query.producto.findMany({ with: { tipo: true } }),
        db.select().from(tipo)
    ]);

    return { user: locals.user, registros, productos, tipos };
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

    desactivarRegistro: async ({ request }) => {
        const { idRegistro } = Object.fromEntries(await request.formData());
        await db.update(registro).set({ estado: false }).where(eq(registro.idRegistro, Number(idRegistro)));
        return { success: true };
    },

    activarRegistro: async ({ request }) => {
        const { idRegistro } = Object.fromEntries(await request.formData());
        await db.update(registro).set({ estado: true }).where(eq(registro.idRegistro, Number(idRegistro)));
        return { success: true };
    }
};