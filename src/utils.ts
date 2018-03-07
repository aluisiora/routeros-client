/**
 * For for any .id search on the query and return it
 * 
 * @param queries array of transformed query
 */
export function lookForIdParameterAndReturnItsValue(queries: string[]): string {
    let val = null;
    for (const query of queries) {
        if (query.includes("numbers=") || query.includes(".id=")) {
            val = query.split("=").pop();
        }
    }
    return val;
} 

/**
 * Transform camelCase or snake_case to dashed-case,
 * so the routerboard can understand the parameters used
 * on this wrapper
 * 
 * @param val to string to transform
 */
export function camelCaseOrSnakeCaseToDashedCase(val: string): string {
    // Clean any empty space left
    return val.replace(/ /g, "")
        // Convert camelCase to dashed
        .replace(/([a-z][A-Z])/g, (g, w) => {
            return g[0] + "-" + g[1].toLowerCase();
        })
        // Replace any underline to hiphen if used
        .replace(/_/g, "-");
}

/**
 * Transform routerboard's dashed-case to camelCase
 * so we can use objects properties without having to wrap
 * around quotes
 * 
 * @param val the string to transform
 */
export function dashedCaseToCamelCase(val: string): string {
    return val.replace(/-([a-z])/g, (g) => {
        return g[1].toUpperCase();
    });
}

/**
 * Transform routerboard's dashed-case to snake_case
 * so we can use objects properties without having to wrap
 * around quotes
 * 
 * @param val the string to transform
 */
export function dashedCaseToSnakeCase(val: string): string {
    return val.replace(/-/g, "_");
}
