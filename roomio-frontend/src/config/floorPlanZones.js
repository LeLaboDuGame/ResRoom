/* Définition des zones cliquables du plan d'étage.
   Chaque zone associe un nom de salle à une forme géométrique,
   sa position (x, y), son échelle (size), sa rotation (rot)
   et son calque (z). */

const floorPlanZones = [
    {
        name: "Howard Hughes",
        shape: { type: "square", taille: 50 },
        x: 143,
        y: 133,
        size: 30,
        rot: 48,
        z: 1,
    },
    {
        name: "NONAME",
        shape: { type: "triangle", L1: 1, L2: 1.4, angle: 90 },
        x: 255,
        y: 50,
        size: 40,
        rot: -90-35,
        z: 1,
    },
    {
        name: "Youri Gargarine",
        shape: { type: "rectangle", L1: 2, L2: 1 },
        x: 232,
        y: 165,
        size: 60,
        rot: 90+49,
        z: 1,
    },
];

export default floorPlanZones;
