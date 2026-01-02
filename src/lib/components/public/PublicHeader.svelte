<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/assets/logo.png';
	import { Button } from '$lib/components/ui/button';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Home, LayoutDashboard, LogIn, Menu, Users, X } from '@lucide/svelte';

	let mobileMenuOpen = $state(false);

	const navLinks = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/sitios', label: 'Sitios', icon: Users }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
>
	<div class="relative container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Logo & Title -->
		<a href="/" class="flex items-center gap-2">
			<img src={logo} alt="CATCH-UP Logo" class="size-9 rounded-lg object-contain" />
			<div class="hidden flex-col sm:flex">
				<span class="text-sm leading-tight font-bold">South Cotabato CATCH-UP</span>
				<span class="text-xs leading-tight text-muted-foreground">Convergence Data Bank</span>
			</div>
		</a>

		<!-- Desktop Navigation -->
		<!-- <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
			{#each navLinks as link}
				{@const active = isActive(link.href)}
				<a
					href={link.href}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {active
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<link.icon class="size-4" />
					{link.label}
				</a>
			{/each}
		</nav> -->

		<!-- Desktop Actions -->
		<div class="hidden items-center gap-2 md:flex">
			<ThemeToggle />
			{#if authStore.isAuthenticated}
				<Button href="/admin" variant="default" size="sm">
					<LayoutDashboard class="mr-2 size-4" />
					Dashboard
				</Button>
			{:else}
				<Button href="/login" variant="outline" size="sm">
					<LogIn class="mr-2 size-4" />
					Admin Login
				</Button>
			{/if}
			<!-- {#each navLinks as link}
				{@const active = isActive(link.href)}
				<a
					href={link.href}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {active
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<link.icon class="size-4" />
					{link.label}
				</a>
			{/each} -->
		</div>

		<!-- Mobile Menu Button -->
		<Button
			variant="ghost"
			size="icon"
			class="md:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle menu"
		>
			{#if mobileMenuOpen}
				<X class="size-5" />
			{:else}
				<Menu class="size-5" />
			{/if}
		</Button>
	</div>

	<!-- Mobile Navigation -->
	{#if mobileMenuOpen}
		<div class="border-t md:hidden">
			<nav class="container mx-auto flex flex-col gap-1 px-4 py-3">
				{#each navLinks as link}
					{@const active = isActive(link.href)}
					<a
						href={link.href}
						onclick={closeMobileMenu}
						class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {active
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<link.icon class="size-4" />
						{link.label}
					</a>
				{/each}
				<div class="my-2 flex items-center justify-between border-t pt-2">
					<span class="text-sm text-muted-foreground">Theme</span>
					<ThemeToggle variant="inline" />
				</div>
				{#if authStore.isAuthenticated}
					<Button
						href="/admin"
						variant="default"
						size="sm"
						class="justify-start"
						onclick={closeMobileMenu}
					>
						<LayoutDashboard class="mr-2 size-4" />
						Dashboard
					</Button>
				{:else}
					<Button
						href="/login"
						variant="outline"
						size="sm"
						class="justify-start"
						onclick={closeMobileMenu}
					>
						<LogIn class="mr-2 size-4" />
						Admin Login
					</Button>
				{/if}
			</nav>
		</div>
	{/if}
</header>
