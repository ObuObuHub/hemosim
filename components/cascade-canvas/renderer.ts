/**
 * CascadeCanvas Renderer
 *
 * Pure canvas drawing functions for membrane surfaces and biological shapes.
 */

/**
 * Draw a wavy circle (membrane-like border for platelets)
 */
export function drawWavyCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  amplitude: number = 2,
  waves: number = 12
): void {
  ctx.beginPath();
  const steps = waves * 8;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wave = Math.sin(angle * waves) * amplitude;
    const r = radius + wave;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

/**
 * Draw a membrane surface with classical phospholipid BILAYER on the BOTTOM
 * Two rows of circles (heads) with tails between them
 */
export function drawMembraneSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label?: string
): void {
  const circleRadius = 3; // Phospholipid "heads"
  const spacing = circleRadius * 2.4; // Space between circle centers
  const bilayerGap = circleRadius * 4; // Gap between the two layers (room for tails)
  const tailLength = bilayerGap / 2 - 1; // Tails meet in the middle
  const padding = circleRadius + 2;

  // No background fill - just the bilayer itself

  ctx.fillStyle = color + '50';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  const startX = x + padding;
  const endX = x + width - padding;
  const count = Math.floor((endX - startX) / spacing);
  const offset = ((endX - startX) - (count - 1) * spacing) / 2;

  // Outer leaflet (top row - facing the complex)
  const outerY = y + height - padding - bilayerGap;
  for (let i = 0; i < count; i++) {
    const cx = startX + offset + i * spacing;
    // Head
    ctx.beginPath();
    ctx.arc(cx, outerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (two lines going down)
    ctx.beginPath();
    ctx.moveTo(cx - 1, outerY + circleRadius);
    ctx.lineTo(cx - 1, outerY + circleRadius + tailLength);
    ctx.moveTo(cx + 1, outerY + circleRadius);
    ctx.lineTo(cx + 1, outerY + circleRadius + tailLength);
    ctx.stroke();
  }

  // Inner leaflet (bottom row - facing cytoplasm)
  const innerY = y + height - padding;
  for (let i = 0; i < count; i++) {
    const cx = startX + offset + i * spacing;
    // Head
    ctx.beginPath();
    ctx.arc(cx, innerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (two lines going up)
    ctx.beginPath();
    ctx.moveTo(cx - 1, innerY - circleRadius);
    ctx.lineTo(cx - 1, innerY - circleRadius - tailLength);
    ctx.moveTo(cx + 1, innerY - circleRadius);
    ctx.lineTo(cx + 1, innerY - circleRadius - tailLength);
    ctx.stroke();
  }

  // Optional label above the complex (font size will be scaled by caller)
  if (label) {
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 8);
  }
}

/**
 * Draw a circular membrane bilayer (two concentric rings with tails) - same style as rectangular
 */
export function drawCircularMembraneSurface(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number, // Where the inner content sits
  color: string
): void {
  const circleRadius = 3; // Same as rectangular version
  const bilayerGap = circleRadius * 4;
  const tailLength = bilayerGap / 2 - 1;

  // No background fill - just the bilayer
  ctx.fillStyle = color + '50';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Inner leaflet (inner ring - facing the cell interior)
  const innerRingRadius = innerRadius + 4;
  const innerCircumference = 2 * Math.PI * innerRingRadius;
  const innerCount = Math.floor(innerCircumference / (circleRadius * 2.4));

  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2;
    const px = cx + Math.cos(angle) * innerRingRadius;
    const py = cy + Math.sin(angle) * innerRingRadius;
    // Head
    ctx.beginPath();
    ctx.arc(px, py, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (pointing outward)
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(angle) * circleRadius, py + Math.sin(angle) * circleRadius);
    ctx.lineTo(px + Math.cos(angle) * (circleRadius + tailLength), py + Math.sin(angle) * (circleRadius + tailLength));
    ctx.stroke();
  }

  // Outer leaflet (outer ring - facing extracellular)
  const outerRingRadius = innerRingRadius + bilayerGap;
  const outerCircumference = 2 * Math.PI * outerRingRadius;
  const outerCount = Math.floor(outerCircumference / (circleRadius * 2.4));

  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const px = cx + Math.cos(angle) * outerRingRadius;
    const py = cy + Math.sin(angle) * outerRingRadius;
    // Head
    ctx.beginPath();
    ctx.arc(px, py, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (pointing inward)
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(angle) * circleRadius, py - Math.sin(angle) * circleRadius);
    ctx.lineTo(px - Math.cos(angle) * (circleRadius + tailLength), py - Math.sin(angle) * (circleRadius + tailLength));
    ctx.stroke();
  }
}
