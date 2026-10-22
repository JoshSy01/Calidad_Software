import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}
	return { user: locals.user };
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
	}
};
