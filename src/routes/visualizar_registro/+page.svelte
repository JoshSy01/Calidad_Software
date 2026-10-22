<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { page } from "$app/stores";

	let { data }: { data: PageData } = $props();
	const tipoSelected = $derived(Number($page.url.searchParams.get("tipoSelected")) || 1);

	let loggingOut = $state(false);
	let filterDate = $state('');
	let selectedRegistro = $state<typeof data.registros[0] | null>(null);
	let showModal = $state(false);
	let filterEstado = $state('true');
	let tipo = $state(tipoSelected.toString());
	let showConfirmationModal = $state(false);
	let pendingAction = $state<'desactivar' | 'activar' | null>(null);
	let gananciaFecha = $state<string>('');
	
	

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
	const productosMap = $derived(
		Object.fromEntries(data.productos.map((p) => [p.idProducto, p]))
	);

	// Mapa de tipos por ID
	const tiposMap = $derived(
		Object.fromEntries(data.tipos.map((t) => [t.idTipo, t]))
	);

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
		const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
	}

	function formatHora(fecha: string): string {
		const d = new Date(fecha);
		return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
	}

	function formatPrice(price: number | null | undefined): string {
		if (price === null || price === undefined) return '—';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	}

	// Total de un registro
	function calcTotal(reg: typeof data.registros[0]): number {
		return reg.preciosProductos.reduce((acc, precio, i) => {
			return acc + precio * (reg.cantidadProductos[i] ?? 1);
		}, 0);
	}

	// Ganancia de un registro
	function calcGanancia(reg: typeof data.registros[0]): number {
		const total = calcTotal(reg);
		return total * ((reg.porcentajeGanancia ?? 0) / 100);
	}

	// Ganancia total de todos los registros de una fecha
	function calcGananciaFecha(key: string): number {
		return registrosFiltrados
			.filter((r) => fechaKey(r.fecha) === key && r.idTipo === tipoSelected && String(r.estado) === filterEstado)
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
			if (r.idTipo === tipoSelected && String(r.estado) === filterEstado){
				const key = fechaKey(r.fecha);
				if (!grupos[key]) grupos[key] = [];
				grupos[key].push(r);
			}
		}
		// Ordenar las claves de forma descendente
		const keys = Object.keys(grupos).sort((a, b) => b.localeCompare(a));
		return keys.map((key) => ({ key, registros: grupos[key] }));
	});

	function openModal(reg: typeof data.registros[0]) {
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
		filterEstado = "true";
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
		if (e.key === 'Escape') closeModal();
	}

	// Nombre del producto por ID
	function getNombreProducto(id: number): string {
		return productosMap[id]?.nombreProducto ?? `Producto #${id}`;
	}

	// Nombre del tipo
	function getNombreTipo(idTipo: number | null | undefined): string {
		if (!idTipo) return '—';
		return tiposMap[idTipo]?.nombreTipo ?? `Tipo #${idTipo}`;
	}

	// Nombre reactivo del tipo seleccionado
	const nombreTipo = $derived(getNombreTipo(tipoSelected));

	// Cantidad total de items en un registro
	function totalItems(reg: typeof data.registros[0]): number {
		return reg.cantidadProductos.reduce((a, b) => a + Number(b), 0);
	}
</script>

