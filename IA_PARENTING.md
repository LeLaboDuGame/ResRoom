# IA_PARENTING — RoomIO

> Tout ce qu'une IA doit savoir pour reprendre ce projet sans rien casser.

---

## 1. VUE D'ENSEMBLE

RoomIO est une application de réservation de salles de réunion avec :
- Plan d'étage interactif (SVG avec pan/zoom)
- Mode tablette dédié par salle (`/fleet/:roomName`)
- Panneau d'administration (CRUD salles, réglages, historique)
- Thème sombre avec 3 breakpoints

**Stack** :
- **Frontend** : React + Vite + Chakra UI v3.35
- **Backend** : FastAPI (Python) + fichier JSON comme base de données
- **Routes** : React Router v6

---

## 2. ARCHITECTURE

```
RoomIO/
├── backend/                    # API Python FastAPI
│   ├── api.py                  # Routes et logique métier
│   ├── config.py               # Constantes (DB_FILE, DATE_FORMAT)
│   ├── db.py                   # Database() — thread-safe JSON loader/saver
│   ├── database.json           # Données (rooms + settings)
│   ├── log.txt                 # Logs
│   └── test_api.http           # Fichier de test REST
│
└── roomio-frontend/            # Application React
    ├── public/rooms/           # Photos des salles (JPEG)
    ├── src/
    │   ├── api/
    │   │   └── apiCall.js        # 11 fonctions API (fetch, CRUD réservations/salles)
    │   │
    │   ├── assets/
    │   │   ├── BureauShape.svg # Plan d'étage complet (2048×2048, noir sur transparent)
    │   │   └── plan/
    │   │       └── plan.json   # Rooms avec zones (shape + position) + walls
    │   │
    │   ├── components/
    │   │   ├── admin/          # AdminTabs, RoomsTab, SettingsTab, HistoryTab
    │   │   ├── booking/        # BookingButton, BookingForm, DeleteModal
    │   │   ├── floorplan/      # FloorPlan (SEUL composant — plus de usePlan)
    │   │   ├── room/           # MeetingProgress, Calendar, RoomInfoPanel, RoomStatusCard
    │   │   └── ui/             # Clock, StatusBadge, FilterBar, LoadingSkeleton, EmptyState
    │   │
    │   ├── config/
    │   │   ├── old/floorPlanZones.js   # ANCIEN — plus utilisé, gardé pour référence
    │   │   ├── settings.js             # Constantes (INACTIVITY_TIMEOUT, POLL_INTERVAL, etc.)
    │   │   └── theme.js                # Chakra system — dark theme avec tokens raw* + semantic
    │   │
    │   ├── hooks/
    │   │   ├── useClock.js     # Horloge temps réel
    │   │   └── useRooms.js     # useRooms() + useRoom(name) avec polling
    │   │   # NOTE: usePlan.js SUPPRIMÉ — plan.json importé statiquement dans FloorPlan
    │   │
    │   ├── pages/
    │   │   ├── Admin.jsx       # AdminTabs
    │   │   ├── Dashboard.jsx   # Plan + panel latéral (RoomInfo + Calendar)
    │   │   ├── Debug.jsx       # Tests UI/API/FloorPlan
    │   │   ├── FleetRoom.jsx   # Mode tablette (RoomView + BookingFlow)
    │   │   └── old/            # Pages obsolètes (à ignorer)
    │   │
    │   ├── utils/
    │   │   ├── shapes.js       # getShapePolygon() + shapePointsToAttr()
    │   │   └── floorPlan.jsx   # ANCIEN Pipeline A — à ignorer
    │   │   # NOTE: planUtils.js SUPPRIMÉ (plan.json intégré dans FloorPlan)
    │   │
    │   ├── App.jsx             # Routes (/, /debug, /fleet/:roomName, /admin)
    │   └── main.jsx            # Point d'entrée React + ChakraProvider avec le system
    │
    ├── package.json
    └── vite.config.js          # Proxy /api → localhost:8000
```

---

## 3. BACKEND

### 3.1. database.json

```json
{
  "rooms": [
    {
      "name": "Howard Hughes",
      "elements": { "capacity": 8, "tv": true, "whiteboard": true, "computer": true },
      "reservations": []
    },
    // ... autres rooms
  ],
  "settings": {
    "dayStart": 7,
    "dayEnd": 22,
    "startingSoonBefore": 15,
    "finishingSoonBefore": 15
  }
}
```

Chaque réservation a : `{ start, end, title, reserved_by, uid }` (uid généré par uuid4()).
Les salles n'ont PLUS de champ `size` (supprimé en Phase 1).
Les réservations sont triées par start DESC.

