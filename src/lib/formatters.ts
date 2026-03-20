// ============================================================
// Formatting Utilities — Pure Functions
// PATTERNS: Pure functions, template literals, Intl API
// ============================================================

// PATTERN: Format cents to dollar string
//! Always store money in cents (integers) to avoid floating point issues
// e.g., formatCurrency(7999) => "$79.99"
export function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
}

// PATTERN: Format ISO date string to readable format
export function formatDate(isoString: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(isoString));
}

// PATTERN: Format date with time
export function formatDateTime(isoString: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(isoString));
}

// PATTERN: Pluralize a word based on count
export function pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${plural || singular + 's'}`;
}

// PATTERN: Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

// PATTERN: Slugify a string (useful for creating URL-friendly strings)
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
