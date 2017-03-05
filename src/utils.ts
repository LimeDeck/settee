/**
 * Builds up an entry key.
 *
 * @param {string} schemaName
 * @param {string} id
 * @return {string}
 */
export function buildKey (schemaName: string, id: string): string {
  return `${schemaName}::${id}`
}
