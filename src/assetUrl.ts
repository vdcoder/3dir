/** Resolves a file in public/ against the deploy base path (e.g. /3dir/ on GitHub Pages). */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