### 3.2. Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/room/fetch/all` | Toutes les salles |
| GET | `/api/room/fetch/name/{name}` | Une salle par nom |
| POST | `/api/reservation/create/{name}` | Crée une réservation |
| POST | `/api/reservation/remove/{name}/{uid}` | Supprime une réservation |
| PUT | `/api/room/update/{name}` | Modifie metadata (name, capacity, tv, whiteboard, computer) |
| POST | `/api/room/create/{name}` | Crée une nouvelle salle (par défaut capacity=1, tout false) |
| DELETE | `/api/room/delete/{name}` | Supprime une salle |
| GET | `/api/reservations/history` | Toutes les réservations (passées + futures) avec room name |
| GET | `/api/settings` | Récupère les settings |
| POST | `/api/settings` | Modifie les settings |
| POST | `/api/room/upload-photo/{name}` | Upload photo → `public/rooms/{name}.jpeg` |

### 3.3. Lancement du backend

```bash
cd backend
../.venv/bin/python3 api.py
# ou uvicorn api:app --reload --port 8000
```

### 3.4. Config backend (`config.py`)

```python
DATE_FORMAT = '%Y-%m-%d %H:%M'  # Format obligatoire pour toutes les dates
```

---

## 4. COMPOSANTS FRONTEND — DÉTAIL COMPLET

### 4.1. `api/apiCall.js` — 11 fonctions API

Toutes utilisent `import.meta.env.VITE_API_URL` comme base.
Aucun état, pas de React — juste des fetchs.

| Fonction | Endpoint | Retour |
|----------|----------|--------|
| `fetchRooms()` | GET `/api/room/fetch/all` | `{ rooms: [...] }` |
| `fetchRoom(name)` | GET `/api/room/fetch/name/{name}` | `{ room: {...} }` |
| `createReservation(name, {start, end, title, reserved_by})` | POST | `{ message, reservation }` |
| `deleteReservation(name, uid)` | POST | `{ message }` |
| `updateRoom(name, {name?, capacity?, tv?, whiteboard?, computer?})` | PUT | `{ message, room }` |
| `uploadPhoto(name, file)` | POST | `{ message, filename }` |
| `fetchHistory()` | GET | `{ reservations: [...] }` |
| `fetchSettings()` | GET | `{ settings: {...} }` |
| `updateSettings({dayStart?, dayEnd?, ...})` | POST | `{ message, settings }` |
| `createRoom(name)` | POST | `{ message, room }` |
| `deleteRoom(name)` | DELETE | `{ message }` |

### 4.2. `hooks/useRooms.js`

```js
useRooms()    → { rooms, loading, error }   // Polling toutes les 30s
useRoom(name) → { room, loading, error }     // Polling toutes les 30s
```

**IMPORTANT** : `useRoom()` déstructure le retour : `const { room } = await fetchRoom(name)`. Si le backend renvoie `{ room: {...} }`, ne pas stocker `data.room` dans `data`.

### 4.3. `components/floorplan/FloorPlan.jsx` — LE plan interactif

**Props** :
```js
rooms          // Array — données API complètes (avec reservations)
selectedRoom   // string|null — nom de la salle sélectionnée
dimmedRooms    // string[]|null — noms des salles à garder à pleine opacité
onRoomClick    // fn(name) — callback quand l'utilisateur clique
```

**Comportement interne** :
- Importe `planData` statiquement depuis `../../assets/plan/plan.json`
- Extrait les rooms avec champ `zone` (shape + x + y + size + rot + z)
- Calcul du statut (Free/StartingSoon/Meeting/FinishingSoon) depuis les réservations
- Couleurs : Free=blanc, StartingSoon=bleu, Meeting=rouge, FinishingSoon=rose
- Fond : `rect #151518` + `image BureauShape.svg` avec `filter: invert(0.92)`
- Salles superposées sous forme de polygones SVG

**Pan/Zoom** :
- Pointer events (unified mouse + touch) avec seuil 5px avant activation
- `touchAction: "none"` + `userSelect: "none"` + `draggable={false}`
- Roue : zoom vers curseur via `addEventListener('wheel', handler, { passive: false })`
- Double-clic : reset viewBox à `0 0 2048 2048`
- Sélection d'une salle : zoom auto centré sur `size * 3.5`
- `vectorEffect="non-scaling-stroke"` sur le polygon (évite stroke × 300)

