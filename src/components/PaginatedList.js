/**
 * Generic Paginated List Component
 * Reusable component for displaying paginated data with React.memo-like optimization.
 * @module components/PaginatedList
 */

const DEFAULT_PAGE_SIZE = 50;

/**
 * Creates a paginated list controller with memoization support.
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Number of items per page (default: 50)
 * @param {Function} options.renderItem - Function to render each item
 * @param {Function} options.onPageChange - Callback when page changes
 * @returns {Object} PaginatedList controller
 */
export function createPaginatedList(options = {}) {
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    const renderItem = options.renderItem || ((item) => String(item));
    const onPageChange = options.onPageChange || (() => {});

    let items = [];
    let currentPage = 1;
    let lastRenderedItemsHash = null;

    // Simple hash function for memoization comparison
    function computeItemsHash(data) {
        if (!Array.isArray(data)) {
            return String(data);
        }
        // Use first/last id and length as quick hash
        if (data.length === 0) {
            return "empty";
        }
        const firstId = data[0]?.id ?? 0;
        const lastId = data[data.length - 1]?.id ?? 0;
        return `${data.length}-${firstId}-${lastId}`;
    }

    function getTotalPages() {
        return Math.ceil(items.length / pageSize) || 1;
    }

    function getPaginatedItems() {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return items.slice(startIndex, endIndex);
    }

    function hasNextPage() {
        return currentPage < getTotalPages();
    }

    function hasPrevPage() {
        return currentPage > 1;
    }

    return {
        /**
         * Gets the current state of the paginated list.
         * @returns {Object} Current state
         */
        getState() {
            return {
                items,
                currentPage,
                pageSize,
                totalItems: items.length,
                totalPages: getTotalPages(),
                paginatedItems: getPaginatedItems(),
                hasNextPage: hasNextPage(),
                hasPrevPage: hasPrevPage(),
            };
        },

        /**
         * Updates the items and returns whether a re-render is needed.
         * Uses memoization to detect actual changes.
         * @param {Array} newItems - New items to display
         * @returns {boolean} True if items changed significantly
         */
        setItems(newItems) {
            const newItemsArray = Array.isArray(newItems) ? newItems : [];
            const newHash = computeItemsHash(newItems);

            // Only update and signal change if hash is different
            if (newHash !== lastRenderedItemsHash) {
                items = newItemsArray;
                lastRenderedItemsHash = newHash;

                // Reset to page 1 if current page is now invalid
                if (currentPage > getTotalPages()) {
                    currentPage = 1;
                }
                return true;
            }

            return false;
        },

        /**
         * Go to specific page.
         * @param {number} page - Page number (1-indexed)
         * @returns {boolean} True if page changed
         */
        goToPage(page) {
            const targetPage = Math.max(1, Math.min(page, getTotalPages()));
            
            if (targetPage !== currentPage) {
                currentPage = targetPage;
                onPageChange(currentPage);
                return true;
            }
            return false;
        },

        /**
         * Go to next page.
         * @returns {boolean} True if page changed
         */
        nextPage() {
            return this.goToPage(currentPage + 1);
        },

        /**
         * Go to previous page.
         * @returns {boolean} True if page changed
         */
        prevPage() {
            return this.goToPage(currentPage - 1);
        },

        /**
         * Go to first page.
         * @returns {boolean} True if page changed
         */
        firstPage() {
            return this.goToPage(1);
        },

        /**
         * Go to last page.
         * @returns {boolean} True if page changed
         */
        lastPage() {
            return this.goToPage(getTotalPages());
        },

        /**
         * Render items for current page.
         * @returns {Array} Rendered item HTML strings
         */
        renderCurrentPage() {
            return getPaginatedItems().map(renderItem);
        },

        /**
         * Reset pagination to initial state.
         */
        reset() {
            items = [];
            currentPage = 1;
            lastRenderedItemsHash = null;
        },
    };
}

/**
 * Creates a memoized version of a component render function.
 * Similar to React.memo for vanilla JS.
 * @param {Function} renderFn - Render function to memoize
 * @param {Function} areEqual - Function to compare old and new props
 * @returns {Function} Memoized render function
 */
export function memoizeComponent(renderFn, areEqual) {
    let lastProps = null;
    let lastResult = null;

    return function (props) {
        if (lastProps === null) {
            lastProps = props;
            lastResult = renderFn(props);
            return lastResult;
        }

        if (areEqual(lastProps, props)) {
            return lastResult;
        }

        lastProps = props;
        lastResult = renderFn(props);
        return lastResult;
    };
}

/**
 * Creates pagination controls HTML.
 * @param {Object} state - Current pagination state
 * @returns {string} HTML string for pagination controls
 */
export function renderPaginationControls(state) {
    const { currentPage, totalPages, hasNextPage, hasPrevPage } = state;

    if (totalPages <= 1) {
        return "";
    }

    return `
        <div class="pagination" data-pagination="true">
            <button 
                class="pagination__btn pagination__btn--prev" 
                data-pagination-action="prev"
                ${!hasPrevPage ? "disabled" : ""}
            >
                &laquo; Anterior
            </button>
            <span class="pagination__info">
                Página ${currentPage} de ${totalPages}
            </span>
            <button 
                class="pagination__btn pagination__btn--next" 
                data-pagination-action="next"
                ${!hasNextPage ? "disabled" : ""}
            >
                Siguiente &raquo;
            </button>
        </div>
    `;
}
