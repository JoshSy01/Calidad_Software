async function runTests() {
	console.log('=== INICIANDO VERIFICACIÓN DE REQUISITOS PDCA ===\n');

	// 1. Redirección de usuario no autenticado en la raíz
	const resRoot = await fetch('http://localhost:5173/', { redirect: 'manual' });
	console.log(
		`[1] GET / -> Status: ${resRoot.status} (Redirige a /login: ${resRoot.headers.get('location') === '/login'})`
	);

	// 2. Cláusula de guarda: intento de agregar registro SIN sesión
	const formUnauth = new URLSearchParams();
	formUnauth.append('id_producto', '1');
	formUnauth.append('precios_productos', '2.5');
	formUnauth.append('cantidad_productos', '1');
	formUnauth.append('id_tipo', '1');

	const resUnauth = await fetch('http://localhost:5173/gestion_productos?/agregarRegistro', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'x-sveltekit-action': 'true'
		},
		body: formUnauth.toString()
	});
	const unauthBody = await resUnauth.json();
	console.log(`[2] Acción sin autenticación -> HTTP ${resUnauth.status}:`, unauthBody);

	// 3. Inicio de sesión con usuario de pruebas
	const loginForm = new URLSearchParams();
	loginForm.append('email', 'joshuajvb0@gmail.com');
	loginForm.append('password', 'Pruebas123');

	const resLogin = await fetch('http://localhost:5173/login', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'x-sveltekit-action': 'true'
		},
		body: loginForm.toString(),
		redirect: 'manual'
	});

	const setCookies = resLogin.headers.getSetCookie
		? resLogin.headers.getSetCookie()
		: [resLogin.headers.get('set-cookie')].filter(Boolean);
	const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
	console.log(`\n[3] Login (joshuajvb0@gmail.com / Pruebas123) -> HTTP ${resLogin.status}`);
	console.log(`    Cookies recibidas: ${setCookies.length > 0 ? 'Sí (Sesión activa)' : 'No'}`);

	if (!setCookies.length) {
		console.error('ERROR: No se pudo iniciar sesión. Abortando pruebas.');
		return;
	}

	// Helper para enviar registros autenticados
	async function testRegistro(casoName, { idProductos, precios, cantidades, ganancia, fecha }) {
		const form = new URLSearchParams();
		form.append('id_producto', idProductos.join(','));
		form.append('precios_productos', precios.join(','));
		form.append('cantidad_productos', cantidades.join(','));
		form.append('id_tipo', '1');
		if (ganancia !== undefined) form.append('porcentaje_ganancia', String(ganancia));
		if (fecha !== undefined) form.append('fecha', String(fecha));
		form.append('estado', 'true');

		const res = await fetch('http://localhost:5173/gestion_productos?/agregarRegistro', {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'x-sveltekit-action': 'true',
				cookie: cookieHeader
			},
			body: form.toString()
		});
		const body = await res.json();
		console.log(`[TEST] ${casoName}:`);
		console.log(`       HTTP Status: ${res.status}`);
		console.log(`       Respuesta:`, JSON.stringify(body));
		return { status: res.status, body };
	}

	console.log('\n=== EJECUTANDO BATERÍA DE CASOS DE PRUEBA PDCA ===\n');

	// Caso 01: Cantidad negativa
	await testRegistro('Caso 01: Cantidad negativa (-1)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [-1],
		ganancia: 50
	});

	// Caso 02: Cantidad cero (0)
	await testRegistro('Caso 02: Cantidad cero (0)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [0],
		ganancia: 50
	});

	// Caso 03: Cantidad superior al límite (10000)
	await testRegistro('Caso 03: Cantidad superior al límite (10000)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [10000],
		ganancia: 50
	});

	// Caso 04: Cantidad decimal (1.5)
	await testRegistro('Caso 04: Cantidad decimal (1.5)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [1.5],
		ganancia: 50
	});

	// Caso 05: Porcentaje excesivo (150%)
	await testRegistro('Caso 05: Porcentaje excesivo (150)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [2],
		ganancia: 150
	});

	// Caso 06: Porcentaje negativo (-10%)
	await testRegistro('Caso 06: Porcentaje negativo (-10)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [2],
		ganancia: -10
	});

	// Caso 08: Precio exorbitante (9999999)
	await testRegistro('Caso 08: Precio exorbitante (9999999)', {
		idProductos: [1],
		precios: [9999999],
		cantidades: [2],
		ganancia: 50
	});

	// Caso 09: Fecha absurda a más de 100 años en el futuro (2150-01-01)
	await testRegistro('Caso 09: Fecha absurda a más de 100 años (2150-01-01)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [2],
		ganancia: 50,
		fecha: '2150-01-01 12:00:00'
	});

	// Caso 10: Fecha absurda en el pasado lejano (1900-01-01)
	await testRegistro('Caso 10: Fecha absurda del siglo pasado (1900-01-01)', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [2],
		ganancia: 50,
		fecha: '1900-01-01 12:00:00'
	});

	// Caso 11: Intentar editar precio a un valor exorbitante
	const formEditPrice = new URLSearchParams();
	formEditPrice.append('id_producto', '1');
	formEditPrice.append('precio', '50000000');
	const resEdit = await fetch('http://localhost:5173/gestion_productos?/editarPrecio', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'x-sveltekit-action': 'true',
			cookie: cookieHeader
		},
		body: formEditPrice.toString()
	});
	const editBody = await resEdit.json();
	console.log('[TEST] Caso 11: Editar precio exorbitante (50,000,000):');
	console.log(`       HTTP Status: ${resEdit.status}`);
	console.log(`       Respuesta:`, JSON.stringify(editBody));

	// Caso Control: Venta válida (debe completarse con éxito)
	console.log('\n=== CASO CONTROL: VENTA VÁLIDA ===\n');
	await testRegistro('Caso Válido: Cantidad 2, Precio 2.50, Ganancia 50%', {
		idProductos: [1],
		precios: [2.5],
		cantidades: [2],
		ganancia: 50
	});
}

runTests().catch(console.error);