**COORDINATION AVEC plan.json** :
```js
planData.floors[0].rooms.filter(r => r.zone).map(r => ({
  name: r.name,           // "Youri Gargarine" (avec espaces)
  shape: r.zone.shape,    // { type, L1, L2, angle? }
  x: r.zone.x,            // Position en SVG coords (0-2048)
  y: r.zone.y,
  size: r.zone.size,      // Échelle (150-300)
  rot: r.zone.rot,
  z: r.zone.z,
}))
```

**HISTORIQUE DES BUGS CORRIGÉS** :
1. ~~`usePlan` hook supprimé — plan.json importé directement~~
2. ~~Passive wheel listener — `useEffect` + `{ passive: false }`~~
3. ~~BureauShape invisible — `filter: invert(0.92)` sur l'image~~
4. ~~Drag sur PC — `draggable={false}` + `userSelect: "none"`~~
5. ~~Pan tactile — pointer events au lieu de mouse~~
6. ~~Crash drag→room — capture `vbX, vbY, mx, my` avant `setVb()`~~
7. ~~Bordures × 300 — `vectorEffect="non-scaling-stroke"`~~

### 4.4. `components/room/*`

**RoomStatusCard** : Photo (depuis `/rooms/{name}.jpeg`) + nom + capacité + équipements + statut + MeetingProgress.

**RoomInfoPanel** : Nom + capacité + TV/Whiteboard/PC (icônes Lucide) dans un `bg.elevated`.

**Calendar** : Liste des réservations du jour (future ou en cours), format `HH:MM - HH:MM`.

**MeetingProgress** : Barre de progression pour la réunion en cours. Utilise `timeToPercent` de timelineUtils (⚠️ timelineUtils importe `colorTheme` qui n'existe pas — mais n'est plus importé par les composants actifs).

### 4.5. `components/booking/*`

**BookingButton** : Bouton +/default. Props : `roomName` (navigue vers booking), `isActive`.

**BookingForm** : Formulaire transparent sur le plan. Start/end (arrondi à 5min), titre, réservé par. Validation : start > now, end > start, pas de chevauchement. `onSuccess`, `onCancel`.

**DeleteModal** : Modal focus trap avec confirmation "oui". Props : `isOpen`, `onConfirm`, `onCancel`, `title`.

### 4.6. `components/admin/*`

**AdminTabs** : Tabs (Rooms, Settings, History).
**RoomsTab** : Tableau éditable des salles. Nom, capacité, TV/WB/PC toggles. "Ajouter" input + bouton. Suppression par ligne avec confirmation. Suit les noms originaux via `_origName` pour l'API update.
**SettingsTab** : dayStart, dayEnd en `input type="time"`. Validation `start < end`.
**HistoryTab** : Calendrier + liste des réservations passées/futures. Bouton supprimer avec confirmation.

### 4.7. `components/ui/*`

**Clock** : Horloge HH:MM (useClock hook).
**StatusBadge** : 4 statuts (Free, Starting Soon, Meeting, Finishing Soon) avec couleurs.
**FilterBar** : Capacité + TV/WB/PC checkboxes. Props : `onFilterChange`.
**LoadingSkeleton** : text, circle, card. Injection `<style>` pour keyframes pulse.
**EmptyState** : Icon + title + description centrés.

---

## 5. PAGES

### 5.1. Dashboard (`/`)

- FloorPlan plein écran + panel droit 420px (RoomInfoPanel + Calendar dans `bg.elevated`, BookingForm transparent en dessous)
- Clique sur salle → ouvre panel, reclique → ferme
- Mobile : bottom tabs (Plan/Admin) + bottom sheet 70% + backdrop

### 5.2. FleetRoom (`/fleet/:roomName`) — Mode tablette

**RoomView** (défaut) : 50/50 — RoomStatusCard gauche, Calendar droite, BookingButton en bas à droite.
**BookingFlow** : 35/65 — FilterBar + RoomInfoPanel + BookingForm gauche, FloorPlan interactif droit (salles filtrées dimmées).
**Inactivité** : 15min (click/touch) → navigue vers `/`.

### 5.3. Admin (`/admin`)

AdminTabs uniquement.

### 5.4. Debug (`/debug`)

3 tabs : UI Components, API Tests, Floor Plan.

---

## 6. THÈME SOMBRE — CHAKRA UI v3

Le theme utilise `createSystem()` + `mergeConfigs(defaultConfig, customConfig)`.

**Règle CRITIQUE** : Chakra v3 ne permet pas les self-references dans les tokens. On utilise donc des tokens `raw*` (ex: `rawBg.primary`) et les semanticTokens y font référence avec `{colors.rawBg.primary}`.

