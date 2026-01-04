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
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import type {
    CustomFieldAggregationType,
    CustomFieldDataType,
    CustomFieldDefinition,
    CustomFieldFormData
  } from '$lib/types';
  import {
    AGGREGATION_TYPE_LABELS,
    DATA_TYPE_LABELS,
    DEFAULT_AGGREGATION_TYPE,
    DEFAULT_VALIDATION_RULES,
    generateFieldName,
    getApplicableAggregationTypes
  } from '$lib/types';
  import {
    archiveCustomFieldDefinition,
    createCustomFieldDefinition,
    getCustomFieldDefinitions,
    hasCustomFieldsOverride,
    reorderCustomFieldDefinitions,
    restoreCustomFieldDefinition,
    updateCustomFieldDefinition
  } from '$lib/utils/custom-fields-storage';
  import {
    Archive,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Edit,
    GripVertical,
    Layers,
    Plus,
    RotateCcw,
    RotateCw,
    Save,
    X
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let definitions = $state<CustomFieldDefinition[]>([]);
  let hasOverride = $state(false);
  let isResetDialogOpen = $state(false);
  let isEditDialogOpen = $state(false);
  let editingField = $state<CustomFieldDefinition | null>(null);
  let showArchived = $state(false);
  let newChoiceInput = $state('');

  // Form state
  let formData = $state<CustomFieldFormData>({
    fieldName: '',
    displayLabel: '',
    dataType: 'text',
    validationRules: { ...DEFAULT_VALIDATION_RULES.text },
    aggregationType: 'count',
    description: ''
  });

  const canManageConfig = $derived(authStore.isSuperadmin);
  const currentUserId = $derived(authStore.currentUser?.id?.toString() ?? 'unknown');

  const displayedDefinitions = $derived(
    showArchived ? definitions : definitions.filter((d) => d.isActive)
  );

  const activeCount = $derived(definitions.filter((d) => d.isActive).length);
  const archivedCount = $derived(definitions.filter((d) => !d.isActive).length);

  onMount(() => {
    loadDefinitions();
  });

  function loadDefinitions() {
    definitions = getCustomFieldDefinitions();
    hasOverride = hasCustomFieldsOverride();
  }

  function openNewFieldDialog() {
    editingField = null;
    formData = {
      fieldName: '',
      displayLabel: '',
      dataType: 'text',
      validationRules: { ...DEFAULT_VALIDATION_RULES.text },
      aggregationType: 'count',
      description: ''
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
      description: field.description ?? ''
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

    // Validate choices for checkbox and radio types
    if (
      (formData.dataType === 'checkbox' || formData.dataType === 'radio') &&
      (!formData.validationRules.choices || formData.validationRules.choices.length === 0)
    ) {
      toast.error('At least one choice is required for this field type');
      return;
    }

    // Generate field name if not provided
    const fieldName = formData.fieldName.trim() || generateFieldName(formData.displayLabel);
    const dataToSave = { ...formData, fieldName };

    if (editingField) {
      // Update existing
      const updated = updateCustomFieldDefinition(editingField.id, dataToSave, currentUserId);
      if (updated) {
        toast.success('Custom field updated successfully');
        loadDefinitions();
        isEditDialogOpen = false;
      } else {
        toast.error('Failed to update custom field');
      }
    } else {
      // Create new
      const created = createCustomFieldDefinition(dataToSave, currentUserId);
      if (created) {
        toast.success('Custom field created successfully');
        loadDefinitions();
        isEditDialogOpen = false;
      } else {
        toast.error('Failed to create custom field. A field with this name may already exist.');
      }
    }
  }

  function handleArchive(field: CustomFieldDefinition) {
    if (archiveCustomFieldDefinition(field.id, currentUserId)) {
      toast.success(`"${field.displayLabel}" has been archived`);
      loadDefinitions();
    } else {
      toast.error('Failed to archive field');
    }
  }

  function handleRestore(field: CustomFieldDefinition) {
    if (restoreCustomFieldDefinition(field.id, currentUserId)) {
      toast.success(`"${field.displayLabel}" has been restored`);
      loadDefinitions();
    } else {
      toast.error('Failed to restore field');
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const activeFields = definitions.filter((d) => d.isActive);
    const actualIndex = definitions.findIndex((d) => d.id === activeFields[index].id);
    const prevIndex = definitions.findIndex((d) => d.id === activeFields[index - 1].id);

    const newOrder = [...definitions];
    [newOrder[actualIndex], newOrder[prevIndex]] = [newOrder[prevIndex], newOrder[actualIndex]];

    const orderedIds = newOrder.filter((d) => d.isActive).map((d) => d.id);
    if (reorderCustomFieldDefinitions(orderedIds, currentUserId)) {
      loadDefinitions();
    }
  }

  function handleMoveDown(index: number) {
    const activeFields = definitions.filter((d) => d.isActive);
    if (index === activeFields.length - 1) return;
    const actualIndex = definitions.findIndex((d) => d.id === activeFields[index].id);
    const nextIndex = definitions.findIndex((d) => d.id === activeFields[index + 1].id);

    const newOrder = [...definitions];
    [newOrder[actualIndex], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[actualIndex]];

    const orderedIds = newOrder.filter((d) => d.isActive).map((d) => d.id);
    if (reorderCustomFieldDefinitions(orderedIds, currentUserId)) {
      loadDefinitions();
    }
  }

  function handleReset() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sccdp_config_custom_fields');
      loadDefinitions();
      toast.success('Custom fields configuration has been reset');
    }
    isResetDialogOpen = false;
  }

  const applicableAggregationTypes = $derived(getApplicableAggregationTypes(formData.dataType));
</script>

<svelte:head>
  <title>Custom Fields | Configuration</title>
</svelte:head>

<div class="flex flex-col">
  <AdminHeader
    title="Custom Fields"
    description="Define supplementary data fields for sitio profiles"
    breadcrumbs={[{ label: 'Configuration', href: '/admin/config' }, { label: 'Custom Fields' }]}
  >
    {#snippet actions()}
      <Button variant="ghost" size="sm" onclick={() => goto('/admin/config')}>
        <ArrowLeft class="size-4 sm:mr-2" />
        <span class="hidden sm:inline">Back</span>
      </Button>
      {#if hasOverride}
        <Button variant="outline" size="sm" onclick={() => (isResetDialogOpen = true)}>
          <RotateCcw class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">Reset</span>
        </Button>
      {/if}
      <Button size="sm" onclick={openNewFieldDialog} disabled={!canManageConfig}>
        <Plus class="size-4 sm:mr-2" />
        <span class="hidden sm:inline">Add Field</span>
      </Button>
    {/snippet}
    {#snippet badges()}
      {#if hasOverride}
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
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      <!-- Fields List -->
      <Card.Root>
        <Card.Header class="flex-row items-center justify-between space-y-0">
          <div>
            <Card.Title>Custom Field Definitions</Card.Title>
            <Card.Description>
              Fields that appear in the "Custom Fields" tab during sitio encoding and visualized in
              the "Supplementary" tab.
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
                Create custom fields to capture additional data specific to your monitoring needs.
                These will appear in the sitio encoding form.
              </p>
              <Button class="mt-6" onclick={openNewFieldDialog}>
                <Plus class="mr-2 size-4" />
                Create First Field
              </Button>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head class="w-10"></Table.Head>
                    <Table.Head>Label</Table.Head>
                    <Table.Head class="hidden sm:table-cell">Type</Table.Head>
                    <Table.Head class="hidden md:table-cell">Aggregation</Table.Head>
                    <Table.Head class="hidden lg:table-cell">Validation</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head class="text-right">Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each displayedDefinitions as field, index (field.id)}
                    <Table.Row class={!field.isActive ? 'opacity-60' : ''}>
                      <Table.Cell class="w-10">
                        {#if field.isActive}
                          <div class="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              class="size-6"
                              onclick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <ArrowUp class="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              class="size-6"
                              onclick={() => handleMoveDown(index)}
                              disabled={index === definitions.filter((d) => d.isActive).length - 1}
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
                          <span class="text-xs text-muted-foreground">{field.fieldName}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell class="hidden sm:table-cell">
                        <Badge variant="secondary">{DATA_TYPE_LABELS[field.dataType]}</Badge>
                      </Table.Cell>
                      <Table.Cell class="hidden md:table-cell">
                        <span class="text-sm text-muted-foreground">
                          {AGGREGATION_TYPE_LABELS[field.aggregationType]}
                        </span>
                      </Table.Cell>
                      <Table.Cell class="hidden lg:table-cell">
                        {#if field.validationRules.required}
                          <Badge variant="outline" class="text-orange-600 dark:text-orange-400"
                            >Required</Badge
                          >
                        {:else}
                          <span class="text-sm text-muted-foreground">Optional</span>
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
                              onclick={() => handleArchive(field)}
                            >
                              <Archive class="size-4" />
                            </Button>
                          {:else}
                            <Button variant="ghost" size="sm" onclick={() => handleRestore(field)}>
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

<ConfigResetDialog
  bind:open={isResetDialogOpen}
  sectionName="Custom Fields"
  onConfirm={handleReset}
  onCancel={() => (isResetDialogOpen = false)}
/>
