// Squarified treemap (Bruls, Huizing & van Wijk, 2000).
//
// Turns a list of weighted items into rectangles that fill a box, favouring
// near-square tiles (low aspect ratio) so the result reads as a "territory
// map". Pure and deterministic — no deps, no React. Rectangles are returned in
// a 0-based `width × height` coordinate space; render via an SVG viewBox.

export type TreemapInput = { id: string; value: number };
export type TreemapRect = {
  id: string;
  value: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Scaled = TreemapInput & { area: number };

// Worst (largest) aspect ratio in a row laid along a side of length `side`.
function worst(row: Scaled[], side: number): number {
  if (row.length === 0) return Infinity;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const r of row) {
    sum += r.area;
    if (r.area < min) min = r.area;
    if (r.area > max) max = r.area;
  }
  const side2 = side * side;
  const sum2 = sum * sum;
  return Math.max((side2 * max) / sum2, sum2 / (side2 * min));
}

export function squarify(
  items: TreemapInput[],
  width: number,
  height: number,
): TreemapRect[] {
  const positive = items.filter((i) => i.value > 0);
  if (positive.length === 0 || width <= 0 || height <= 0) return [];

  const total = positive.reduce((s, i) => s + i.value, 0);
  const boxArea = width * height;
  const scaled: Scaled[] = positive
    .map((i) => ({ ...i, area: (i.value / total) * boxArea }))
    .sort((a, b) => b.area - a.area);

  const result: TreemapRect[] = [];

  // Free sub-rectangle, shrunk as each row is placed.
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;

  function layoutRow(row: Scaled[]) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    if (sum <= 0) return;
    if (w >= h) {
      // Place a column of width `colW` on the left; stack items vertically.
      const colW = sum / h;
      let cy = y;
      for (const r of row) {
        const rh = r.area / colW;
        result.push({ id: r.id, value: r.value, x, y: cy, w: colW, h: rh });
        cy += rh;
      }
      x += colW;
      w -= colW;
    } else {
      // Place a row of height `rowH` along the top; lay items horizontally.
      const rowH = sum / w;
      let cx = x;
      for (const r of row) {
        const rw = r.area / rowH;
        result.push({ id: r.id, value: r.value, x: cx, y, w: rw, h: rowH });
        cx += rw;
      }
      y += rowH;
      h -= rowH;
    }
  }

  let row: Scaled[] = [];
  let i = 0;
  while (i < scaled.length) {
    const item = scaled[i];
    const side = Math.min(w, h);
    if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) {
      row.push(item);
      i++;
    } else {
      layoutRow(row);
      row = [];
    }
  }
  if (row.length) layoutRow(row);

  return result;
}