```js
tokens: {
  colors: {
    rawBg: { primary: { value: "#0a0a0b" }, ... },
    rawText: { primary: { value: "#f5f5f7" }, ... },
    rawAccent: { default: { value: "#4f8cff" }, ... },
    rawStatus: { free: { value: "#34d399" }, ... },
    // etc.
  },
  radii: { sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "9999px" },
  shadows: { sm/md/lg/xl },
},
semanticTokens: {
  colors: {
    bg: { primary: { value: "{colors.rawBg.primary}" }, ... },
    text: { primary: { value: "{colors.rawText.primary}" }, ... },
    accent: { default: { value: "{colors.rawAccent.default}" }, ... },
    status: { free: { value: "{colors.rawStatus.free}" }, ... },
    // ...
  },
},
breakpoints: { sm: "640px", md: "1024px", lg: "1200px" },
```

**Breakpoints** :
- Desktop : ≥1200px
- Tablet : 640–1199px
- Mobile : <640px

---

## 7. CONVENTIONS DE CODE

### 7.1. Commits — Conventional Commits

Format : `type(scope): description`
- Types : `feat`, `fix`, `style`, `chore`
- Scopes : `api`, `hook`, `page`, `ui`, `plan`, `room`, `booking`, `admin`, `theme`, `floorplan`
- Exemple : `feat(floorplan): interactive plan with pan/zoom and BureauShape background`

**NE JAMAIS** inclure d'ID d'issue.

### 7.2. Conventions générales

- Pas de commentaires dans le code (sauf JSDoc pour les fonctions exportées)
- Import React Router : `import { useNavigate } from "react-router-dom"`
- Icônes : `lucide-react`
- Switch Chakra : pattern compound obligatoire
  ```jsx
  <Switch.Root checked={value} onCheckedChange={fn}>
    <Switch.Control><Switch.Thumb /></Switch.Control>
  </Switch.Root>
  ```
- `useState` pour l'état local, `useRef` pour les valeurs qui changent sans re-render (ex: panRef, vbRef pour éviter les closures périmées)

### 7.3. Tests

L'utilisateur teste lui-même chaque étape avant de commit. **Ne pas commit sans que l'utilisateur ait explicitement testé et approuvé.**

### 7.4. Commandes

```bash
npm run dev      # Lance le serveur de dev Vite
npm run build    # Build production (toujours faire ça avant de dire "fini")
```

---

## 8. PLAN.DÉTAILLÉ — LE SYSTÈME DE PLAN D'ÉTAGE

### 8.1. BureauShape.svg

- Fichier : `src/assets/BureauShape.svg`
- viewBox : `0 0 2048 2048`
- Contenu : chemins SVG noirs `fill="rgb(0,0,0)"` sur fond transparent
- Représente : les murs et la structure du bâtiment
- Dans FloorPlan : `filter: invert(0.92)` pour le rendre visible (noir → blanc) + `rect #151518` derrière

### 8.2. plan.json

