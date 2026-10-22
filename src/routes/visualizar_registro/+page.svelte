<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { VALIDATION_LIMITS } from '$lib/validation';

	let { data }: { data: PageData } = $props();
	const tipoSelected = $derived(Number($page.url.searchParams.get('tipoSelected')) || 1);

	let loggingOut = $state(false);
	let filterDate = $state('');
	let selectedRegistro = $state<(typeof data.registros)[0] | null>(null);
	let showModal = $state(false);
	let filterEstado = $state('true');
	let showConfirmationModal = $state(false);
	let pendingAction = $state<'desactivar' | 'activar' | null>(null);

	const minDateStr = `${VALIDATION_LIMITS.MIN_YEAR}-01-01`;
	const maxDateStr = `${new Date().getFullYear() + VALIDATION_LIMITS.MAX_YEAR_OFFSET}-12-31`;

	// Iniciales del usuario
	const initials = $derived(
		data.user?.name
			?.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() ?? '?'
	);

	// Mapa de productos por ID para búsqueda rápida
	const productosMap = $derived(Object.fromEntries(data.productos.map((p) => [p.idProducto, p])));

	// Mapa de tipos por ID
	const tiposMap = $derived(Object.fromEntries(data.tipos.map((t) => [t.idTipo, t])));

	// Formatear fecha a "DD/MM/YYYY"
	function formatFecha(fecha: string): string {
		const d = new Date(fecha);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	}

	// Clave de fecha "YYYY-MM-DD" para agrupar
	function fechaKey(fecha: string): string {
		const d = new Date(fecha);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${year}-${month}-${day}`;
	}

	// Fecha legible para cabecera de grupo
	function formatFechaGrupo(key: string): string {
		const [year, month, day] = key.split('-');
		const meses = [
			'Enero',
			'Febrero',
			'Marzo',
			'Abril',
			'Mayo',
			'Junio',
			'Julio',
			'Agosto',
			'Septiembre',
			'Octubre',
			'Noviembre',
			'Diciembre'
		];
		return `${parseInt(day, 10)} de ${meses[parseInt(month, 10) - 1]} de ${year}`;
	}

	function formatHora(fecha: string): string {
		const d = new Date(fecha);
		return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function formatPrice(price: number | null | undefined): string {
		if (price === null || price === undefined) return '—';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	}

	// Total de un registro
	function calcTotal(reg: (typeof data.registros)[0]): number {
		return reg.preciosProductos.reduce((acc, precio, i) => {
			return acc + precio * (reg.cantidadProductos[i] ?? 1);
		}, 0);
	}

	// Ganancia de un registro
	function calcGanancia(reg: (typeof data.registros)[0]): number {
		const total = calcTotal(reg);
		return total * ((reg.porcentajeGanancia ?? 0) / 100);
	}

	// Ganancia total de todos los registros de una fecha
	function calcGananciaFecha(key: string): number {
		return registrosFiltrados
			.filter(
				(r) =>
					fechaKey(r.fecha) === key &&
					r.idTipo === tipoSelected &&
					String(r.estado) === filterEstado
			)
			.reduce((acc, r) => acc + calcGanancia(r), 0);
	}

	// Registros filtrados por fecha
	const registrosFiltrados = $derived(
		data.registros.filter((r) => {
			if (!filterDate) return true;
			return fechaKey(r.fecha) === filterDate;
		})
	);

	// Agrupar registros por fecha (descendente)
	const registrosAgrupados = $derived(() => {
		const grupos: Record<string, typeof data.registros> = {};
		for (const r of registrosFiltrados) {
			if (r.idTipo === tipoSelected && (filterEstado === '' || String(r.estado) === filterEstado)) {
				const key = fechaKey(r.fecha);
				if (!grupos[key]) grupos[key] = [];
				grupos[key].push(r);
			}
		}
		const keys = Object.keys(grupos).sort((a, b) => b.localeCompare(a));
		return keys.map((key) => ({ key, registros: grupos[key] }));
	});

	function openModal(reg: (typeof data.registros)[0]) {
		selectedRegistro = reg;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedRegistro = null;
	}

	function desactivarRegistro() {
		const form = document.getElementById('form-desactivar') as HTMLFormElement;
		form?.requestSubmit();
	}

	function activarRegistro() {
		const form = document.getElementById('form-activar') as HTMLFormElement;
		form?.requestSubmit();
		filterEstado = 'true';
	}

	function requestConfirmation(action: 'desactivar' | 'activar') {
		pendingAction = action;
		showConfirmationModal = true;
	}

	function confirmAction() {
		showConfirmationModal = false;
		if (pendingAction === 'desactivar') desactivarRegistro();
		else if (pendingAction === 'activar') activarRegistro();
		pendingAction = null;
	}

	function cancelConfirmation() {
		showConfirmationModal = false;
		pendingAction = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (showConfirmationModal) cancelConfirmation();
			else if (showModal) closeModal();
		}
	}

	function getNombreProducto(id: number): string {
		return productosMap[id]?.nombreProducto ?? `Producto #${id}`;
	}

	function getNombreTipo(idTipo: number | null | undefined): string {
		if (!idTipo) return '—';
		return tiposMap[idTipo]?.nombreTipo ?? `Tipo #${idTipo}`;
	}

	const nombreTipo = $derived(getNombreTipo(tipoSelected));

	function totalItems(reg: (typeof data.registros)[0]): number {
		return reg.cantidadProductos.reduce((a, b) => a + Number(b), 0);
	}
