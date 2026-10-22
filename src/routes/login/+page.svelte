<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Iniciar Sesión · Imperio</title>
	<meta name="description" content="Accede a tu cuenta en Imperio." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="login-wrapper">
	<div class="login-card">
		<!-- Logo / Marca -->
		<div class="brand">
			<img src="https://res.cloudinary.com/b6k3zfto/image/upload/v1788471377/logo.png" width="64" height="64" alt="Imperio" class="brand-logo">
		</div>

		<div class="card-header">
			<h2>Bienvenido de vuelta</h2>
			<p>Ingresa la contraseña para continuar</p>
		</div>

		{#if form?.error}
			<div class="error-alert" role="alert">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<line x1="12" y1="8" x2="12" y2="12"/>
					<line x1="12" y1="16" x2="12.01" y2="16"/>
				</svg>
				{form.error}
			</div>
		{/if}

		<form
			id="login-form"
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>

			<div class="field">
				<label for="password">Contraseña</label>
				<div class="input-wrapper">
					<svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="••••••••"
						autocomplete="current-password"
						required
					/>
					<button
						type="button"
						class="toggle-password"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
					>
						{#if showPassword}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
								<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button id="login-submit" type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					<span class="spinner" aria-hidden="true"></span>
					Iniciando sesión...
				{:else}
					Iniciar sesión
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

	.login-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
		position: relative;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
		padding: 1.5rem;
	}

	.login-card {
		position: relative;
		width: 100%;
		max-width: 400px;
		background: #111;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 2.75rem 2.25rem;
		animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(24px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.brand {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.brand-logo {
		border-radius: 16px;
		display: block;
	}

	.card-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.card-header h2 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: #fff;
		margin-bottom: 0.4rem;
	}

	.card-header p {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.45);
	}

	.error-alert {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		color: #f87171;
		font-size: 0.875rem;
		margin-bottom: 1.25rem;
		animation: shake 0.3s ease;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25%       { transform: translateX(-4px); }
		75%       { transform: translateX(4px); }
	}

	.field {
		margin-bottom: 1rem;
	}

	.field label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 0.875rem;
		color: rgba(255, 255, 255, 0.25);
		pointer-events: none;
		flex-shrink: 0;
	}

	.input-wrapper input {
		width: 100%;
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 0.85rem 3rem 0.85rem 2.75rem;
		color: #fff;
		font-size: 0.95rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s;
	}

	.input-wrapper input::placeholder { color: rgba(255, 255, 255, 0.2); }

	.input-wrapper input:focus {
		border-color: rgba(182, 145, 76, 0.6);
	}

	.input-wrapper input:hover:not(:focus) {
		border-color: rgba(255, 255, 255, 0.18);
	}

	.toggle-password {
		position: absolute;
		right: 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.25);
		display: flex;
		align-items: center;
		padding: 0;
		transition: color 0.2s;
	}

	.toggle-password:hover { color: rgba(255, 255, 255, 0.6); }

	.btn-primary {
		width: 100%;
		margin-top: 1rem;
		padding: 0.9rem;
		border: none;
		border-radius: 12px;
		background: #b6914c;
		color: #000;
		font-size: 0.95rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: opacity 0.2s, transform 0.15s;
		letter-spacing: 0.01em;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.88;
		transform: translateY(-1px);
	}

	.btn-primary:active:not(:disabled) { transform: translateY(0); }
	.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

	.spinner {
		width: 15px; height: 15px;
		border: 2px solid rgba(0,0,0,0.25);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }
</style>
