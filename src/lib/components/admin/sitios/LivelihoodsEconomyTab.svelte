<script lang="ts">
  import { ComboboxMultiSelect } from '$lib/components/ui/combobox';
  import CurrencyInput from '$lib/components/ui/currency-input/currency-input.svelte';
  import FormSection from '$lib/components/ui/form-section/form-section.svelte';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import { Label } from '$lib/components/ui/label';
  import { NumberInput } from '$lib/components/ui/number-input';
  import { cn } from '$lib/utils';
  import { Briefcase, Coins, PawPrint, Wheat } from '@lucide/svelte';

  // Props matching SitioProfile Section H - Livelihood & Agriculture
  let {
    workerClass = $bindable({
      privateHousehold: 0,
      privateEstablishment: 0,
      government: 0,
      selfEmployed: 0,
      employer: 0,
      ofw: 0
    }),
    averageDailyIncome = $bindable(0),
    agriculture = $bindable({
      numberOfFarmers: 0,
      numberOfAssociations: 0,
      estimatedFarmAreaHectares: 0
    }),
    crops = $bindable<string[]>([]),
    livestock = $bindable<string[]>([])
  }: {
    workerClass: {
      privateHousehold: number;
      privateEstablishment: number;
      government: number;
      selfEmployed: number;
      employer: number;
      ofw: number;
    };
    averageDailyIncome: number;
    agriculture: {
      numberOfFarmers: number;
      numberOfAssociations: number;
      estimatedFarmAreaHectares: number;
    };
    crops: string[];
    livestock: string[];
  } = $props();

  // Computed totals
  const totalWorkers = $derived(
    workerClass.privateHousehold +
      workerClass.privateEstablishment +
      workerClass.government +
      workerClass.selfEmployed +
      workerClass.employer +
      workerClass.ofw
  );

  // Section completion checks
  const isEmploymentComplete = $derived(totalWorkers > 0);
  const isIncomeComplete = $derived(averageDailyIncome > 0);
  const isAgricultureComplete = $derived(
    agriculture.numberOfFarmers > 0 || crops.length > 0 || livestock.length > 0
  );

  const cropOptions = [
    'Rice',
    'Corn',
    'Coconut',
    'Banana',
    'Sugarcane',
    'Coffee',
    'Cacao',
    'Abaca',
    'Cassava',
    'Sweet Potato',
    'Mango',
    'Pineapple',
    'Rubber',
    'Oil Palm'
  ];

  const livestockPoultryOptions = [
    'Pigs',
    'Cows',
    'Carabaos',
    'Horses',
    'Goats',
    'Chickens',
    'Ducks'
  ];
</script>

