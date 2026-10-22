<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loggingOut = $state(false);

	// Iniciales del usuario
	const initials = $derived(
		data.user?.name
			?.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() ?? '?'
	);
</script>

<svelte:head>
	<title>Panel de Control · Imperio</title>
	<meta name="description" content="Panel de administración y control operativo Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="dashboard">
	<!-- Navbar Empresarial -->
	<header class="navbar">
		<div class="navbar-brand">
			<a href="/" class="brand-link" aria-label="Inicio Imperio">
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
		<!-- Welcome Header -->
		<div class="welcome-section">
			<div class="welcome-avatar" aria-hidden="true">{initials}</div>
			<div class="welcome-text">
				<h1>Hola, {data.user?.name?.split(' ')[0] ?? 'Usuario'}</h1>
				<p>Selecciona una categoría para gestionar inventario o consultar registros de ventas</p>
			</div>
		</div>

		<!-- Category Cards Grid -->
		<div class="cards-grid">
			<!-- Yogurt Card -->
			<div class="category-card">
				<div class="card-image-wrap">
					<img
						src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/yogurt.png"
						alt="Categoría Yogurt"
						class="card-image"
						loading="lazy"
					/>
				</div>
				<div class="card-body">
					<div class="card-header-line">
						<span class="card-label">Línea de Producción</span>
						<span class="category-tag">Catálogo 1</span>
					</div>
					<h2 class="card-title">Yogurt Natural & Sabores</h2>
					<p class="card-desc">
						Control de catálogo, actualización de precios y registro de transacciones de yogurt.
					</p>
					<div class="card-actions">
						<a href="/gestion_productos?tipoSelected=1" class="btn-primary">
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
							</svg>
							Gestionar Productos
						</a>
						<a href="/visualizar_registro?tipoSelected=1" class="btn-secondary">
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
							Ver Historial de Registros
						</a>
					</div>
				</div>
			</div>

			<!-- Proteínas Card -->
			<div class="category-card">
				<div class="card-image-wrap">
					<img
						src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/proteinas.png"
						alt="Categoría Proteínas"
						class="card-image"
						loading="lazy"
					/>
				</div>
				<div class="card-body">
					<div class="card-header-line">
						<span class="card-label">Línea de Producción</span>
						<span class="category-tag">Catálogo 2</span>
					</div>
					<h2 class="card-title">Proteínas & Suplementos</h2>
					<p class="card-desc">
						Administración de suplementos, fijación de precios y auditoría de ventas.
					</p>
					<div class="card-actions">
						<a href="/gestion_productos?tipoSelected=2" class="btn-primary">
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
							</svg>
							Gestionar Productos
						</a>
						<a href="/visualizar_registro?tipoSelected=2" class="btn-secondary">
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
							Ver Historial de Registros
						</a>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

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

	/* ── Main Container ── */
	.main-content {
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
		box-sizing: border-box;
	}

	/* ── Welcome Section ── */
	.welcome-section {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-bottom: 2.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #1a1e2a;
	}

	.welcome-avatar {
		width: 52px;
		height: 52px;
		border-radius: 8px;
		background: #141722;
		border: 1px solid #262c3e;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: 700;
		color: #d4af37;
		flex-shrink: 0;
	}

	.welcome-text h1 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #ffffff;
		margin: 0;
	}

	.welcome-text p {
		font-size: 0.88rem;
		color: #7d8495;
		margin-top: 0.25rem;
	}

	/* ── Cards Grid ── */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.category-card {
		background: #11141c;
		border: 1px solid #1f2433;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: border-color 0.15s;
	}

	.category-card:hover {
		border-color: #2e3549;
	}

	.card-image-wrap {
		width: 100%;
		aspect-ratio: 16/9;
		background: #0d0f15;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid #1a1e2a;
	}

	.card-image {
		width: 55%;
		height: 55%;
		object-fit: contain;
	}

	.card-body {
		padding: 1.35rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.card-header-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.card-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #b6914c;
	}

	.category-tag {
		font-size: 0.68rem;
		color: #7d8495;
		background: #141722;
		border: 1px solid #232838;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0 0 0.5rem;
	}

	.card-desc {
		font-size: 0.84rem;
		color: #7d8495;
		line-height: 1.45;
		margin: 0 0 1.25rem;
		flex: 1;
	}

	.card-actions {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		background: #b6914c;
		color: #0c0d12;
		border: none;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 700;
		text-decoration: none;
		transition: background 0.15s;
	}

	.btn-primary:hover {
		background: #c5a05b;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.65rem 1rem;
		background: #141722;
		color: #c0c6d4;
		border: 1px solid #232838;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.btn-secondary:hover {
		background: #1c2130;
		border-color: #343c52;
		color: #ffffff;
	}

	/* Spinner */
	.spinner-sm {
		width: 12px;
		height: 12px;
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

	@media (max-width: 640px) {
		.navbar {
			padding: 0 1rem;
		}

		.logout-btn span:not(.spinner-sm) {
			display: none;
		}

		.main-content {
			padding: 1.75rem 1rem;
		}

		.welcome-text h1 {
			font-size: 1.35rem;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