- Fichier : `src/assets/plan/plan.json`
- Contient : walls (coordonnées négatives — issus d'un outil externe, pas utilisées), rooms (avec champ `zone` pour le positionnement)
- 7 rooms avec zone : Howard Hughes, Ken Miles, Youri Gargarine, NoName 1-4
- Le champ `zone` de chaque room :
  ```json
  {
    "shape": { "type": "rectangle", "L1": 1.4, "L2": 2 },
    "x": 581,
    "y": 1874,
    "size": 300,
    "rot": 90,
    "z": 1
  }
  ```
- Les noms dans plan.json utilisent des espaces (ex: "Youri Gargarine") pour correspondre aux noms API

### 8.3. Pourquoi deux systèmes ont été fusionnés

- **Pipeline A** (ancien `utils/floorPlan.jsx`) : BureauShape background + 7 rooms depuis `floorPlanZones.js` — pas de zoom/pan, jamais utilisé dans les pages actives
- **Pipeline B** (ancien `components/floorplan/RoomShape/WallLayer`) : 1 seul room (Youri) + murs depuis plan.json — pas de background, pas de zoom/pan
- **Solution** : Fusion dans un seul `FloorPlan.jsx` qui lit `plan.json` pour les zones + BureauShape pour le fond + pan/zoom

### 8.4. Fichiers supprimés (ne plus utiliser)

- `hooks/usePlan.js`
- `utils/planUtils.js`
- `components/floorplan/WallLayer.jsx`
- `components/floorplan/RoomShape.jsx`
- `config/floorPlanZones.js` (déplacé dans `config/old/`)
- `config/colorTheme.jsx` (n'existe pas — ne pas recréer)

---

## 9. ÉTAT ACTUEL (Juin 2026)

### 9.1. Fait

- Phase 1-6 : Structure, composants, hooks, backend
- Phase 7.1 : Dashboard (plan plein écran + panel droit + mobile)
- Phase 7.2 : FleetRoom (RoomView + BookingFlow + inactivité)
- Phase 7.3 : Admin (RoomsTab CRUD + SettingsTab + HistoryTab)
- Phase 7.3+ : Plan interactif (BureauShape + pan/zoom + sélection)

### 9.2. Prochaines étapes (priorité)

1. **Phase 8 — Layouts responsive** : Header, AppShell, FleetShell, mobile layout
2. **Phase 9 — Refinements** : responsive tweaks, accessibility pass
3. **Phase 10 — Polish** : animations, edge cases

### 9.3. Bugs connus

- `database.json` a DEUX rooms "NoName 1" (doublon backend)
- `utils/timelineUtils.jsx` importe `colorTheme` qui n'existe pas — mais ce fichier n'est plus importé par aucun composant actif (uniquement `pages/old/`)
- Les anciens `pages/old/` ne sont plus utilisés mais sont conservés

---

## 10. COMMENT INTERAGIR AVEC L'UTILISATEUR

- **Langue** : en
- **Tonalité** : directe, concise, technique. Réponses ≤4 lignes sauf si l'utilisateur demande des détails.
- **Préférences** :
  - L'utilisateur lit le code et comprend tout
  - Il ne veut PAS de commentaires dans le code
  - Il ne veut PAS d'explications superflues (juste "fait", pas "voici ce que j'ai fait")
  - Il demande lui-même des explications quand il en veut
  - Il teste chaque étape avant de commit
  - NE JAMAIS commit sans son accord explicite
  - Toujours faire `npm run build` avant de dire que c'est fini
  - Ne PAS créer de fichiers markdown (*.md) ou README sauf demande explicite
  - Ne PAS utiliser d'émojis
  - Quand il signale un bug, proposer immédiatement une solution technique

- **Quand l'utilisateur dit** "explique ce que tu as fait" → répondre en français, en bullet points, très concis
- **Quand l'utilisateur dit** "Continue if you have next steps" → ne PAS demander de clarification, exécuter
- **Quand l'utilisateur dit** "make my commit message" → proposer UNE ligne, format Conventional Commits

- **NE PAS** demander la permission pour des choses évidentes (ex: "puis-je modifier ce fichier ?")
- **NE PAS** ajouter de commentaires ou documentation sauf demande explicite
- **TOUJOURS** vérifier les conventions du code existant avant d'écrire du nouveau code

### 10.1. Réponses types

L'utilisateur signale une erreur → lire l'erreur, identifier la cause racine, proposer une correction immédiate.
L'utilisateur demande un commit → proposer `type(scope): description` en une ligne.
L'utilisateur demande une modification → modifier le minimum de fichiers possible.

---

## 11. CONFIGURATION DE DÉVELOPPEMENT

### 11.1. variables d'environnement

Frontend : `VITE_API_URL` (dans `.env` ou système)
Backend : tourne sur port 8000

### 11.2. Proxy Vite

```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

### 11.3. Python

Le venv se trouve dans `../.venv/bin/python3` (relatif à backend/).

---

## 12. POINTS D'ATTENTION SPÉCIFIQUES

1. **Les noms de salles** : toujours avec espaces (ex: "Howard Hughes", "Youri Gargarine"). Pas de underscores (sauf dans l'URL codée). `plan.json` utilise des espaces.
2. **Photos** : dans `public/rooms/{name}.jpeg`, servies à `/rooms/{name}.jpeg`
3. **`useRoom()`** retourne `{ room: {...} }` — déstructurer `const { room } = ...`
4. **Le Switch** Chakra v3 doit utiliser le pattern compound, PAS un simple `<Switch />`
5. **Thème** : utiliser les semanticTokens (ex: `color="text.primary"`, `bg="bg.elevated"`)
6. **Pas de size** : les salles n'ont plus de champ `size`, seulement `elements.capacity`
7. **État de panique** : `vbRef.current = vb` avant chaque render (ligne 48 de FloorPlan.jsx)
8. **Animation keyframes** : injectées via `<style>` tag (LoadingSkeleton)

---

## 13. RÈGLE ABSOLUE

**NE JAMAIS commit ou push** sans que l'utilisateur ait explicitement dit "oui, commit" ou ait testé et approuvé les changements.
