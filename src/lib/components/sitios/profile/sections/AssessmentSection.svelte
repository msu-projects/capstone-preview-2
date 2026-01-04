<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import type { PPARecommendation, SitioProfile } from '$lib/types';
  import {
    AlertTriangle,
    ChartNoAxesCombined,
    ChevronDown,
    Download,
    Eye,
    Handshake
  } from '@lucide/svelte';

  interface Props {
    sitio: SitioProfile;
  }

  const { sitio }: Props = $props();

  // Selected recommendation for modal
  let selectedRecommendation = $state<PPARecommendation | null>(null);
  let isModalOpen = $state(false);

  // Calculate priority color based on score
  function getPriorityConfig(priority: string) {
    switch (priority) {
      case 'Critical':
        return {
          bgClass: 'bg-rose-100 dark:bg-rose-500/20',
          borderClass: 'border-rose-200 dark:border-rose-500/30',
          textClass: 'text-rose-700 dark:text-rose-400',
          ringClass: 'ring-rose-500'
        };
      case 'High':
        return {
          bgClass: 'bg-orange-100 dark:bg-orange-500/20',
          borderClass: 'border-orange-200 dark:border-orange-500/30',
          textClass: 'text-orange-700 dark:text-orange-400',
          ringClass: 'ring-orange-500'
        };
      case 'Moderate':
        return {
          bgClass: 'bg-yellow-100 dark:bg-yellow-500/20',
          borderClass: 'border-yellow-200 dark:border-yellow-500/30',
          textClass: 'text-yellow-700 dark:text-yellow-400',
          ringClass: 'ring-yellow-500'
        };
      default:
        return {
          bgClass: 'bg-green-100 dark:bg-green-500/20',
          borderClass: 'border-green-200 dark:border-green-500/30',
          textClass: 'text-green-700 dark:text-green-400',
          ringClass: 'ring-green-500'
        };
    }
  }

  // Get priority badge label
  function getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'Critical':
        return 'Top Priority';
      case 'High':
        return 'High Priority';
      case 'Moderate':
        return 'Moderate Priority';
      default:
        return 'Low Priority';
    }
  }

  // Calculate overall assessment ring progress
  const assessmentProgress = $derived(() => {
    const score = sitio.averageNeedScore;
    const circumference = 2 * Math.PI * 58;
    const offset = circumference - (score / 10) * circumference;
    return { score, circumference, offset };
  });

  // Get priority ranking label based on score - as derived
  const overallPriorityInfo = $derived(() => {
    const score = sitio.averageNeedScore;
    if (score >= 8)
      return { label: 'Critical Priority', class: 'text-rose-700 dark:text-rose-400' };
    if (score >= 6)
      return { label: 'High Priority', class: 'text-orange-700 dark:text-orange-400' };
    if (score >= 4)
      return { label: 'Moderate Priority', class: 'text-yellow-700 dark:text-yellow-400' };
    return { label: 'Low Priority', class: 'text-green-700 dark:text-green-400' };
  });

  // Sort recommendations by score
  const sortedRecommendations = $derived(
    [...sitio.recommendations].sort((a, b) => b.needScore - a.needScore)
  );

  // Get top 3 priorities from recommendations
  const topPriorities = $derived(
    sortedRecommendations.slice(0, 3).map((rec) => ({
      name: rec.ppa.name.replace(
        /^(Construction of |Conduct of |Provision of |Implementation of |Distribution of |Installation of )/i,
        ''
      ),
      score: rec.needScore,
      maxScore: 10
    }))
  );

  function openRecommendationModal(rec: PPARecommendation) {
    selectedRecommendation = rec;
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
    selectedRecommendation = null;
  }
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Assessment & Priorities (1/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-1">
    <!-- Need Analysis Card -->
    <InfoCard
      title="Need Analysis"
      description="Overall community assessment score"
      icon={ChartNoAxesCombined}
      iconBgColor="bg-rose-50 dark:bg-rose-900/20"
      iconTextColor="text-rose-500"
    >
      {#snippet children()}
        <div class="flex flex-col items-center justify-center py-4">
          <div
            class="relative flex size-28 items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800"
          >
            <svg class="absolute top-0 left-0 size-full -rotate-90 transform">
              <circle
                class="text-rose-500"
                cx="56"
                cy="56"
                fill="transparent"
                r="50"
                stroke="currentColor"
                stroke-dasharray={2 * Math.PI * 50}
                stroke-dashoffset={2 * Math.PI * 50 -
                  (assessmentProgress().score / 10) * 2 * Math.PI * 50}
                stroke-width="8"
              ></circle>
            </svg>
            <div class="flex flex-col items-center">
              <span class="text-3xl font-bold text-slate-900 dark:text-white">
                {assessmentProgress().score.toFixed(1)}
              </span>
              <span
                class="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase"
              >
                Average
              </span>
            </div>
          </div>
          <div class="mt-3 text-center">
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-medium {overallPriorityInfo()
                .class} dark:border-rose-800/30 dark:bg-rose-900/20"
            >
              {overallPriorityInfo().label}
            </span>
            <p class="mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">
              {sitio.sitioName} shows significant gaps in basic infrastructure and social services requiring
              intervention.
            </p>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Community Priorities Card -->
    <InfoCard
      title="Community Priorities"
      description="Top needs based on assessment"
      icon={AlertTriangle}
      iconBgColor="bg-orange-50 dark:bg-orange-900/20"
      iconTextColor="text-orange-500"
    >
      {#snippet children()}
        <div class="flex flex-col gap-3">
          <div
            class="flex justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-[10px] font-medium text-muted-foreground uppercase dark:border-slate-700 dark:bg-slate-800/50"
          >
            <span>0 - None</span>
            <span>3 - Low</span>
            <span>6 - Moderate</span>
            <span>10 - High</span>
          </div>
          {#each topPriorities as priority}
            {@const percentage = (priority.score / priority.maxScore) * 100}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="max-w-45 truncate font-medium text-slate-700 dark:text-slate-300">
                  {priority.name}
                </span>
                <span class="font-semibold text-slate-900 dark:text-white">
                  {priority.score.toFixed(1)}
                </span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-full rounded-full transition-all duration-500 {percentage >= 80
                    ? 'bg-rose-500'
                    : percentage >= 60
                      ? 'bg-orange-500'
                      : percentage >= 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'}"
                  style="width: {percentage}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>
  </div>

  <!-- Right Column: PPA Recommendations (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- PPA Recommendations Card -->
    <InfoCard
      title="PPA Recommendations"
      description="Proposed Programs, Projects & Activities based on needs"
      icon={Handshake}
      iconBgColor="bg-primary/10"
      iconTextColor="text-primary"
      class="h-full"
    >
      {#snippet children()}
        <div class="flex flex-col gap-3">
          {#each sortedRecommendations.slice(0, 5) as recommendation, index}
            {@const priorityConfig = getPriorityConfig(recommendation.priority)}
            <div
              class="group rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/30 {index ===
              0
                ? 'ring-2 ring-offset-2 ' + priorityConfig.ringClass + '/20'
                : ''}"
            >
              <div class="flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div class="flex-1">
                  <div class="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      class="text-[10px] font-medium tracking-wide uppercase {priorityConfig.bgClass} {priorityConfig.borderClass} {priorityConfig.textClass}"
                    >
                      {getPriorityLabel(recommendation.priority)}
                    </Badge>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      Score: {recommendation.needScore.toFixed(1)}
                    </span>
                  </div>
                  <h4 class="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {recommendation.ppa.name}
                  </h4>
                  <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {recommendation.ppa.description}
                  </p>
                </div>
                <div class="flex w-full items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full sm:w-auto"
                    onclick={() => openRecommendationModal(recommendation)}
                  >
                    <Eye class="mr-1.5 size-3.5" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          {/each}

          {#if sortedRecommendations.length > 5}
            <div class="flex justify-center pt-2">
              <Button variant="ghost" size="sm" class="text-muted-foreground">
                <ChevronDown class="mr-1.5 size-4" />
                Show {sortedRecommendations.length - 5} more recommendations
              </Button>
            </div>
          {/if}
        </div>
      {/snippet}
    </InfoCard>
  </div>
</div>

<!-- Recommendation Detail Modal -->
<Dialog.Root bind:open={isModalOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-3xl overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="text-lg">PPA Recommendation Details</Dialog.Title>
    </Dialog.Header>

    {#if selectedRecommendation}
      {@const priorityConfig = getPriorityConfig(selectedRecommendation.priority)}
      <div class="overflow-y-auto px-1 py-4">
        <div class="mb-6 flex flex-col gap-4">
          <div class="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-3">
                <Badge
                  variant="outline"
                  class="rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase {priorityConfig.bgClass} {priorityConfig.borderClass} {priorityConfig.textClass}"
                >
                  {getPriorityLabel(selectedRecommendation.priority)}
                </Badge>
                <span class="text-xs text-muted-foreground">
                  ID: {selectedRecommendation.ppa.id}
                </span>
              </div>
              <h2 class="mb-2 text-lg font-semibold text-slate-900 md:text-xl dark:text-white">
                {selectedRecommendation.ppa.name}
              </h2>
              <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {selectedRecommendation.ppa.description}
              </p>
            </div>
            <div class="flex min-w-24 flex-col items-end gap-1">
              <div class="flex items-end gap-1.5">
                <span class="text-4xl font-bold text-primary">
                  {selectedRecommendation.needScore.toFixed(1)}
                </span>
                <span class="mb-1 text-sm text-muted-foreground">/ 10</span>
              </div>
              <span class="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Overall Need Score
              </span>
            </div>
          </div>
        </div>

        <!-- Score Breakdown Table -->
        <div>
          <h4
            class="mb-3 flex items-center gap-2 text-sm font-medium tracking-wider text-slate-900 uppercase dark:text-white"
          >
            <ChartNoAxesCombined class="size-4" />
            Score Breakdown
          </h4>
          <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50/80 dark:bg-slate-800/50">
                <tr>
                  <th
                    class="px-4 py-2.5 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
                    scope="col"
                  >
                    Criteria Name
                  </th>
                  <th
                    class="px-4 py-2.5 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase"
                    scope="col"
                  >
                    Score
                  </th>
                  <th
                    class="px-4 py-2.5 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
                    scope="col"
                  >
                    Reasoning
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800/30"
              >
                {#each selectedRecommendation.scoreBreakdown as criteria}
                  <tr class="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td
                      class="px-4 py-3 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-white"
                    >
                      {criteria.criteriaName}
                    </td>
                    <td class="px-4 py-3 text-center text-sm">
                      <div class="flex items-center justify-center gap-1">
                        <span class="font-semibold text-slate-900 dark:text-white">
                          {criteria.pointsAwarded.toFixed(1)}
                        </span>
                        <span class="text-xs text-muted-foreground">
                          / {criteria.maxPoints.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {criteria.reason}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog.Footer class="border-t border-slate-200 pt-4 dark:border-slate-700">
        <Button variant="outline" onclick={closeModal}>Close</Button>
        <Button>
          <Download class="mr-1.5 size-4" />
          Download Report
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
