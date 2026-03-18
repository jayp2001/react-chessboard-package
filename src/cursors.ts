const DEFAULT_CURSOR_SIZE = 40;

/**
 * Generates a CSS `cursor` value from a DOM element that contains (or is) an SVG.
 * Clones the SVG, sets fixed dimensions, serializes it, and returns a `url(data:...)` cursor string.
 *
 * @returns A CSS cursor string, or `null` if the element doesn't contain an SVG.
 */
export function generateCursorFromElement(
  element: Element | null,
  size: number = DEFAULT_CURSOR_SIZE,
): string | null {
  if (!element || typeof XMLSerializer === 'undefined') return null;

  const svgEl =
    element.tagName.toLowerCase() === 'svg'
      ? element
      : element.querySelector('svg');

  if (!svgEl) return null;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));

  const serialized = new XMLSerializer().serializeToString(clone);
  const encoded = encodeURIComponent(serialized);
  const hotspot = Math.round(size / 2);

  return `url('data:image/svg+xml,${encoded}') ${hotspot} ${hotspot}, pointer`;
}

/**
 * Generates a CSS `cursor` value from a raw SVG markup string.
 *
 * @returns A CSS cursor string, or `'pointer'` if parsing fails.
 */
export function generateCursorFromMarkup(
  svgMarkup: string,
  size: number = DEFAULT_CURSOR_SIZE,
): string {
  if (typeof DOMParser === 'undefined') return 'pointer';

  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) return 'pointer';

  svgEl.setAttribute('width', String(size));
  svgEl.setAttribute('height', String(size));

  const serialized = new XMLSerializer().serializeToString(svgEl);
  const encoded = encodeURIComponent(serialized);
  const hotspot = Math.round(size / 2);

  return `url('data:image/svg+xml,${encoded}') ${hotspot} ${hotspot}, pointer`;
}
