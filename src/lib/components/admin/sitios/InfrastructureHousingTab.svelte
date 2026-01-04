<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import FormSection from '$lib/components/ui/form-section/form-section.svelte';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import { Label } from '$lib/components/ui/label';
  import { NumberInput } from '$lib/components/ui/number-input';
  import * as Select from '$lib/components/ui/select';
  import { cn } from '$lib/utils';
  import { Building, Droplets, Radio, Route, Wifi, Zap } from '@lucide/svelte';

  // Helper types for facilities and infrastructure
  type FacilityDetails = {
    exists: 'yes' | 'no';
    count?: number;
    distanceToNearest?: number;
    condition?: 1 | 2 | 3 | 4 | 5;
  };

  type RoadDetails = {
    exists: 'yes' | 'no';
    length?: number;
    condition?: 1 | 2 | 3 | 4 | 5;
  };

  type WaterSourceStatus = {
    exists: 'yes' | 'no';
    functioningCount?: number;
    notFunctioningCount?: number;
  };

  // Props matching SitioProfile Sections C, D, E, F, G
  let {
    // Section C - Basic Utilities & Connectivity
    householdsWithToilet = $bindable(0),
    householdsWithElectricity = $bindable(0),
    electricitySources = $bindable({
      grid: 0,
      solar: 0,
      battery: 0,
      generator: 0
    }),
    mobileSignal = $bindable<'none' | '2g' | '3g' | '4g' | '5g'>('none'),
    householdsWithInternet = $bindable(0),

    // Section D - Community Facilities
    facilities = $bindable<{
      healthCenter: FacilityDetails;
      pharmacy: FacilityDetails;
      communityToilet: FacilityDetails;
      kindergarten: FacilityDetails;
      elementarySchool: FacilityDetails;
      highSchool: FacilityDetails;
      madrasah: FacilityDetails;
      market: FacilityDetails;
    }>({
      healthCenter: { exists: 'no' },
      pharmacy: { exists: 'no' },
      communityToilet: { exists: 'no' },
      kindergarten: { exists: 'no' },
      elementarySchool: { exists: 'no' },
      highSchool: { exists: 'no' },
      madrasah: { exists: 'no' },
      market: { exists: 'no' }
    }),

    // Section E - Roads & Internal Infrastructure
    infrastructure = $bindable<{
      asphalt: RoadDetails;
      concrete: RoadDetails;
      gravel: RoadDetails;
      natural: RoadDetails;
    }>({
      asphalt: { exists: 'no' },
      concrete: { exists: 'no' },
      gravel: { exists: 'no' },
      natural: { exists: 'no' }
    }),

    // Section F - Education Status
    studentsPerRoom = $bindable<
      'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom'
    >('less_than_46'),

    // Section G - Water & Sanitation
    waterSources = $bindable<{
      natural: WaterSourceStatus;
      level1: WaterSourceStatus;
      level2: WaterSourceStatus;
      level3: WaterSourceStatus;
    }>({
      natural: { exists: 'no' },
      level1: { exists: 'no' },
      level2: { exists: 'no' },
      level3: { exists: 'no' }
    }),
    sanitationTypes = $bindable({
      waterSealed: false,
      pitLatrine: false,
      communityCR: false,
      openDefecation: false
    })
  }: {
    householdsWithToilet: number;
    householdsWithElectricity: number;
    electricitySources: {
      grid: number;
      solar: number;
      battery: number;
      generator: number;
    };
    mobileSignal: 'none' | '2g' | '3g' | '4g' | '5g';
    householdsWithInternet: number;
    facilities: {
      healthCenter: FacilityDetails;
      pharmacy: FacilityDetails;
      communityToilet: FacilityDetails;
      kindergarten: FacilityDetails;
      elementarySchool: FacilityDetails;
      highSchool: FacilityDetails;
      madrasah: FacilityDetails;
      market: FacilityDetails;
    };
    infrastructure: {
      asphalt: RoadDetails;
      concrete: RoadDetails;
      gravel: RoadDetails;
      natural: RoadDetails;
    };
    studentsPerRoom: 'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom';
    waterSources: {
      natural: WaterSourceStatus;
      level1: WaterSourceStatus;
      level2: WaterSourceStatus;
      level3: WaterSourceStatus;
    };
    sanitationTypes: {
      waterSealed: boolean;
      pitLatrine: boolean;
      communityCR: boolean;
      openDefecation: boolean;
    };
  } = $props();

  // Section completion checks
  const isUtilitiesComplete = $derived(householdsWithElectricity > 0 || householdsWithToilet > 0);
  const isConnectivityComplete = $derived(mobileSignal !== 'none' || householdsWithInternet > 0);
  const hasWaterSources = $derived(
    waterSources.natural.exists === 'yes' ||
      waterSources.level1.exists === 'yes' ||
      waterSources.level2.exists === 'yes' ||
      waterSources.level3.exists === 'yes'
  );
  const hasSanitation = $derived(
    sanitationTypes.waterSealed ||
      sanitationTypes.pitLatrine ||
      sanitationTypes.communityCR ||
      sanitationTypes.openDefecation
  );

  // Facility labels for display
  const facilityLabels: Record<keyof typeof facilities, string> = {
    healthCenter: 'Health Center',
    pharmacy: 'Pharmacy',
    communityToilet: 'Community Toilet',
    kindergarten: 'Kindergarten',
    elementarySchool: 'Elementary School',
    highSchool: 'High School',
    madrasah: 'Madrasah',
    market: 'Market'
  };

  // Road type labels
  const roadLabels: Record<keyof typeof infrastructure, string> = {
    asphalt: 'Asphalt',
    concrete: 'Concrete',
    gravel: 'Gravel',
    natural: 'Natural (Earth Surface)'
  };

  // Water source labels
  const waterSourceLabels: Record<keyof typeof waterSources, { name: string; desc: string }> = {
    natural: { name: 'Natural', desc: 'Spring/River/Well' },
    level1: { name: 'Level 1', desc: 'Point source/Hand pump' },
    level2: { name: 'Level 2', desc: 'Communal faucet' },
    level3: { name: 'Level 3', desc: 'House connection' }
  };

  const conditionLabels = ['', 'Bad', 'Poor', 'Fair', 'Good', 'Excellent'];
