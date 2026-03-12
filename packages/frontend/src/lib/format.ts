/**
 * Formatea una fecha para mostrar en la UI.
 * Acepta string (ISO o fecha local), Date o número (timestamp).
 *
 * @param value - Fecha en cualquier formato aceptado por Date
 * @param options - locale (p. ej. 'es'), fallback cuando la fecha es inválida o vacía
 * @returns Fecha formateada (p. ej. "15/5/2000") o fallback
 */
export function formatDate(
  value: string | Date | number | null | undefined,
  options: { locale?: string; fallback?: string } = {},
): string {
  const { locale = 'es', fallback = '–' } = options;
  if (value == null || value === '') return fallback;
  try {
    const date = typeof value === 'object' && 'getTime' in value ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString(locale);
  } catch {
    return fallback;
  }
}
