<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import {
		validateCantidad,
		validatePorcentajeGanancia,
		validatePrecio,
		validateFecha,
		VALIDATION_LIMITS
	} from '$lib/validation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tipoSelected = $derived(Number($page.url.searchParams.get('tipoSelected')) || 1);
	const pageTitle = $derived(
		tipoSelected === 1
			? 'Gestión de Yogurt'
			: tipoSelected === 2
				? 'Gestión de Proteínas'
				: 'Gestión de Productos'
	);

	let loggingOut = $state(false);
	let showModal = $state(false);
	let showModalPrice = $state(false);
	let selectedProductId = $state<number | null>(null);
	let adding = $state(false);
	let deletingId = $state<number | null>(null);
	let activatingId = $state<number | null>(null);
	let searchQuery = $state('');
	let filterEstado = $state('true');
	let porcentajeGanancia = $state(50);
	let cantidades = $state<Record<number, number>>({});
	let selectedProducts = $state<Set<number>>(new Set());
	let showModalRegistro = $state(false);
	let modalRegistroError = $state<string | null>(null);
	let modalPriceError = $state<string | null>(null);
	let modalProductError = $state<string | null>(null);
	let clientError = $state<string | null>(null);
	let fechaCustom = $state(false);

	const minDateStr = `${VALIDATION_LIMITS.MIN_YEAR}-01-01`;
	const maxDateStr = `${new Date().getFullYear() + VALIDATION_LIMITS.MAX_YEAR_OFFSET}-12-31`;

	$effect(() => {
		for (const p of data.productos) {
			if (cantidades[p.idProducto] === undefined) {
				cantidades[p.idProducto] = 1;
			}
		}
	});

	const min = VALIDATION_LIMITS.MIN_CANTIDAD;
	const max = VALIDATION_LIMITS.MAX_CANTIDAD;

	function increment(id: number) {
		const val = Math.floor(Number(cantidades[id])) || 1;
		if (val < max) cantidades[id] = val + 1;
	}

	function decrement(id: number) {
		const val = Math.floor(Number(cantidades[id])) || 1;
		if (val > min) cantidades[id] = val - 1;
	}

	function toggleSelection(id: number, estado: boolean) {
		if (estado) {
			const next = new Set(selectedProducts);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			selectedProducts = next;
		}
	}

	function openModalRegistro() {
		if (selectedProducts.size === 0) return;
		modalRegistroError = null;
		clientError = null;
		showModalRegistro = true;
	}

	function closeModalRegistro() {
		showModalRegistro = false;
		modalRegistroError = null;
	}

	const initials = $derived(
		data.user?.name
			?.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() ?? '?'
	);

	const productosFiltrados = $derived(
		data.productos.filter((p) => {
			const matchSearch = p.nombreProducto?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchEstado = filterEstado !== '' ? String(p.estado) === filterEstado : true;
			const matchTipo = String(p.idTipo) === tipoSelected.toString();
			return matchSearch && matchEstado && matchTipo;
		})
	);

	const seleccionResumen = $derived(
		data.productos
			.filter((p) => selectedProducts.has(p.idProducto))
			.map((p) => ({
				id: p.idProducto,
				nombre: p.nombreProducto ?? 'Sin nombre',
				precio: p.precio ?? 0,
				cantidad: cantidades[p.idProducto] ?? 1,
				subtotal: (p.precio ?? 0) * (cantidades[p.idProducto] ?? 1)
			}))
	);

	const totalSeleccion = $derived(seleccionResumen.reduce((acc, item) => acc + item.subtotal, 0));

	function formatPrice(price: number | null) {
		if (price === null || price === undefined) return '—';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	}

	function closeModal() {
		showModal = false;
		showModalPrice = false;
		modalPriceError = null;
		modalProductError = null;
	}

	function openModalPrice(id: number) {
		selectedProductId = id;
		modalPriceError = null;
		showModalPrice = true;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeModal();
			closeModalRegistro();
		}
	}

	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let image = $state<{ name: string; url: string } | null>(null);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) procesarArchivos(e.dataTransfer.files);
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) procesarArchivos(target.files);
	}

	function procesarArchivos(files: FileList) {
		const file = Array.from(files).find((f) => f.type.startsWith('image/'));
		if (file) {
			if (image) {
				URL.revokeObjectURL(image.url);
			}
			image = {
				name: file.name,
				url: URL.createObjectURL(file)
			};
		}
	}

	function removeImage(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (image) {
			URL.revokeObjectURL(image.url);
			image = null;
		}
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<svelte:head>
	<title>{pageTitle} · Imperio</title>
	<meta name="description" content="Gestión y control de productos del sistema Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="dashboard">
	<!-- Navbar -->
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
			<span class="breadcrumb-current">{pageTitle}</span>
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

	<!-- Main Content -->
	<main class="main-content">
		<!-- Page Header -->
		<div class="page-header">
			<div class="page-header-left">
				<div class="page-icon" aria-hidden="true">
					{#if tipoSelected === 1}
						<!-- Yogurt Flask / Bottle SVG -->
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M7 2h10v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V2z" />
							<rect x="5" y="7" width="14" height="15" rx="3" />
							<line x1="9" y1="12" x2="15" y2="12" />
							<line x1="9" y1="16" x2="13" y2="16" />
						</svg>
					{:else}
						<!-- Proteínas / Energy SVG -->
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					{/if}
				</div>
				<div>
					<h1 class="page-title">{pageTitle}</h1>
					<p class="page-subtitle">
						{productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} en catálogo
					</p>
				</div>
			</div>

			<div class="header-actions">
				<a href="/visualizar_registro?tipoSelected={tipoSelected}" class="btn-secondary-link">
					<svg
						width="15"
						height="15"
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
					Ver Registros
				</a>

				<button id="btn-agregar" class="btn-add" onclick={() => (showModal = true)}>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Nuevo Producto
				</button>
			</div>
		</div>

		<!-- Feedback Messages -->
		{#if form?.success}
			<div class="alert alert-success" role="alert">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
				Operación completada correctamente.
			</div>
		{/if}
		{#if form?.error}
			<div class="alert alert-error" role="alert">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
				{form.error}
			</div>
		{/if}

		<!-- Barra de Filtros Rígida y Funcional -->
		<div class="filters-bar">
			<div class="search-wrapper">
				<svg
					class="search-icon"
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					id="search-input"
					type="text"
					placeholder="Buscar por nombre de producto..."
					class="search-input"
					bind:value={searchQuery}
				/>
			</div>

			<div class="filter-group">
				<label for="filter-estado" class="filter-label">Estado:</label>
				<select id="filter-estado" class="filter-select" bind:value={filterEstado}>
					<option value="true">Activos</option>
					<option value="false">Inactivos</option>
					<option value="">Todos</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="porcentaje-ganancia" class="filter-label">Ganancia base (%):</label>
				<input
					type="number"
					id="porcentaje-ganancia"
					class="filter-number-input"
					bind:value={porcentajeGanancia}
					min="0"
					max="100"
					step="1"
				/>
			</div>
		</div>

		<!-- Products Grid -->
		{#if productosFiltrados.length === 0}
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
						<path
							d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
						/>
						<path d="m3.3 7 8.7 5 8.7-5" />
						<path d="M12 22V12" />
					</svg>
				</div>
				<h2>No se encontraron productos</h2>
				<p>
					{searchQuery || filterEstado !== 'true'
						? 'No hay productos que coincidan con los criterios de búsqueda actuales.'
						: 'No hay productos registrados en esta categoría aún.'}
				</p>
			</div>
		{:else}
			<div class="products-grid">
				{#each productosFiltrados as p (p.idProducto)}
					<div
						class="product-card"
						class:selected={selectedProducts.has(p.idProducto)}
						class:inactive={!p.estado}
						role="checkbox"
						aria-checked={selectedProducts.has(p.idProducto)}
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === ' ' || e.key === 'Enter') {
								e.preventDefault();
								toggleSelection(p.idProducto, p.estado ?? false);
							}
						}}
					>
						<!-- Checkbox indicator badge -->
						{#if p.estado}
							<button
								type="button"
								class="card-select-toggle"
								onclick={() => toggleSelection(p.idProducto, p.estado ?? false)}
								aria-label="Seleccionar {p.nombreProducto}"
							>
								{#if selectedProducts.has(p.idProducto)}
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								{/if}
							</button>
						{/if}

						<!-- Product Image -->
						<div
							class="product-image-wrap"
							onclick={() => toggleSelection(p.idProducto, p.estado ?? false)}
							role="presentation"
						>
							{#if p.linkFoto}
								<img
									src={p.linkFoto}
									alt={p.nombreProducto ?? 'Producto'}
									class="product-img"
									loading="lazy"
								/>
							{:else}
								<div class="product-img-placeholder" aria-hidden="true">
									<svg
										width="36"
										height="36"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<circle cx="8.5" cy="8.5" r="1.5" />
										<polyline points="21 15 16 10 5 21" />
									</svg>
								</div>
							{/if}
						</div>

						<!-- Card Body -->
						<div class="product-body">
							<div class="product-header-row">
								<span class="product-tipo">{p.tipo?.nombreTipo ?? 'Catálogo'}</span>
								<span class="product-status-tag" class:active={p.estado}>
									{p.estado ? 'Activo' : 'Inactivo'}
								</span>
							</div>

							<h2 class="product-name" title={p.nombreProducto}>
								{p.nombreProducto ?? 'Sin nombre'}
							</h2>

							<!-- Precio & Edición -->
							<div class="product-price-row">
								<div class="price-display">
									<span class="price-label">Precio Unitario:</span>
									<button
										type="button"
										class="btn-price"
										disabled={!p.estado}
										title="Haz clic para modificar el precio de este producto"
										onclick={() => {
											if (p.estado) openModalPrice(p.idProducto);
										}}
									>
										<span class="price-val">{formatPrice(p.precio ?? 0)}</span>
										{#if p.estado}
											<svg
												width="11"
												height="11"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
											</svg>
										{/if}
									</button>
								</div>
							</div>

							<!-- Stepper de Cantidad -->
							{#if p.estado}
								<div class="quantity-container">
									<span class="quantity-label">Cantidad:</span>
									<div class="quantity-wrapper">
										<button
											type="button"
											class="qty-btn btn-decrease"
											onclick={() => decrement(p.idProducto)}
											aria-label="Disminuir cantidad"
										>
											−
										</button>
										<input
											type="number"
											class="qty-input"
											bind:value={cantidades[p.idProducto]}
											{min}
											{max}
											step="1"
											aria-label="Cantidad para {p.nombreProducto}"
										/>
										<button
											type="button"
											class="qty-btn btn-increase"
											onclick={() => increment(p.idProducto)}
											aria-label="Aumentar cantidad"
										>
											+
										</button>
									</div>
								</div>
								{#if cantidades[p.idProducto] !== undefined && !validateCantidad(cantidades[p.idProducto]).success}
									<div class="qty-error-badge">
										{validateCantidad(cantidades[p.idProducto]).error}
									</div>
								{/if}
							{/if}
						</div>

						<!-- Card Footer con acción activar/desactivar -->
						<div class="product-footer">
							{#if p.estado}
								<form
									method="POST"
									action="?/eliminarProducto"
									use:enhance={() => {
										if (selectedProducts.has(p.idProducto)) {
											toggleSelection(p.idProducto, p.estado ?? false);
										}
										deletingId = p.idProducto;
										return async ({ update }) => {
											deletingId = null;
											await update();
										};
									}}
								>
									<input type="hidden" name="id_producto" value={p.idProducto} />
									<button
										type="submit"
										class="btn-delete"
										disabled={deletingId === p.idProducto}
										aria-label="Desactivar {p.nombreProducto}"
									>
										{#if deletingId === p.idProducto}
											<span class="spinner-sm"></span>
										{:else}
											<svg
												width="13"
												height="13"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<circle cx="12" cy="12" r="10" />
												<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
											</svg>
										{/if}
										Desactivar
									</button>
								</form>
							{:else}
								<form
									method="POST"
									action="?/activarProducto"
									use:enhance={() => {
										activatingId = p.idProducto;
										return async ({ update }) => {
											activatingId = null;
											filterEstado = 'true';
											await update();
										};
									}}
								>
									<input type="hidden" name="id_producto" value={p.idProducto} />
									<button
										type="submit"
										class="btn-activate"
										disabled={activatingId === p.idProducto}
										aria-label="Activar {p.nombreProducto}"
									>
										{#if activatingId === p.idProducto}
											<span class="spinner-sm"></span>
										{:else}
											<svg
												width="13"
												height="13"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
										{/if}
										Reactivar
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Barra de Resumen / Registrar Selección Flotante/Fija -->
			<div class="register-bar">
				<div class="register-summary">
					<span class="summary-count">
						<strong>{selectedProducts.size}</strong> producto{selectedProducts.size !== 1
							? 's'
							: ''} seleccionado{selectedProducts.size !== 1 ? 's' : ''}
					</span>
					{#if selectedProducts.size > 0}
						<span class="summary-total"
							>Total estimado: <strong>{formatPrice(totalSeleccion)}</strong></span
						>
					{/if}
				</div>

				<button
					id="btn-abrir-registro"
					class="btn-register"
					disabled={selectedProducts.size === 0}
					onclick={openModalRegistro}
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
					Registrar Venta / Producción
				</button>
			</div>
		{/if}
	</main>
</div>

<!-- Modal: Agregar Producto -->
{#if showModal}
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
		aria-label="Agregar producto"
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<div>
					<h2 class="modal-title">Agregar Nuevo Producto</h2>
					<p class="modal-subtitle">Ingresa la información requerida en los límites del catálogo</p>
				</div>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar">
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

			{#if modalProductError}
				<div class="alert alert-error" role="alert" style="margin: 1rem 1.5rem 0;">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="15" y1="9" x2="9" y2="15" />
						<line x1="9" y1="9" x2="15" y2="15" />
					</svg>
					{modalProductError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/agregarProducto"
				enctype="multipart/form-data"
				use:enhance={() => {
					adding = true;
					modalProductError = null;
					return async ({ update, result }) => {
						adding = false;
						if (result.type === 'failure') {
							modalProductError = (result.data as any)?.error || 'Error al guardar el producto.';
						} else {
							modalProductError = null;
							showModal = false;
							await update();
						}
					};
				}}
				class="modal-form"
			>
				<div class="form-group">
					<label for="nombre_producto" class="form-label">
						Nombre del Producto <span class="required">*</span>
					</label>
					<input
						id="nombre_producto"
						name="nombre_producto"
						type="text"
						class="form-input"
						placeholder="Ej: Yogurt Griego Fresa 500g"
						maxlength="100"
						required
					/>
				</div>

				<div class="form-group">
					<label for="precio-nuevo" class="form-label">
						Precio Unitario ($) <span class="required">*</span>
					</label>
					<input
						id="precio-nuevo"
						name="precio"
						type="number"
						step="0.01"
						min="0"
						max={VALIDATION_LIMITS.MAX_PRECIO}
						class="form-input"
						placeholder="0.00"
						required
					/>
					<p class="form-hint">
						Mínimo: $0.00 | Máximo permitido: ${VALIDATION_LIMITS.MAX_PRECIO.toLocaleString(
							'es-ES'
						)}
					</p>
				</div>

				<div class="form-group">
					<span class="form-label">Imagen de Producto (Opcional)</span>
					<div class="upload-card">
						<label
							for="imagen"
							class="drop-zone {isDragging ? 'dragging' : ''}"
							ondragover={(e) => {
								e.preventDefault();
								isDragging = true;
							}}
							ondragleave={() => (isDragging = false)}
							ondrop={handleDrop}
						>
							{#if !image}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="32"
									height="32"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.75"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
								<p class="drop-text">Arrastra una imagen o haz clic para seleccionarla</p>
							{:else}
								<div class="preview-container">
									<div class="image-preview">
										<img src={image.url} alt={image.name} />
										<button
											type="button"
											class="remove-btn"
											onclick={removeImage}
											aria-label="Eliminar imagen seleccionada"
										>
											✕
										</button>
									</div>
								</div>
							{/if}

							<input
								id="imagen"
								name="imagen"
								type="file"
								accept="image/*"
								bind:this={fileInput}
								onchange={handleFileSelect}
								hidden
							/>
						</label>
					</div>
				</div>

				<input type="hidden" name="tipoSelected" value={tipoSelected} />

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Guardando...
						{:else}
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Guardar Producto
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Cambiar Precio (con validación de precio exorbitante) -->
{#if showModalPrice}
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
		aria-label="Cambiar Precio"
		tabindex="-1"
	>
		<div class="modal modal-sm">
			<div class="modal-header">
				<div>
					<h2 class="modal-title">Actualizar Precio</h2>
					<p class="modal-subtitle">Establece el nuevo precio unitario para el producto</p>
				</div>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar">
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

			{#if modalPriceError}
				<div class="alert alert-error" role="alert" style="margin: 1rem 1.5rem 0;">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="15" y1="9" x2="9" y2="15" />
						<line x1="9" y1="9" x2="15" y2="15" />
					</svg>
					{modalPriceError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/editarPrecio"
				enctype="multipart/form-data"
				use:enhance={() => {
					adding = true;
					modalPriceError = null;
					return async ({ update, result }) => {
						adding = false;
						if (result.type === 'failure') {
							modalPriceError = (result.data as any)?.error || 'Error al actualizar el precio.';
						} else {
							modalPriceError = null;
							showModalPrice = false;
							await update();
						}
					};
				}}
				class="modal-form"
			>
				<input type="hidden" id="id_producto" name="id_producto" value={selectedProductId} />

				<div class="form-group">
					<label for="precio-edit" class="form-label">
						Nuevo Precio ($) <span class="required">*</span>
					</label>
					<input
						id="precio-edit"
						name="precio"
						type="number"
						step="0.01"
						min="0"
						max={VALIDATION_LIMITS.MAX_PRECIO}
						class="form-input"
						placeholder="0.00"
						required
					/>
					<p class="form-hint">
						Mínimo: $0.00 | Máximo permitido: ${VALIDATION_LIMITS.MAX_PRECIO.toLocaleString(
							'es-ES'
						)}
					</p>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Actualizando...
						{:else}
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Guardar Precio
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Agregar Registro / Resumen con Fecha/Hora Responsiva sin recortes -->
{#if showModalRegistro}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModalRegistro();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeModalRegistro();
		}}
		role="dialog"
		aria-modal="true"
		aria-label="Agregar Registro"
		tabindex="-1"
	>
		<div class="modal modal-registro">
			<div class="modal-header">
				<div>
					<h2 class="modal-title">Confirmación de Registro</h2>
					<p class="modal-subtitle">Revisa el desglose de productos y la fecha de registro</p>
				</div>
				<button class="modal-close" onclick={closeModalRegistro} aria-label="Cerrar">
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

			<form
				method="POST"
				action="?/agregarRegistro"
				enctype="multipart/form-data"
				use:enhance={({ formData, cancel }) => {
					adding = true;
					const now = new Date();
					const pad = (n: number) => String(n).padStart(2, '0');

					let localFecha = '';
					if (fechaCustom) {
						const fecha = formData.get('fecha_custom')?.toString();
						const hora = formData.get('hora_custom')?.toString();
						if (!fecha || !hora) {
							modalRegistroError = 'Debes ingresar fecha y hora personalizada.';
							adding = false;
							cancel();
							return;
						}
						const combined = `${fecha} ${hora}:00`;
						const fechaCheck = validateFecha(combined);
						if (!fechaCheck.success) {
							modalRegistroError = fechaCheck.error ?? 'Fecha no válida.';
							adding = false;
							cancel();
							return;
						}
						localFecha = combined;
					} else {
						localFecha = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
							now.getHours()
						)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
					}
					formData.set('fecha', localFecha);

					return async ({ update, result }) => {
						adding = false;
						if (result.type === 'failure') {
							modalRegistroError = (result.data as any)?.error || 'Error al guardar el registro.';
						} else if (result.type === 'success') {
							modalRegistroError = null;
							showModalRegistro = false;
							selectedProducts = new Set();
							porcentajeGanancia = 50;
							await update();
						}
					};
				}}
			>
				{#if modalRegistroError}
					<div class="alert alert-error" style="margin: 1rem 1.5rem 0;" role="alert">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
						{modalRegistroError}
					</div>
				{/if}

				<input
					type="hidden"
					name="id_producto"
					value={seleccionResumen.map((i) => i.id).join(',')}
				/>
				<input type="hidden" name="id_tipo" value={tipoSelected} />
				<input
					type="hidden"
					name="precios_productos"
					value={seleccionResumen.map((i) => i.precio).join(',')}
				/>
				<input
					type="hidden"
					name="cantidad_productos"
					value={seleccionResumen.map((i) => i.cantidad).join(',')}
				/>
				<input type="hidden" name="estado" value="true" />

				<div class="registro-body">
					<!-- Tabla de desglose -->
					<div class="registro-table-wrap">
						<table class="registro-table">
							<thead>
								<tr>
									<th>Producto</th>
									<th>Precio</th>
									<th class="th-center">Cant.</th>
									<th class="th-right">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								{#each seleccionResumen as item (item.id)}
									<tr>
										<td class="td-name">{item.nombre}</td>
										<td>{formatPrice(item.precio)}</td>
										<td class="td-center font-mono">{item.cantidad}</td>
										<td class="td-right font-mono">{formatPrice(item.subtotal)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Total -->
					<div class="registro-total-box">
						<span class="total-label">Total del Registro:</span>
						<span class="total-value">{formatPrice(totalSeleccion)}</span>
					</div>

					<!-- Porcentaje de Ganancia -->
					<div class="form-group" style="margin-top: 1rem;">
						<label class="form-label" for="modal-porcentaje"
							>Porcentaje de Ganancia Estimada (%)</label
						>
						<input
							id="modal-porcentaje"
							name="porcentaje_ganancia"
							type="number"
							class="form-input"
							bind:value={porcentajeGanancia}
							min="0"
							max="100"
							step="0.5"
							placeholder="ej. 50"
						/>
						{#if porcentajeGanancia !== undefined && porcentajeGanancia !== null && !validatePorcentajeGanancia(porcentajeGanancia).success}
							<p class="ganancia-hint error-text">
								{validatePorcentajeGanancia(porcentajeGanancia).error}
							</p>
						{:else if porcentajeGanancia > 0}
							<p class="ganancia-hint">
								Margen calculado: <strong
									>{formatPrice(totalSeleccion * (porcentajeGanancia / 100))}</strong
								>
								({porcentajeGanancia}%)
							</p>
						{/if}
					</div>

					<!-- Sección de Fecha Personalizada: Responsiva, Rígida y Sin Cortes -->
					<div class="custom-date-section">
						<label class="checkbox-container">
							<input type="checkbox" id="check-fecha-custom" bind:checked={fechaCustom} />
							<span class="checkbox-text">Especificar fecha y hora personalizada</span>
						</label>

						{#if fechaCustom}
							<div class="form-fecha-custom-row">
								<div class="form-fecha-custom-row-item">
									<label for="fecha-custom" class="form-label">Fecha:</label>
									<input
										id="fecha-custom"
										name="fecha_custom"
										type="date"
										class="form-input-fecha"
										min={minDateStr}
										max={maxDateStr}
										required
									/>
									<span class="field-hint"
										>Rango: {VALIDATION_LIMITS.MIN_YEAR} - {new Date().getFullYear() +
											VALIDATION_LIMITS.MAX_YEAR_OFFSET}</span
									>
								</div>

								<div class="form-fecha-custom-row-item">
									<label for="hora-custom" class="form-label">Hora:</label>
									<input
										id="hora-custom"
										name="hora_custom"
										type="time"
										class="form-input-hora"
										required
									/>
									<span class="field-hint">Formato 24h</span>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModalRegistro}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Guardando...
						{:else}
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Confirmar Registro
						{/if}
					</button>
				</div>
			</form>
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
		padding: 2rem 1.5rem 6rem;
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
		flex-wrap: wrap;
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

	.btn-add {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: #b6914c;
		color: #0c0d12;
		border: none;
		padding: 0.55rem 1.1rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-add:hover {
		background: #c5a05b;
	}

	/* ── Alerts ── */
	.alert {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.86rem;
		font-weight: 500;
		margin-bottom: 1.25rem;
	}

	.alert-success {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.25);
		color: #34d399;
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: #f87171;
	}

	/* ── Filters Bar ── */
	.filters-bar {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
		padding: 0.85rem 1rem;
		background: #0f1118;
		border: 1px solid #1f2330;
		border-radius: 8px;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
		min-width: 220px;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: #555d72;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.55rem 0.85rem 0.55rem 2.25rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.85rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}

	.search-input:focus {
		border-color: #b6914c;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.8rem;
		color: #7d8495;
		white-space: nowrap;
	}

	.filter-select {
		padding: 0.55rem 0.85rem;
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

	.filter-number-input {
		width: 70px;
		padding: 0.55rem 0.65rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.85rem;
		font-family: inherit;
		text-align: center;
		outline: none;
	}

	.filter-number-input:focus {
		border-color: #b6914c;
	}

	/* ── Products Grid ── */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.15rem;
	}

	/* ── Product Card ── */
	.product-card {
		background: #11141c;
		border: 1px solid #1f2433;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
		transition: border-color 0.15s;
	}

	.product-card:hover {
		border-color: #2e3549;
	}

	.product-card.selected {
		border-color: #b6914c;
		background: #141720;
	}

	.product-card.inactive {
		opacity: 0.65;
	}

	/* Card Checkbox indicator */
	.card-select-toggle {
		position: absolute;
		top: 0.65rem;
		right: 0.65rem;
		z-index: 5;
		width: 22px;
		height: 22px;
		border-radius: 4px;
		background: #0f1118;
		border: 1px solid #343c52;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #0c0d12;
		padding: 0;
	}

	.product-card.selected .card-select-toggle {
		background: #b6914c;
		border-color: #b6914c;
	}

	.product-image-wrap {
		width: 100%;
		aspect-ratio: 16/10;
		background: #0d0f15;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid #1a1e2a;
		cursor: pointer;
	}

	.product-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-img-placeholder {
		color: #3b4254;
	}

	.product-body {
		padding: 0.95rem 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.product-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.product-tipo {
		font-size: 0.7rem;
		font-weight: 600;
		color: #b6914c;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.product-status-tag {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.product-status-tag.active {
		background: rgba(16, 185, 129, 0.1);
		color: #34d399;
		border-color: rgba(16, 185, 129, 0.2);
	}

	.product-name {
		font-size: 0.98rem;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.35;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.product-price-row {
		margin-top: 0.2rem;
	}

	.price-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.price-label {
		font-size: 0.75rem;
		color: #7d8495;
	}

	.btn-price {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: #171b26;
		border: 1px solid #283044;
		border-radius: 6px;
		padding: 0.25rem 0.55rem;
		color: #d4af37;
		font-family: inherit;
		cursor: pointer;
		font-weight: 700;
		font-size: 0.9rem;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.btn-price:hover:not(:disabled) {
		background: #1f2434;
		border-color: #b6914c;
	}

	.btn-price:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Stepper de cantidad */
	.quantity-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 0.4rem;
	}

	.quantity-label {
		font-size: 0.75rem;
		color: #7d8495;
	}

	.quantity-wrapper {
		display: inline-flex;
		align-items: center;
		background: #151824;
		border: 1px solid #262c3e;
		border-radius: 6px;
		overflow: hidden;
		height: 32px;
	}

	.qty-btn {
		width: 32px;
		height: 100%;
		background: transparent;
		border: none;
		color: #9da4b5;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.qty-btn:hover {
		background: #202536;
		color: #ffffff;
	}

	.qty-input {
		width: 44px;
		height: 100%;
		border: none;
		background: transparent;
		color: #ffffff;
		text-align: center;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		outline: none;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.qty-input::-webkit-outer-spin-button,
	.qty-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.qty-error-badge {
		color: #f87171;
		font-size: 0.72rem;
		padding: 0.2rem 0.4rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 4px;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.product-footer {
		padding: 0.65rem 1rem;
		border-top: 1px solid #1a1e2a;
		background: #0f1118;
		display: flex;
		justify-content: flex-end;
	}

	.btn-delete,
	.btn-activate {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.65rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
		background: transparent;
	}

	.btn-delete {
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: #f87171;
	}

	.btn-delete:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.12);
	}

	.btn-activate {
		border: 1px solid rgba(16, 185, 129, 0.25);
		color: #34d399;
	}

	.btn-activate:hover:not(:disabled) {
		background: rgba(16, 185, 129, 0.12);
	}

	/* ── Floating Register Action Bar ── */
	.register-bar {
		position: sticky;
		bottom: 1.25rem;
		margin-top: 2rem;
		z-index: 40;
		background: #11141c;
		border: 1px solid #283044;
		border-radius: 8px;
		padding: 0.85rem 1.25rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.register-summary {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		font-size: 0.9rem;
	}

	.summary-count strong {
		color: #d4af37;
	}

	.summary-total strong {
		color: #ffffff;
		font-size: 1.05rem;
	}

	.btn-register {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #b6914c;
		color: #0c0d12;
		border: none;
		padding: 0.65rem 1.4rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-register:hover:not(:disabled) {
		background: #c5a05b;
	}

	.btn-register:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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

	/* ── Modales Rígidos y Profesionales ── */
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
		max-width: 520px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
		overflow: hidden;
	}

	.modal-sm {
		max-width: 440px;
	}

	.modal-registro {
		max-width: 600px;
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

	.modal-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.modal-subtitle {
		font-size: 0.78rem;
		color: #7d8495;
		margin-top: 0.2rem;
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

	.modal-form {
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
		box-sizing: border-box;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #c0c6d4;
	}

	.required {
		color: #f87171;
	}

	.form-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.85rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.9rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}

	.form-input:focus {
		border-color: #b6914c;
	}

	.form-hint {
		font-size: 0.74rem;
		color: #6a7285;
		margin-top: 0.15rem;
	}

	/* Upload card */
	.upload-card {
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.75rem;
		box-sizing: border-box;
	}

	.drop-zone {
		border: 1px dashed #30374b;
		border-radius: 6px;
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #7d8495;
		transition:
			border-color 0.15s,
			background 0.15s;
		text-align: center;
	}

	.drop-zone.dragging,
	.drop-zone:hover {
		border-color: #b6914c;
		background: rgba(182, 145, 76, 0.04);
		color: #d4af37;
	}

	.drop-text {
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	.preview-container {
		display: flex;
		justify-content: center;
	}

	.image-preview {
		position: relative;
		width: 72px;
		height: 72px;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid #30374b;
	}

	.image-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-btn {
		position: absolute;
		top: 2px;
		right: 2px;
		background: rgba(239, 68, 68, 0.9);
		color: #ffffff;
		border: none;
		border-radius: 3px;
		width: 18px;
		height: 18px;
		font-size: 10px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.15rem 1.5rem;
		border-top: 1px solid #1a1e2a;
		background: #0d0f15;
	}

	.btn-cancel {
		padding: 0.55rem 1.1rem;
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

	.btn-submit {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 1.25rem;
		background: #b6914c;
		border: none;
		border-radius: 6px;
		color: #0c0d12;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-submit:hover:not(:disabled) {
		background: #c5a05b;
	}

	.btn-submit:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* ── Modal Registro Body ── */
	.registro-body {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-sizing: border-box;
	}

	.registro-table-wrap {
		border: 1px solid #1f2433;
		border-radius: 6px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.registro-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		min-width: 360px;
	}

	.registro-table thead {
		background: #141722;
	}

	.registro-table th {
		padding: 0.55rem 0.85rem;
		text-align: left;
		font-size: 0.72rem;
		font-weight: 600;
		color: #7d8495;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid #1f2433;
	}

	.registro-table td {
		padding: 0.55rem 0.85rem;
		border-bottom: 1px solid #161922;
		color: #c0c6d4;
	}

	.registro-table tbody tr:last-child td {
		border-bottom: none;
	}

	.td-name {
		color: #ffffff;
		font-weight: 500;
	}

	.th-center,
	.td-center {
		text-align: center;
	}

	.th-right,
	.td-right {
		text-align: right;
	}

	.font-mono {
		font-variant-numeric: tabular-nums;
	}

	.registro-total-box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.85rem 1rem;
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
	}

	.total-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #c0c6d4;
	}

	.total-value {
		font-size: 1.15rem;
		font-weight: 700;
		color: #d4af37;
		font-variant-numeric: tabular-nums;
	}

	.ganancia-hint {
		font-size: 0.76rem;
		color: #7d8495;
		margin-top: 0.25rem;
	}

	.ganancia-hint strong {
		color: #34d399;
	}

	.error-text {
		color: #f87171;
	}

	/* ── Sección de Fecha/Hora Rígida y Sin Cortes ── */
	.custom-date-section {
		background: #141722;
		border: 1px solid #232838;
		border-radius: 6px;
		padding: 0.85rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.checkbox-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-container input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #b6914c;
	}

	.checkbox-text {
		font-size: 0.82rem;
		font-weight: 600;
		color: #e2e4e9;
	}

	/* Fila de Fecha y Hora en Grid Simétrico Rígido */
	.form-fecha-custom-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.25rem;
	}

	.form-fecha-custom-row-item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
		min-width: 0;
	}

	.form-input-fecha,
	.form-input-hora {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: 0.6rem 0.75rem;
		background: #0f1118;
		border: 1px solid #283044;
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.88rem;
		font-family: inherit;
		outline: none;
		color-scheme: dark;
		transition: border-color 0.15s;
	}

	.form-input-fecha:focus,
	.form-input-hora:focus {
		border-color: #b6914c;
	}

	.field-hint {
		font-size: 0.7rem;
		color: #6a7285;
	}

	/* Spinner */
	.spinner-sm {
		width: 13px;
		height: 13px;
		border: 2px solid rgba(0, 0, 0, 0.25);
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

	/* ── Responsividad Completa ── */
	@media (max-width: 768px) {
		.navbar {
			padding: 0 1rem;
		}

		.navbar-breadcrumb {
			display: none;
		}

		.main-content {
			padding: 1.25rem 1rem 5rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.filters-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.search-wrapper {
			min-width: unset;
			width: 100%;
		}

		.filter-group {
			justify-content: space-between;
			width: 100%;
		}

		.filter-select {
			flex: 1;
		}

		.register-bar {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
			bottom: 0.75rem;
		}

		.register-summary {
			justify-content: space-between;
		}

		.btn-register {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 540px) {
		.products-grid {
			grid-template-columns: 1fr;
		}

		.form-fecha-custom-row {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.modal {
			max-height: 94vh;
		}

		.modal-backdrop {
			padding: 0.5rem;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.modal-actions button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
