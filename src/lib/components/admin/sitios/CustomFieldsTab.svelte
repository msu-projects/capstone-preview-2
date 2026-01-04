<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { FormSection } from '$lib/components/ui/form-section';
  import { HelpTooltip } from '$lib/components/ui/help-tooltip';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { NumberInput } from '$lib/components/ui/number-input';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { Switch } from '$lib/components/ui/switch';
  import type { CustomFieldDefinition } from '$lib/types';
  import { DATA_TYPE_LABELS, validateCustomFieldValue } from '$lib/types';
  import { cn } from '$lib/utils';
  import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
  import {
    AlertCircle,
    Calendar,
    CheckSquare,
    Circle,
    Hash,
    Info,
    Layers,
    List,
    Plus,
    ToggleLeft,
    Type,
    X
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    customFields: Record<string, unknown>;
  }

  let { customFields = $bindable({}) }: Props = $props();

  let definitions = $state<CustomFieldDefinition[]>([]);
  let validationErrors = $state<Record<string, string>>({});
  let arrayInputs = $state<Record<string, string>>({});

  onMount(() => {
    definitions = getActiveCustomFieldDefinitions();
    // Initialize missing fields with defaults
    for (const def of definitions) {
      if (customFields[def.id] === undefined) {
        customFields[def.id] = getDefaultValue(def);
      }
    }
  });

  function getDefaultValue(def: CustomFieldDefinition): unknown {
    switch (def.dataType) {
      case 'text':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return '';
      case 'array':
        return [];
      case 'checkbox':
        return [];
      case 'radio':
        return '';
    }
  }

  function getIcon(dataType: CustomFieldDefinition['dataType']) {
    switch (dataType) {
      case 'text':
        return Type;
      case 'number':
        return Hash;
      case 'boolean':
        return ToggleLeft;
      case 'date':
        return Calendar;
      case 'array':
        return List;
      case 'checkbox':
        return CheckSquare;
      case 'radio':
        return Circle;
    }
  }

  function handleFieldChange(def: CustomFieldDefinition, value: unknown) {
    customFields[def.id] = value;

    // Validate
    const result = validateCustomFieldValue(value, def);
    if (!result.valid && result.error) {
      validationErrors[def.id] = result.error;
    } else {
      delete validationErrors[def.id];
      validationErrors = { ...validationErrors };
    }
  }

  function handleNumberChange(def: CustomFieldDefinition, value: number) {
    handleFieldChange(def, value);
  }

  function handleTextChange(def: CustomFieldDefinition, event: Event) {
    const target = event.target as HTMLInputElement;
    handleFieldChange(def, target.value);
  }

  function handleBooleanChange(def: CustomFieldDefinition, checked: boolean) {
    handleFieldChange(def, checked);
  }

  function handleDateChange(def: CustomFieldDefinition, event: Event) {
    const target = event.target as HTMLInputElement;
    handleFieldChange(def, target.value);
  }

  function handleArrayAdd(def: CustomFieldDefinition) {
    const input = arrayInputs[def.id]?.trim();
    if (!input) return;

    const currentValue = Array.isArray(customFields[def.id]) ? customFields[def.id] : [];
    const newArray = [...(currentValue as string[]), input];
    handleFieldChange(def, newArray);
    arrayInputs[def.id] = '';
  }

  function handleArrayRemove(def: CustomFieldDefinition, index: number) {
    const currentValue = Array.isArray(customFields[def.id]) ? customFields[def.id] : [];
    const newArray = (currentValue as string[]).filter((_, i) => i !== index);
    handleFieldChange(def, newArray);
  }

  function handleCheckboxChange(def: CustomFieldDefinition, choice: string, checked: boolean) {
    const currentValue = Array.isArray(customFields[def.id])
      ? (customFields[def.id] as string[])
      : [];
    let newValue: string[];
    if (checked) {
      newValue = [...currentValue, choice];
    } else {
      newValue = currentValue.filter((v) => v !== choice);
    }
    handleFieldChange(def, newValue);
  }

  function handleRadioChange(def: CustomFieldDefinition, value: string) {
    handleFieldChange(def, value);
  }

  const hasAnyFields = $derived(definitions.length > 0);
  const hasFilledFields = $derived(
    definitions.some((def) => {
      const value = customFields[def.id];
      if (value === undefined || value === null) return false;
      if (def.dataType === 'text' && value === '') return false;
      if (def.dataType === 'number' && value === 0) return false;
      if (def.dataType === 'boolean' && value === false) return false;
      if (def.dataType === 'date' && value === '') return false;
      if (def.dataType === 'array' && Array.isArray(value) && value.length === 0) return false;
      if (def.dataType === 'checkbox' && Array.isArray(value) && value.length === 0) return false;
      if (def.dataType === 'radio' && value === '') return false;
      return true;
    })
  );
