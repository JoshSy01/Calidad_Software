<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { page } from "$app/stores";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tipoSelected = $derived(Number($page.url.searchParams.get("tipoSelected")) || 1);

	let loggingOut = $state(false);
	let showModal = $state(false);
	let showModalPrice = $state(false);
	let selectedProductId = $state<number | null>(null);
	let adding = $state(false);
	let deletingId = $state<number | null>(null);
	let activatingId = $state<number | null>(null);
	let searchQuery = $state('');
	let filterEstado = $state('true');
	// svelte-ignore state_referenced_locally
	let filterTipo = $state(tipoSelected.toString());
	let porcentajeGanancia = $state(50);
	let cantidades = $state<Record<number, number>>({});
	let selectedProducts = $state<Set<number>>(new Set());
	let showModalRegistro = $state(false);
	let fechaCustom = $state(false);

    // Inicializa la cantidad de todos los productos en 1
    for (const p of data.productos) {
        cantidades[p.idProducto] = 1;
    }

    let min = 1;
    let max = 99;

    // Actualiza las funciones para recibir el ID del producto
    function increment(id: number) {
        if (cantidades[id] < max) cantidades[id] = Number(cantidades[id]) + 1;
    }

    function decrement(id: number) {
        if (cantidades[id] > min) cantidades[id] = Number(cantidades[id]) - 1;
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
		showModalRegistro = true;
	}

	function closeModalRegistro() {
		showModalRegistro = false;
	}

	// Iniciales del usuario
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
			const matchSearch = p.nombreProducto
				?.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchEstado = filterEstado !== '' ? String(p.estado) === filterEstado : true;
			const matchTipo = filterTipo !== '' ? String(p.idTipo) === filterTipo : true;
			return matchSearch && matchEstado && matchTipo;
		})
	);

	// Resumen de los productos seleccionados para el modal
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

	const totalSeleccion = $derived(
		seleccionResumen.reduce((acc, item) => acc + item.subtotal, 0)
	);

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
	}

	function openModalPrice(id:number){
		selectedProductId = id;
		showModalPrice = true;
	}


	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}

	let isDragging = $state(false);
    // svelte-ignore non_reactive_update
    let fileInput: HTMLInputElement;
    
    // Cambiamos el array por un único objeto que puede ser null cuando no hay imagen
    let image = $state<{ name: string, url: string } | null>(null);

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
        // Buscamos solo el primer archivo que sea una imagen
        const file = Array.from(files).find(f => f.type.startsWith('image/'));
        
        if (file) {
            // Si ya existía una imagen previa, liberamos la memoria de su URL
            if (image) {
                URL.revokeObjectURL(image.url);
            }

            // Guardamos solo la nueva imagen
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
            image = null; // Volvemos al estado inicial vacío
        }
        if (fileInput) {
            fileInput.value = '';
        }
    }


</script>

