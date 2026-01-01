<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		ExternalLink,
		FileText,
		LayoutDashboard,
		List,
		LogOut,
		Settings2,
		Shield,
		ShieldCheck,
		User as UserIcon,
		Users
	} from '@lucide/svelte';
	import type { Component, ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	interface NavItem {
		title: string;
		url: string;
		icon: Component;
		requiresSuperadmin?: boolean;
		requiresAdmin?: boolean;
	}

	interface NavGroup {
		title: string;
		items: NavItem[];
	}

	const navGroups: NavGroup[] = [
		{
			title: 'Main',
			items: [
				{ title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
				{ title: 'Sitios List', url: '/admin/sitios', icon: List }
			]
		},
		{
			title: 'System',
			items: [
				{ title: 'Users', url: '/admin/users', icon: Users, requiresSuperadmin: true },
				{ title: 'Configuration', url: '/admin/config', icon: Settings2, requiresSuperadmin: true },
				{ title: 'Audit Logs', url: '/admin/audit', icon: FileText },
				{ title: 'View Public Portal', url: '/', icon: ExternalLink }
			]
		}
	];

	// Get current user from auth store
	const currentUser = $derived(authStore.currentUser);
	const userDisplay = $derived({
		name: currentUser?.name || 'Guest',
		email: currentUser?.email || '',
		initials: currentUser?.name?.charAt(0).toUpperCase() || 'G',
		role: currentUser?.role || 'viewer'
	});

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}

	function isActive(url: string): boolean {
		// For sitios, projects, recommendations, and config, use startsWith to match sub-routes
		if (
			url === '/admin/sitios' ||
			url === '/admin/projects' ||
			url === '/admin/recommendations' ||
			url === '/admin/config'
		) {
			return page.url.pathname.startsWith(url);
		}
		return page.url.pathname === url;
	}

	function canViewItem(item: NavItem): boolean {
		if (item.requiresSuperadmin && !authStore.isSuperadmin) return false;
		if (item.requiresAdmin && !authStore.isAdmin) return false;
		return true;
	}

	function getRoleIcon(role: string) {
		switch (role) {
			case 'superadmin':
				return ShieldCheck;
			case 'admin':
				return Shield;
			default:
				return UserIcon;
		}
	}
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
					<a href="/admin" class="flex items-center gap-2">
						<div class="flex aspect-square size-8 items-center justify-center">
							<img src="/favicon.png" alt="SC Data Bank Logo" class="size-8 object-contain" />
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">CATCH-UP Data Bank</span>
							<span class="truncate text-xs">Admin Portal</span>
						</div>
					</a>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each navGroups as group}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each group.items as item}
						{#if canViewItem(item)}
							{@const active = isActive(item.url)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton tooltipContent={item.title} isActive={active}>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon class="size-4" />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/if}
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="size-8 rounded-lg">
									<Avatar.Fallback class="rounded-lg bg-blue-600 text-white">
										{userDisplay.initials}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{userDisplay.name}</span>
									<span class="truncate text-xs">{userDisplay.email}</span>
								</div>
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" side="right" align="end" sideOffset={4}>
						<DropdownMenu.Label class="p-0 font-normal">
							<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar.Root class="size-8 rounded-lg">
									<Avatar.Fallback class="rounded-lg bg-blue-600 text-white">
										{userDisplay.initials}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{userDisplay.name}</span>
									<div class="flex w-full items-center gap-1">
										<span class="w-full truncate text-xs">{userDisplay.email}</span>
									</div>
								</div>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<div class="flex items-center justify-between px-2 py-1.5">
							<span class="text-sm">Theme</span>
							<ThemeToggle variant="inline" />
						</div>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={handleLogout}>
							<LogOut class="size-4" />
							Log out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
