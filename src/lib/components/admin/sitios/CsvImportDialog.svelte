<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Progress } from '$lib/components/ui/progress';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as Table from '$lib/components/ui/table';
  import * as Tabs from '$lib/components/ui/tabs';
  import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileWarning,
    Info,
    Upload,
    X
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    onImportComplete?: (results: ImportResult) => void;
  }

  let { open = $bindable(false), onOpenChange, onImportComplete }: Props = $props();

  // State
  let step = $state<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  let selectedFile = $state<File | null>(null);
  let dragOver = $state(false);
  let importProgress = $state(0);
  let parsedData = $state<ParsedSitioRow[]>([]);
  let validationErrors = $state<ValidationError[]>([]);
  let importResults = $state<ImportResult | null>(null);
  let selectedYearTab = $state<string>('all');

  // Types for parsed data
  interface ParsedSitioRow {
    rowNumber: number;
    year: number;
    municipality: string;
    barangay: string;
    sitioName: string;
    sitioCode: string;
    latitude: number;
    longitude: number;
    totalPopulation: number;
    totalHouseholds: number;
    registeredVoters: number;
    isValid: boolean;
    errors: string[];
  }

  interface ValidationError {
    row: number;
    field: string;
    message: string;
  }

  export interface ImportResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    byYear: Record<number, { count: number; sitios: string[] }>;
    errors: string[];
  }

  // Derived: Group data by year
  const dataByYear = $derived.by(() => {
    const grouped: Record<number, ParsedSitioRow[]> = {};
    for (const row of parsedData) {
      if (!grouped[row.year]) {
        grouped[row.year] = [];
      }
      grouped[row.year].push(row);
    }
    return grouped;
  });

  // Derived: Available years sorted descending
  const availableYears = $derived(
    Object.keys(dataByYear)
      .map(Number)
      .sort((a, b) => b - a)
  );

  // Derived: Filtered data based on selected tab
  const displayData = $derived(
    selectedYearTab === 'all' ? parsedData : (dataByYear[Number(selectedYearTab)] ?? [])
  );

  // Derived stats
  const validCount = $derived(parsedData.filter((row) => row.isValid).length);
  const invalidCount = $derived(parsedData.filter((row) => !row.isValid).length);

  // Derived: Stats by year
  const statsByYear = $derived.by(() => {
    const stats: Record<number, { total: number; valid: number; invalid: number }> = {};
    for (const [year, rows] of Object.entries(dataByYear)) {
      const yearNum = Number(year);
      stats[yearNum] = {
        total: rows.length,
        valid: rows.filter((r) => r.isValid).length,
        invalid: rows.filter((r) => !r.isValid).length
      };
    }
    return stats;
  });

  function handleDialogChange(isOpen: boolean) {
    if (!isOpen) {
      resetDialog();
    }
    open = isOpen;
    onOpenChange?.(isOpen);
  }

  function resetDialog() {
    step = 'upload';
    selectedFile = null;
    dragOver = false;
    importProgress = 0;
    parsedData = [];
    validationErrors = [];
    importResults = null;
    selectedYearTab = 'all';
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  }

  function handleFileSelect(file: File) {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    selectedFile = file;
    parseCSVFile(file);
  }

  async function parseCSVFile(file: File) {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row');
        return;
      }

      // Parse header
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

      // Required columns (including year)
      const requiredColumns = ['year', 'municipality', 'barangay', 'sitio_name'];
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Parse data rows
      const data: ParsedSitioRow[] = [];
      const errors: ValidationError[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rowData = createRowObject(headers, values);
        const row = validateAndParseRow(rowData, i + 1, errors);
        data.push(row);
      }

      parsedData = data;
      validationErrors = errors;
      selectedYearTab = 'all';
      step = 'preview';
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parse error:', error);
    }
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  function createRowObject(headers: string[], values: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  }

  function validateAndParseRow(
    row: Record<string, string>,
    rowNumber: number,
    errors: ValidationError[]
  ): ParsedSitioRow {
    const rowErrors: string[] = [];

    // Year validation
    const yearStr = row['year']?.trim() || '';
    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    if (!yearStr) {
      rowErrors.push('Year is required');
      errors.push({ row: rowNumber, field: 'year', message: 'Year is required' });
    } else if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      rowErrors.push(`Invalid year: ${yearStr}`);
      errors.push({
        row: rowNumber,
        field: 'year',
        message: `Year must be between 1900 and ${currentYear + 1}`
      });
    }

    // Required fields
    const municipality = row['municipality']?.trim() || '';
    const barangay = row['barangay']?.trim() || '';
    const sitioName = row['sitio_name']?.trim() || '';

    if (!municipality) {
      rowErrors.push('Municipality is required');
      errors.push({ row: rowNumber, field: 'municipality', message: 'Municipality is required' });
    }

    if (!barangay) {
      rowErrors.push('Barangay is required');
      errors.push({ row: rowNumber, field: 'barangay', message: 'Barangay is required' });
    }

    if (!sitioName) {
      rowErrors.push('Sitio name is required');
      errors.push({ row: rowNumber, field: 'sitio_name', message: 'Sitio name is required' });
    }

    // Optional fields with validation
    const latitude = parseFloat(row['latitude'] || '0') || 0;
    const longitude = parseFloat(row['longitude'] || '0') || 0;
    const totalPopulation = parseInt(row['total_population'] || '0', 10) || 0;
    const totalHouseholds = parseInt(row['total_households'] || '0', 10) || 0;
    const registeredVoters = parseInt(row['registered_voters'] || '0', 10) || 0;

    // Validate coordinates if provided
    if (row['latitude'] && row['latitude'].trim() && (latitude < -90 || latitude > 90)) {
      rowErrors.push('Invalid latitude');
      errors.push({
        row: rowNumber,
        field: 'latitude',
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (row['longitude'] && row['longitude'].trim() && (longitude < -180 || longitude > 180)) {
      rowErrors.push('Invalid longitude');
      errors.push({
        row: rowNumber,
        field: 'longitude',
        message: 'Longitude must be between -180 and 180'
      });
    }

    return {
      rowNumber,
      year: isNaN(year) ? 0 : year,
      municipality,
      barangay,
      sitioName,
      sitioCode: row['sitio_code']?.trim() || '',
      latitude,
      longitude,
      totalPopulation,
      totalHouseholds,
      registeredVoters,
      isValid: rowErrors.length === 0,
      errors: rowErrors
    };
  }

  function removeFile() {
    selectedFile = null;
    parsedData = [];
    validationErrors = [];
    step = 'upload';
  }

  async function handleImport() {
    if (parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    const validRows = parsedData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    step = 'importing';
    importProgress = 0;

    // Simulate import process (frontend only)
    const totalRows = validRows.length;
    let processed = 0;

    // Group by year for results
    const byYear: Record<number, { count: number; sitios: string[] }> = {};

    for (const row of validRows) {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 30));
      processed++;
      importProgress = Math.round((processed / totalRows) * 100);

      // Track by year
      if (!byYear[row.year]) {
        byYear[row.year] = { count: 0, sitios: [] };
      }
      byYear[row.year].count++;
      byYear[row.year].sitios.push(row.sitioName);
    }

    // Set results
    importResults = {
      totalProcessed: totalRows,
      successful: totalRows,
      failed: 0,
      byYear,
      errors: []
    };

    step = 'complete';

    const yearSummary = Object.entries(byYear)
      .map(([year, data]) => `${year}: ${data.count}`)
      .join(', ');
    toast.success(`Successfully imported ${totalRows} records (${yearSummary})`);
    onImportComplete?.(importResults);
  }

  function downloadTemplate() {
    // Create a sample CSV template with year column
    const templateContent = `year,municipality,barangay,sitio_name,sitio_code,latitude,longitude,total_population,total_households,registered_voters
2025,Koronadal City,Zone I,Purok 1,KOR-Z1-P1,6.4997,124.8466,500,120,350
2025,Koronadal City,Zone II,Purok 2,KOR-Z2-P2,6.5012,124.8501,350,85,220
2024,Koronadal City,Zone I,Purok 1,KOR-Z1-P1,6.4997,124.8466,480,115,340
2024,General Santos City,Calumpang,Sitio Malaya,GSC-CAL-SM,6.1166,125.1716,280,65,180`;

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitio-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Template downloaded');
  }
</script>

<Dialog.Root bind:open onOpenChange={handleDialogChange}>
  <Dialog.Content class="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <FileSpreadsheet class="size-5" />
        Import Sitios from CSV
      </Dialog.Title>
      <Dialog.Description>
        {#if step === 'upload'}
          Upload a CSV file containing sitio data. Each row should include a year column.
        {:else if step === 'preview'}
          Review the data before importing. Found {availableYears.length} year(s) of data.
        {:else if step === 'importing'}
          Importing sitio data...
        {:else}
          Import complete!
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-hidden py-4">
      {#if step === 'upload'}
        <!-- File Drop Zone -->
        <div
          class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
						{dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'}"
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          role="button"
          tabindex="0"
        >
          {#if selectedFile}
            <div class="flex flex-col items-center gap-3">
              <div class="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 class="size-8 text-green-500" />
              </div>
              <div>
                <p class="font-medium">{selectedFile.name}</p>
                <p class="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button variant="outline" size="sm" onclick={removeFile}>
                <X class="mr-2 size-4" />
                Remove
              </Button>
            </div>
          {:else}
            <div class="flex flex-col items-center gap-3">
              <div class="rounded-full bg-muted p-3">
                <Upload class="size-8 text-muted-foreground" />
              </div>
              <div>
                <p class="font-medium">Drop your CSV file here</p>
                <p class="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Input
                type="file"
                accept=".csv"
                class="absolute inset-0 cursor-pointer opacity-0"
                onchange={handleFileInputChange}
              />
            </div>
          {/if}
        </div>

        <!-- Info about year column -->
        <div
          class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50"
        >
          <div class="flex items-start gap-2 text-sm">
            <Info class="mt-0.5 size-4 shrink-0 text-blue-500" />
            <div class="text-blue-700 dark:text-blue-300">
              <p class="font-medium">CSV Format Requirements</p>
              <p class="mt-1 text-blue-600 dark:text-blue-400">
                Each row must include a <code class="rounded bg-blue-100 px-1 dark:bg-blue-900"
                  >year</code
                > column. This allows importing multiple years of data in a single file.
              </p>
            </div>
          </div>
        </div>

        <!-- Template Download -->
        <div class="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Download class="size-4" />
            <span>Need a template?</span>
          </div>
          <Button variant="outline" size="sm" onclick={downloadTemplate}>
            <Download class="mr-2 size-4" />
            Download Template
          </Button>
        </div>
      {:else if step === 'preview'}
        <!-- Overall Stats -->
        <div class="mb-4 flex flex-wrap gap-3">
          <div class="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
            <CheckCircle2 class="size-4 text-green-500" />
            <span class="text-sm font-medium">{validCount} Valid</span>
          </div>
          {#if invalidCount > 0}
            <div class="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
              <AlertCircle class="size-4 text-destructive" />
              <span class="text-sm font-medium">{invalidCount} Invalid</span>
            </div>
          {/if}
          <div class="ml-auto flex items-center gap-2">
            <Calendar class="size-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
              {availableYears.length} year(s): {availableYears.join(', ')}
            </span>
          </div>
        </div>

        <!-- Year Tabs -->
        <Tabs.Root bind:value={selectedYearTab} class="flex flex-col">
          <Tabs.List class="mb-3 w-full justify-start">
            <Tabs.Trigger value="all" class="gap-1.5">
              All
              <Badge variant="secondary" class="ml-1 h-5 px-1.5 text-xs">
                {parsedData.length}
              </Badge>
            </Tabs.Trigger>
            {#each availableYears as year}
              {@const yearStats = statsByYear[year]}
              <Tabs.Trigger value={year.toString()} class="gap-1.5">
                {year}
                <Badge
                  variant={yearStats?.invalid > 0 ? 'destructive' : 'secondary'}
                  class="ml-1 h-5 px-1.5 text-xs"
                >
                  {yearStats?.total ?? 0}
                </Badge>
              </Tabs.Trigger>
            {/each}
          </Tabs.List>

          <!-- Data Preview Table -->
          <ScrollArea class="h-64 rounded-md border">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head class="w-12">#</Table.Head>
                  <Table.Head class="w-12">Status</Table.Head>
                  <Table.Head class="w-16">Year</Table.Head>
                  <Table.Head>Municipality</Table.Head>
                  <Table.Head>Barangay</Table.Head>
                  <Table.Head>Sitio Name</Table.Head>
                  <Table.Head class="text-right">Population</Table.Head>
                  <Table.Head class="text-right">Households</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each displayData as row (row.rowNumber)}
                  <Table.Row class={row.isValid ? '' : 'bg-destructive/5'}>
                    <Table.Cell class="font-mono text-xs text-muted-foreground">
                      {row.rowNumber}
                    </Table.Cell>
                    <Table.Cell>
                      {#if row.isValid}
                        <CheckCircle2 class="size-4 text-green-500" />
                      {:else}
                        <div class="group relative">
                          <AlertCircle class="size-4 text-destructive" />
                          <div
                            class="absolute top-full left-0 z-10 hidden w-48 rounded-md border bg-popover p-2 text-xs shadow-md group-hover:block"
                          >
                            {#each row.errors as error}
                              <p class="text-destructive">{error}</p>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="outline" class="font-mono">
                        {row.year || '—'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell class="max-w-32 truncate">{row.municipality}</Table.Cell>
                    <Table.Cell class="max-w-32 truncate">{row.barangay}</Table.Cell>
                    <Table.Cell class="max-w-32 truncate">{row.sitioName}</Table.Cell>
                    <Table.Cell class="text-right">
                      {row.totalPopulation.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell class="text-right">
                      {row.totalHouseholds.toLocaleString()}
                    </Table.Cell>
                  </Table.Row>
                {:else}
                  <Table.Row>
                    <Table.Cell colspan={8} class="py-8 text-center text-muted-foreground">
                      No data for this year
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </ScrollArea>
        </Tabs.Root>

        {#if invalidCount > 0}
          <div class="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm">
            <FileWarning class="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p class="text-amber-700 dark:text-amber-400">
              {invalidCount} row(s) have validation errors and will be skipped during import.
            </p>
          </div>
        {/if}
      {:else if step === 'importing'}
        <div class="flex flex-col items-center gap-6 py-8">
          <div class="relative">
            <div class="size-20 animate-pulse rounded-full bg-primary/20"></div>
            <FileSpreadsheet
              class="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-primary"
            />
          </div>
          <div class="w-full max-w-xs space-y-2">
            <Progress value={importProgress} class="h-2" />
            <p class="text-center text-sm text-muted-foreground">Importing... {importProgress}%</p>
          </div>
        </div>
      {:else if step === 'complete'}
        <div class="flex flex-col items-center gap-4 py-6">
          <div class="rounded-full bg-green-500/10 p-4">
            <CheckCircle2 class="size-12 text-green-500" />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-semibold">Import Complete!</h3>
            <p class="text-muted-foreground">
              Successfully imported {importResults?.successful} sitio records.
            </p>
          </div>

          <!-- Breakdown by year -->
          {#if importResults?.byYear && Object.keys(importResults.byYear).length > 0}
            <div class="w-full max-w-sm space-y-2">
              <p class="text-center text-sm font-medium text-muted-foreground">Records by Year</p>
              <div class="rounded-lg border p-3">
                {#each Object.entries(importResults.byYear).sort(([a], [b]) => Number(b) - Number(a)) as [year, data]}
                  <div class="flex items-center justify-between py-1.5">
                    <div class="flex items-center gap-2">
                      <Calendar class="size-4 text-muted-foreground" />
                      <span class="font-medium">{year}</span>
                    </div>
                    <Badge variant="secondary">{data.count} records</Badge>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if importResults && importResults.failed > 0}
            <div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {importResults.failed} row(s) failed to import.
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="shrink-0">
      {#if step === 'upload'}
        <Button variant="outline" onclick={() => handleDialogChange(false)}>Cancel</Button>
        <Button onclick={() => selectedFile && parseCSVFile(selectedFile)} disabled={!selectedFile}>
          Continue
        </Button>
      {:else if step === 'preview'}
        <Button variant="outline" onclick={() => (step = 'upload')}>Back</Button>
        <Button onclick={handleImport} disabled={validCount === 0}>
          <Upload class="mr-2 size-4" />
          Import {validCount} Records
        </Button>
      {:else if step === 'complete'}
        <Button onclick={() => handleDialogChange(false)}>Done</Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
