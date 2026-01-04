<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import ConfigResetDialog from '$lib/components/admin/config/ConfigResetDialog.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import * as Table from '$lib/components/ui/table';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import type {
    CustomFieldAggregationType,
    CustomFieldDataType,
    CustomFieldDefinition,
    CustomFieldFormData,
    CustomFieldGroup,
    CustomFieldGroupFormData
  } from '$lib/types';
  import {
    AGGREGATION_TYPE_LABELS,
    DATA_TYPE_LABELS,
    DEFAULT_AGGREGATION_TYPE,
    DEFAULT_GROUP_VALUES,
    DEFAULT_VALIDATION_RULES,
    generateFieldName,
    getApplicableAggregationTypes,
    GROUP_ICON_OPTIONS
  } from '$lib/types';
  import {
    archiveCustomFieldDefinition,
    archiveCustomFieldGroup,
    createCustomFieldDefinition,
    createCustomFieldGroup,
    getCustomFieldDefinitions,
    getCustomFieldGroups,
    getFieldsByGroupId,
    hasCustomFieldGroupsOverride,
    hasCustomFieldsOverride,
    reorderCustomFieldDefinitions,
    reorderCustomFieldGroups,
    restoreCustomFieldDefinition,
    restoreCustomFieldGroup,
    updateCustomFieldDefinition,
    updateCustomFieldGroup
  } from '$lib/utils/custom-fields-storage';
  import type { Icon as IconType } from '@lucide/svelte';
  import {
    Activity,
    Archive,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Award,
    BookOpen,
    Briefcase,
    Building,
    ChevronDown,
    ChevronRight,
    Droplet,
    Edit,
    Folder,
    FolderPlus,
    GripVertical,
    Heart,
    Home,
    Layers,
    Leaf,
    Map as MapIcon,
    PieChart,
    Plus,
    RotateCcw,
    RotateCw,
    Save,
    Settings,
    Shield,
    Star,
    Target,
    Truck,
    Users,
    X,
    Zap
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // State
  let definitions = $state<CustomFieldDefinition[]>([]);
  let groups = $state<CustomFieldGroup[]>([]);
  let hasFieldsOverride = $state(false);
  let hasGroupsOverride = $state(false);
  let isResetDialogOpen = $state(false);
  let isEditDialogOpen = $state(false);
  let isGroupDialogOpen = $state(false);
  let editingField = $state<CustomFieldDefinition | null>(null);
  let editingGroup = $state<CustomFieldGroup | null>(null);
  let showArchived = $state(false);
  let showArchivedGroups = $state(false);
  let newChoiceInput = $state('');
  let activeTab = $state<'fields' | 'groups'>('fields');
  let collapsedGroups = $state<Set<string>>(new Set());

  // Form states
  let formData = $state<CustomFieldFormData>({
    fieldName: '',
    displayLabel: '',
    dataType: 'text',
    validationRules: { ...DEFAULT_VALIDATION_RULES.text },
    aggregationType: 'count',
    description: '',
    groupId: undefined
  });

  let groupFormData = $state<CustomFieldGroupFormData>({
    ...DEFAULT_GROUP_VALUES
  });

  const canManageConfig = $derived(authStore.isSuperadmin);
  const currentUserId = $derived(authStore.currentUser?.id?.toString() ?? 'unknown');

  const displayedDefinitions = $derived(
    showArchived ? definitions : definitions.filter((d) => d.isActive)
  );

  const displayedGroups = $derived(showArchivedGroups ? groups : groups.filter((g) => g.isActive));

  const activeCount = $derived(definitions.filter((d) => d.isActive).length);
  const archivedCount = $derived(definitions.filter((d) => !d.isActive).length);
  const activeGroupCount = $derived(groups.filter((g) => g.isActive).length);
  const archivedGroupCount = $derived(groups.filter((g) => !g.isActive).length);

  // Get active groups for field assignment dropdown
  const activeGroups = $derived(groups.filter((g) => g.isActive));

  // Get fields organized by group
  const fieldsByGroup = $derived(() => {
    const grouped = new Map<string | null, CustomFieldDefinition[]>();

    // Initialize with all active groups
    for (const group of activeGroups) {
      grouped.set(group.id, []);
    }
    grouped.set(null, []); // Uncategorized

    for (const field of displayedDefinitions) {
      const groupId = field.groupId ?? null;
      // If group doesn't exist (archived), put in uncategorized
      if (groupId && !activeGroups.some((g) => g.id === groupId)) {
        grouped.get(null)!.push(field);
      } else {
        if (!grouped.has(groupId)) {
          grouped.set(groupId, []);
        }
        grouped.get(groupId)!.push(field);
      }
    }

    // Sort fields within each group
    for (const [, fieldList] of grouped) {
      fieldList.sort((a: CustomFieldDefinition, b: CustomFieldDefinition) => {
        const orderA = a.groupDisplayOrder ?? a.displayOrder;
        const orderB = b.groupDisplayOrder ?? b.displayOrder;
        return orderA - orderB;
      });
    }

    return grouped;
  });

  onMount(() => {
    loadData();
  });

  function loadData() {
    definitions = getCustomFieldDefinitions();
    groups = getCustomFieldGroups();
    hasFieldsOverride = hasCustomFieldsOverride();
    hasGroupsOverride = hasCustomFieldGroupsOverride();
  }

  // ===== Field Management =====

  function openNewFieldDialog() {
    editingField = null;
    formData = {
      fieldName: '',
      displayLabel: '',
      dataType: 'text',
      validationRules: { ...DEFAULT_VALIDATION_RULES.text },
      aggregationType: 'count',
      description: '',
      groupId: undefined
    };
    newChoiceInput = '';
    isEditDialogOpen = true;
  }

  function openEditFieldDialog(field: CustomFieldDefinition) {
    editingField = field;
    formData = {
      fieldName: field.fieldName,
      displayLabel: field.displayLabel,
      dataType: field.dataType,
      validationRules: { ...field.validationRules },
      aggregationType: field.aggregationType,
      description: field.description ?? '',
      groupId: field.groupId
    };
    newChoiceInput = '';
    isEditDialogOpen = true;
  }

  function handleDataTypeChange(value: string) {
    if (!value) return;
    formData.dataType = value as CustomFieldDataType;
    formData.validationRules = { ...DEFAULT_VALIDATION_RULES[value as CustomFieldDataType] };
    formData.aggregationType = DEFAULT_AGGREGATION_TYPE[value as CustomFieldDataType];
    newChoiceInput = '';
  }

  function handleAggregationTypeChange(value: string) {
    if (!value) return;
    formData.aggregationType = value as CustomFieldAggregationType;
  }

  function handleGroupChange(value: string) {
    formData.groupId = value === '__none__' ? undefined : value;
  }

  function addChoice() {
    const trimmed = newChoiceInput.trim();
    if (!trimmed) return;

    if (!formData.validationRules.choices) {
      formData.validationRules.choices = [];
    }

    if (formData.validationRules.choices.includes(trimmed)) {
      toast.error('This choice already exists');
      return;
    }

    formData.validationRules.choices = [...formData.validationRules.choices, trimmed];
    newChoiceInput = '';
  }

  function removeChoice(choice: string) {
    if (!formData.validationRules.choices) return;
    formData.validationRules.choices = formData.validationRules.choices.filter((c) => c !== choice);
  }

  function handleSaveField() {
    if (!formData.displayLabel.trim()) {
      toast.error('Display label is required');
      return;
    }

    if (
      (formData.dataType === 'checkbox' || formData.dataType === 'radio') &&
      (!formData.validationRules.choices || formData.validationRules.choices.length === 0)
    ) {
      toast.error('At least one choice is required for this field type');
      return;
    }

    const fieldName = formData.fieldName.trim() || generateFieldName(formData.displayLabel);
    const dataToSave = { ...formData, fieldName };

    if (editingField) {
      const updated = updateCustomFieldDefinition(editingField.id, dataToSave, currentUserId);
      if (updated) {
        toast.success('Custom field updated successfully');
        loadData();
        isEditDialogOpen = false;
      } else {
        toast.error('Failed to update custom field');
      }
    } else {
      const created = createCustomFieldDefinition(dataToSave, currentUserId);
      if (created) {
        toast.success('Custom field created successfully');
        loadData();
        isEditDialogOpen = false;
      } else {
        toast.error('Failed to create custom field. A field with this name may already exist.');
      }
    }
  }

  function handleArchiveField(field: CustomFieldDefinition) {
    if (archiveCustomFieldDefinition(field.id, currentUserId)) {
      toast.success(`"${field.displayLabel}" has been archived`);
      loadData();
    } else {
      toast.error('Failed to archive field');
    }
  }

  function handleRestoreField(field: CustomFieldDefinition) {
    if (restoreCustomFieldDefinition(field.id, currentUserId)) {
      toast.success(`"${field.displayLabel}" has been restored`);
      loadData();
    } else {
      toast.error('Failed to restore field');
    }
  }

  function handleMoveFieldUp(groupId: string | null, index: number) {
    const fieldsInGroup = fieldsByGroup().get(groupId) ?? [];
    if (index === 0 || fieldsInGroup.length <= 1) return;

    const orderedIds = fieldsInGroup.map((f: CustomFieldDefinition) => f.id);
    [orderedIds[index - 1], orderedIds[index]] = [orderedIds[index], orderedIds[index - 1]];

    if (reorderCustomFieldDefinitions(orderedIds, currentUserId)) {
      loadData();
    }
  }

  function handleMoveFieldDown(groupId: string | null, index: number) {
    const fieldsInGroup = fieldsByGroup().get(groupId) ?? [];
    if (index >= fieldsInGroup.length - 1) return;

    const orderedIds = fieldsInGroup.map((f: CustomFieldDefinition) => f.id);
    [orderedIds[index], orderedIds[index + 1]] = [orderedIds[index + 1], orderedIds[index]];

    if (reorderCustomFieldDefinitions(orderedIds, currentUserId)) {
      loadData();
    }
  }

  // ===== Group Management =====

  function openNewGroupDialog() {
    editingGroup = null;
    groupFormData = { ...DEFAULT_GROUP_VALUES };
    isGroupDialogOpen = true;
  }

  function openEditGroupDialog(group: CustomFieldGroup) {
    editingGroup = group;
    groupFormData = {
      name: group.name,
      description: group.description ?? '',
      icon: group.icon ?? 'Folder',
      isCollapsible: group.isCollapsible
    };
    isGroupDialogOpen = true;
  }

  function handleSaveGroup() {
    if (!groupFormData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (editingGroup) {
      const updated = updateCustomFieldGroup(editingGroup.id, groupFormData, currentUserId);
      if (updated) {
        toast.success('Group updated successfully');
        loadData();
        isGroupDialogOpen = false;
      } else {
        toast.error('Failed to update group. A group with this name may already exist.');
      }
    } else {
      const created = createCustomFieldGroup(groupFormData, currentUserId);
      if (created) {
        toast.success('Group created successfully');
        loadData();
        isGroupDialogOpen = false;
      } else {
        toast.error('Failed to create group. A group with this name may already exist.');
      }
    }
  }

  function handleArchiveGroup(group: CustomFieldGroup) {
    if (archiveCustomFieldGroup(group.id, currentUserId)) {
      toast.success(`Group "${group.name}" has been archived. Fields moved to Uncategorized.`);
      loadData();
    } else {
      toast.error('Failed to archive group');
    }
  }

  function handleRestoreGroup(group: CustomFieldGroup) {
    if (restoreCustomFieldGroup(group.id, currentUserId)) {
      toast.success(`Group "${group.name}" has been restored`);
      loadData();
    } else {
      toast.error('Failed to restore group');
    }
  }

  function handleMoveGroupUp(index: number) {
    const activeGroupsList = groups.filter((g) => g.isActive);
    if (index === 0) return;

    const orderedIds = activeGroupsList.map((g) => g.id);
    [orderedIds[index - 1], orderedIds[index]] = [orderedIds[index], orderedIds[index - 1]];

    if (reorderCustomFieldGroups(orderedIds, currentUserId)) {
      loadData();
    }
  }

  function handleMoveGroupDown(index: number) {
    const activeGroupsList = groups.filter((g) => g.isActive);
    if (index >= activeGroupsList.length - 1) return;

    const orderedIds = activeGroupsList.map((g) => g.id);
    [orderedIds[index], orderedIds[index + 1]] = [orderedIds[index + 1], orderedIds[index]];

    if (reorderCustomFieldGroups(orderedIds, currentUserId)) {
      loadData();
    }
  }

  function toggleGroupCollapse(groupId: string) {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    collapsedGroups = newSet;
  }

  // ===== Reset =====

  function handleReset() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sccdp_config_custom_fields');
      localStorage.removeItem('sccdp_config_custom_field_groups');
      loadData();
      toast.success('Custom fields configuration has been reset');
    }
    isResetDialogOpen = false;
  }

  // ===== Helpers =====

  const applicableAggregationTypes = $derived(getApplicableAggregationTypes(formData.dataType));

  function getIconComponent(iconName: string | undefined): typeof IconType {
    const iconMap: Record<string, typeof IconType> = {
      Folder,
      Layers,
      Users,
      Building,
      Home,
      Briefcase,
      Heart,
      Shield,
      Leaf,
      Droplet,
      Zap,
      BookOpen,
      Truck,
      Map: MapIcon,
      Activity,
      PieChart,
      Settings,
      Star,
      Target,
      Award
    };
    return iconName && iconMap[iconName] ? iconMap[iconName] : Folder;
  }

  function getGroupName(groupId: string | null): string {
    if (!groupId) return 'Uncategorized';
    const group = groups.find((g) => g.id === groupId);
    return group?.name ?? 'Unknown Group';
  }
