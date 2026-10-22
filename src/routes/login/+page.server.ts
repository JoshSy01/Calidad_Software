import { redirect, fail, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Si ya está autenticado, redirigir al dashboard
	if (locals.user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim() || 'joshuajvb0@gmail.com';
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Por favor completa todos los campos.' });
		}

		try {
			const response = await auth.api.signInEmail({
				body: { email, password },
				asResponse: true
			});

			if (!response.ok) {
				const data = await response.json();
				return fail(401, { error: data.message ?? 'Credenciales incorrectas.' });
			}

			throw redirect(302, '/');
		} catch (e: unknown) {
			if (isRedirect(e)) {
				throw e;
			}

			const msg = e instanceof Error ? e.message : 'Error inesperado al iniciar sesión.';
			return fail(500, { error: msg });
		}
	}
};
