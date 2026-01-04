<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { ComboboxMultiSelect } from '$lib/components/ui/combobox';
  import CurrencyInput from '$lib/components/ui/currency-input/currency-input.svelte';
  import FormSection from '$lib/components/ui/form-section/form-section.svelte';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import { Label } from '$lib/components/ui/label';
  import { NumberInput } from '$lib/components/ui/number-input';
  import type { BackyardCropCategory } from '$lib/types/sitio-profile';
  import { cn } from '$lib/utils';
  import {
    AlertTriangle,
    Briefcase,
    Cat,
    Coins,
    Dog,
    PawPrint,
    Sprout,
    Wheat
  } from '@lucide/svelte';

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
    livestock = $bindable<string[]>([]),
    pets = $bindable({
      catsCount: 0,
      dogsCount: 0,
      vaccinatedCats: 0,
      vaccinatedDogs: 0
    }),
    backyardGardens = $bindable({
      householdsWithGardens: 0,
      commonCrops: [] as BackyardCropCategory[]
    }),
    totalHouseholds = 0
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
    pets: {
      catsCount: number;
      dogsCount: number;
      vaccinatedCats: number;
      vaccinatedDogs: number;
    };
    backyardGardens: {
      householdsWithGardens: number;
      commonCrops: BackyardCropCategory[];
    };
    totalHouseholds?: number;
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
  const isPetsComplete = $derived(pets.catsCount > 0 || pets.dogsCount > 0);
  const isBackyardGardensComplete = $derived(
    backyardGardens.householdsWithGardens > 0 || backyardGardens.commonCrops.length > 0
  );

  // Validation for vaccination counts
  const isCatVaccinationValid = $derived(pets.vaccinatedCats <= pets.catsCount);
  const isDogVaccinationValid = $derived(pets.vaccinatedDogs <= pets.dogsCount);

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

  const backyardCropOptions: BackyardCropCategory[] = ['Vegetables', 'Fruits', 'Root Crops'];
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

  <!-- Pets Section -->
  <FormSection
    title="Pets"
    description="Cats and dogs in the sitio with vaccination data"
    icon={Dog}
    variant="default"
    isComplete={isPetsComplete}
    defaultOpen={false}
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Cats -->
      <div class="space-y-4 rounded-lg border p-4">
        <div class="flex items-center gap-2 text-sm font-medium">
          <Cat class="size-4 text-orange-500" />
          <span>Cats</span>
        </div>
        <div class="space-y-2">
          <Label for="catsCount">Total Cats</Label>
          <NumberInput
            id="catsCount"
            bind:value={pets.catsCount}
            placeholder="0"
            min={0}
            class={cn(pets.catsCount > 0 && 'border-primary/30 bg-primary/5')}
          />
        </div>
        <div class="space-y-2">
          <Label for="vaccinatedCats" class="flex items-center gap-1.5">
            Vaccinated Cats
            <HelpTooltip
              content="Number of cats that have been vaccinated (should not exceed total cats)"
            />
          </Label>
          <NumberInput
            id="vaccinatedCats"
            bind:value={pets.vaccinatedCats}
            placeholder="0"
            min={0}
            max={pets.catsCount || undefined}
            class={cn(
              pets.vaccinatedCats > 0 && 'border-primary/30 bg-primary/5',
              !isCatVaccinationValid && 'border-destructive bg-destructive/5'
            )}
          />
          {#if !isCatVaccinationValid}
            <p class="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle class="size-3" />
              Vaccinated cats cannot exceed total cats
            </p>
          {/if}
        </div>
      </div>

      <!-- Dogs -->
      <div class="space-y-4 rounded-lg border p-4">
        <div class="flex items-center gap-2 text-sm font-medium">
          <Dog class="size-4 text-amber-600" />
          <span>Dogs</span>
        </div>
        <div class="space-y-2">
          <Label for="dogsCount">Total Dogs</Label>
          <NumberInput
            id="dogsCount"
            bind:value={pets.dogsCount}
            placeholder="0"
            min={0}
            class={cn(pets.dogsCount > 0 && 'border-primary/30 bg-primary/5')}
          />
        </div>
        <div class="space-y-2">
          <Label for="vaccinatedDogs" class="flex items-center gap-1.5">
            Vaccinated Dogs
            <HelpTooltip
              content="Number of dogs that have been vaccinated (should not exceed total dogs)"
            />
          </Label>
          <NumberInput
            id="vaccinatedDogs"
            bind:value={pets.vaccinatedDogs}
            placeholder="0"
            min={0}
            max={pets.dogsCount || undefined}
            class={cn(
              pets.vaccinatedDogs > 0 && 'border-primary/30 bg-primary/5',
              !isDogVaccinationValid && 'border-destructive bg-destructive/5'
            )}
          />
          {#if !isDogVaccinationValid}
            <p class="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle class="size-3" />
              Vaccinated dogs cannot exceed total dogs
            </p>
          {/if}
        </div>
      </div>
    </div>
  </FormSection>

  <!-- Backyard Gardens Section -->
  <FormSection
    title="Backyard Gardens"
    description="Household gardening activities"
    icon={Sprout}
    variant="default"
    isComplete={isBackyardGardensComplete}
    defaultOpen={false}
  >
    <div class="space-y-4">
      <div class="max-w-sm space-y-2">
        <Label for="householdsWithGardens" class="flex items-center gap-1.5">
          Households with Backyard Gardens
          <HelpTooltip
            content="Number of households that maintain backyard gardens for food production"
          />
        </Label>
        <NumberInput
          id="householdsWithGardens"
          bind:value={backyardGardens.householdsWithGardens}
          placeholder="0"
          min={0}
          max={totalHouseholds || undefined}
          class={cn(backyardGardens.householdsWithGardens > 0 && 'border-primary/30 bg-primary/5')}
        />
        {#if totalHouseholds > 0 && backyardGardens.householdsWithGardens > 0}
          <p class="text-xs text-muted-foreground">
            {Math.round((backyardGardens.householdsWithGardens / totalHouseholds) * 100)}% of
            households
          </p>
        {/if}
      </div>

      <div class="space-y-3">
        <Label class="flex items-center gap-1.5">
          Common Backyard Crops
          <HelpTooltip content="Select crop categories grown in household gardens" />
        </Label>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {#each backyardCropOptions as cropCategory}
            {@const cropId = cropCategory.toLowerCase().replace(/\s+/g, '-')}
            <Label
              for={cropId}
              class={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                backyardGardens.commonCrops.includes(cropCategory) &&
                  'border-primary/50 bg-primary/5'
              )}
            >
              <Checkbox
                id={cropId}
                checked={backyardGardens.commonCrops.includes(cropCategory)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    backyardGardens.commonCrops = [...backyardGardens.commonCrops, cropCategory];
                  } else {
                    backyardGardens.commonCrops = backyardGardens.commonCrops.filter(
                      (c) => c !== cropCategory
                    );
                  }
                }}
              />
              <span class="text-sm">{cropCategory}</span>
            </Label>
          {/each}
        </div>
      </div>
    </div>
  </FormSection>
</div>
