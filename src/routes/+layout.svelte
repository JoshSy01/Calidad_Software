<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(html, body) {
		width: 100%;
		height: 100%;
		background: #000;
		color: #f5f5f7;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	:global(:focus-visible) {
		outline: 2px solid rgba(182, 145, 76, 0.6);
		outline-offset: 2px;
	}

	:global(::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	:global(::-webkit-scrollbar-track) {
		background: transparent;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.12);
		border-radius: 4px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.22);
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(img) {
		max-width: 100%;
		display: block;
	}

	:global(button, input, select, textarea) {
		font-family: inherit;
	}
</style>
