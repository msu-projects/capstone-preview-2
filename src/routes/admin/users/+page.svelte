<script lang="ts">
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { User, UserPermissions, UserRole } from '$lib/types';
	import { calculateChanges, logAuditAction } from '$lib/utils/audit';
	import toTitleCase from '$lib/utils/common';
	import {
		addUser,
		DEFAULT_PERMISSIONS,
		deleteUser,
		loadUsers,
		updateUser
	} from '$lib/utils/user-storage';
	import {
		AlertCircle,
		Edit,
		Plus,
		RefreshCw,
		Search,
		Shield,
		ShieldCheck,
		Trash2,
		User as UserIcon,
		Users
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// State
	let users = $state<User[]>([]);
	let searchQuery = $state('');
	let roleFilter = $state<string>('all');
	let statusFilter = $state<string>('all');

	// Dialog states
	let isCreateDialogOpen = $state(false);
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);
	let selectedUser = $state<User | null>(null);

	// Form state
	let formData = $state({
		name: '',
		email: '',
		password: '',
		role: 'viewer' as UserRole,
		department: '',
		is_active: true,
		permissions: { ...DEFAULT_PERMISSIONS.viewer }
	});

	// Computed
	const filteredUsers = $derived.by(() => {
		return users.filter((user) => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesSearch =
					user.name.toLowerCase().includes(query) ||
					user.email.toLowerCase().includes(query) ||
					user.department.toLowerCase().includes(query);
				if (!matchesSearch) return false;
			}

			// Role filter
			if (roleFilter !== 'all' && user.role !== roleFilter) return false;

			// Status filter
			if (statusFilter === 'active' && !user.is_active) return false;
			if (statusFilter === 'inactive' && user.is_active) return false;

			return true;
		});
	});

	const canManageUsers = $derived(authStore.isSuperadmin);

	// Load users on mount
	onMount(() => {
		refreshUsers();
	});

	function refreshUsers() {
		users = loadUsers();
	}

	function getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'outline' {
		switch (role) {
			case 'superadmin':
				return 'default';
			case 'admin':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getRoleIcon(role: UserRole) {
		switch (role) {
			case 'superadmin':
				return ShieldCheck;
			case 'admin':
				return Shield;
			default:
				return UserIcon;
		}
	}

	// Custom date format with time for users page
	function formatDateWithTime(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openCreateDialog() {
		formData = {
			name: '',
			email: '',
			password: '',
			role: 'viewer',
			department: '',
			is_active: true,
			permissions: { ...DEFAULT_PERMISSIONS.viewer }
		};
		isCreateDialogOpen = true;
	}

	function openEditDialog(user: User) {
		selectedUser = user;
		formData = {
			name: user.name,
			email: user.email,
			password: '', // Don't show existing password
			role: user.role,
			department: user.department,
			is_active: user.is_active,
			permissions: { ...user.permissions }
		};
		isEditDialogOpen = true;
	}

	function openDeleteDialog(user: User) {
		selectedUser = user;
		isDeleteDialogOpen = true;
	}

	function handleRoleChange(role: UserRole) {
		formData.role = role;
		// Update permissions to default for the selected role
		formData.permissions = { ...DEFAULT_PERMISSIONS[role] };
	}

	function handleCreateUser() {
		if (!formData.name || !formData.email || !formData.password) {
			toast.error('Please fill in all required fields');
			return;
		}

		const newUser = addUser({
			name: formData.name,
			email: formData.email,
			password_hash: formData.password,
			role: formData.role,
			department: formData.department,
			is_active: formData.is_active,
			permissions: formData.permissions,
			last_login: ''
		});

		if (newUser) {
			logAuditAction('create', 'user', newUser.id, newUser.name, `Created user: ${newUser.email}`);
			toast.success(`User "${newUser.name}" created successfully`);
			refreshUsers();
			isCreateDialogOpen = false;
		} else {
			toast.error('Failed to create user. Email may already exist.');
		}
	}

	function handleUpdateUser() {
		if (!selectedUser) return;

		const updates: Partial<User> = {
			name: formData.name,
			email: formData.email,
			role: formData.role,
			department: formData.department,
			is_active: formData.is_active,
			permissions: formData.permissions
		};

		// Only update password if provided
		if (formData.password) {
			updates.password_hash = formData.password;
		}

		// Calculate changes for audit log
		const changes = calculateChanges(selectedUser, updates, [
			'name',
			'email',
			'role',
			'department',
			'is_active'
		]);

		const success = updateUser(selectedUser.id, updates);

		if (success) {
			const changedFields = changes.map((c) => c.field).join(', ');
			logAuditAction(
				'update',
				'user',
				selectedUser.id,
				formData.name,
				changedFields ? `Updated: ${changedFields}` : `Updated user: ${formData.email}`,
				changes
			);
			toast.success(`User "${formData.name}" updated successfully`);
			refreshUsers();
			isEditDialogOpen = false;
			selectedUser = null;
		} else {
			toast.error('Failed to update user');
		}
	}

	function handleDeleteUser() {
		if (!selectedUser) return;

		const success = deleteUser(selectedUser.id);

		if (success) {
			logAuditAction(
				'delete',
				'user',
				selectedUser.id,
				selectedUser.name,
				`Deactivated user: ${selectedUser.email}`
			);
			toast.success(`User "${selectedUser.name}" has been deactivated`);
			refreshUsers();
			isDeleteDialogOpen = false;
			selectedUser = null;
		} else {
			toast.error('Failed to delete user. Cannot delete the last superadmin.');
		}
	}

	// Permission toggle helper
	function togglePermission(resource: keyof UserPermissions, action: 'read' | 'write' | 'delete') {
		formData.permissions[resource][action] = !formData.permissions[resource][action];
	}
</script>

<svelte:head>
	<title>User Management - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
	<!-- Header -->
	<AdminHeader
		title="User Management"
		description="Manage user accounts and permissions"
		breadcrumbs={[{ label: 'Users' }]}
	>
		{#snippet actions()}
			{#if canManageUsers}
				<Button onclick={openCreateDialog} size="sm">
					<Plus class="size-4 sm:mr-2" />
					<span class="hidden sm:inline">Add User</span>
				</Button>
			{/if}
		{/snippet}
	</AdminHeader>

	<!-- Content -->
	<div class="flex-1 space-y-6 p-6">
		{#if !canManageUsers}
			<Alert.Root variant="destructive">
				<AlertCircle class="h-4 w-4" />
				<Alert.Title>Access Restricted</Alert.Title>
				<Alert.Description>
					Only superadmins can manage users. You can view the user list but cannot make changes.
				</Alert.Description>
			</Alert.Root>
		{/if}

		<!-- Filters -->
		<Card.Root>
			<Card.Content class="">
				<div class="flex flex-col gap-4 md:flex-row md:items-center">
					<div class="relative flex-1">
						<Search
							class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input placeholder="Search users..." bind:value={searchQuery} class="pl-10" />
					</div>
					<div class="flex gap-2">
						<Select.Root type="single" bind:value={roleFilter}>
							<Select.Trigger class="w-35">
								{roleFilter === 'all'
									? 'All Roles'
									: roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All Roles</Select.Item>
								<Select.Item value="superadmin">Superadmin</Select.Item>
								<Select.Item value="admin">Admin</Select.Item>
								<Select.Item value="viewer">Viewer</Select.Item>
							</Select.Content>
						</Select.Root>
						<Select.Root type="single" bind:value={statusFilter}>
							<Select.Trigger class="w-35">
								{statusFilter === 'all'
									? 'All Status'
									: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All Status</Select.Item>
								<Select.Item value="active">Active</Select.Item>
								<Select.Item value="inactive">Inactive</Select.Item>
							</Select.Content>
						</Select.Root>
						<Button variant="outline" size="icon" onclick={refreshUsers}>
							<RefreshCw class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Users Table -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Users class="h-5 w-5" />
					Users ({filteredUsers.length})
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>User</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Department</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Last Login</Table.Head>
							{#if canManageUsers}
								<Table.Head class="text-right">Actions</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredUsers as user (user.id)}
							{@const RoleIcon = getRoleIcon(user.role)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
										>
											<RoleIcon class="h-5 w-5 text-slate-600 dark:text-slate-400" />
										</div>
										<div>
											<div class="font-medium">{user.name}</div>
											<div class="text-sm text-muted-foreground">{user.email}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getRoleBadgeVariant(user.role)}>
										{toTitleCase(user.role)}
									</Badge>
								</Table.Cell>
								<Table.Cell>{user.department}</Table.Cell>
								<Table.Cell>
									{#if user.is_active}
										<Badge
											variant="outline"
											class="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
										>
											Active
										</Badge>
									{:else}
										<Badge
											variant="outline"
											class="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
										>
											Inactive
										</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{user.last_login ? formatDateWithTime(user.last_login) : 'Never'}
								</Table.Cell>
								{#if canManageUsers}
									<Table.Cell class="text-right">
										<div class="flex justify-end gap-2">
											<Button variant="ghost" size="icon" onclick={() => openEditDialog(user)}>
												<Edit class="h-4 w-4" />
											</Button>
											{#if user.role !== 'superadmin' || users.filter((u) => u.role === 'superadmin').length > 1}
												<Button
													variant="ghost"
													size="icon"
													class="text-destructive hover:text-destructive"
													onclick={() => openDeleteDialog(user)}
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											{/if}
										</div>
									</Table.Cell>
								{/if}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell
									colspan={canManageUsers ? 6 : 5}
									class="text-center py-8 text-muted-foreground"
								>
									No users found
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Create User Dialog -->
<Dialog.Root bind:open={isCreateDialogOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Create New User</Dialog.Title>
			<Dialog.Description>Add a new user to the system</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="name">Full Name *</Label>
					<Input id="name" bind:value={formData.name} placeholder="Juan Dela Cruz" />
				</div>
				<div class="space-y-2">
					<Label for="email">Email *</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="juan@example.com"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="password">Password *</Label>
					<Input
						id="password"
						type="password"
						bind:value={formData.password}
						placeholder="••••••••"
					/>
				</div>
				<div class="space-y-2">
					<Label for="department">Department</Label>
					<Input id="department" bind:value={formData.department} placeholder="DILG" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Role</Label>
					<Select.Root
						type="single"
						value={formData.role}
						onValueChange={(v) => handleRoleChange(v as UserRole)}
					>
						<Select.Trigger>
							{formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="superadmin">Superadmin</Select.Item>
							<Select.Item value="admin">Admin</Select.Item>
							<Select.Item value="viewer">Viewer</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center space-x-2 pt-6">
					<Checkbox id="is_active" bind:checked={formData.is_active} />
					<Label for="is_active">Active</Label>
				</div>
			</div>

			<!-- Permissions -->
			<div class="space-y-3">
				<Label class="text-base font-semibold">Permissions</Label>
				<div class="rounded-md border p-4">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Resource</Table.Head>
								<Table.Head class="text-center">Read</Table.Head>
								<Table.Head class="text-center">Write</Table.Head>
								<Table.Head class="text-center">Delete</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each Object.keys(formData.permissions) as resource}
								<Table.Row>
									<Table.Cell class="font-medium capitalize"
										>{resource.replace('_', ' ')}</Table.Cell
									>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].read}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'read')}
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].write}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'write')}
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].delete}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'delete')}
										/>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isCreateDialogOpen = false)}>Cancel</Button>
			<Button onclick={handleCreateUser}>Create User</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit User Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
	<Dialog.Content class="max-w-3xl!">
		<Dialog.Header>
			<Dialog.Title>Edit User</Dialog.Title>
			<Dialog.Description>Update user information and permissions</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-name">Full Name *</Label>
					<Input id="edit-name" bind:value={formData.name} />
				</div>
				<div class="space-y-2">
					<Label for="edit-email">Email *</Label>
					<Input id="edit-email" type="email" bind:value={formData.email} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-password">New Password (leave blank to keep current)</Label>
					<Input
						id="edit-password"
						type="password"
						bind:value={formData.password}
						placeholder="••••••••"
					/>
				</div>
				<div class="space-y-2">
					<Label for="edit-department">Department</Label>
					<Input id="edit-department" bind:value={formData.department} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Role</Label>
					<Select.Root
						type="single"
						value={formData.role}
						onValueChange={(v) => handleRoleChange(v as UserRole)}
					>
						<Select.Trigger>
							{formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="superadmin">Superadmin</Select.Item>
							<Select.Item value="admin">Admin</Select.Item>
							<Select.Item value="viewer">Viewer</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center space-x-2 pt-6">
					<Checkbox id="edit-is_active" bind:checked={formData.is_active} />
					<Label for="edit-is_active">Active</Label>
				</div>
			</div>

			<!-- Permissions -->
			<div class="space-y-3">
				<Label class="text-base font-semibold">Permissions</Label>
				<div class="rounded-md border p-4">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Resource</Table.Head>
								<Table.Head class="text-center">Read</Table.Head>
								<Table.Head class="text-center">Write</Table.Head>
								<Table.Head class="text-center">Delete</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each Object.keys(formData.permissions) as resource}
								<Table.Row>
									<Table.Cell class="font-medium capitalize"
										>{resource.replace('_', ' ')}</Table.Cell
									>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].read}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'read')}
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].write}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'write')}
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Checkbox
											checked={formData.permissions[resource as keyof UserPermissions].delete}
											onCheckedChange={() =>
												togglePermission(resource as keyof UserPermissions, 'delete')}
										/>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isEditDialogOpen = false)}>Cancel</Button>
			<Button onclick={handleUpdateUser}>Save Changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Deactivate User</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to deactivate "{selectedUser?.name}"? They will no longer be able to
				log in. This action can be undone by reactivating the user.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
				onclick={handleDeleteUser}
			>
				Deactivate
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
