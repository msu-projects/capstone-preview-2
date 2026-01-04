/**
 * Reusable pagination hook using Svelte 5 runes
 * Provides reactive pagination state and computed values
 */

export interface PaginationOptions<T> {
  /** Items per page (default: 10) */
  perPage?: number;
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial items */
  items?: T[];
}

/**
 * Creates a reactive pagination controller
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { Pagination } from '$lib/hooks/pagination.svelte';
 *
 *   const pagination = new Pagination({ items: myItems, perPage: 12 });
 *
 *   // Access paginated items
 *   $effect(() => {
 *     console.log(pagination.paginatedItems);
 *   });
 * </script>
 *
 * <button onclick={() => pagination.next()}>Next</button>
 * ```
 */
export class Pagination<T> {
  #items = $state<T[]>([]);
  #perPage = $state(10);
  #currentPage = $state(1);

  constructor(options: PaginationOptions<T> = {}) {
    const { perPage = 10, initialPage = 1, items = [] } = options;
    this.#items = items;
    this.#perPage = perPage;
    this.#currentPage = initialPage;
  }

  /** Get/set the current items array */
  get items(): T[] {
    return this.#items;
  }

  set items(value: T[]) {
    this.#items = value;
    // Reset to page 1 if current page would be out of bounds
    if (this.#currentPage > this.totalPages) {
      this.#currentPage = 1;
    }
  }

  /** Get/set items per page */
  get perPage(): number {
    return this.#perPage;
  }

  set perPage(value: number) {
    this.#perPage = Math.max(1, value);
    // Reset to page 1 if current page would be out of bounds
    if (this.#currentPage > this.totalPages) {
      this.#currentPage = 1;
    }
  }

  /** Get/set current page (1-indexed) */
  get currentPage(): number {
    return this.#currentPage;
  }

  set currentPage(value: number) {
    this.#currentPage = Math.max(1, Math.min(value, this.totalPages || 1));
  }

  /** Total number of pages */
  get totalPages(): number {
    return Math.ceil(this.#items.length / this.#perPage);
  }

  /** Total number of items */
  get totalItems(): number {
    return this.#items.length;
  }

  /** Items for the current page */
  get paginatedItems(): T[] {
    const start = (this.#currentPage - 1) * this.#perPage;
    return this.#items.slice(start, start + this.#perPage);
  }

  /** Whether there is a next page */
  get hasNext(): boolean {
    return this.#currentPage < this.totalPages;
  }

  /** Whether there is a previous page */
  get hasPrev(): boolean {
    return this.#currentPage > 1;
  }

  /** Start index of current page (1-indexed for display) */
  get startIndex(): number {
    return (this.#currentPage - 1) * this.#perPage + 1;
  }

  /** End index of current page (for display) */
  get endIndex(): number {
    return Math.min(this.#currentPage * this.#perPage, this.#items.length);
  }

  /** Go to next page */
  next(): void {
    if (this.hasNext) {
      this.#currentPage++;
    }
  }

  /** Go to previous page */
  prev(): void {
    if (this.hasPrev) {
      this.#currentPage--;
    }
  }

  /** Go to first page */
  first(): void {
    this.#currentPage = 1;
  }

  /** Go to last page */
  last(): void {
    this.#currentPage = this.totalPages || 1;
  }

  /** Go to a specific page */
  goTo(page: number): void {
    this.currentPage = page;
  }

  /** Reset to first page */
  reset(): void {
    this.#currentPage = 1;
  }

  /** Get array of page numbers for pagination UI */
  getPageNumbers(maxVisible: number = 5): number[] {
    const total = this.totalPages;
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, this.#currentPage - half);
    const end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}

/**
 * Factory function for creating pagination (alternative to class)
 */
export function createPagination<T>(options: PaginationOptions<T> = {}) {
  return new Pagination<T>(options);
}
