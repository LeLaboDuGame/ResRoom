/* Définition des zones cliquables du plan d'étage.
   Chaque zone associe un nom de salle à une forme géométrique,
   sa position (x, y), son échelle (size), sa rotation (rot)
   et son calque (z). */

const floorPlanZones = [
    {
        name: "Howard Hughes",
        shape: {type: "rectangle", L1: 1.4, L2: 2},
        x: 581,
        y: 1874,
        size: 300,
        rot: 90,
        z: 1,
    },
    {
        name: "Ken Miles",
        shape: {type: "triangle", L1: 1.2, L2: 1.5, angle: 90},
        x: 1305.6,
        y: 1350,
        size: 220,
        rot: -90,
        z: 1,
    },
    {
        name: "Youri Gargarine",
        shape: {type: "rectangle", L1: 1.1, L2: 1.3},
        x: 540,
        y: 1303,
        size: 270,
        rot: 0,
        z: 1,
    },

    {
        name: "NoName 1",
        shape: {type: "triangle", L1: 1.3, L2: 1.5, angle: 90},
        x: 1090,
        y: 1170,
        size: 220,
        rot: -90,
        z: 1,
    },
    {
        name: "NoName 2",
        shape: {type: "rectangle", L1: 1, L2: 0.65},
        x: 1405,
        y: 1555,
        size: 150,
        rot: 0,
        z: 1,
    },
    {
        name: "NoName 3",
        shape: {type: "rectangle", L1: 1, L2: 0.7},
        x: 1405,
        y: 1647,
        size: 150,
        rot: 0,
        z: 1,
    },
    {
        name: "NoName 4",
        shape: {type: "rectangle", L1: 1.05, L2: 0.6},
        x: 332,
        y: 1848,
        size: 200,
        rot: 0,
        z: 1,
    },
];

export default floorPlanZones;