<svelte:head>
	<title>Visualizar Registros · Imperio</title>
	<meta name="description" content="Visualiza los registros de ventas en Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="dashboard">

	<!-- Navbar -->
	<header class="navbar">
		<div class="navbar-brand">
			<div class="brand-icon">
				<a href="/">
					<img src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/logo.png" width="50" height="50" alt="Imperio" class="brand-logo" />
				</a>
			</div>
		</div>

		<nav class="navbar-breadcrumb">
			<a href="/" class="breadcrumb-link">Inicio</a>
			<span class="breadcrumb-sep">›</span>
			<span class="breadcrumb-current">Visualizar Registros</span>
		</nav>

		<div class="navbar-user">
			<div class="user-avatar" aria-label="Avatar de {data.user?.name}">
				{initials}
			</div>
			<form method="POST" action="?/logout" use:enhance={() => {
				loggingOut = true;
				return async ({ update }) => { loggingOut = false; await update(); };
			}}>
				<button id="logout-btn" type="submit" class="logout-btn" disabled={loggingOut}>
					{#if loggingOut}
						<span class="spinner-sm" aria-hidden="true"></span>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
							<polyline points="16 17 21 12 16 7"/>
							<line x1="21" y1="12" x2="9" y2="12"/>
						</svg>
					{/if}
					Cerrar sesión
				</button>
			</form>
		</div>
	</header>

	<!-- Contenido principal -->
	<main class="main-content">
		<!-- Page Header -->
		<div class="page-header">
			<div class="page-header-left">
				<div class="page-icon">📋</div>
				<div>
					<h1 class="page-title">Registros de Ventas de {nombreTipo}</h1>
				</div>
			</div>
		</div>

		<!-- Filtro por fecha -->
		<div class="filters-bar">
			<div class="filter-date-wrapper">
				<svg class="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
					<line x1="16" y1="2" x2="16" y2="6"/>
					<line x1="8" y1="2" x2="8" y2="6"/>
					<line x1="3" y1="10" x2="21" y2="10"/>
				</svg>
				<input
					id="filter-date"
					type="date"
					class="date-input"
					bind:value={filterDate}
					aria-label="Filtrar por fecha"
				/>
				{#if filterDate}
					<button class="clear-filter" onclick={() => filterDate = ''} aria-label="Limpiar filtro">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				{/if}
			</div>
			{#if filterDate}
				<span class="filter-badge">
					Mostrando: {formatFechaGrupo(filterDate)}
				</span>
			{/if}

			<div class="filter-estado">

				<label for="filter-estado">Estado:</label>
				<select class="filter-select" id="filter-estado" bind:value={filterEstado}>
					<option value="true">Activo</option>
					<option value="false">Inactivo</option>
				</select>

			</div>
		</div>

		<!-- Contenido de registros -->
		{#if registrosFiltrados.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h2>Sin registros</h2>
				<p>
					{filterDate
						? 'No se encontraron registros para esa fecha.'
						: 'Aún no hay registros realizados.'}
				</p>
			</div>
		{:else}
			{#each registrosAgrupados() as grupo (grupo.key)}
				<!-- Grupo por fecha -->
				<div class="date-group">
					<div class="date-group-header">
						<div class="date-group-line"></div>
						<span class="date-group-label">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
								<line x1="16" y1="2" x2="16" y2="6"/>
								<line x1="8" y1="2" x2="8" y2="6"/>
								<line x1="3" y1="10" x2="21" y2="10"/>
							</svg>
							{formatFechaGrupo(grupo.key)}

							{#if calcGananciaFecha(grupo.key) > 0}
								<span style="font-weight: bold; color: #34d399;">
									Ganancia del día: {formatPrice(calcGananciaFecha(grupo.key))}
								</span>
							{/if}
						</span>
						<div class="date-group-line"></div>
					</div>

					<!-- Grid de registros del grupo -->
					<div class="registros-grid">
						{#each grupo.registros as reg (reg.idRegistro)}
							<div class="registro-card">
								<div class="registro-card-top">
									<div class="registro-meta">
										<span class="registro-hora">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<circle cx="12" cy="12" r="10"/>
												<polyline points="12 6 12 12 16 14"/>
											</svg>
											{formatHora(reg.fecha)}
										</span>
									</div>
									<span class="registro-tipo-badge">
										{getNombreTipo(reg.idTipo)}
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
									<div class="registro-stat">
										<span class="stat-label">Total</span>
										<span class="stat-value stat-total">{formatPrice(calcTotal(reg))}</span>
									</div>
									{#if (reg.porcentajeGanancia ?? 0) > 0}
										<div class="registro-stat">
											<span class="stat-label">Ganancia ({reg.porcentajeGanancia}%)</span>
											<span class="stat-value stat-ganancia">+{formatPrice(calcGanancia(reg))}</span>
										</div>
									{/if}
								</div>

								<!-- Productos resumidos -->
								<div class="registro-products-preview">
									{#each reg.idProductos.slice(0, 3) as pid, i}
										<span class="product-chip">
											{getNombreProducto(Number(pid))}
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
									class="btn-ver-mas"
									onclick={() => openModal(reg)}
									aria-label="Ver detalles del registro {reg.idRegistro}"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
									Ver más
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</main>
</div>

<!-- Modal de detalle del registro -->
{#if showModal && selectedRegistro}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
		onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
		role="dialog"
		aria-modal="true"
		aria-label="Detalle del registro"
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<div class="modal-header-info">
					<h2 class="modal-title">Registro #{selectedRegistro.idRegistro}</h2>
					<span class="modal-fecha">{formatFecha(selectedRegistro.fecha)} · {formatHora(selectedRegistro.fecha)}</span>
				</div>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<!-- Info general -->
				<div class="modal-info-row">
					<div class="modal-info-item">
						<span class="modal-info-label">Tipo</span>
						<span class="modal-info-value">{getNombreTipo(selectedRegistro.idTipo)}</span>
					</div>
					<div class="modal-info-item">
						<span class="modal-info-label">Estado</span>
						<span class="modal-info-value estado-badge" class:activo={selectedRegistro.estado}>
							{selectedRegistro.estado ? 'Activo' : 'Inactivo'}
						</span>
					</div>
					<div class="modal-info-item">
						<span class="modal-info-label">Porcentaje de Ganancia</span>
						<span class="modal-info-value">{selectedRegistro.porcentajeGanancia ?? 0}%</span>
					</div>
				</div>

				<!-- Tabla de productos -->
				<div class="modal-section-title">Detalle de Productos</div>
				<div class="modal-table-wrap">
					<table class="modal-table">
						<thead>
							<tr>
								<th>Producto</th>
								<th class="th-center">C</th>
								<th class="th-right">P/U</th>
								<th class="th-right">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							{#each selectedRegistro.idProductos as pid, i}
								{@const precio = selectedRegistro.preciosProductos[i] ?? 0}
								{@const cantidad = selectedRegistro.cantidadProductos[i] ?? 1}
								{@const subtotal = precio * Number(cantidad)}
								<tr>
									<td>{getNombreProducto(Number(pid))}</td>
									<td class="td-center">{cantidad}</td>
									<td class="td-right">{formatPrice(precio)}</td>
									<td class="td-right">{formatPrice(subtotal)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Totales -->
				<div class="modal-totals">
					<div class="modal-total-row">
						<span class="modal-total-label">Subtotal</span>
						<span class="modal-total-value">{formatPrice(calcTotal(selectedRegistro))}</span>
					</div>
					{#if (selectedRegistro.porcentajeGanancia ?? 0) > 0}
						<div class="modal-total-row">
							<span class="modal-total-label">Ganancia ({selectedRegistro.porcentajeGanancia}%)</span>
							<span class="modal-total-value ganancia-value">+{formatPrice(calcGanancia(selectedRegistro))}</span>
						</div>
						<div class="modal-total-row modal-total-final">
							<span class="modal-total-label">Total con Ganancia</span>
							<span class="modal-total-value">{formatPrice(calcTotal(selectedRegistro) + calcGanancia(selectedRegistro))}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="modal-footer">
				{#if selectedRegistro}
					<form id="form-desactivar" method="POST" action="?/desactivarRegistro" use:enhance={() => { closeModal(); return async ({ update }) => { await update(); }; }}>
						<input type="hidden" name="idRegistro" value={selectedRegistro.idRegistro} />
					</form>
					<form id="form-activar" method="POST" action="?/activarRegistro" use:enhance={() => { closeModal(); return async ({ update }) => { await update(); }; }}>
						<input type="hidden" name="idRegistro" value={selectedRegistro.idRegistro} />
					</form>
				{/if}
				<div class="modal-desactivate-button">
					<button class='desactivar' aria-label={selectedRegistro?.estado ? 'Desactivar' : 'Activar'} onclick={() => { requestConfirmation(selectedRegistro?.estado ? 'desactivar' : 'activar') }}>
						{selectedRegistro?.estado ? 'Desactivar' : 'Activar'}
					</button>
					<button type="button" class="btn-cancel" onclick={closeModal}>Cerrar</button>
				</div>
			</div>
		</div>
	</div>
{/if}


{#if showConfirmationModal}
	<div
		class="confirm-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		onclick={(e) => { if (e.target === e.currentTarget) cancelConfirmation(); }}
		onkeydown={(e) => { if (e.key === 'Escape') cancelConfirmation(); }}
		tabindex="-1"
	>
		<div class="confirm-card">
			<div class="confirm-icon {pendingAction === 'desactivar' ? 'icon-warn' : 'icon-ok'}">
				{#if pendingAction === 'desactivar'}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
						<line x1="12" y1="9" x2="12" y2="13"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				{/if}
			</div>
			<h2 id="confirm-title" class="confirm-title">
				{pendingAction === 'desactivar' ? '¿Desactivar registro?' : '¿Activar registro?'}
			</h2>
			<p class="confirm-desc">
				{#if pendingAction === 'desactivar'}
					El registro quedará marcado como <strong>inactivo</strong>. Puedes reactivarlo en cualquier momento.
				{:else}
					El registro quedará marcado como <strong>activo</strong> nuevamente.
				{/if}
			</p>
			<div class="confirm-actions">
				<button id="btn-confirm-cancel" class="confirm-btn confirm-btn--cancel" onclick={cancelConfirmation}>
					Cancelar
				</button>
				<button id="btn-confirm-apply" class="confirm-btn confirm-btn--apply {pendingAction === 'desactivar' ? 'apply-warn' : 'apply-ok'}" onclick={confirmAction}>
					Aplicar
				</button>
			</div>
		</div>
	</div>
{/if}


<style>
	*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

	.dashboard {
		min-height: 100vh;
		background: #000;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
		color: #f5f5f7;
	}

	/* ── Navbar ── */
	.navbar {
		position: sticky; top: 0; z-index: 50;
		display: flex; align-items: center; justify-content: space-between;
		padding: 0 2rem;
		height: 52px;
		background: rgba(0, 0, 0, 0.82);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
		gap: 1rem;
	}
	.navbar-brand { display: flex; align-items: center; }
	.brand-icon {
		width: 36px; height: 36px; border-radius: 10px;
		background: transparent;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden;
	}
	.brand-logo { object-fit: cover; border-radius: 8px; }

	.navbar-breadcrumb {
		display: flex; align-items: center; gap: 0.4rem;
		font-size: 0.85rem;
	}
	.breadcrumb-link {
		color: rgba(255, 255, 255, 0.4); text-decoration: none;
		transition: color 0.2s;
	}
	.breadcrumb-link:hover { color: rgba(255, 255, 255, 0.85); }
	.breadcrumb-sep { color: rgba(255, 255, 255, 0.2); }
	.breadcrumb-current { color: rgba(255, 255, 255, 0.85); font-weight: 500; }

	.navbar-user { display: flex; align-items: center; gap: 0.75rem; }
	.user-avatar {
		width: 32px; height: 32px; border-radius: 50%;
		background: #b6914c;
		display: flex; align-items: center; justify-content: center;
		font-size: 0.75rem; font-weight: 700; color: #000;
		flex-shrink: 0;
	}
	.logout-btn {
		display: flex; align-items: center; gap: 0.4rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px; padding: 0.4rem 0.8rem;
		color: rgba(255,255,255,0.5); font-size: 0.8rem; font-family: inherit;
		cursor: pointer; transition: all 0.2s;
	}
	.logout-btn:hover:not(:disabled) {
		background: rgba(255,255,255,0.06);
		border-color: rgba(255,255,255,0.25);
		color: #fff;
	}
	.logout-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.spinner-sm {
		width: 12px; height: 12px;
		border: 2px solid rgba(255,255,255,0.2);
		border-top-color: rgba(255,255,255,0.7);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		display: inline-block;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Main ── */
	.main-content {
		position: relative; z-index: 1;
		max-width: 1100px; margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}

	/* ── Page Header ── */
	.page-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 2rem;
		animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
	}
	.page-header-left { display: flex; align-items: center; gap: 1rem; }
	.page-icon {
		width: 48px; height: 48px; border-radius: 12px;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		display: flex; align-items: center; justify-content: center;
		font-size: 1.4rem;
	}
	.page-title {
		font-size: 1.6rem; font-weight: 700;
		letter-spacing: -0.03em;
		color: #f5f5f7;
	}

	/* ── Filters ── */
	.filters-bar {
		display: flex; align-items: center; gap: 1rem;
		margin-bottom: 2rem;
		padding: 0.875rem 1.25rem;
		background: #111;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 14px;
		animation: fadeUp 0.5s 0.05s cubic-bezier(0.16,1,0.3,1) both;
		flex-wrap: wrap;
	}
	.filter-date-wrapper {
		display: flex; align-items: center; gap: 0.5rem;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px;
		padding: 0.45rem 0.75rem;
		transition: border-color 0.2s;
	}
	.filter-date-wrapper:focus-within {
		border-color: rgba(182,145,76,0.5);
	}
	.filter-icon { color: rgba(255,255,255,0.3); flex-shrink: 0; }
	.date-input {
		background: transparent; border: none; outline: none;
		color: #f5f5f7; font-family: inherit; font-size: 0.875rem;
		cursor: pointer;
	}
	.date-input::-webkit-calendar-picker-indicator {
		filter: invert(0.6); cursor: pointer;
	}
	.clear-filter {
		background: none; border: none; cursor: pointer;
		color: rgba(255,255,255,0.3); display: flex; align-items: center;
		padding: 0; transition: color 0.2s;
	}
	.clear-filter:hover { color: #f87171; }
	.filter-badge {
		font-size: 0.78rem; font-weight: 600;
		color: #b6914c;
		background: rgba(182,145,76,0.12);
		border: 1px solid rgba(182,145,76,0.25);
		border-radius: 20px; padding: 0.25rem 0.75rem;
	}

	.filter-estado {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.filter-estado label { font-size: 0.85rem; color: rgba(255,255,255,0.45); }
	.filter-select {
		padding: 0.6rem 0.9rem;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; color: #f5f5f7;
		font-size: 0.875rem; font-family: inherit;
		cursor: pointer; min-width: 140px;
		transition: border-color 0.2s; outline: none;
	}
	.filter-select:focus { border-color: rgba(182,145,76,0.5); }
	.filter-select option { background: #111; color: #f5f5f7; }

	/* ── Empty State ── */
	.empty-state {
		display: flex; flex-direction: column; align-items: center;
		gap: 0.75rem; padding: 5rem 2rem; text-align: center;
		background: #111;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 20px;
	}
	.empty-icon { font-size: 3rem; }
	.empty-state h2 { font-size: 1.2rem; color: #f5f5f7; font-weight: 600; }
	.empty-state p { font-size: 0.875rem; color: rgba(255,255,255,0.35); }

	/* ── Date Group ── */
	.date-group { margin-bottom: 2.5rem; animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
	.date-group-header {
		display: flex; align-items: center; gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.date-group-line {
		flex: 1; height: 1px;
		background: rgba(255,255,255,0.07);
	}
	.date-group-label {
		display: flex; align-items: center; gap: 0.5rem;
		font-size: 0.78rem; font-weight: 600;
		color: rgba(255,255,255,0.5); letter-spacing: 0.04em;
		text-transform: uppercase; white-space: nowrap;
		background: #111;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 20px; padding: 0.3rem 0.9rem;
	}

	/* ── Registros Grid ── */
	.registros-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	/* ── Registro Card ── */
	.registro-card {
		display: flex; flex-direction: column; gap: 1rem;
		background: #111;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 16px; padding: 1.25rem;
		transition: border-color 0.25s, transform 0.25s;
	}
	.registro-card:hover {
		border-color: rgba(255,255,255,0.18);
		transform: translateY(-2px);
	}

	.registro-card-top {
		display: flex; align-items: center; justify-content: space-between;
	}
	.registro-meta { display: flex; align-items: center; gap: 0.75rem; }
	.registro-hora {
		display: flex; align-items: center; gap: 0.3rem;
		font-size: 0.9rem; color: rgba(255,255,255,0.45);
	}
	.registro-tipo-badge {
		font-size: 0.72rem; font-weight: 600;
		color: #b6914c;
		background: rgba(182,145,76,0.12);
		border: 1px solid rgba(182,145,76,0.25);
		border-radius: 20px; padding: 0.2rem 0.65rem;
		text-transform: capitalize;
	}

	.registro-card-body {
		display: grid; grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}
	.registro-stat {
		display: flex; flex-direction: column; gap: 0.2rem;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.06);
		border-radius: 10px; padding: 0.6rem 0.8rem;
	}
	.stat-label {
		font-size: 0.68rem; font-weight: 600;
		color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em;
	}
	.stat-value {
		font-size: 0.95rem; font-weight: 700; color: #f5f5f7;
	}
	.stat-total { color: #b6914c; }
	.stat-ganancia { color: #34d399; }

	/* Chips de productos */
	.registro-products-preview {
		display: flex; flex-wrap: wrap; gap: 0.4rem;
	}
	.product-chip {
		display: inline-flex; align-items: center; gap: 0.25rem;
		font-size: 0.72rem; font-weight: 500; color: rgba(255,255,255,0.5);
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 6px; padding: 0.2rem 0.55rem;
		white-space: nowrap; max-width: 150px;
		overflow: hidden; text-overflow: ellipsis;
	}
	.product-chip-qty {
		color: #b6914c; font-weight: 700; font-size: 0.65rem;
	}
	.product-chip-more {
		color: rgba(255,255,255,0.4);
		background: #222;
		border-color: rgba(255,255,255,0.1);
	}

	/* Botón ver más */
	.btn-ver-mas {
		display: flex; align-items: center; justify-content: center; gap: 0.5rem;
		width: 100%; padding: 0.6rem;
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 10px;
		color: rgba(255,255,255,0.55); font-size: 0.82rem; font-weight: 600;
		font-family: inherit; cursor: pointer;
		transition: all 0.2s;
	}
	.btn-ver-mas:hover {
		background: rgba(255,255,255,0.05);
		border-color: rgba(255,255,255,0.22);
		color: #fff;
	}

	/* ── Modal ── */
	.modal-backdrop {
		position: fixed; inset: 0; z-index: 50;
		background: rgba(0,0,0,0.75);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex; align-items: center; justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	.modal {
		width: 100%; max-width: 640px; max-height: 90vh;
		background: #111;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 20px;
		overflow: hidden; display: flex; flex-direction: column;
		box-shadow: 0 30px 80px rgba(0,0,0,0.8);
		animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
	}
	@keyframes modalIn {
		from { opacity: 0; transform: scale(0.96) translateY(12px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}
	.modal-header {
		display: flex; align-items: flex-start; justify-content: space-between;
		padding: 1.5rem 1.75rem 1.25rem;
		border-bottom: 1px solid rgba(255,255,255,0.07);
	}
	.modal-header-info { display: flex; flex-direction: column; gap: 0.25rem; }
	.modal-title { font-size: 1.2rem; font-weight: 700; color: #f5f5f7; }
	.modal-fecha { font-size: 0.8rem; color: rgba(255,255,255,0.35); }
	.modal-close {
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 8px; padding: 0.4rem;
		color: rgba(255,255,255,0.4); cursor: pointer;
		display: flex; align-items: center;
		transition: all 0.2s; flex-shrink: 0;
	}
	.modal-close:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.25); }

	.modal-body {
		flex: 1; overflow-y: auto;
		padding: 1.5rem 1.75rem;
		display: flex; flex-direction: column; gap: 1.25rem;
	}
	.modal-body::-webkit-scrollbar { width: 4px; }
	.modal-body::-webkit-scrollbar-track { background: transparent; }
	.modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

	.modal-info-row {
		display: flex; gap: 1rem; flex-wrap: wrap;
	}
	.modal-info-item {
		flex: 1; min-width: 120px;
		display: flex; flex-direction: column; gap: 0.25rem;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 10px; padding: 0.75rem 1rem;
	}
	.modal-info-label {
		font-size: 0.68rem; font-weight: 600;
		color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em;
	}
	.modal-info-value { font-size: 0.9rem; font-weight: 600; color: #f5f5f7; }
	.estado-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 6px;
		font-size: 0.78rem;
		background: rgba(239,68,68,0.12);
		color: #f87171;
		border: 1px solid rgba(239,68,68,0.2);
		width: fit-content;
	}
	.estado-badge.activo {
		background: rgba(52,211,153,0.1);
		color: #34d399;
		border-color: rgba(52,211,153,0.2);
	}

	.modal-section-title {
		font-size: 0.72rem; font-weight: 700;
		color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.07em;
	}

	.modal-table-wrap {
		overflow-x: auto;
		border-radius: 12px;
		-webkit-overflow-scrolling: touch;
	}
	.modal-table {
		width: 100%; border-collapse: collapse;
		font-size: 0.875rem;
		min-width: 400px;
	}
	.modal-table thead { background: #1a1a1a; }
	.modal-table th {
		padding: 0.75rem 1rem;
		text-align: left; font-size: 0.72rem;
		font-weight: 600; color: rgba(255,255,255,0.35);
		text-transform: uppercase; letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(255,255,255,0.07);
		white-space: inherit;
	}
	.modal-table td {
		padding: 0.75rem 1rem;
		color: rgba(255,255,255,0.75);
		border-bottom: 1px solid rgba(255,255,255,0.05);
	}
	.modal-table tbody tr:last-child td { border-bottom: none; }
	.modal-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
	.th-center, .td-center { text-align: center; }
	.th-right, .td-right { text-align: right; }

	.modal-totals {
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 12px; padding: 1rem 1.25rem;
		display: flex; flex-direction: column; gap: 0.6rem;
	}
	.modal-total-row { display: flex; justify-content: space-between; align-items: center; }
	.modal-total-label { font-size: 0.875rem; color: rgba(255,255,255,0.45); }
	.modal-total-value { font-size: 0.95rem; font-weight: 700; color: #f5f5f7; }
	.ganancia-value { color: #34d399; }
	.modal-total-final {
		padding-top: 0.6rem;
		border-top: 1px solid rgba(255,255,255,0.07);
		margin-top: 0.2rem;
	}
	.modal-total-final .modal-total-label { color: #f5f5f7; font-weight: 600; }
	.modal-total-final .modal-total-value { color: #b6914c; font-size: 1.1rem; }

	.modal-footer {
		padding: 1rem 1.75rem;
		border-top: 1px solid rgba(255,255,255,0.07);
		display: flex; justify-content: flex-end;
	}
	.modal-desactivate-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}
	.btn-cancel {
		padding: 0.6rem 1.5rem;
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 10px;
		color: rgba(255,255,255,0.5); font-size: 0.875rem;
		font-family: inherit; font-weight: 600;
		cursor: pointer; transition: all 0.2s;
	}
	.btn-cancel:hover {
		background: rgba(255,255,255,0.05);
		border-color: rgba(255,255,255,0.22);
		color: #fff;
	}
	.desactivar {
		padding: 0.6rem 1.5rem;
		background: transparent;
		border: 1px solid rgba(239,68,68,0.25);
		border-radius: 10px;
		color: #f87171; font-size: 0.875rem;
		font-family: inherit; font-weight: 600;
		cursor: pointer; transition: all 0.2s;
	}
	.desactivar:hover {
		background: rgba(239,68,68,0.1);
		border-color: rgba(239,68,68,0.4);
	}

	/* ── Confirmation Modal ── */
	.confirm-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		animation: fadeIn 0.18s ease;
	}

	.confirm-card {
		background: #111;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 2.2rem 2rem 1.8rem;
		width: min(420px, 92vw);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
		animation: slideUp 0.2s ease;
	}

	.confirm-icon {
		width: 56px; height: 56px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		margin-bottom: 0.3rem;
	}
	.confirm-icon svg { width: 26px; height: 26px; }

	.icon-warn {
		background: rgba(251, 146, 60, 0.12);
		color: #fb923c;
		border: 1px solid rgba(251, 146, 60, 0.25);
	}
	.icon-ok {
		background: rgba(52, 211, 153, 0.1);
		color: #34d399;
		border: 1px solid rgba(52, 211, 153, 0.2);
	}

	.confirm-title {
		font-size: 1.1rem; font-weight: 700;
		color: #f5f5f7; text-align: center;
	}
	.confirm-desc {
		font-size: 0.875rem; color: rgba(255,255,255,0.45);
		text-align: center; line-height: 1.55;
	}
	.confirm-desc strong { color: rgba(255,255,255,0.8); }

	.confirm-actions {
		display: flex; gap: 0.75rem;
		margin-top: 0.6rem; width: 100%;
	}
	.confirm-btn {
		flex: 1; padding: 0.65rem 1rem;
		border-radius: 10px;
		font-size: 0.9rem; font-weight: 600;
		cursor: pointer; border: none;
		transition: opacity 0.15s, transform 0.15s;
	}
	.confirm-btn:hover { opacity: 0.88; transform: translateY(-1px); }
	.confirm-btn:active { transform: translateY(0); }

	.confirm-btn--cancel {
		background: #1a1a1a;
		color: rgba(255,255,255,0.6);
		border: 1px solid rgba(255,255,255,0.1);
	}
	.confirm-btn--apply.apply-warn {
		background: #ea580c;
		color: #fff;
	}
	.confirm-btn--apply.apply-ok {
		background: #059669;
		color: #fff;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(20px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	@keyframes slideUp {
		from { transform: translateY(14px); opacity: 0; }
		to   { transform: translateY(0); opacity: 1; }
	}

	/* ── Responsive ── */
	@media (max-width: 640px) {
		.navbar { padding: 0 1rem; gap: 0.5rem; }
		.navbar-breadcrumb { display: none; }
		.logout-btn span:not(.spinner-sm) { display: none; }
		.main-content { padding: 1.25rem 0.875rem; }
		.page-title { font-size: 1.2rem; }
		.page-header-left { gap: 0.65rem; }
		.page-icon { width: 40px; height: 40px; font-size: 1.15rem; }
		.filters-bar { flex-direction: column; align-items: stretch; gap: 0.65rem; padding: 0.875rem 1rem; }
		.filter-date-wrapper { width: 100%; }
		.date-input { width: 100%; }
		.filter-estado { justify-content: space-between; }
		.filter-select { min-width: unset; width: 100%; }
		.registros-grid { grid-template-columns: 1fr; }
		.modal-backdrop { padding: 0; align-items: flex-end; }
		.modal { max-width: 100%; border-radius: 20px 20px 0 0; max-height: 92vh; }
		.modal-header { padding: 1.1rem 1.25rem 1rem; }
		.modal-body { padding: 1rem 1.25rem; }
		.modal-footer { padding: 0.875rem 1.25rem; }
		.modal-table th, .modal-table td { padding: 0.6rem 0.3rem; font-size: 0.8rem; }
		.modal-desactivate-button { flex-direction: column-reverse; gap: 0.5rem; }
		.modal-desactivate-button .btn-cancel,
		.modal-desactivate-button .desactivar { width: 100%; text-align: center; justify-content: center; }
		.modal-info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
		.modal-info-item { min-width: unset; padding: 0.5rem 0.6rem; }
		.modal-info-label { font-size: 0.6rem; }
		.modal-info-value { font-size: 0.7rem; }
		.date-group-label { font-size: 0.72rem; padding: 0.25rem 0.65rem; }
	}
</style>