<div class="space-y-6">
  <!-- Worker Class Section -->
  <FormSection
    title="Class of Workers"
    description="Number of workers by employment type"
    icon={Briefcase}
    variant="default"
    isComplete={isEmploymentComplete}
  >
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="space-y-2">
        <Label for="privateHousehold" class="flex items-center gap-1.5">
          Private Household
          <HelpTooltip content="e.g., domestic helper" />
        </Label>
        <NumberInput
          id="privateHousehold"
          bind:value={workerClass.privateHousehold}
          placeholder="0"
          min={0}
          class={cn(workerClass.privateHousehold > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="privateEstablishment" class="flex items-center gap-1.5">
          Private Establishment
          <HelpTooltip content="e.g., company employee" />
        </Label>
        <NumberInput
          id="privateEstablishment"
          bind:value={workerClass.privateEstablishment}
          placeholder="0"
          min={0}
          class={cn(workerClass.privateEstablishment > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="government" class="flex items-center gap-1.5">
          Government
          <HelpTooltip content="e.g., Barangay Tanod, Teacher" />
        </Label>
        <NumberInput
          id="government"
          bind:value={workerClass.government}
          placeholder="0"
          min={0}
          class={cn(workerClass.government > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="selfEmployed" class="flex items-center gap-1.5">
          Self-Employed
          <HelpTooltip content="e.g., Sari-sari store owner" />
        </Label>
        <NumberInput
          id="selfEmployed"
          bind:value={workerClass.selfEmployed}
          placeholder="0"
          min={0}
          class={cn(workerClass.selfEmployed > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="employer" class="flex items-center gap-1.5">
          Employer
          <HelpTooltip content="Own family-operated farm/business with employees" />
        </Label>
        <NumberInput
          id="employer"
          bind:value={workerClass.employer}
          placeholder="0"
          min={0}
          class={cn(workerClass.employer > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="ofw" class="flex items-center gap-1.5">
          OFW
          <HelpTooltip content="Overseas Filipino Workers" />
        </Label>
        <NumberInput
          id="ofw"
          bind:value={workerClass.ofw}
          placeholder="0"
          min={0}
          class={cn(workerClass.ofw > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
    </div>
    <!-- {#if totalWorkers > 0}
      <div class="mt-4 rounded-lg border bg-muted/30 px-3 py-2 text-center text-sm">
        <span class="text-muted-foreground">Total Workers: </span>
        <span class="font-semibold">{totalWorkers.toLocaleString()}</span>
      </div>
    {/if} -->
  </FormSection>

  <!-- Average Daily Income Section -->
  <FormSection
    title="Income"
    description="Average household income information"
    icon={Coins}
    variant="default"
    isComplete={isIncomeComplete}
  >
    <div class="max-w-sm space-y-2">
      <Label for="averageDailyIncome" class="flex items-center gap-1.5">
        Average Daily Income (₱)
        <HelpTooltip content="Average household income per day in Philippine Pesos" />
      </Label>
      <CurrencyInput
        id="averageDailyIncome"
        bind:value={averageDailyIncome}
        placeholder="0"
        min={0}
        class={cn(averageDailyIncome > 0 && 'border-primary/30 bg-primary/5')}
      />
    </div>
  </FormSection>

  <!-- Agriculture Section -->
  <FormSection
    title="Agriculture"
    description="Farming activities and crop production"
    icon={Wheat}
    variant="default"
    isComplete={isAgricultureComplete}
    defaultOpen={false}
  >
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="space-y-2">
        <Label for="numberOfFarmers">Number of Farmers</Label>
        <NumberInput
          id="numberOfFarmers"
          bind:value={agriculture.numberOfFarmers}
          placeholder="0"
          min={0}
          class={cn(agriculture.numberOfFarmers > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="numberOfAssociations">Farmer Associations</Label>
        <NumberInput
          id="numberOfAssociations"
          bind:value={agriculture.numberOfAssociations}
          placeholder="0"
          min={0}
          class={cn(agriculture.numberOfAssociations > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="estimatedFarmAreaHectares">Farm Area (hectares)</Label>
        <NumberInput
          id="estimatedFarmAreaHectares"
          bind:value={agriculture.estimatedFarmAreaHectares}
          placeholder="0"
          min={0}
          step={0.1}
          class={cn(agriculture.estimatedFarmAreaHectares > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
    </div>

    <div class="space-y-3">
      <Label class="flex items-center gap-1.5">
        Main Crops Produced
        <HelpTooltip
          content="Major crops grown in this sitio (e.g., Palay, Corn, Banana, Coconut)"
        />
      </Label>
      <ComboboxMultiSelect
        bind:values={crops}
        options={cropOptions}
        placeholder="Search crop..."
        addLabel="Add Crop"
        emptyMessage="No crops selected"
        allowCustom
        variant="list"
      />
    </div>
  </FormSection>

  <!-- Livestock & Poultry Section -->
  <FormSection
    title="Livestock & Poultry"
    description="Animals raised in the sitio"
    icon={PawPrint}
    variant="default"
    defaultOpen={false}
  >
    <div class="space-y-3">
      <Label class="flex items-center gap-1.5">
        Livestock/Poultry Types
        <HelpTooltip
          content="Types of livestock and poultry raised (e.g., Pig, Cow, Chicken, Duck)"
        />
      </Label>
      <ComboboxMultiSelect
        bind:values={livestock}
        options={livestockPoultryOptions}
        placeholder="Search livestock/poultry..."
        addLabel="Add Type"
        emptyMessage="No livestock/poultry selected"
        allowCustom
        variant="list"
      />
    </div>
  </FormSection>
</div>
