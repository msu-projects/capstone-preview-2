<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authStore } from '$lib/stores/auth.svelte';
	import { AlertCircle, Database, Eye, EyeOff, Lock, Mail } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let isLoading = $state(false);

	// Redirect if already authenticated
	onMount(() => {
		authStore.initialize();
		if (authStore.isAuthenticated) {
			goto('/admin');
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		// Simulate network delay for realistic feel
		await new Promise((resolve) => setTimeout(resolve, 500));

		const result = authStore.login(email, password);

		if (result.success) {
			goto('/admin');
		} else {
			error = result.error || 'Login failed';
		}

		isLoading = false;
	}

	// Demo credentials
	const demoAccounts = [
		{ role: 'Superadmin', email: 'superadmin@southcotabato.gov.ph', password: 'admin123' },
		{ role: 'Admin', email: 'juan.delacruz@southcotabato.gov.ph', password: 'admin123' },
		{ role: 'Viewer', email: 'pedro.reyes@southcotabato.gov.ph', password: 'viewer123' }
	];

	function fillDemoCredentials(demoEmail: string, demoPassword: string) {
		email = demoEmail;
		password = demoPassword;
	}
</script>

<svelte:head>
	<title>Login - South Cotabato Data Bank</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800"
>
	<div class="w-full max-w-md space-y-6">
		<!-- Logo/Header -->
		<div class="text-center">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
				<Database class="h-8 w-8 text-primary-foreground" />
			</div>
			<h1 class="mt-4 text-2xl font-bold text-foreground">South Cotabato Data Bank</h1>
			<p class="mt-2 text-sm text-muted-foreground">Sign in to access the admin dashboard</p>
		</div>

		<!-- Login Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Sign In</Card.Title>
				<Card.Description>Enter your credentials to continue</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleSubmit} class="space-y-4">
					{#if error}
						<Alert.Root variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>{error}</Alert.Description>
						</Alert.Root>
					{/if}

					<div class="space-y-2">
						<Label for="email">Email</Label>
						<div class="relative">
							<Mail
								class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								bind:value={email}
								class="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="password">Password</Label>
						<div class="relative">
							<Lock
								class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="••••••••"
								bind:value={password}
								class="pr-10 pl-10"
								required
								disabled={isLoading}
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<Button type="submit" class="w-full" disabled={isLoading}>
						{#if isLoading}
							<span
								class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							></span>
							Signing in...
						{:else}
							Sign In
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Demo Credentials -->
		<Card.Root class="border-dashed">
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-medium">Demo Credentials</Card.Title>
				<Card.Description class="text-xs">Click to auto-fill credentials</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each demoAccounts as account}
					<button
						type="button"
						onclick={() => fillDemoCredentials(account.email, account.password)}
						class="w-full rounded-md border border-border p-2 text-left text-xs transition-colors hover:bg-muted"
					>
						<div class="flex items-center justify-between">
							<span class="font-medium text-foreground">{account.role}</span>
							<span class="rounded bg-muted px-2 py-0.5 text-muted-foreground"
								>{account.password}</span
							>
						</div>
						<span class="text-muted-foreground">{account.email}</span>
					</button>
				{/each}
			</Card.Content>
		</Card.Root>

		<!-- Back to public portal link -->
		<p class="text-center text-sm text-muted-foreground">
			<a href="/" class="font-medium text-primary hover:text-primary/80">
				← Back to Public Portal
			</a>
		</p>
	</div>
</div>
