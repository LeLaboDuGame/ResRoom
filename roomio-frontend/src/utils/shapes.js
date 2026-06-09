/* Calcule les coordonnées normalisées d'une forme géométrique et son centroïde.
   La forme est centrée sur l'origine et mise à l'échelle pour tenir dans [-0.5, 0.5]. */
export function getShapePolygon(shape) {
    if (!shape || typeof shape !== "object") return { points: [], centroid: { x: 0, y: 0 } };

    let raw;
    switch (shape.type) {
        case "square": {
            const s = shape.taille || 10;
            raw = [
                { x: 0, y: 0 },
                { x: s, y: 0 },
                { x: s, y: s },
                { x: 0, y: s },
            ];
            break;
        }
        case "rectangle": {
            const w = shape.L1 || 10;
            const h = shape.L2 || 10;
            raw = [
                { x: 0, y: 0 },
                { x: w, y: 0 },
                { x: w, y: h },
                { x: 0, y: h },
            ];
            break;
        }
        case "triangle": {
            const L1 = shape.L1 || 10;
            const L2 = shape.L2 || 10;
            const angleRad = (shape.angle || 60) * Math.PI / 180;
            raw = [
                { x: 0, y: 0 },
                { x: L1, y: 0 },
                { x: L2 * Math.cos(angleRad), y: L2 * Math.sin(angleRad) },
            ];
            break;
        }
        default:
            return { points: [], centroid: { x: 0, y: 0 } };
    }

    const xs = raw.map(p => p.x);
    const ys = raw.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rawW = maxX - minX || 1;
    const rawH = maxY - minY || 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const norm = 1 / Math.max(rawW, rawH);

    const rawCentroid = {
        x: xs.reduce((a, b) => a + b, 0) / xs.length,
        y: ys.reduce((a, b) => a + b, 0) / ys.length,
    };

    // Points normalisés centrés sur l'origine
    const points = raw.map(p => ({
        x: (p.x - cx) * norm,
        y: (p.y - cy) * norm,
    }));

    // Centroïde normalisé
    const centroid = {
        x: (rawCentroid.x - cx) * norm,
        y: (rawCentroid.y - cy) * norm,
    };

    return { points, centroid };
}

/* Convertit un tableau de points en chaîne pour l'attribut SVG points */
export function shapePointsToAttr(points) {
    return points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
}