<svelte:head>
	<title>Gestionar Yogurt · Imperio</title>
	<meta name="description" content="Gestionar productos de Yogurt en Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="dashboard">
	<!-- Fondo -->
	<div class="bg-orbs" aria-hidden="true">
		<span class="orb orb-1"></span>
		<span class="orb orb-2"></span>
		<span class="orb orb-3"></span>
	</div>

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
			<span class="breadcrumb-current">Gestión Yogurt</span>
		</nav>

		<div class="navbar-user">
			<div class="user-avatar" aria-label="Avatar de {data.user?.name}">
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
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
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
				{#if tipoSelected === 1}
					<div class="page-icon">🥛</div>
					<div>
						<h1 class="page-title">Gestión de Yogurt</h1>
						<p class="page-subtitle">
							{data.productos.length} producto{data.productos.length !== 1 ? 's' : ''} registrado{data
								.productos.length !== 1
								? 's'
								: ''}
						</p>
					</div>
				{:else if tipoSelected === 2}
					<div class="page-icon">⚡</div>
					<div>
						<h1 class="page-title">Gestión de Proteínas</h1>
						<p class="page-subtitle">
							{data.productos.length} producto{data.productos.length !== 1 ? 's' : ''} registrado{data
								.productos.length !== 1
								? 's'
								: ''}
						</p>
					</div>
				{/if}
			</div>
			<button id="btn-agregar" class="btn-add" onclick={() => (showModal = true)}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Agregar Producto
			</button>
		</div>

		<!-- Feedback messages -->
		{#if form?.success}
			<div class="alert alert-success" role="alert">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="20 6 9 17 4 12" />
				</svg>
				Operación realizada con éxito.
			</div>
		{/if}
		{#if form?.error}
			<div class="alert alert-error" role="alert">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
				{form.error}
			</div>
		{/if}

		<!-- Filters bar -->
		<div class="filters-bar">
			<div class="search-wrapper">
				<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					id="search-input"
					type="text"
					placeholder="Buscar producto..."
					class="search-input"
					bind:value={searchQuery}
				/>
			</div>
			<select id="filter-estado" class="filter-select" bind:value={filterEstado}>
				<option value="true">Activos</option>
				<option value="false">Inactivos</option>
			</select>
			<div>
				<label for="porcentaje-ganancia">Porcentaje de Ganancia:</label>
				<input type="number" id="porcentaje-ganancia" bind:value={porcentajeGanancia} />
			</div>
		</div>

		<!-- Products grid -->
		{#if productosFiltrados.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📦</div>
				<h2>Sin productos</h2>
				<p>
					{searchQuery || filterEstado
						? 'No se encontraron productos con ese filtro.'
						: 'Aún no hay productos registrados. ¡Agrega el primero!'}
				</p>
			</div>
		{:else}
			<div class="products-grid">
				{#each productosFiltrados as p (p.idProducto)}
					<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
					<div
						class="product-card"
						class:selected={selectedProducts.has(p.idProducto)}
						role="checkbox"
						aria-checked={selectedProducts.has(p.idProducto)}
						aria-label="Seleccionar {p.nombreProducto}"
						tabindex="0"
					>
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							class="product-image-wrap"
							onclick={() => toggleSelection(p.idProducto, p.estado ?? false)}
						>
							{#if p.linkFoto}
								<img src={p.linkFoto} alt={p.nombreProducto ?? 'Producto'} class="product-img" />
							{:else}
								<div class="product-img-placeholder">🥛</div>
							{/if}
						</div>
						<div class="product-body">
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="product-tipo"
								onclick={() => toggleSelection(p.idProducto, p.estado ?? false)}
							>
								{p.tipo?.nombreTipo ?? 'Sin tipo'}
							</div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div onclick={() => toggleSelection(p.idProducto, p.estado ?? false)}>
								<h3 class="product-name">{p.nombreProducto ?? 'Sin nombre'}</h3>
							</div>
							<button type="button" class="btn-price" onclick={() => { if (p.estado) openModalPrice(p.idProducto)}}>{formatPrice(p.precio ?? 0)}</button>
						</div>

						<div class="quantity-wrapper">
							<!-- Vincula el valor a la cantidad específica de este producto -->
							<input type="number" bind:value={cantidades[p.idProducto]} {min} {max} />
							
							<div class="controls">
								<!-- Pasa el idProducto a las funciones de incremento y decremento -->
								<button type="button" class="qty-btn btn-decrease" onclick={() => { if (p.estado) decrement(p.idProducto)}} aria-label="Disminuir">−</button>
								<button type="button" class="qty-btn btn-increase" onclick={() => { if (p.estado) increment(p.idProducto)}} aria-label="Aumentar">+</button>
							</div>
						</div>
						
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
										aria-label="Eliminar {p.nombreProducto}"
									>
										{#if deletingId === p.idProducto}
											<span class="spinner-sm"></span>
										{:else}
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
												<polyline points="3 6 5 6 21 6" />
												<path d="M19 6l-1 14H6L5 6" />
												<path d="M10 11v6M14 11v6" />
												<path d="M9 6V4h6v2" />
											</svg>
											Desactivar
										{/if}
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
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											Activar
										{/if}
									</button>

									
								</form>
							{/if}
							
						</div>
						 
					</div>
				{/each}				
			</div>
			<div class="register-section">
				{#if selectedProducts.size > 0}
					<span class="selection-badge">{selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''} seleccionado{selectedProducts.size !== 1 ? 's' : ''}</span>
				{/if}
				<button
					id="btn-agregar"
					class="btn-add"
					disabled={selectedProducts.size === 0}
					onclick={openModalRegistro}
				>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
					Agregar Registro
				</button>
			</div>
		{/if}
	</main>
</div>

<!-- Modal: Agregar Producto -->
{#if showModal}
	<div 
		class="modal-backdrop" 
		onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }} 
		onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
		role="dialog" 
		aria-modal="true" 
		aria-label="Agregar producto" 
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<h2 class="modal-title">Agregar Producto</h2>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action="?/agregarProducto"
				enctype="multipart/form-data"
				use:enhance={() => {
					adding = true;
					return async ({ update }) => {
						adding = false;
						showModal = false;
						await update();
						location.reload();
					};
				}}
				class="modal-form"
			>
				<div class="form-group">
					<label for="nombre_producto" class="form-label">Nombre del producto <span class="required">*</span></label>
					<input
						id="nombre_producto"
						name="nombre_producto"
						type="text"
						class="form-input"
						placeholder="Ej: Yogurt Natural 500g"
						required
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="precio" class="form-label">Precio</label>
						<div class="quantity-wrapper ">
							<input
								id="precio"
								name="precio"
								type="number"
								step="0.01"
								min="0"
								class="form-input"
								placeholder="0.00"
							/>
						</div>
					</div>
				</div>
				<span class="form-label">Imagen del Producto</span>

				<div class="upload-card">
					<label 
						for="imagen"
						class="drop-zone {isDragging ? 'dragging' : ''}"
						ondragover={(e) => { e.preventDefault(); isDragging = true; }}
						ondragleave={() => isDragging = false}
						ondrop={handleDrop}
					>
						{#if !image}
							<!-- Si no hay imagen, muestra el ícono de la nube -->
							<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0a0b2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1332 20.1866 10.1983 17.8735 10.0195C17.4338 6.62125 14.5162 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2335 4.01142 11.4645 4.03357 11.6917C2.29658 12.3996 1 14.0734 1 16C1 18.7614 3.23858 21 6 21H11" />
								<path d="M12 13L12 21M12 13L9 16M12 13L15 16" />
							</svg>
							<p class="drop-text">Drag and drop a file</p>
						{:else}
							<!-- Si hay imagen, muestra solo esa vista previa -->
							<div class="preview-container">
								<div class="image-preview">
									<img src={image.url} alt={image.name} />
									<button type="button" class="remove-btn" onclick={removeImage} aria-label="Eliminar imagen">
										✕
									</button>
								</div>
							</div>
						{/if}

						<!-- Se eliminó el atributo \"multiple\" de este input -->
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

				<input type="hidden" name="tipoSelected" value={tipoSelected} />

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Guardando...
						{:else}
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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

{#if showModalPrice }
	<div 
		class="modal-backdrop" 
		onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }} 
		onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
		role="dialog" 
		aria-modal="true" 
		aria-label="Cambiar Precio" 
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<h2 class="modal-title">Cambiar Precio</h2>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Cerrar">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action="?/editarPrecio"
				enctype="multipart/form-data"
				use:enhance={() => {
					adding = true;
					return async ({ update }) => {
						adding = false;
						showModalPrice = false;
						await update();
					};
				}}
				>
					<input type="hidden" id="id_producto" name="id_producto" bind:value={selectedProductId} />
				<div class="form-row">
					<div class="form-group">
						<label for="precio" class="form-label">Precio</label>
						<div class="quantity-wrapper">
							<input
							id="precio"
							name="precio"
							type="number"
							step="0.01"
							min="0"
							class="form-input"
							placeholder="0.00"
							/>
						</div>
						
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Guardando...
						{:else}
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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

<!-- Modal: Agregar Registro -->
{#if showModalRegistro}
	<div 
		class="modal-backdrop" 
		onclick={(e) => { if (e.target === e.currentTarget) closeModalRegistro(); }} 
		onkeydown={(e) => { if (e.key === 'Escape') closeModalRegistro(); }}
		role="dialog" 
		aria-modal="true" 
		aria-label="Agregar Registro" 
		tabindex="-1"
	>
		<div class="modal modal-registro">
			<div class="modal-header">
				<h2 class="modal-title">Resumen de Registro</h2>
				<button class="modal-close" onclick={closeModalRegistro} aria-label="Cerrar">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<form 
				method="POST"
				action="?/agregarRegistro"
				enctype="multipart/form-data"
				use:enhance={({ formData }) => {
					adding = true;
					const now = new Date();
					const pad = (n: number) => String(n).padStart(2, '0');

					let localFecha = '';
					if (fechaCustom) {
						const fecha = formData.get('fecha_custom')?.toString();
						const hora = formData.get('hora_custom')?.toString();
						if (fecha && hora) {
							localFecha = `${fecha} ${hora}`;
						}
					}else{
						localFecha = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
					}
					formData.set('fecha', localFecha);

					return async ({ update, result }) => {
						adding = false;
						if (result.type === 'success') {
							showModalRegistro = false;
							selectedProducts = new Set();
							porcentajeGanancia = 0;
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id_producto" value={seleccionResumen.map(i => i.id).join(',')} />
				<input type="hidden" name="id_tipo" value={tipoSelected} />
				<input type="hidden" name="precios_productos" value={seleccionResumen.map(i => i.precio).join(',')} />
				<input type="hidden" name="cantidad_productos" value={seleccionResumen.map(i => i.cantidad).join(',')} />
				<input type="hidden" name="estado" value="true" />

				<div class="registro-body">
					<!-- Tabla de productos seleccionados -->
					<div class="registro-table-wrap">
						<table class="registro-table">
							<thead>
								<tr>
									<th>Producto</th>
									<th>Precio</th>
									<th>Cantidad</th>
									<th>Subtotal</th>
								</tr>
							</thead>
							<tbody>
								{#each seleccionResumen as item (item.id)}
									<tr>
										<td>{item.nombre}</td>
										<td>{formatPrice(item.precio)}</td>
										<td class="td-center">{item.cantidad}</td>
										<td class="td-right">{formatPrice(item.subtotal)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Total -->
					<div class="registro-total">
						<span>Total</span>
						<span class="total-value">{formatPrice(totalSeleccion)}</span>
					</div>

					<!-- Porcentaje de Ganancia -->
					<div class="form-group">
						<label class="form-label" for="modal-porcentaje">Porcentaje de Ganancia (%)</label>
						<input
							id="modal-porcentaje"
							name="porcentaje_ganancia"
							type="number"
							class="form-input"
							bind:value={porcentajeGanancia}
							min="0"
							max="100"
							step="0.1"
							placeholder="ej. 30"
						/>
						{#if porcentajeGanancia > 0}
							<p class="ganancia-hint">
								Ganancia estimada: <strong>{formatPrice(totalSeleccion * (porcentajeGanancia / 100))}</strong>
							</p>
						{/if}
					</div>
				</div>
				<div class="modal-section">
					<label for="fecha-custom" class="form-label">Fecha Personalizada</label>
					<label class="switch">
						<input type="checkbox" bind:checked={fechaCustom} />
						<span class="slider"></span>
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
							placeholder="ej. 2023-01-01"
							required
						/>
						</div>
						<div class="form-fecha-custom-row-item">
						<label for="hora-custom" class="form-label">Hora:</label>
						<input
							id="hora-custom"
							name="hora_custom"
							type="time"
							class="form-input-hora"
							placeholder="ej. 12:00"
							required
						/>
						</div>
					</div>


						
					{:else}
						
					{/if}
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeModalRegistro}>Cancelar</button>
					<button type="submit" class="btn-submit" disabled={adding}>
						{#if adding}
							<span class="spinner-sm"></span>
							Guardando...
						{:else}
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Guardar Registro
						{/if}
					</button>
				</div>
			</form>
				
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

	/* â”€â”€ Navbar â”€â”€ */
	.navbar {
		position: sticky; top: 0; z-index: 100;
		display: flex; align-items: center; justify-content: space-between;
		padding: 0 2rem;
		height: 52px;
		background: rgba(0, 0, 0, 0.82);
		border-bottom: 1px solid rgba(255,255,255,0.08);
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
		color: rgba(255,255,255,0.4); text-decoration: none;
		transition: color 0.2s;
	}
	.breadcrumb-link:hover { color: #b6914c; }
	.breadcrumb-sep { color: rgba(255,255,255,0.2); }
	.breadcrumb-current { color: rgba(255,255,255,0.85); font-weight: 500; }

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
		border: 1px solid rgba(255,255,255,0.15);
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

	/* â”€â”€ Main content â”€â”€ */
	.main-content {
		position: relative; z-index: 1;
		max-width: 1100px; margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}

	/* SecciÃ³n de Registrar y exportar */
	.register-section {
		display: flex; align-items: center; justify-content: center;
		gap: 1rem;
		margin-bottom: 1.75rem;
		animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
		padding: 1rem;
	}
	.selection-badge {
		padding: 0.35rem 0.85rem;
		background: rgba(182,145,76,0.12);
		border: 1px solid rgba(182,145,76,0.3);
		border-radius: 20px;
		color: #d4af6a;
		font-size: 0.82rem; font-weight: 600;
		animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
	}
	.btn-add {
		display: inline-flex; align-items: center; gap: 0.4rem;
		background: #b6914c;
		color: #000;
		border: none;
		padding: 0.65rem 1.3rem;
		border-radius: 10px;
		font-size: 0.9rem; font-weight: 700;
		cursor: pointer;
		transition: opacity 0.2s, transform 0.15s;
	}
	.btn-add:hover:not(:disabled) {
		opacity: 0.88;
		transform: translateY(-1px);
	}
	.btn-add:disabled {
		opacity: 0.35; cursor: not-allowed; transform: none;
	}

	/* â”€â”€ Page header â”€â”€ */
	.page-header {
		display: flex; align-items: center; justify-content: space-between;
		flex-wrap: wrap; gap: 1rem;
		margin-bottom: 1.75rem;
		animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
	}
	.page-header-left { display: flex; align-items: center; gap: 1rem; }
	.page-icon {
		font-size: 2rem; line-height: 1;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 14px; padding: 0.6rem;
	}
	.page-title {
		font-size: 1.6rem; font-weight: 700;
		letter-spacing: -0.03em;
		color: #f5f5f7;
	}
	.page-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.35); margin-top: 0.1rem; }

	/* â”€â”€ Buttons â”€â”€ */
	.btn-delete {
		display: flex; align-items: center; gap: 0.35rem;
		background: rgba(239,68,68,0.08);
		border: 1px solid rgba(239,68,68,0.2);
		border-radius: 7px; padding: 0.35rem 0.75rem;
		color: #f87171; font-size: 0.78rem; font-weight: 500;
		font-family: inherit; cursor: pointer;
		transition: all 0.2s;
	}
	.btn-delete:hover:not(:disabled) {
		background: rgba(239,68,68,0.15);
		border-color: rgba(239,68,68,0.35);
	}
	.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-activate {
		display: flex; align-items: center; gap: 0.35rem;
		background: rgba(34,197,94,0.08);
		border: 1px solid rgba(34,197,94,0.2);
		border-radius: 7px; padding: 0.35rem 0.75rem;
		color: #86efac; font-size: 0.78rem; font-weight: 500;
		font-family: inherit; cursor: pointer;
		transition: all 0.2s;
	}
	.btn-activate:hover:not(:disabled) {
		background: rgba(34,197,94,0.15);
		border-color: rgba(34,197,94,0.35);
	}
	.btn-activate:disabled { opacity: 0.5; cursor: not-allowed; }

	/* â”€â”€ Alerts â”€â”€ */
	.alert {
		display: flex; align-items: center; gap: 0.6rem;
		padding: 0.85rem 1.2rem; border-radius: 10px;
		font-size: 0.88rem; font-weight: 500;
		margin-bottom: 1.25rem;
		animation: slideUp 0.3s ease both;
	}
	.alert-success {
		background: rgba(34,197,94,0.08);
		border: 1px solid rgba(34,197,94,0.2);
		color: #86efac;
	}
	.alert-error {
		background: rgba(239,68,68,0.08);
		border: 1px solid rgba(239,68,68,0.2);
		color: #f87171;
	}

	/* â”€â”€ Filters â”€â”€ */
	.filters-bar {
		display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
		margin-bottom: 1.75rem;
		animation: slideUp 0.4s 0.05s cubic-bezier(0.16,1,0.3,1) both;
	}
	.search-wrapper {
		position: relative; flex: 1; min-width: 200px;
	}
	.search-icon {
		position: absolute; left: 0.85rem; top: 50%;
		transform: translateY(-50%); color: rgba(255,255,255,0.25);
		pointer-events: none;
	}
	.search-input {
		width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem;
		background: #111;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; color: #f5f5f7;
		font-size: 0.88rem; font-family: inherit;
		transition: border-color 0.2s;
		outline: none;
	}
	.search-input::placeholder { color: rgba(255,255,255,0.25); }
	.search-input:focus {
		border-color: rgba(182,145,76,0.5);
	}
	.filter-select {
		padding: 0.65rem 1rem;
		background: #111;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; color: #f5f5f7;
		font-size: 0.88rem; font-family: inherit;
		cursor: pointer; min-width: 160px;
		transition: border-color 0.2s; outline: none;
	}
	.filter-select:focus { border-color: rgba(182,145,76,0.5); }
	.filter-select option { background: #111; color: #f5f5f7; }

	/* â”€â”€ Products grid â”€â”€ */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
		animation: slideUp 0.45s 0.1s cubic-bezier(0.16,1,0.3,1) both;
	}

	.product-card {
		background: #111;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 16px; overflow: hidden;
		display: flex; flex-direction: column;
		transition: border-color 0.25s, transform 0.25s;
		cursor: pointer;
		position: relative;
	}
	.product-card:hover {
		border-color: rgba(255,255,255,0.18);
		transform: translateY(-3px);
	}
	.product-card.selected {
		background: rgba(182,145,76,0.08);
		border-color: rgba(182,145,76,0.5);
	}
	.product-card.selected::after {
		content: '\2713';
		position: absolute;
		top: 0.6rem; right: 0.6rem;
		width: 22px; height: 22px;
		background: #b6914c;
		color: #000;
		border-radius: 50%;
		font-size: 0.8rem; font-weight: 800;
		line-height: 22px; text-align: center;
		animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
	}

	.product-image-wrap {
		width: 100%; aspect-ratio: 4/3;
		background: #1a1a1a;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}
	.product-img {
		width: 100%; height: 100%; object-fit: cover;
		transition: transform 0.3s ease;
	}
	.product-card:hover .product-img { transform: scale(1.04); }
	.product-img-placeholder { font-size: 3.5rem; opacity: 0.3; }

	.product-body {
		padding: 1rem 1.1rem; flex: 1;
	}
	.product-tipo {
		font-size: 0.7rem; font-weight: 600;
		color: #b6914c; text-transform: uppercase;
		letter-spacing: 0.06em; margin-bottom: 0.3rem;
	}
	.product-name {
		font-size: 0.98rem; font-weight: 600;
		color: #f5f5f7; line-height: 1.3;
		margin-bottom: 0.5rem;
	}

	.product-footer {
		padding: 0.7rem 1.1rem;
		border-top: 1px solid rgba(255,255,255,0.06);
		display: flex; align-items: center; justify-content: space-between;
	}
	.product-price {
		font-size: 0.95rem; font-weight: 700; color: #b6914c;
	}
	.product-actions { display: flex; gap: 0.5rem; }

	/* â”€â”€ Empty state â”€â”€ */
	.empty-state {
		text-align: center; padding: 4rem 2rem;
		animation: slideUp 0.4s ease both;
	}
	.empty-icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.4; }
	.empty-state h2 {
		font-size: 1.2rem; font-weight: 600;
		color: #f5f5f7; margin-bottom: 0.5rem;
	}
	.empty-state p { font-size: 0.9rem; color: rgba(255,255,255,0.35); margin-bottom: 1.5rem; }

	/* â”€â”€ Modal â”€â”€ */
	.modal-backdrop {
		position: fixed; inset: 0; z-index: 200;
		background: rgba(0,0,0,0.75);
		backdrop-filter: blur(8px);
		display: flex; align-items: center; justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.2s ease both;
	}
	.modal {
		background: #111;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 20px; padding: 2rem;
		width: 100%; max-width: 480px;
		box-shadow: 0 30px 80px rgba(0,0,0,0.8);
		animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
	}
	.modal-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 1.75rem;
	}
	.modal-title {
		font-size: 1.2rem; font-weight: 700;
		color: #f5f5f7;
	}
	.modal-close {
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 8px; padding: 0.4rem;
		color: rgba(255,255,255,0.4); cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: all 0.2s;
	}
	.modal-close:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }

	/* â”€â”€ Form â”€â”€ */
	.modal-form { display: flex; flex-direction: column; gap: 1.1rem; }
	.form-group { display: flex; flex-direction: column; gap: 0.45rem; }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	.form-label {
		font-size: 0.82rem; font-weight: 600;
		color: rgba(255,255,255,0.45); letter-spacing: 0.02em;
	}
	.required { color: #f87171; }
	.form-input {
		padding: 0.7rem 0.9rem;
		background: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; color: #f5f5f7;
		font-size: 0.9rem; font-family: inherit;
		transition: border-color 0.2s;
		width: 100%; outline: none;
	}
	.form-input::placeholder { color: rgba(255,255,255,0.2); }
	.form-input:focus {
		border-color: rgba(182,145,76,0.5);
	}

	.modal-actions {
		display: flex; gap: 0.75rem; justify-content: flex-end;
		margin-top: 0.5rem;
	}
	.btn-cancel {
		padding: 0.65rem 1.2rem;
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 10px; color: rgba(255,255,255,0.5);
		font-size: 0.88rem; font-family: inherit; cursor: pointer;
		transition: all 0.2s;
	}
	.btn-cancel:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.22); color: #fff; }
	.btn-submit {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.65rem 1.3rem;
		background: #b6914c;
		border: none; border-radius: 10px;
		color: #000; font-size: 0.9rem; font-weight: 700;
		font-family: inherit; cursor: pointer;
		transition: opacity 0.2s, transform 0.15s;
	}
	.btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
	.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

	.form-fecha-custom-row {
		display: flex; flex-direction: row; gap: 1rem; margin-top: 0.5rem;
	}
	.form-fecha-custom-row-item {
		display: flex; flex-direction: column; gap: 1rem; width: 100%;
	}

	/* â”€â”€ Spinner â”€â”€ */
	.spinner-sm {
		width: 13px; height: 13px;
		border: 2px solid rgba(255,255,255,0.2);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		display: inline-block;
	}

	.quantity-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 8px;
		height: 38px;
		width: 130px;
		overflow: hidden;
	}

	input[type="number"] {
		width: 60px;
		background: transparent;
		border: none;
		color: #ffffff;
		text-align: center;
		font-size: 1rem;
		font-family: inherit;
		outline: none;
		padding-left: 8px;
	}

	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type="number"] {
		-moz-appearance: textfield;
	}

	.controls {
		display: flex;
		height: 100%;
		border-left: 1px solid rgba(255,255,255,0.08);
	}

	.qty-btn {
		background: #1a1a1a;
		border: none;
		color: rgba(255,255,255,0.5);
		width: 38px;
		cursor: pointer;
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s, color 0.2s;
		padding: 0;
	}

	.btn-price {
		width: 75px;
		padding: 10px;
		background-color: #1a1a1a;
		border-radius: 10px;
		outline: none;
		border: 1px solid rgba(255,255,255,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-family: inherit;
		color: white;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
	}

	.btn-price:hover { background-color: #222; }

	.qty-btn:hover { background: #222; color: #fff; }
	.qty-btn:active { background: #111; }
	.btn-decrease { border-right: 1px solid rgba(255,255,255,0.08); }

	/* â”€â”€ Animations â”€â”€ */
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(18px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes scaleIn {
		from { opacity: 0; transform: scale(0.96); }
		to   { opacity: 1; transform: scale(1); }
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes popIn {
		from { opacity: 0; transform: scale(0.6); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* â”€â”€ Modal Registro â”€â”€ */
	.modal-registro { max-width: 560px; }
	.registro-body { padding: 0 1.5rem 1rem; }
	.registro-table-wrap {
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 10px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin-bottom: 1rem;
	}
	.registro-table {
		width: 100%; border-collapse: collapse;
		font-size: 0.875rem;
		min-width: 380px;
	}
	.registro-table thead { background: #1a1a1a; }
	.registro-table th {
		padding: 0.65rem 0.9rem;
		text-align: left;
		color: rgba(255,255,255,0.4);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(255,255,255,0.07);
		white-space: nowrap;
	}
	.registro-table td {
		padding: 0.65rem 0.9rem;
		color: rgba(255,255,255,0.8);
		border-bottom: 1px solid rgba(255,255,255,0.05);
	}
	.registro-table tbody tr:last-child td { border-bottom: none; }
	.registro-table tbody tr:hover { background: rgba(255,255,255,0.02); }
	.td-center { text-align: center; }
	.td-right { text-align: right; font-weight: 600; color: #b6914c; }
	.registro-total {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(182,145,76,0.08);
		border: 1px solid rgba(182,145,76,0.2);
		border-radius: 10px;
		margin-bottom: 1.25rem;
		font-weight: 700;
		color: #f5f5f7;
	}
	.total-value { font-size: 1.2rem; color: #b6914c; }
	.ganancia-hint { margin-top: 0.4rem; font-size: 0.82rem; color: rgba(255,255,255,0.4); }
	.ganancia-hint strong { color: #b6914c; }

	/* Upload card */
	.upload-card {
		background-color: #1a1a1a;
		width: 100%;
		max-width: 400px;
		margin: 20px auto;
		padding: 10px;
		border-radius: 16px;
		box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.upload-btn {
		background-color: #b6914c;
		color: #000;
		border: none;
		padding: 10px 40px;
		border-radius: 99px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		margin-bottom: 30px;
		transition: opacity 0.2s;
	}
	.upload-btn:hover { opacity: 0.88; }

	.drop-zone {
		width: 100%;
		border: 2px dashed rgba(255,255,255,0.15);
		border-radius: 8px;
		padding: 40px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		box-sizing: border-box;
	}
	.drop-zone.dragging {
		border-color: #b6914c;
		background-color: rgba(182,145,76,0.05);
	}
	.drop-zone:hover {
		border-color: rgba(255,255,255,0.3);
		background-color: rgba(255,255,255,0.02);
	}
	.drop-text { margin-top: 15px; color: rgba(255,255,255,0.4); font-size: 14px; }

	.preview-container {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		justify-content: center;
		width: 100%;
	}
	.image-preview {
		position: relative;
		width: 80px; height: 80px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.3);
	}
	.image-preview img {
		width: 100%; height: 100%;
		object-fit: cover; border-radius: 8px;
	}
	.remove-btn {
		position: absolute;
		top: -8px; right: -8px;
		background-color: #ef4444;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px; height: 24px;
		font-size: 12px;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.3);
		transition: transform 0.2s;
	}
	.remove-btn:hover { transform: scale(1.1); background-color: #dc2626; }

	.form-input-fecha {
		display: flex;
		width: 80%;
		padding: 0.625rem 1rem;
		background-color: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 12px;
		color: #f5f5f7;
		font-size: 0.95rem;
		outline: none;
		transition: border-color 0.25s ease;
	}
	.form-input-fecha:focus { border-color: rgba(182,145,76,0.5); }

	.form-input-hora {
		display: flex;
		width: 45%;
		padding: 0.625rem 1rem;
		background-color: #1a1a1a;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 12px;
		color: #f5f5f7;
		font-size: 0.95rem;
		outline: none;
		transition: border-color 0.25s ease;
	}
	.form-input-hora:focus { border-color: rgba(182,145,76,0.5); }

	.switch {
		position: relative;
		display: inline-block;
		width: 40px; height: 24px;
		margin: 20px;
	}
	.switch input { opacity: 0; width: 0; height: 0; }
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: rgba(255,255,255,0.15);
		transition: .4s;
		border-radius: 24px;
	}
	.slider:before {
		position: absolute;
		content: "";
		height: 16px; width: 16px;
		left: 4px; bottom: 4px;
		background-color: white;
		transition: .4s;
		border-radius: 50%;
	}
	input:checked + .slider { background-color: #b6914c; }
	input:checked + .slider:before { transform: translateX(16px); }

	/* â”€â”€ Responsive â”€â”€ */
	@media (max-width: 600px) {
		.main-content { padding: 1.5rem 1rem; }
		.navbar { padding: 0 1rem; gap: 0.5rem; }
		.navbar-breadcrumb { display: none; }
		.logout-btn span:not(.spinner-sm) { display: none; }
		.page-header { flex-direction: column; align-items: flex-start; }
		.page-header-left { gap: 0.65rem; }
		.page-title { font-size: 1.25rem; }
		.btn-add { font-size: 0.82rem; padding: 0.55rem 1rem; }
		.form-row { grid-template-columns: 1fr; }
		.filters-bar { flex-direction: column; align-items: stretch; }
		.search-wrapper { min-width: unset; }
		.filter-select { min-width: unset; }
		.products-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
		.modal-backdrop { padding: 0; align-items: flex-end; }
		.modal { max-width: 100%; border-radius: 20px 20px 0 0; padding: 1.5rem 1.25rem; max-height: 90vh; overflow-y: auto; }
		.modal-registro { max-width: 100%; }
		.registro-body { padding: 0 0 1rem; }
		.registro-table th, .registro-table td { padding: 0.5rem 0.65rem; font-size: 0.8rem; }
		.modal-actions { flex-direction: column-reverse; }
		.modal-actions .btn-cancel, .modal-actions .btn-submit { width: 100%; justify-content: center; text-align: center; }
	}
</style>
