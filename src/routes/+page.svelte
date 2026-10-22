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
	<title>Dashboard · Imperio</title>
	<meta name="description" content="Tu panel de control en Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="dashboard">
	<!-- Navbar -->
	<header class="navbar">
		<div class="navbar-brand">
			<img src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/logo.png" width="40" height="40" alt="Imperio" class="brand-logo">
		</div>

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
		<!-- Welcome -->
		<div class="welcome-section">
			<div class="welcome-avatar">{initials}</div>
			<div class="welcome-text">
				<h1>Hola, {data.user?.name?.split(' ')[0]}</h1>
				<p>¿Qué quieres gestionar hoy?</p>
			</div>
		</div>

		<!-- Cards -->
		<div class="cards-grid">

			<div class="product-card">
				<div class="card-image-wrap">
					<img src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/yogurt.png" alt="Yogurt" class="card-image">
				</div>
				<div class="card-body">
					<span class="card-label">Categoría</span>
					<h2 class="card-title">Yogurt</h2>
					<div class="card-actions">
						<a href="/gestion_productos?tipoSelected=1" class="btn-primary">Gestionar</a>
						<a href="/visualizar_registro?tipoSelected=1" class="btn-secondary">Ver registros</a>
					</div>
				</div>
			</div>

			<div class="product-card">
				<div class="card-image-wrap">
					<img src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/proteinas.png" alt="Proteínas" class="card-image">
				</div>
				<div class="card-body">
					<span class="card-label">Categoría</span>
					<h2 class="card-title">Proteínas</h2>
					<div class="card-actions">
						<a href="/gestion_productos?tipoSelected=2" class="btn-primary">Gestionar</a>
						<a href="/visualizar_registro?tipoSelected=2" class="btn-secondary">Ver registros</a>
					</div>
				</div>
			</div>

		</div>
	</main>
</div>

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
	}

	.navbar-brand { display: flex; align-items: center; }
	.brand-logo { border-radius: 10px; display: block; }

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
		color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; font-family: inherit;
		cursor: pointer; transition: all 0.2s;
	}

	.logout-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.25);
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
		max-width: 860px; margin: 0 auto;
		padding: 4rem 1.5rem 3rem;
	}

	/* ── Welcome ── */
	.welcome-section {
		display: flex; align-items: center; gap: 1.25rem;
		margin-bottom: 3rem;
		animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.welcome-avatar {
		width: 56px; height: 56px; border-radius: 50%;
		background: #b6914c;
		display: flex; align-items: center; justify-content: center;
		font-size: 1.3rem; font-weight: 700; color: #000;
		flex-shrink: 0;
	}

	.welcome-text h1 {
		font-size: 2rem; font-weight: 700;
		letter-spacing: -0.03em; color: #f5f5f7;
	}

	.welcome-text p {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.2rem;
	}

	/* ── Cards ── */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 1.5rem;
		animation: fadeUp 0.5s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.product-card {
		background: #111;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 18px;
		overflow: hidden;
		transition: border-color 0.25s, transform 0.25s;
	}

	.product-card:hover {
		border-color: rgba(255, 255, 255, 0.18);
		transform: translateY(-3px);
	}

	.card-image-wrap {
		width: 100%;
		aspect-ratio: 16/9;
		background: #1a1a1a;
		display: flex; align-items: center; justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.card-image {
		width: 60%; height: 60%; object-fit: contain;
		transition: transform 0.35s ease;
	}

	.product-card:hover .card-image { transform: scale(1.05); }

	.card-body {
		padding: 1.5rem;
	}

	.card-label {
		font-size: 0.72rem; font-weight: 600;
		text-transform: uppercase; letter-spacing: 0.08em;
		color: #b6914c;
		display: block; margin-bottom: 0.35rem;
	}

	.card-title {
		font-size: 1.4rem; font-weight: 700;
		letter-spacing: -0.02em; color: #f5f5f7;
		margin-bottom: 1.25rem;
	}

	.card-actions {
		display: flex; flex-direction: column; gap: 0.6rem;
	}

	.btn-primary {
		display: flex; align-items: center; justify-content: center;
		padding: 0.8rem;
		background: #b6914c;
		color: #000;
		border: none; border-radius: 10px;
		font-size: 0.9rem; font-weight: 700;
		font-family: inherit; cursor: pointer;
		text-decoration: none;
		transition: opacity 0.2s, transform 0.15s;
	}

	.btn-primary:hover {
		opacity: 0.88;
		transform: translateY(-1px);
	}

	.btn-secondary {
		display: flex; align-items: center; justify-content: center;
		padding: 0.8rem;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 10px;
		font-size: 0.9rem; font-weight: 600;
		font-family: inherit; cursor: pointer;
		text-decoration: none;
		transition: background 0.2s, border-color 0.2s, color 0.2s;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.22);
		color: #fff;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(20px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 600px) {
		.navbar { padding: 0 1rem; }
		.main-content { padding: 2.5rem 1rem 2rem; }
		.welcome-text h1 { font-size: 1.5rem; }
		.cards-grid { grid-template-columns: 1fr; }
	}
</style>