</script>

<div class="space-y-6">
  <!-- Basic Utilities Section -->
  <FormSection
    title="Basic Utilities"
    description="Toilet and electricity access"
    icon={Zap}
    variant="warning"
    isComplete={isUtilitiesComplete}
  >
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label for="householdsWithToilet" class="flex items-center gap-1.5">
          Households with Toilet
          <HelpTooltip content="Number of households with toilet facilities" />
        </Label>
        <NumberInput
          id="householdsWithToilet"
          bind:value={householdsWithToilet}
          placeholder="0"
          min={0}
          class={cn(householdsWithToilet > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
      <div class="space-y-2">
        <Label for="householdsWithElectricity" class="flex items-center gap-1.5">
          Households with Electricity
          <HelpTooltip content="Total households with electricity access" />
        </Label>
        <NumberInput
          id="householdsWithElectricity"
          bind:value={householdsWithElectricity}
          placeholder="0"
          min={0}
          class={cn(householdsWithElectricity > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
    </div>

    <!-- Electricity Sources Breakdown -->
    <div class="mt-4 space-y-3">
      <Label class="text-sm font-medium">
        Electricity Sources
        <HelpTooltip content="Households with this type of source" />
      </Label>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="space-y-1.5">
          <Label for="elecGrid" class="text-xs text-muted-foreground">Grid</Label>
          <NumberInput id="elecGrid" bind:value={electricitySources.grid} placeholder="0" min={0} />
        </div>
        <div class="space-y-1.5">
          <Label for="elecSolar" class="text-xs text-muted-foreground">Solar</Label>
          <NumberInput
            id="elecSolar"
            bind:value={electricitySources.solar}
            placeholder="0"
            min={0}
          />
        </div>
        <div class="space-y-1.5">
          <Label for="elecBattery" class="text-xs text-muted-foreground">Battery</Label>
          <NumberInput
            id="elecBattery"
            bind:value={electricitySources.battery}
            placeholder="0"
            min={0}
          />
        </div>
        <div class="space-y-1.5">
          <Label for="elecGenerator" class="text-xs text-muted-foreground">Generator</Label>
          <NumberInput
            id="elecGenerator"
            bind:value={electricitySources.generator}
            placeholder="0"
            min={0}
          />
        </div>
      </div>
    </div>
  </FormSection>

  <!-- Connectivity Section -->
  <FormSection
    title="Connectivity"
    description="Mobile signal and internet access"
    icon={Wifi}
    variant="info"
    isComplete={isConnectivityComplete}
  >
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label class="flex items-center gap-1.5">
          <Radio class="size-4" />
          Mobile Signal
          <HelpTooltip content="Best available mobile signal in the area" />
        </Label>
        <Select.Root
          type="single"
          value={mobileSignal}
          onValueChange={(v) => {
            if (v) mobileSignal = v as typeof mobileSignal;
          }}
        >
          <Select.Trigger
            class={cn('w-full', mobileSignal !== 'none' && 'border-primary/30 bg-primary/5')}
          >
            {mobileSignal === 'none' ? 'None' : mobileSignal.toUpperCase()}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="none">None</Select.Item>
            <Select.Item value="2g">2G</Select.Item>
            <Select.Item value="3g">3G</Select.Item>
            <Select.Item value="4g">4G</Select.Item>
            <Select.Item value="5g">5G</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-2">
        <Label for="householdsWithInternet" class="flex items-center gap-1.5">
          Households with Internet
          <HelpTooltip content="Number of households with internet connectivity" />
        </Label>
        <NumberInput
          id="householdsWithInternet"
          bind:value={householdsWithInternet}
          placeholder="0"
          min={0}
          class={cn(householdsWithInternet > 0 && 'border-primary/30 bg-primary/5')}
        />
      </div>
    </div>
  </FormSection>

  <!-- Water Sources Section -->
  <FormSection
    title="Water Sources"
    description="Status of water sources by type"
    icon={Droplets}
    variant="info"
    isComplete={hasWaterSources}
    defaultOpen={false}
  >
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/30">
            <th class="px-3 py-2 text-left font-medium">Source Type</th>
            <th class="w-24 px-3 py-2 text-center font-medium">Exists</th>
            <th class="w-28 px-3 py-2 text-center font-medium">Functioning</th>
            <th class="w-28 px-3 py-2 text-center font-medium">Not Functioning</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(waterSources) as [key, source]}
            {@const k = key as keyof typeof waterSources}
            <tr class="border-b last:border-0">
              <td class="px-3 py-2">
                <div>
                  <p class="font-medium">{waterSourceLabels[k].name}</p>
                  <p class="text-xs text-muted-foreground">{waterSourceLabels[k].desc}</p>
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <Select.Root
                  type="single"
                  value={source.exists}
                  onValueChange={(v) => {
                    if (v) waterSources[k] = { ...waterSources[k], exists: v as 'yes' | 'no' };
                  }}
                >
                  <Select.Trigger class="h-8 w-20">
                    {source.exists === 'yes' ? 'Yes' : 'No'}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="yes">Yes</Select.Item>
                    <Select.Item value="no">No</Select.Item>
                  </Select.Content>
                </Select.Root>
              </td>
              <td class="px-3 py-2">
                {#if source.exists === 'yes'}
                  <NumberInput
                    value={waterSources[k].functioningCount ?? 0}
                    onvaluechange={(v) => {
                      waterSources[k] = { ...waterSources[k], functioningCount: v };
                    }}
                    placeholder="0"
                    min={0}
                    class="h-8 text-center"
                  />
                {:else}
                  <span class="text-muted-foreground">-</span>
                {/if}
              </td>
              <td class="px-3 py-2">
                {#if source.exists === 'yes'}
                  <NumberInput
                    value={waterSources[k].notFunctioningCount ?? 0}
                    onvaluechange={(v) => {
                      waterSources[k] = { ...waterSources[k], notFunctioningCount: v };
                    }}
                    placeholder="0"
                    min={0}
                    class="h-8 text-center"
                  />
                {:else}
                  <span class="text-muted-foreground">-</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </FormSection>

  <!-- Sanitation Section -->
  <FormSection
    title="Sanitation Types"
    description="Sanitation used by majority of households"
    icon={Droplets}
    variant="default"
    isComplete={hasSanitation}
    defaultOpen={false}
  >
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Label
        for="waterSealed"
        class={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50',
          sanitationTypes.waterSealed && 'border-primary/50 bg-primary/5'
        )}
      >
        <Checkbox
          id="waterSealed"
          checked={sanitationTypes.waterSealed}
          onCheckedChange={(checked) =>
            (sanitationTypes = { ...sanitationTypes, waterSealed: !!checked })}
        />
        <span class="text-sm">Water Sealed</span>
      </Label>
      <Label
        for="pitLatrine"
        class={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50',
          sanitationTypes.pitLatrine && 'border-primary/50 bg-primary/5'
        )}
      >
        <Checkbox
          id="pitLatrine"
          checked={sanitationTypes.pitLatrine}
          onCheckedChange={(checked) =>
            (sanitationTypes = { ...sanitationTypes, pitLatrine: !!checked })}
        />
        <span class="text-sm">Pit Latrine</span>
      </Label>
      <Label
        for="communityCR"
        class={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50',
          sanitationTypes.communityCR && 'border-primary/50 bg-primary/5'
        )}
      >
        <Checkbox
          id="communityCR"
          checked={sanitationTypes.communityCR}
          onCheckedChange={(checked) =>
            (sanitationTypes = { ...sanitationTypes, communityCR: !!checked })}
        />
        <span class="text-sm">Community CR</span>
      </Label>
      <Label
        for="openDefecation"
        class={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50',
          sanitationTypes.openDefecation && 'border-primary/50 bg-primary/5'
        )}
      >
        <Checkbox
          id="openDefecation"
          checked={sanitationTypes.openDefecation}
          onCheckedChange={(checked) =>
            (sanitationTypes = { ...sanitationTypes, openDefecation: !!checked })}
        />
        <span class="text-sm">Open Defecation</span>
      </Label>
    </div>
  </FormSection>

  <!-- Community Facilities Section -->
  <FormSection
    title="Community Facilities"
    description="Inventory and condition of community facilities"
    icon={Building}
    variant="success"
    defaultOpen={false}
  >
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/30">
            <th class="px-3 py-2 text-left font-medium">Facility</th>
            <th class="w-24 px-3 py-2 text-center font-medium">
              <div class="flex items-center gap-2">
                <span>Exists</span>
                <HelpTooltip content="If this facility exists in the sitio." />
              </div>
            </th>
            <th class="w-24 px-3 py-2 text-center font-medium">Count</th>
            <th class="w-40 px-3 py-2 text-center font-medium">
              <div class="flex items-center gap-2">
                <span>Distance (km)</span>
                <HelpTooltip content="Distance to the nearest facility outside the sitio." />
              </div>
            </th>
            <th class="w-28 px-3 py-2 text-center font-medium">
              <div class="flex items-center justify-center gap-1.5">
                Condition
                <HelpTooltip>
                  5 - Excellent: In optimal condition; newly built, renovated, or exceeds standard
                  requirements.
                  <br />
                  4 - Good: Fully functional and well-maintained; requires only routine maintenance.
                  <br />
                  3 - Average: Functional with minor defects; needs minor repairs and preventive maintenance.
                  <br />
                  2 - Poor: Functional but with significant wear; requires major repairs soon to prevent
                  failure.
                  <br />
                  1 - Bad: Severely damaged, unsafe, or non-functional; requires immediate major intervention.
                </HelpTooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(facilities) as [key, facility]}
            {@const k = key as keyof typeof facilities}
            <tr class="border-b last:border-0">
              <td class="px-3 py-2 font-medium">{facilityLabels[k]}</td>
              <td class="px-3 py-2 text-center">
                <Select.Root
                  type="single"
                  value={facility.exists}
                  onValueChange={(v) => {
                    if (v) facilities[k] = { ...facilities[k], exists: v as 'yes' | 'no' };
                  }}
                >
                  <Select.Trigger class="h-8 w-20">
                    {facility.exists === 'yes' ? 'Yes' : 'No'}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="yes">Yes</Select.Item>
                    <Select.Item value="no">No</Select.Item>
                  </Select.Content>
                </Select.Root>
              </td>
              <td class="px-3 py-2">
                {#if facility.exists === 'yes'}
                  <NumberInput
                    value={facilities[k].count ?? 0}
                    onvaluechange={(v) => {
                      facilities[k] = { ...facilities[k], count: v };
                    }}
                    placeholder="0"
                    min={0}
                    class="h-8 text-center"
                  />
                {:else}
                  <span class="text-center text-muted-foreground">-</span>
                {/if}
              </td>
              <td class="px-3 py-2">
                {#if facility.exists === 'no'}
                  <NumberInput
                    value={facilities[k].distanceToNearest ?? 0}
                    onvaluechange={(v) => {
                      facilities[k] = { ...facilities[k], distanceToNearest: v };
                    }}
                    placeholder="0"
                    min={0}
                    step={0.1}
                    class="h-8 text-center"
                  />
                {:else}
                  <span class="text-center text-muted-foreground">-</span>
                {/if}
              </td>
              <td class="px-3 py-2">
                {#if facility.exists === 'yes'}
                  <Select.Root
                    type="single"
                    value={facility.condition?.toString()}
                    onValueChange={(v) => {
                      if (v)
                        facilities[k] = {
                          ...facilities[k],
                          condition: parseInt(v) as 1 | 2 | 3 | 4 | 5
                        };
                    }}
                  >
                    <Select.Trigger class="h-8 w-24">
                      {facility.condition ? conditionLabels[facility.condition] : 'Select'}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="1">Bad</Select.Item>
                      <Select.Item value="2">Poor</Select.Item>
                      <Select.Item value="3">Fair</Select.Item>
                      <Select.Item value="4">Good</Select.Item>
                      <Select.Item value="5">Excellent</Select.Item>
                    </Select.Content>
                  </Select.Root>
                {:else}
                  <span class="text-center text-muted-foreground">-</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </FormSection>

  <!-- Roads & Infrastructure Section -->
  <FormSection
    title="Roads & Infrastructure"
    description="Inventory of road types and conditions"
    icon={Route}
    variant="default"
    defaultOpen={false}
  >
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/30">
            <th class="px-3 py-2 text-left font-medium">Road Type</th>
            <th class="w-24 px-3 py-2 text-center font-medium">Exists</th>
            <th class="w-28 px-3 py-2 text-center font-medium">Length (km)</th>
            <th class="w-28 px-3 py-2 text-center font-medium">
              <div class="flex items-center justify-center gap-1.5">
                Condition
                <HelpTooltip>
                  5 - Excellent: Optimal condition; new or like-new surface.
                  <br />
                  4 - Good: Smooth ride; sound structure with minimal wear.
                  <br />
                  3 - Average: Functional but bumpy; minor cracks and wear.
                  <br />
                  2 - Poor: Rough ride; significant potholes and cracking.
                  <br />
                  1 - Bad: Unsafe or impassable; severe damage like deep potholes or collapse.
                </HelpTooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(infrastructure) as [key, road]}
            {@const k = key as keyof typeof infrastructure}
            <tr class="border-b last:border-0">
              <td class="px-3 py-2 font-medium">{roadLabels[k]}</td>
              <td class="px-3 py-2 text-center">
                <Select.Root
                  type="single"
                  value={road.exists}
                  onValueChange={(v) => {
                    if (v) infrastructure[k] = { ...infrastructure[k], exists: v as 'yes' | 'no' };
                  }}
                >
                  <Select.Trigger class="h-8 w-20">
                    {road.exists === 'yes' ? 'Yes' : 'No'}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="yes">Yes</Select.Item>
                    <Select.Item value="no">No</Select.Item>
                  </Select.Content>
                </Select.Root>
              </td>
              <td class="px-3 py-2">
                {#if road.exists === 'yes'}
                  <NumberInput
                    value={infrastructure[k].length ?? 0}
                    onvaluechange={(v) => {
                      infrastructure[k] = { ...infrastructure[k], length: v };
                    }}
                    placeholder="0"
                    min={0}
                    step={0.1}
                    class="h-8 text-center"
                  />
                {:else}
                  <span class="text-center text-muted-foreground">-</span>
                {/if}
              </td>
              <td class="px-3 py-2">
                {#if road.exists === 'yes'}
                  <Select.Root
                    type="single"
                    value={road.condition?.toString()}
                    onValueChange={(v) => {
                      if (v)
                        infrastructure[k] = {
                          ...infrastructure[k],
                          condition: parseInt(v) as 1 | 2 | 3 | 4 | 5
                        };
                    }}
                  >
                    <Select.Trigger class="h-8 w-24">
                      {road.condition ? conditionLabels[road.condition] : 'Select'}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="1">Bad</Select.Item>
                      <Select.Item value="2">Poor</Select.Item>
                      <Select.Item value="3">Fair</Select.Item>
                      <Select.Item value="4">Good</Select.Item>
                      <Select.Item value="5">Excellent</Select.Item>
                    </Select.Content>
                  </Select.Root>
                {:else}
                  <span class="text-center text-muted-foreground">-</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </FormSection>

  <!-- Education Status Section -->
  <FormSection
    title="Education Status"
    description="Classroom capacity information"
    icon={Building}
    variant="info"
    defaultOpen={false}
  >
    <div class="max-w-sm space-y-2">
      <Label class="flex items-center gap-1.5">
        Students Per Room
        <HelpTooltip content="Number of students per classroom" />
      </Label>
      <Select.Root
        type="single"
        value={studentsPerRoom}
        onValueChange={(v) => {
          if (v) studentsPerRoom = v as typeof studentsPerRoom;
        }}
      >
        <Select.Trigger class="w-full">
          {studentsPerRoom === 'less_than_46'
            ? 'Less than 46'
            : studentsPerRoom === '46_50'
              ? '46-50'
              : studentsPerRoom === '51_55'
                ? '51-55'
                : studentsPerRoom === 'more_than_56'
                  ? 'More than 56'
                  : 'No Classroom'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="less_than_46">Less than 46</Select.Item>
          <Select.Item value="46_50">46-50</Select.Item>
          <Select.Item value="51_55">51-55</Select.Item>
          <Select.Item value="more_than_56">More than 56</Select.Item>
          <Select.Item value="no_classroom">No Classroom</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
  </FormSection>
</div>