</script>

<svelte:head>
	<title>Registros de {nombreTipo} · Imperio</title>
	<meta name="description" content="Historial y registros de ventas de {nombreTipo} en Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="dashboard">
	<!-- Navbar Empresarial -->
	<header class="navbar">
		<div class="navbar-brand">
			<a href="/" class="brand-link" aria-label="Volver al inicio">
				<img
					src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/logo.png"
					width="38"
					height="38"
					alt="Imperio"
					class="brand-logo"
				/>
				<span class="brand-text">IMPERIO</span>
			</a>
		</div>

		<nav class="navbar-breadcrumb" aria-label="Navegación de migas de pan">
			<a href="/" class="breadcrumb-link">Inicio</a>
			<span class="breadcrumb-sep" aria-hidden="true">/</span>
			<a href="/gestion_productos?tipoSelected={tipoSelected}" class="breadcrumb-link"
				>Gestión {nombreTipo}</a
			>
			<span class="breadcrumb-sep" aria-hidden="true">/</span>
			<span class="breadcrumb-current">Registros</span>
		</nav>

		<div class="navbar-user">
			<div
				class="user-avatar"
				title={data.user?.name ?? 'Usuario'}
				aria-label="Avatar de {data.user?.name}"
			>
				{initials}
			</div>
			<form
				method="POST"
				action="?/logout"
				use:enhance={() => {
					loggingOut = true;
					return async ({ update }) => {
						loggingOut = false;
						await update();
					};
				}}
			>
				<button id="logout-btn" type="submit" class="logout-btn" disabled={loggingOut}>
					{#if loggingOut}
						<span class="spinner-sm" aria-hidden="true"></span>
					{:else}
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
					{/if}
					<span>Cerrar sesión</span>
				</button>
			</form>
		</div>
	</header>

	<!-- Contenido Principal -->
	<main class="main-content">
		<!-- Page Header -->
		<div class="page-header">
			<div class="page-header-left">
				<div class="page-icon" aria-hidden="true">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
					</svg>
				</div>
				<div>
					<h1 class="page-title">Historial de Registros: {nombreTipo}</h1>
					<p class="page-subtitle">Auditoría y trazabilidad cronológica de operaciones</p>
				</div>
			</div>

			<div class="header-actions">
				<a href="/gestion_productos?tipoSelected={tipoSelected}" class="btn-secondary-link">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="19" y1="12" x2="5" y2="12" />
						<polyline points="12 19 5 12 12 5" />
					</svg>
					Volver a Gestión
				</a>
			</div>
		</div>

		<!-- Barra de Filtros Rígida -->
		<div class="filters-bar">
			<div class="filter-date-wrapper">
				<svg
					class="filter-icon"
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
				<input
					id="filter-date"
					type="date"
					class="date-input"
					min={minDateStr}
					max={maxDateStr}
					bind:value={filterDate}
					aria-label="Filtrar por fecha específica"
				/>
				{#if filterDate}
					<button
						class="clear-filter"
						onclick={() => (filterDate = '')}
						aria-label="Limpiar filtro de fecha"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}
			</div>

			{#if filterDate}
				<div class="filter-badge">
					Filtrando: {formatFechaGrupo(filterDate)}
				</div>
			{/if}

			<div class="filter-estado-group">
				<label for="filter-estado" class="filter-estado-label">Estado:</label>
				<select class="filter-select" id="filter-estado" bind:value={filterEstado}>
					<option value="true">Activos</option>
					<option value="false">Inactivos</option>
					<option value="">Todos</option>
				</select>
			</div>
		</div>

		<!-- Listado Agrupado de Registros -->
		{#if registrosAgrupados().length === 0}
			<div class="empty-state">
				<div class="empty-icon" aria-hidden="true">
					<svg
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
						<line x1="9" y1="14" x2="15" y2="14" />
					</svg>
				</div>
				<h2>No se encontraron registros</h2>
				<p>
					{filterDate
						? `No existen operaciones registradas para la fecha seleccionada (${formatFechaGrupo(filterDate)}).`
						: 'No hay registros en el sistema para esta categoría y estado.'}
				</p>
			</div>
		{:else}
			{#each registrosAgrupados() as grupo (grupo.key)}
				<div class="date-group">
					<!-- Cabecera de grupo de fecha con cálculo de ganancia -->
					<div class="date-group-header">
						<div class="date-group-line" aria-hidden="true"></div>
						<div class="date-group-label">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							</svg>
							<span class="group-date-text">{formatFechaGrupo(grupo.key)}</span>
							<span class="group-count"
								>({grupo.registros.length} registro{grupo.registros.length !== 1 ? 's' : ''})</span
							>

							{#if calcGananciaFecha(grupo.key) > 0}
								<span class="daily-profit-badge">
									Margen del día: {formatPrice(calcGananciaFecha(grupo.key))}
								</span>
							{/if}
						</div>
						<div class="date-group-line" aria-hidden="true"></div>
					</div>

					<!-- Grid de tarjetas de registros -->
					<div class="registros-grid">
						{#each grupo.registros as reg (reg.idRegistro)}
							<div class="registro-card" class:inactive={!reg.estado}>
								<div class="registro-card-top">
									<div class="registro-meta">
										<span class="registro-id">#{reg.idRegistro}</span>
										<span class="registro-hora" title="Hora de registro">
											<svg
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<circle cx="12" cy="12" r="10" />
												<polyline points="12 6 12 12 16 14" />
											</svg>
											{formatHora(reg.fecha)}
										</span>
									</div>
									<span class="registro-status-badge" class:active={reg.estado}>
										{reg.estado ? 'Activo' : 'Inactivo'}
									</span>
								</div>

								<div class="registro-card-body">
									<div class="registro-stat">
										<span class="stat-label">Productos</span>
										<span class="stat-value">{reg.idProductos.length}</span>
									</div>
									<div class="registro-stat">
										<span class="stat-label">Unidades</span>
										<span class="stat-value">{totalItems(reg)}</span>
									</div>
									<div class="registro-stat stat-full">
										<span class="stat-label">Monto Total</span>
										<span class="stat-value stat-total">{formatPrice(calcTotal(reg))}</span>
									</div>
									{#if (reg.porcentajeGanancia ?? 0) > 0}
										<div class="registro-stat stat-full">
											<span class="stat-label">Ganancia ({reg.porcentajeGanancia}%)</span>
											<span class="stat-value stat-ganancia">+{formatPrice(calcGanancia(reg))}</span
											>
										</div>
									{/if}
								</div>

								<!-- Vista previa de chips de productos -->
								<div class="registro-products-preview">
									{#each reg.idProductos.slice(0, 3) as pid, i}
										<span class="product-chip">
											<span class="product-chip-name">{getNombreProducto(Number(pid))}</span>
											{#if reg.cantidadProductos[i] > 1}
												<span class="product-chip-qty">×{reg.cantidadProductos[i]}</span>
											{/if}
										</span>
									{/each}
									{#if reg.idProductos.length > 3}
										<span class="product-chip product-chip-more">
											+{reg.idProductos.length - 3} más
										</span>
									{/if}
								</div>

								<button
									type="button"
									class="btn-ver-mas"
									onclick={() => openModal(reg)}
									aria-label="Ver detalles completos del registro {reg.idRegistro}"
								>
									<svg
										width="13"
										height="13"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
									Detalles del Registro
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</main>
</div>

<!-- Modal de Detalle del Registro -->
{#if showModal && selectedRegistro}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeModal();
		}}
		role="dialog"
		aria-modal="true"
		aria-label="Detalle del registro"
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<div class="modal-header-info">
					<h2 class="modal-title">Registro #{selectedRegistro.idRegistro}</h2>
					<div class="modal-date-time-tag">
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						<span class="modal-fecha-txt">{formatFecha(selectedRegistro.fecha)}</span>
						<span class="dot-sep" aria-hidden="true">•</span>
						<span class="modal-hora-txt">{formatHora(selectedRegistro.fecha)}</span>
					</div>
				</div>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar modal">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<!-- Información general del registro -->
				<div class="modal-info-row">
					<div class="modal-info-item">
						<span class="modal-info-label">Categoría</span>
						<span class="modal-info-value">{getNombreTipo(selectedRegistro.idTipo)}</span>
					</div>
					<div class="modal-info-item">
						<span class="modal-info-label">Estado</span>
						<span class="estado-badge" class:activo={selectedRegistro.estado}>
							{selectedRegistro.estado ? 'Activo' : 'Inactivo'}
						</span>
					</div>
					<div class="modal-info-item">
						<span class="modal-info-label">Margen de Ganancia</span>
						<span class="modal-info-value">{selectedRegistro.porcentajeGanancia ?? 0}%</span>
					</div>
				</div>

				<!-- Tabla de productos y desglose -->
				<div class="modal-section-title">Desglose de Productos</div>
				<div class="modal-table-wrap">
					<table class="modal-table">
						<thead>
							<tr>
								<th>Producto</th>
								<th class="th-center">Cant.</th>
								<th class="th-right">Precio Unit.</th>
								<th class="th-right">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							{#each selectedRegistro.idProductos as pid, i}
								{@const precio = selectedRegistro.preciosProductos[i] ?? 0}
								{@const cantidad = selectedRegistro.cantidadProductos[i] ?? 1}
								{@const subtotal = precio * Number(cantidad)}
								<tr>
									<td class="td-prod-name">{getNombreProducto(Number(pid))}</td>
									<td class="td-center font-mono">{cantidad}</td>
									<td class="td-right font-mono">{formatPrice(precio)}</td>
									<td class="td-right font-mono font-bold">{formatPrice(subtotal)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Totales -->
				<div class="modal-totals">
					<div class="modal-total-row">
						<span class="modal-total-label">Subtotal de Costo / Venta:</span>
						<span class="modal-total-value">{formatPrice(calcTotal(selectedRegistro))}</span>
					</div>
					{#if (selectedRegistro.porcentajeGanancia ?? 0) > 0}
						<div class="modal-total-row">
							<span class="modal-total-label"
								>Margen Estimado ({selectedRegistro.porcentajeGanancia}%):</span
							>
							<span class="modal-total-value ganancia-value"
								>+{formatPrice(calcGanancia(selectedRegistro))}</span
							>
						</div>
						<div class="modal-total-row modal-total-final">
							<span class="modal-total-label">Monto Bruto Estimado:</span>
							<span class="modal-total-value total-gold">
								{formatPrice(calcTotal(selectedRegistro) + calcGanancia(selectedRegistro))}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="modal-footer">
				{#if selectedRegistro}
					<form
						id="form-desactivar"
						method="POST"
						action="?/desactivarRegistro"
						use:enhance={() => {
							closeModal();
							return async ({ update }) => {
								await update();
							};
						}}
					>
						<input type="hidden" name="idRegistro" value={selectedRegistro.idRegistro} />
					</form>
					<form
						id="form-activar"
						method="POST"
						action="?/activarRegistro"
						use:enhance={() => {
							closeModal();
							return async ({ update }) => {
								await update();
							};
						}}
					>
						<input type="hidden" name="idRegistro" value={selectedRegistro.idRegistro} />
					</form>
				{/if}
				<div class="modal-footer-actions">
					<button
						type="button"
						class={selectedRegistro.estado ? 'btn-danger-outline' : 'btn-success-outline'}
						onclick={() => {
							if (selectedRegistro)
								requestConfirmation(selectedRegistro.estado ? 'desactivar' : 'activar');
						}}
					>
						{selectedRegistro.estado ? 'Desactivar Registro' : 'Reactivar Registro'}
					</button>
					<button type="button" class="btn-cancel" onclick={closeModal}>Cerrar</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Modal de Confirmación Rígido -->
{#if showConfirmationModal}
	<div
		class="confirm-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		onclick={(e) => {
			if (e.target === e.currentTarget) cancelConfirmation();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') cancelConfirmation();
		}}
		tabindex="-1"
	>
		<div class="confirm-card">
			<div class="confirm-icon {pendingAction === 'desactivar' ? 'icon-warn' : 'icon-ok'}">
				{#if pendingAction === 'desactivar'}
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
						/>
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				{:else}
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</div>

			<h2 id="confirm-title" class="confirm-title">
				{pendingAction === 'desactivar'
					? '¿Desactivar este registro?'
					: '¿Reactivar este registro?'}
			</h2>

			<p class="confirm-desc">
				{#if pendingAction === 'desactivar'}
					El registro pasará a estado inactivo y no se considerará en los cálculos activos diarios.
				{:else}
					El registro volverá a estar activo y se incluirá en los balances del sistema.
				{/if}
			</p>

			<div class="confirm-actions">
				<button
					id="btn-confirm-cancel"
					class="confirm-btn confirm-btn--cancel"
					onclick={cancelConfirmation}
				>
					Cancelar
				</button>
				<button
					id="btn-confirm-apply"
					class="confirm-btn confirm-btn--apply {pendingAction === 'desactivar'
						? 'apply-warn'
						: 'apply-ok'}"
					onclick={confirmAction}
				>
					{pendingAction === 'desactivar' ? 'Desactivar' : 'Reactivar'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Layout Base Rígido y Profesional ── */
	.dashboard {
		min-height: 100vh;
		background: #090a0f;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		color: #e2e4e9;
		display: flex;
		flex-direction: column;
	}

	/* ── Navbar Empresarial ── */
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.75rem;
		height: 54px;
		background: #0f1118;
		border-bottom: 1px solid #1f2330;
		gap: 1rem;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		text-decoration: none;
		color: inherit;
	}

	.brand-logo {
		border-radius: 6px;
		display: block;
	}

	.brand-text {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #f4f4f6;
	}

	.navbar-breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.breadcrumb-link {
		color: #7d8495;
		text-decoration: none;
		transition: color 0.15s;
	}

	.breadcrumb-link:hover {
		color: #d4af37;
	}

	.breadcrumb-sep {
		color: #404759;
	}

	.breadcrumb-current {
		color: #f4f4f6;
		font-weight: 600;
	}

	.navbar-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: #b6914c;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: #0c0d12;
		flex-shrink: 0;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.4rem 0.75rem;
		color: #9da4b5;
		font-size: 0.8rem;
		font-family: inherit;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.logout-btn:hover:not(:disabled) {
		background: #1c2130;
		border-color: #343c52;
		color: #ffffff;
	}

	.logout-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Main Content Container ── */
	.main-content {
		flex: 1;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		box-sizing: border-box;
	}

	/* ── Page Header ── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1.25rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid #1a1e2a;
	}

	.page-header-left {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.page-icon {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		background: #141722;
		border: 1px solid #262c3d;
		color: #d4af37;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.page-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #ffffff;
		margin: 0;
	}

	.page-subtitle {
		font-size: 0.82rem;
		color: #7d8495;
		margin-top: 0.15rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn-secondary-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: #141722;
		border: 1px solid #262c3d;
		padding: 0.55rem 0.95rem;
		border-radius: 6px;
		color: #c0c6d4;
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.btn-secondary-link:hover {
		background: #1b2030;
		border-color: #38425c;
		color: #ffffff;
	}

	/* ── Barra de Filtros ── */
	.filters-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 0.85rem 1rem;
		background: #0f1118;
		border: 1px solid #1f2330;
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.filter-date-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.45rem 0.75rem;
		transition: border-color 0.15s;
	}

	.filter-date-wrapper:focus-within {
		border-color: #b6914c;
	}

	.filter-icon {
		color: #555d72;
		flex-shrink: 0;
	}

	.date-input {
		background: transparent;
		border: none;
		outline: none;
		color: #ffffff;
		font-family: inherit;
		font-size: 0.86rem;
		cursor: pointer;
		color-scheme: dark;
		min-width: 140px;
	}

	.clear-filter {
		background: none;
		border: none;
		cursor: pointer;
		color: #7d8495;
		display: flex;
		align-items: center;
		padding: 0;
		transition: color 0.15s;
	}

	.clear-filter:hover {
		color: #f87171;
	}

	.filter-badge {
		font-size: 0.8rem;
		font-weight: 600;
		color: #d4af37;
		background: rgba(182, 145, 76, 0.1);
		border: 1px solid rgba(182, 145, 76, 0.25);
		border-radius: 6px;
		padding: 0.35rem 0.75rem;
	}

	.filter-estado-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}

	.filter-estado-label {
		font-size: 0.8rem;
		color: #7d8495;
	}

	.filter-select {
		padding: 0.5rem 0.85rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	.filter-select:focus {
		border-color: #b6914c;
	}

	/* ── Grupos de Fecha ── */
	.date-group {
		margin-bottom: 2.25rem;
	}

	.date-group-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.15rem;
	}

	.date-group-line {
		flex: 1;
		height: 1px;
		background: #1c2130;
	}

	.date-group-label {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.65rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: #c0c6d4;
		background: #11141c;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.4rem 0.85rem;
	}

	.group-date-text {
		color: #ffffff;
		font-weight: 600;
	}

	.group-count {
		font-size: 0.75rem;
		color: #7d8495;
	}

	.daily-profit-badge {
		font-weight: 700;
		color: #34d399;
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.25);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	/* ── Grid de Registros ── */
	.registros-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	/* ── Registro Card ── */
	.registro-card {
		background: #11141c;
		border: 1px solid #1f2433;
		border-radius: 8px;
		padding: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		transition: border-color 0.15s;
	}

	.registro-card:hover {
		border-color: #2e3549;
	}

	.registro-card.inactive {
		opacity: 0.65;
	}

	.registro-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.registro-meta {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.registro-id {
		font-size: 0.78rem;
		font-weight: 700;
		color: #7d8495;
	}

	.registro-hora {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: #9da4b5;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.registro-status-badge {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.registro-status-badge.active {
		background: rgba(16, 185, 129, 0.1);
		color: #34d399;
		border-color: rgba(16, 185, 129, 0.2);
	}

	.registro-card-body {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.registro-stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		background: #141722;
		border: 1px solid #202536;
		border-radius: 6px;
		padding: 0.55rem 0.75rem;
	}

	.stat-full {
		grid-column: span 2;
	}

	.stat-label {
		font-size: 0.68rem;
		font-weight: 600;
		color: #7d8495;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-value {
		font-size: 0.95rem;
		font-weight: 700;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.stat-total {
		color: #d4af37;
	}

	.stat-ganancia {
		color: #34d399;
	}

	/* Chips de productos resumidos */
	.registro-products-preview {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.product-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #c0c6d4;
		background: #141722;
		border: 1px solid #222736;
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		max-width: 100%;
	}

	.product-chip-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 130px;
	}

	.product-chip-qty {
		color: #d4af37;
		font-weight: 700;
		font-size: 0.7rem;
	}

	.product-chip-more {
		color: #7d8495;
		background: #181c28;
	}

	.btn-ver-mas {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		width: 100%;
		padding: 0.55rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #c0c6d4;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
		margin-top: 0.25rem;
	}

	.btn-ver-mas:hover {
		background: #1b2030;
		border-color: #38425c;
		color: #ffffff;
	}

	/* ── Empty State ── */
	.empty-state {
		text-align: center;
		padding: 4.5rem 1.5rem;
		background: #0f1118;
		border: 1px solid #1f2330;
		border-radius: 8px;
	}

	.empty-icon {
		margin-bottom: 0.75rem;
		color: #495267;
	}

	.empty-state h2 {
		font-size: 1.15rem;
		color: #ffffff;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}

	.empty-state p {
		font-size: 0.85rem;
		color: #7d8495;
	}

	/* ── Modales ── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		box-sizing: border-box;
	}

	.modal {
		background: #11141c;
		border: 1px solid #262c3e;
		border-radius: 10px;
		width: 100%;
		max-width: 640px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #1a1e2a;
		background: #0d0f15;
		gap: 1rem;
	}

	.modal-header-info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.modal-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.modal-date-time-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.82rem;
		color: #9da4b5;
		font-variant-numeric: tabular-nums;
	}

	.dot-sep {
		color: #404759;
	}

	.modal-close {
		background: transparent;
		border: 1px solid #232838;
		border-radius: 6px;
		width: 32px;
		height: 32px;
		color: #7d8495;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.modal-close:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	.modal-body {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-sizing: border-box;
	}

	.modal-info-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.modal-info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		background: #141722;
		border: 1px solid #202536;
		border-radius: 6px;
		padding: 0.65rem 0.85rem;
	}

	.modal-info-label {
		font-size: 0.68rem;
		font-weight: 600;
		color: #7d8495;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.modal-info-value {
		font-size: 0.9rem;
		font-weight: 600;
		color: #ffffff;
	}

	.estado-badge {
		display: inline-block;
		width: fit-content;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(239, 68, 68, 0.12);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.25);
	}

	.estado-badge.activo {
		background: rgba(16, 185, 129, 0.12);
		color: #34d399;
		border-color: rgba(16, 185, 129, 0.25);
	}

	.modal-section-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #7d8495;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: -0.5rem;
	}

	.modal-table-wrap {
		border: 1px solid #1f2433;
		border-radius: 6px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.modal-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		min-width: 400px;
	}

	.modal-table thead {
		background: #141722;
	}

	.modal-table th {
		padding: 0.55rem 0.85rem;
		text-align: left;
		font-size: 0.72rem;
		font-weight: 600;
		color: #7d8495;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid #1f2433;
	}

	.modal-table td {
		padding: 0.6rem 0.85rem;
		border-bottom: 1px solid #161922;
		color: #c0c6d4;
	}

	.modal-table tbody tr:last-child td {
		border-bottom: none;
	}

	.td-prod-name {
		color: #ffffff;
		font-weight: 500;
	}

	.font-mono {
		font-variant-numeric: tabular-nums;
	}

	.font-bold {
		font-weight: 700;
	}

	.th-center,
	.td-center {
		text-align: center;
	}

	.th-right,
	.td-right {
		text-align: right;
	}

	.modal-totals {
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.85rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.modal-total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-total-label {
		font-size: 0.85rem;
		color: #7d8495;
	}

	.modal-total-value {
		font-size: 0.95rem;
		font-weight: 700;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.ganancia-value {
		color: #34d399;
	}

	.modal-total-final {
		padding-top: 0.5rem;
		border-top: 1px solid #1c2130;
		margin-top: 0.25rem;
	}

	.modal-total-final .modal-total-label {
		color: #ffffff;
		font-weight: 600;
	}

	.total-gold {
		color: #d4af37;
		font-size: 1.1rem;
	}

	.modal-footer {
		padding: 1.15rem 1.5rem;
		border-top: 1px solid #1a1e2a;
		background: #0d0f15;
	}

	.modal-footer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.75rem;
	}

	.btn-cancel {
		padding: 0.55rem 1.25rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #9da4b5;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-cancel:hover {
		background: #1c2130;
		color: #ffffff;
	}

	.btn-danger-outline {
		padding: 0.55rem 1.1rem;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.35);
		border-radius: 6px;
		color: #f87171;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-danger-outline:hover {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.btn-success-outline {
		padding: 0.55rem 1.1rem;
		background: transparent;
		border: 1px solid rgba(16, 185, 129, 0.35);
		border-radius: 6px;
		color: #34d399;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-success-outline:hover {
		background: rgba(16, 185, 129, 0.12);
		border-color: rgba(16, 185, 129, 0.5);
	}

	/* ── Confirmation Modal ── */
	.confirm-overlay {
		position: fixed;
		inset: 0;
		z-index: 150;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.75);
		padding: 1rem;
	}

	.confirm-card {
		background: #11141c;
		border: 1px solid #262c3e;
		border-radius: 8px;
		padding: 1.75rem;
		width: min(400px, 92vw);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
	}

	.confirm-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.2rem;
	}

	.icon-warn {
		background: rgba(245, 158, 11, 0.12);
		color: #fbbf24;
		border: 1px solid rgba(245, 158, 11, 0.25);
	}

	.icon-ok {
		background: rgba(16, 185, 129, 0.12);
		color: #34d399;
		border: 1px solid rgba(16, 185, 129, 0.25);
	}

	.confirm-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: #ffffff;
		text-align: center;
		margin: 0;
	}

	.confirm-desc {
		font-size: 0.85rem;
		color: #7d8495;
		text-align: center;
		line-height: 1.5;
		margin: 0;
	}

	.confirm-actions {
		display: flex;
		gap: 0.65rem;
		margin-top: 0.5rem;
		width: 100%;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.55rem 1rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: opacity 0.15s;
	}

	.confirm-btn:hover {
		opacity: 0.9;
	}

	.confirm-btn--cancel {
		background: #141722;
		color: #9da4b5;
		border: 1px solid #232838;
	}

	.confirm-btn--apply.apply-warn {
		background: #dc2626;
		color: #ffffff;
	}

	.confirm-btn--apply.apply-ok {
		background: #059669;
		color: #ffffff;
	}

	/* Spinner */
	.spinner-sm {
		width: 13px;
		height: 13px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Responsividad ── */
	@media (max-width: 768px) {
		.navbar {
			padding: 0 1rem;
		}

		.navbar-breadcrumb {
			display: none;
		}

		.main-content {
			padding: 1.25rem 1rem 3rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
		}

		.filters-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-date-wrapper {
			width: 100%;
			box-sizing: border-box;
		}

		.date-input {
			flex: 1;
		}

		.filter-estado-group {
			margin-left: 0;
			justify-content: space-between;
			width: 100%;
		}

		.filter-select {
			flex: 1;
		}

		.registros-grid {
			grid-template-columns: 1fr;
		}

		.modal-info-row {
			grid-template-columns: 1fr;
		}

		.modal-footer-actions {
			flex-direction: column-reverse;
		}

		.modal-footer-actions button {
			width: 100%;
			text-align: center;
			justify-content: center;
		}
	}
</style>