</script>

<div class="space-y-6">
  {#if !hasAnyFields}
    <!-- Empty state when no custom fields are defined -->
    <div
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center"
    >
      <div
        class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Layers class="size-8" />
      </div>
      <h3 class="mt-4 text-lg font-medium">No Custom Fields Defined</h3>
      <p class="mt-2 max-w-sm text-sm text-muted-foreground">
        Custom fields can be configured by administrators to capture additional data specific to
        monitoring needs.
      </p>
      <p class="mt-4 text-xs text-muted-foreground">
        Go to Configuration → Custom Fields to add new fields.
      </p>
    </div>
  {:else}
    <FormSection
      title="Supplementary Data Fields"
      description="Additional data fields configured by administrators"
      icon={Layers}
      variant="purple"
      isComplete={hasFilledFields}
    >
      <div class="space-y-6">
        {#each definitions as def (def.id)}
          {@const Icon = getIcon(def.dataType)}
          {@const error = validationErrors[def.id]}
          {@const value = customFields[def.id]}

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Label for={def.id} class="flex items-center gap-2">
                <Icon class="size-4 text-muted-foreground" />
                {def.displayLabel}
                {#if def.validationRules.required}
                  <span class="text-destructive">*</span>
                {/if}
              </Label>
              {#if def.description}
                <HelpTooltip content={def.description} />
              {/if}
              <span
                class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {DATA_TYPE_LABELS[def.dataType]}
              </span>
            </div>

            {#if def.dataType === 'text'}
              <Input
                id={def.id}
                type="text"
                value={typeof value === 'string' ? value : ''}
                oninput={(e) => handleTextChange(def, e)}
                placeholder={`Enter ${def.displayLabel.toLowerCase()}...`}
                class={cn(error && 'border-destructive')}
                minlength={def.validationRules.minLength}
                maxlength={def.validationRules.maxLength}
              />
            {:else if def.dataType === 'number'}
              <NumberInput
                id={def.id}
                value={typeof value === 'number' ? value : 0}
                onvaluechange={(v) => handleNumberChange(def, v)}
                class={cn(error && 'border-destructive')}
                min={def.validationRules.min}
                max={def.validationRules.max}
              />
            {:else if def.dataType === 'boolean'}
              <div class="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <Switch
                  id={def.id}
                  checked={typeof value === 'boolean' ? value : false}
                  onCheckedChange={(checked) => handleBooleanChange(def, checked)}
                />
                <Label for={def.id} class="cursor-pointer text-sm">
                  {typeof value === 'boolean' && value ? 'Yes' : 'No'}
                </Label>
              </div>
            {:else if def.dataType === 'date'}
              <Input
                id={def.id}
                type="date"
                value={typeof value === 'string' ? value : ''}
                oninput={(e) => handleDateChange(def, e)}
                class={cn(error && 'border-destructive')}
              />
            {:else if def.dataType === 'array'}
              {@const arrayValue = Array.isArray(value) ? (value as string[]) : []}
              <div class="space-y-2">
                <div class="flex gap-2">
                  <Input
                    id={def.id}
                    type="text"
                    bind:value={arrayInputs[def.id]}
                    placeholder="Add item..."
                    class={cn(error && 'border-destructive')}
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleArrayAdd(def);
                      }
                    }}
                  />
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                    onclick={() => handleArrayAdd(def)}
                  >
                    <Plus class="size-4" />
                    Add
                  </button>
                </div>
                {#if arrayValue.length > 0}
                  <div class="flex flex-wrap gap-2">
                    {#each arrayValue as item, index (index)}
                      <Badge variant="secondary" class="gap-1 pr-1">
                        {item}
                        <button
                          type="button"
                          class="ml-1 rounded-full hover:bg-destructive/20"
                          onclick={() => handleArrayRemove(def, index)}
                        >
                          <X class="size-3" />
                        </button>
                      </Badge>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else if def.dataType === 'checkbox'}
              {@const checkboxValue = Array.isArray(value) ? (value as string[]) : []}
              <div class={cn('rounded-lg border bg-muted/30 p-3', error && 'border-destructive')}>
                {#if def.validationRules.choices && def.validationRules.choices.length > 0}
                  <div class="flex flex-wrap gap-3">
                    {#each def.validationRules.choices as choice (choice)}
                      <div class="flex items-center gap-2">
                        <Checkbox
                          id={`${def.id}-${choice}`}
                          checked={checkboxValue.includes(choice)}
                          onCheckedChange={(checked: boolean) =>
                            handleCheckboxChange(def, choice, checked)}
                        />
                        <Label for={`${def.id}-${choice}`} class="cursor-pointer text-sm">
                          {choice}
                        </Label>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-sm text-muted-foreground">No choices configured</p>
                {/if}
              </div>
            {:else if def.dataType === 'radio'}
              {@const radioValue = typeof value === 'string' ? value : ''}
              <div class={cn('rounded-lg border bg-muted/30 p-3', error && 'border-destructive')}>
                {#if def.validationRules.choices && def.validationRules.choices.length > 0}
                  <RadioGroup.Root
                    value={radioValue}
                    onValueChange={(v) => handleRadioChange(def, v)}
                  >
                    <div class="flex flex-wrap gap-3">
                      {#each def.validationRules.choices as choice (choice)}
                        <div class="flex items-center gap-2">
                          <RadioGroup.Item id={`${def.id}-${choice}`} value={choice} />
                          <Label for={`${def.id}-${choice}`} class="cursor-pointer text-sm">
                            {choice}
                          </Label>
                        </div>
                      {/each}
                    </div>
                  </RadioGroup.Root>
                {:else}
                  <p class="text-sm text-muted-foreground">No choices configured</p>
                {/if}
              </div>
            {/if}

            {#if error}
              <p class="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle class="size-3" />
                {error}
              </p>
            {/if}

            {#if def.dataType === 'number' && (def.validationRules.min !== undefined || def.validationRules.max !== undefined)}
              <p class="flex items-center gap-1 text-xs text-muted-foreground">
                <Info class="size-3" />
                {#if def.validationRules.min !== undefined && def.validationRules.max !== undefined}
                  Value must be between {def.validationRules.min} and {def.validationRules.max}
                {:else if def.validationRules.min !== undefined}
                  Minimum value: {def.validationRules.min}
                {:else if def.validationRules.max !== undefined}
                  Maximum value: {def.validationRules.max}
                {/if}
              </p>
            {/if}

            {#if def.dataType === 'text' && (def.validationRules.minLength || def.validationRules.maxLength)}
              <p class="flex items-center gap-1 text-xs text-muted-foreground">
                <Info class="size-3" />
                {#if def.validationRules.minLength && def.validationRules.maxLength}
                  {def.validationRules.minLength}-{def.validationRules.maxLength} characters
                {:else if def.validationRules.maxLength}
                  Maximum {def.validationRules.maxLength} characters
                {:else if def.validationRules.minLength}
                  Minimum {def.validationRules.minLength} characters
                {/if}
              </p>
            {/if}

            {#if def.dataType === 'array' && (def.validationRules.minLength || def.validationRules.maxLength)}
              <p class="flex items-center gap-1 text-xs text-muted-foreground">
                <Info class="size-3" />
                {#if def.validationRules.minLength && def.validationRules.maxLength}
                  {def.validationRules.minLength}-{def.validationRules.maxLength} items
                {:else if def.validationRules.maxLength}
                  Maximum {def.validationRules.maxLength} items
                {:else if def.validationRules.minLength}
                  Minimum {def.validationRules.minLength} items
                {/if}
              </p>
            {/if}
          </div>
        {/each}
      </div>
    </FormSection>

    <!-- Info about data persistence -->
    <div
      class="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50"
    >
      <Info class="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
      <div class="text-sm text-blue-800 dark:text-blue-200">
        <p class="font-medium">About Custom Fields</p>
        <p class="mt-1 text-blue-700 dark:text-blue-300">
          These fields are defined by administrators and may change over time. Data entered here
          will be preserved even if the field definition is later archived or modified.
        </p>
      </div>
    </div>
  {/if}
</div>