</script>

<svelte:head>
  <title>Custom Fields | Configuration</title>
</svelte:head>

<div class="flex flex-col">
  <AdminHeader
    title="Custom Fields"
    description="Define supplementary data fields and organize them into groups"
    breadcrumbs={[{ label: 'Configuration', href: '/admin/config' }, { label: 'Custom Fields' }]}
  >
    {#snippet actions()}
      <Button variant="ghost" size="sm" onclick={() => goto('/admin/config')}>
        <ArrowLeft class="size-4 sm:mr-2" />
        <span class="hidden sm:inline">Back</span>
      </Button>
      {#if hasFieldsOverride || hasGroupsOverride}
        <Button variant="outline" size="sm" onclick={() => (isResetDialogOpen = true)}>
          <RotateCcw class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">Reset</span>
        </Button>
      {/if}
    {/snippet}
    {#snippet badges()}
      {#if hasFieldsOverride || hasGroupsOverride}
        <Badge variant="outline" class="text-amber-600 dark:text-amber-400">Customized</Badge>
      {/if}
    {/snippet}
  </AdminHeader>

  <div class="flex flex-col gap-6 p-4 md:p-6">
    {#if !canManageConfig}
      <Card.Root>
        <Card.Content class="py-8 text-center">
          <p class="text-muted-foreground">
            You need superadmin privileges to manage configuration.
          </p>
        </Card.Content>
      </Card.Root>
    {:else}
      <!-- Stats Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card.Root>
          <Card.Content class="flex items-center gap-3 p-4">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <Layers class="size-5" />
            </div>
            <div>
              <p class="text-2xl font-bold">{activeCount}</p>
              <p class="text-sm text-muted-foreground">Active Fields</p>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="flex items-center gap-3 p-4">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
            >
              <Folder class="size-5" />
            </div>
            <div>
              <p class="text-2xl font-bold">{activeGroupCount}</p>
              <p class="text-sm text-muted-foreground">Active Groups</p>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="flex items-center gap-3 p-4">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <Archive class="size-5" />
            </div>
            <div>
              <p class="text-2xl font-bold">{archivedCount}</p>
              <p class="text-sm text-muted-foreground">Archived Fields</p>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="flex items-center gap-3 p-4">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <Archive class="size-5" />
            </div>
            <div>
              <p class="text-2xl font-bold">{archivedGroupCount}</p>
              <p class="text-sm text-muted-foreground">Archived Groups</p>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Tabs for Fields and Groups -->
      <Tabs.Root bind:value={activeTab}>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs.List>
            <Tabs.Trigger value="fields" class="gap-2">
              <Layers class="size-4" />
              Fields
              <Badge variant="secondary" class="ml-1">{activeCount}</Badge>
            </Tabs.Trigger>
            <Tabs.Trigger value="groups" class="gap-2">
              <Folder class="size-4" />
              Groups
              <Badge variant="secondary" class="ml-1">{activeGroupCount}</Badge>
            </Tabs.Trigger>
          </Tabs.List>

          <div class="flex gap-2">
            {#if activeTab === 'fields'}
              <Button size="sm" onclick={openNewFieldDialog}>
                <Plus class="size-4 sm:mr-2" />
                <span class="hidden sm:inline">Add Field</span>
              </Button>
            {:else}
              <Button size="sm" onclick={openNewGroupDialog}>
                <FolderPlus class="size-4 sm:mr-2" />
                <span class="hidden sm:inline">Add Group</span>
              </Button>
            {/if}
          </div>
        </div>

        <!-- Fields Tab Content -->
        <Tabs.Content value="fields" class="mt-4">
          <Card.Root>
            <Card.Header class="flex-row items-center justify-between space-y-0">
              <div>
                <Card.Title>Custom Field Definitions</Card.Title>
                <Card.Description>
                  Fields organized by groups. Fields appear in the "Supplementary" tab during sitio
                  encoding.
                </Card.Description>
              </div>
              {#if archivedCount > 0}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => (showArchived = !showArchived)}
                  class="shrink-0"
                >
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </Button>
              {/if}
            </Card.Header>
            <Card.Content>
              {#if displayedDefinitions.length === 0}
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Layers class="size-8" />
                  </div>
                  <h3 class="mt-4 text-lg font-medium">No custom fields defined</h3>
                  <p class="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create custom fields to capture additional data specific to your monitoring
                    needs.
                  </p>
                  <Button class="mt-6" onclick={openNewFieldDialog}>
                    <Plus class="mr-2 size-4" />
                    Create First Field
                  </Button>
                </div>
              {:else}
                <div class="space-y-4">
                  <!-- Grouped Fields Display -->
                  {#each [...activeGroups, { id: null, name: 'Uncategorized', icon: 'Folder', isActive: true }] as group (group.id ?? '__uncategorized__')}
                    {@const groupFields = fieldsByGroup().get(group.id ?? null) ?? []}
                    {@const IconComponent = getIconComponent(group.icon)}
                    {#if groupFields.length > 0 || group.id === null}
                      <div class="rounded-lg border">
                        <!-- Group Header -->
                        <button
                          type="button"
                          class="flex w-full items-center justify-between p-3 transition-colors hover:bg-muted/50"
                          onclick={() => group.id && toggleGroupCollapse(group.id)}
                        >
                          <div class="flex items-center gap-2">
                            {#if group.id}
                              {#if collapsedGroups.has(group.id)}
                                <ChevronRight class="size-4 text-muted-foreground" />
                              {:else}
                                <ChevronDown class="size-4 text-muted-foreground" />
                              {/if}
                            {:else}
                              <ChevronDown class="size-4 text-muted-foreground" />
                            {/if}
                            <IconComponent class="size-4 text-primary" />
                            <span class="font-medium">{group.name}</span>
                            <Badge variant="secondary" class="text-xs">
                              {groupFields.length} field{groupFields.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </button>

                        <!-- Fields in Group -->
                        {#if !group.id || !collapsedGroups.has(group.id)}
                          {#if groupFields.length > 0}
                            <div class="border-t">
                              <Table.Root>
                                <Table.Header>
                                  <Table.Row>
                                    <Table.Head class="w-10"></Table.Head>
                                    <Table.Head>Label</Table.Head>
                                    <Table.Head class="hidden sm:table-cell">Type</Table.Head>
                                    <Table.Head class="hidden md:table-cell">Aggregation</Table.Head
                                    >
                                    <Table.Head class="hidden lg:table-cell">Validation</Table.Head>
                                    <Table.Head>Status</Table.Head>
                                    <Table.Head class="text-right">Actions</Table.Head>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  {#each groupFields as field, index (field.id)}
                                    <Table.Row class={!field.isActive ? 'opacity-60' : ''}>
                                      <Table.Cell class="w-10">
                                        {#if field.isActive}
                                          <div class="flex flex-col gap-0.5">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              class="size-6"
                                              onclick={() =>
                                                handleMoveFieldUp(group.id ?? null, index)}
                                              disabled={index === 0}
                                            >
                                              <ArrowUp class="size-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              class="size-6"
                                              onclick={() =>
                                                handleMoveFieldDown(group.id ?? null, index)}
                                              disabled={index === groupFields.length - 1}
                                            >
                                              <ArrowDown class="size-3" />
                                            </Button>
                                          </div>
                                        {:else}
                                          <GripVertical class="size-4 text-muted-foreground/30" />
                                        {/if}
                                      </Table.Cell>
                                      <Table.Cell>
                                        <div class="flex flex-col">
                                          <span class="font-medium">{field.displayLabel}</span>
                                          <span class="text-xs text-muted-foreground"
                                            >{field.fieldName}</span
                                          >
                                        </div>
                                      </Table.Cell>
                                      <Table.Cell class="hidden sm:table-cell">
                                        <Badge variant="secondary"
                                          >{DATA_TYPE_LABELS[field.dataType]}</Badge
                                        >
                                      </Table.Cell>
                                      <Table.Cell class="hidden md:table-cell">
                                        <span class="text-sm text-muted-foreground">
                                          {AGGREGATION_TYPE_LABELS[field.aggregationType]}
                                        </span>
                                      </Table.Cell>
                                      <Table.Cell class="hidden lg:table-cell">
                                        {#if field.validationRules.required}
                                          <Badge
                                            variant="outline"
                                            class="text-orange-600 dark:text-orange-400"
                                          >
                                            Required
                                          </Badge>
                                        {:else}
                                          <span class="text-sm text-muted-foreground">Optional</span
                                          >
                                        {/if}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {#if field.isActive}
                                          <Badge
                                            variant="outline"
                                            class="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                          >
                                            Active
                                          </Badge>
                                        {:else}
                                          <Badge variant="secondary">Archived</Badge>
                                        {/if}
                                      </Table.Cell>
                                      <Table.Cell class="text-right">
                                        <div class="flex justify-end gap-1">
                                          {#if field.isActive}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              class="size-8"
                                              onclick={() => openEditFieldDialog(field)}
                                            >
                                              <Edit class="size-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              class="size-8 text-muted-foreground hover:text-destructive"
                                              onclick={() => handleArchiveField(field)}
                                            >
                                              <Archive class="size-4" />
                                            </Button>
                                          {:else}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onclick={() => handleRestoreField(field)}
                                            >
                                              <RotateCw class="mr-1 size-4" />
                                              Restore
                                            </Button>
                                          {/if}
                                        </div>
                                      </Table.Cell>
                                    </Table.Row>
                                  {/each}
                                </Table.Body>
                              </Table.Root>
                            </div>
                          {:else if group.id === null}
                            <div class="border-t p-4 text-center text-sm text-muted-foreground">
                              No uncategorized fields. All fields are assigned to groups.
                            </div>
                          {/if}
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

        <!-- Groups Tab Content -->
        <Tabs.Content value="groups" class="mt-4">
          <Card.Root>
            <Card.Header class="flex-row items-center justify-between space-y-0">
              <div>
                <Card.Title>Field Groups</Card.Title>
                <Card.Description>
                  Organize custom fields into logical groups for better presentation.
                </Card.Description>
              </div>
              {#if archivedGroupCount > 0}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => (showArchivedGroups = !showArchivedGroups)}
                  class="shrink-0"
                >
                  {showArchivedGroups ? 'Hide Archived' : 'Show Archived'}
                </Button>
              {/if}
            </Card.Header>
            <Card.Content>
              {#if displayedGroups.length === 0 && !showArchivedGroups}
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Folder class="size-8" />
                  </div>
                  <h3 class="mt-4 text-lg font-medium">No groups defined</h3>
                  <p class="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create groups to organize your custom fields into logical sections.
                  </p>
                  <Button class="mt-6" onclick={openNewGroupDialog}>
                    <FolderPlus class="mr-2 size-4" />
                    Create First Group
                  </Button>
                </div>
              {:else}
                <div class="overflow-x-auto">
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head class="w-10"></Table.Head>
                        <Table.Head>Name</Table.Head>
                        <Table.Head class="hidden sm:table-cell">Icon</Table.Head>
                        <Table.Head class="hidden md:table-cell">Fields</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head class="text-right">Actions</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {#each displayedGroups as group, index (group.id)}
                        {@const fieldCount = getFieldsByGroupId(group.id).length}
                        <Table.Row class={!group.isActive ? 'opacity-60' : ''}>
                          <Table.Cell class="w-10">
                            {#if group.isActive}
                              <div class="flex flex-col gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  class="size-6"
                                  onclick={() => handleMoveGroupUp(index)}
                                  disabled={index === 0}
                                >
                                  <ArrowUp class="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  class="size-6"
                                  onclick={() => handleMoveGroupDown(index)}
                                  disabled={index ===
                                    displayedGroups.filter((g) => g.isActive).length - 1}
                                >
                                  <ArrowDown class="size-3" />
                                </Button>
                              </div>
                            {:else}
                              <GripVertical class="size-4 text-muted-foreground/30" />
                            {/if}
                          </Table.Cell>
                          <Table.Cell>
                            <div class="flex flex-col">
                              <span class="font-medium">{group.name}</span>
                              {#if group.description}
                                <span class="text-xs text-muted-foreground"
                                  >{group.description}</span
                                >
                              {/if}
                            </div>
                          </Table.Cell>
                          <Table.Cell class="hidden sm:table-cell">
                            {@const IconComponent = getIconComponent(group.icon)}
                            <div class="flex items-center gap-2">
                              <IconComponent class="size-4 text-primary" />
                              <span class="text-sm text-muted-foreground">{group.icon}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell class="hidden md:table-cell">
                            <Badge variant="secondary"
                              >{fieldCount} field{fieldCount !== 1 ? 's' : ''}</Badge
                            >
                          </Table.Cell>
                          <Table.Cell>
                            {#if group.isActive}
                              <Badge
                                variant="outline"
                                class="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                              >
                                Active
                              </Badge>
                            {:else}
                              <Badge variant="secondary">Archived</Badge>
                            {/if}
                          </Table.Cell>
                          <Table.Cell class="text-right">
                            <div class="flex justify-end gap-1">
                              {#if group.isActive}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  class="size-8"
                                  onclick={() => openEditGroupDialog(group)}
                                >
                                  <Edit class="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  class="size-8 text-muted-foreground hover:text-destructive"
                                  onclick={() => handleArchiveGroup(group)}
                                >
                                  <Archive class="size-4" />
                                </Button>
                              {:else}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onclick={() => handleRestoreGroup(group)}
                                >
                                  <RotateCw class="mr-1 size-4" />
                                  Restore
                                </Button>
                              {/if}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      {/each}
                    </Table.Body>
                  </Table.Root>
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        </Tabs.Content>
      </Tabs.Root>
    {/if}
  </div>
</div>

<!-- Add/Edit Field Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</Dialog.Title>
      <Dialog.Description>
        {editingField
          ? 'Update the configuration for this custom field.'
          : 'Define a new custom field to capture additional sitio data.'}
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 py-4">
      <!-- Display Label -->
      <div class="grid gap-2">
        <Label for="displayLabel">Display Label *</Label>
        <Input
          id="displayLabel"
          bind:value={formData.displayLabel}
          placeholder="e.g., Solar Panel Count"
        />
        <p class="text-xs text-muted-foreground">The label shown to users in forms and reports.</p>
      </div>

      <!-- Field Name (auto-generated) -->
      <div class="grid gap-2">
        <Label for="fieldName">Field Name</Label>
        <Input
          id="fieldName"
          bind:value={formData.fieldName}
          placeholder={generateFieldName(formData.displayLabel) || 'Auto-generated from label'}
        />
        <p class="text-xs text-muted-foreground">
          Internal identifier (camelCase). Leave empty to auto-generate.
        </p>
      </div>

      <!-- Group Assignment -->
      <div class="grid gap-2">
        <Label for="groupId">Group</Label>
        <Select.Root
          type="single"
          value={formData.groupId ?? '__none__'}
          onValueChange={handleGroupChange}
        >
          <Select.Trigger id="groupId" class="w-full">
            {formData.groupId ? getGroupName(formData.groupId) : 'Uncategorized'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__none__">Uncategorized</Select.Item>
            {#each activeGroups as group (group.id)}
              <Select.Item value={group.id}>{group.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <p class="text-xs text-muted-foreground">
          Assign this field to a group for organized display.
        </p>
      </div>

      <!-- Data Type -->
      <div class="grid gap-2">
        <Label for="dataType">Data Type *</Label>
        <Select.Root type="single" value={formData.dataType} onValueChange={handleDataTypeChange}>
          <Select.Trigger id="dataType" class="w-full">
            {DATA_TYPE_LABELS[formData.dataType]}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(DATA_TYPE_LABELS) as [value, label]}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <p class="text-xs text-muted-foreground">
          Determines the input type and visualization options.
        </p>
      </div>

      <!-- Aggregation Type (for number fields) -->
      {#if applicableAggregationTypes.length > 1}
        <div class="grid gap-2">
          <Label for="aggregationType">Dashboard Aggregation</Label>
          <Select.Root
            type="single"
            value={formData.aggregationType}
            onValueChange={handleAggregationTypeChange}
          >
            <Select.Trigger id="aggregationType" class="w-full">
              {AGGREGATION_TYPE_LABELS[formData.aggregationType]}
            </Select.Trigger>
            <Select.Content>
              {#each applicableAggregationTypes as aggType}
                <Select.Item value={aggType}>{AGGREGATION_TYPE_LABELS[aggType]}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <p class="text-xs text-muted-foreground">
            How values are combined in dashboard visualizations.
          </p>
        </div>
      {/if}

      <!-- Required Toggle -->
      <div class="flex items-center justify-between rounded-lg border p-3">
        <div class="space-y-0.5">
          <Label for="required">Required Field</Label>
          <p class="text-xs text-muted-foreground">Users must fill this field before saving.</p>
        </div>
        <Switch id="required" bind:checked={formData.validationRules.required} />
      </div>

      <!-- Number-specific validation -->
      {#if formData.dataType === 'number'}
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="min">Minimum Value</Label>
            <Input
              id="min"
              type="number"
              bind:value={formData.validationRules.min}
              placeholder="No minimum"
            />
          </div>
          <div class="grid gap-2">
            <Label for="max">Maximum Value</Label>
            <Input
              id="max"
              type="number"
              bind:value={formData.validationRules.max}
              placeholder="No maximum"
            />
          </div>
        </div>
      {/if}

      <!-- Text-specific validation -->
      {#if formData.dataType === 'text'}
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="minLength">Min Length</Label>
            <Input
              id="minLength"
              type="number"
              bind:value={formData.validationRules.minLength}
              placeholder="0"
              min="0"
            />
          </div>
          <div class="grid gap-2">
            <Label for="maxLength">Max Length</Label>
            <Input
              id="maxLength"
              type="number"
              bind:value={formData.validationRules.maxLength}
              placeholder="500"
              min="1"
            />
          </div>
        </div>
      {/if}

      <!-- Array-specific validation -->
      {#if formData.dataType === 'array'}
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="arrayMinLength">Min Items</Label>
            <Input
              id="arrayMinLength"
              type="number"
              bind:value={formData.validationRules.minLength}
              placeholder="0"
              min="0"
            />
          </div>
          <div class="grid gap-2">
            <Label for="arrayMaxLength">Max Items</Label>
            <Input
              id="arrayMaxLength"
              type="number"
              bind:value={formData.validationRules.maxLength}
              placeholder="100"
              min="1"
            />
          </div>
        </div>
      {/if}

      <!-- Choices configuration for checkbox and radio types -->
      {#if formData.dataType === 'checkbox' || formData.dataType === 'radio'}
        <div class="grid gap-2">
          <Label>
            Choices *
            <span class="ml-1 text-xs font-normal text-muted-foreground">
              ({formData.dataType === 'checkbox'
                ? 'users can select multiple'
                : 'users select one'})
            </span>
          </Label>
          <div class="flex gap-2">
            <Input
              placeholder="Enter a choice..."
              bind:value={newChoiceInput}
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChoice();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onclick={addChoice}>
              <Plus class="mr-1 size-4" />
              Add
            </Button>
          </div>
          {#if formData.validationRules.choices && formData.validationRules.choices.length > 0}
            <div class="mt-2 flex flex-wrap gap-2">
              {#each formData.validationRules.choices as choice (choice)}
                <Badge variant="secondary" class="gap-1 pr-1">
                  {choice}
                  <button
                    type="button"
                    class="ml-1 rounded-full hover:bg-destructive/20"
                    onclick={() => removeChoice(choice)}
                  >
                    <X class="size-3" />
                  </button>
                </Badge>
              {/each}
            </div>
          {:else}
            <p class="text-xs text-muted-foreground">
              No choices added yet. Add at least one choice.
            </p>
          {/if}
        </div>
      {/if}

      <!-- Description -->
      <div class="grid gap-2">
        <Label for="description">Help Text (Optional)</Label>
        <Textarea
          id="description"
          bind:value={formData.description}
          placeholder="Additional instructions or context for this field..."
          rows={2}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isEditDialogOpen = false)}>Cancel</Button>
      <Button onclick={handleSaveField}>
        <Save class="mr-2 size-4" />
        {editingField ? 'Update Field' : 'Create Field'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Add/Edit Group Dialog -->
<Dialog.Root bind:open={isGroupDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{editingGroup ? 'Edit Group' : 'Add Group'}</Dialog.Title>
      <Dialog.Description>
        {editingGroup
          ? 'Update the group settings.'
          : 'Create a new group to organize custom fields.'}
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 py-4">
      <!-- Group Name -->
      <div class="grid gap-2">
        <Label for="groupName">Group Name *</Label>
        <Input id="groupName" bind:value={groupFormData.name} placeholder="e.g., Health & Safety" />
      </div>

      <!-- Icon -->
      <div class="grid gap-2">
        <Label for="groupIcon">Icon</Label>
        <Select.Root
          type="single"
          value={groupFormData.icon}
          onValueChange={(v) => (groupFormData.icon = v)}
        >
          <Select.Trigger id="groupIcon" class="w-full">
            {#each [getIconComponent(groupFormData.icon)] as IconComponent}
              <div class="flex items-center gap-2">
                <IconComponent class="size-4" />
                <span>{groupFormData.icon}</span>
              </div>
            {/each}
          </Select.Trigger>
          <Select.Content class="max-h-60">
            {#each GROUP_ICON_OPTIONS as iconName}
              {@const IconComponent = getIconComponent(iconName)}
              <Select.Item value={iconName}>
                <div class="flex items-center gap-2">
                  <IconComponent class="size-4" />
                  <span>{iconName}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Description -->
      <div class="grid gap-2">
        <Label for="groupDescription">Description (Optional)</Label>
        <Textarea
          id="groupDescription"
          bind:value={groupFormData.description}
          placeholder="Brief description of what fields belong in this group..."
          rows={2}
        />
      </div>

      <!-- Collapsible Toggle -->
      <div class="flex items-center justify-between rounded-lg border p-3">
        <div class="space-y-0.5">
          <Label for="isCollapsible">Collapsible</Label>
          <p class="text-xs text-muted-foreground">Allow users to collapse this group in views.</p>
        </div>
        <Switch id="isCollapsible" bind:checked={groupFormData.isCollapsible} />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isGroupDialogOpen = false)}>Cancel</Button>
      <Button onclick={handleSaveGroup}>
        <Save class="mr-2 size-4" />
        {editingGroup ? 'Update Group' : 'Create Group'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<ConfigResetDialog
  bind:open={isResetDialogOpen}
  sectionName="Custom Fields"
  onConfirm={handleReset}
  onCancel={() => (isResetDialogOpen = false)}
/>
