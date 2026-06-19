# ResRoom — Roadmap de Refonte UX/UI

## Vision

ResRoom est une plateforme de réservation de salles de réunion composée :
- D'un **backend** FastAPI (Python) avec base de données JSON
- D'un **frontend** React 19 + Chakra UI v3 + React Router v7 + Vite

Cette roadmap détaille la refonte complète de l'interface utilisateur pour atteindre un niveau professionnel (Linear, Notion, Stripe Dashboard).

## Principes directeurs

1. **Accessibilité** — WCAG AA, navigation clavier, screen readers
2. **Zéro scroll** — Tout le contenu tient dans la viewport
3. **Responsive** — 3 breakpoints : desktop, tablette, mobile
4. **Mode tablette dédiée** — Chaque tablette en salle affiche sa salle via `/fleet/:roomName`
5. **Inactivité** — 15 min sans interaction → retour à l'écran racine de la tablette
6. **Palette sombre** — Fond `#0a0a0b`, accent bleu `#4f8cff`, contrastes forts

---

## Phase 1 — Structure du projet & configuration

### 1.1 Créer l'arborescence des dossiers

- [x] Créer `src/api/`
- [ ] Créer `src/components/layout/`
- [x] Créer `src/components/floorplan/`
- [x] Créer `src/components/room/`
- [x] Créer `src/components/booking/`
- [x] Créer `src/components/admin/`
- [x] Créer `src/components/ui/`
- [x] Créer `src/hooks/`
- [x] Créer `src/pages/Dashboard.jsx`
- [x] Créer `src/pages/FleetRoom.jsx`
- [x] Créer `src/pages/Admin.jsx`
- [x] Conserver `src/pages/old/` intact

### 1.2 Palette de couleurs sombre

- [x] Créer `src/config/theme.js` avec les tokens :
  - `bg.primary: #0a0a0b`
  - `bg.secondary: #141416`
  - `bg.elevated: #1c1c1f`
  - `border: #2c2c30`
  - `text.primary: #f5f5f7`
  - `text.secondary: #a0a0ab`
  - `text.muted: #6b6b76`
  - `accent.default: #4f8cff`
  - `accent.hover: #3b72e3`
  - `accent.muted: #1a3366`
  - `status.free: #34d399`
  - `status.startingSoon: #fbbf24`
  - `status.meeting: #f87171`
  - `status.finishingSoon: #fb923c`
  - `danger: #f87171`
  - `overlay: rgba(0,0,0,0.6)`
- [x] Supprimer l'ancien `src/config/colorTheme.jsx`
- [x] Mettre à jour `main.jsx` pour utiliser le nouveau thème Chakra

### 1.3 Constantes d'application

- [x] Créer `src/config/settings.js` :
  - `STATUS_BEFORE: 15`
  - `DAY_START: 8`
  - `DAY_END: 20`
  - `INACTIVITY_TIMEOUT: 15`
  - `POLL_INTERVAL: 30000`

### 1.4 Mettre à jour les routes

- [x] Modifier `src/App.jsx` :
  - `/` → `Dashboard`
  - `/fleet/:roomName` → `FleetRoom`
  - `/admin` → `Admin`
- [x] Conserver `react-router-dom` v7

---

## Phase 2 — Backend

### 2.1 Supprimer le champ `size` des rooms

- [x] Modifier `backend/api.py` : retirer `size` des retours API
- [x] Modifier `backend/database.json` : supprimer `size` de chaque room
- [x] Ne conserver que `elements.capacity`

### 2.2 Ajouter les settings dans database.json

- [x] Ajouter une clé `settings` dans `database.json` :
  ```json
  "settings": {
    "dayStart": 8,
    "dayEnd": 20,
    "startingSoonBefore": 15,
    "finishingSoonBefore": 15
  }
  ```
- [x] Charger les settings au démarrage du backend
- [x] Les exposer dans les endpoints existants

### 2.3 Nouveaux endpoints

- [x] `PUT /api/room/update/{room_name}` — Modifier nom, capacité, équipements
- [x] `GET /api/reservations/history` — Toutes les réservations (filtrée, paginée)
- [x] `POST /api/settings` — Modifier dayStart, dayEnd, thresholds
- [x] `POST /api/room/upload-photo/{room_name}` — Upload multipart d'image

### 2.4 Mettre à jour les tests API

- [x] Ajouter les nouveaux endpoints dans `backend/test_api.http`

---

## Phase 3 — API Client & Hooks

### 3.1 API Client

- [x] Créer `src/api/apiCall.js` avec les fonctions :
  - `fetchRooms()`
  - `fetchRoom(name)`
  - `createReservation(roomName, data)`
  - `deleteReservation(roomName, uid)`
  - `updateRoom(name, data)`
  - `uploadPhoto(name, file)`
  - `fetchHistory(params)`
  - `updateSettings(data)`
- [x] Gestion d'erreur centralisée
- [x] Base URL depuis `VITE_API_URL`

### 3.2 Hook useRooms

- [x] Créer `src/hooks/useRooms.js` :
  - State : `rooms`, `loading`, `error`
  - Fetch initial + polling 30s
  - Cleanup au démontage

### 3.3 Hook usePlan (SUPPRIMÉ — plan.json importé statiquement dans FloorPlan)

- [x] Créer `src/hooks/usePlan.js` :
  - State : `walls`, `roomPolygons`, `background`, `loading`
  - Fetch `assets/plan/plan.json` au montage (une fois)
  - Parse via `planUtils.parsePlan()`

---

## Phase 4 — Utilitaires

### 4.1 Utility planUtils (SUPPRIMÉ — logique intégrée dans FloorPlan)

- [x] Créer `src/utils/planUtils.js` :
  - Fonction `parsePlan(json)` → `{ background, walls, roomPolygons }`
  - Convertir les walls (start/end) en lignes SVG
  - Calculer les polygones des rooms à partir des wall IDs
  - Normaliser les coordonnées pour la viewBox SVG

### 4.2 Conserver les utilitaires existants

- [x] `src/utils/timelineUtils.js` — inchangé
- [x] `src/utils/shapes.js` — inchangé

---

## Phase 5 — Composants UI atomiques

### 5.1 Clock

- [x] Créer `src/components/ui/Clock.jsx`
- [x] Affiche HH:MM:SS temps réel via `useClock`
- [x] Style : `text.secondary`, responsive

### 5.2 StatusBadge

- [x] Créer `src/components/ui/StatusBadge.jsx`
- [x] Props : `status`
- [x] Fond coloré selon statut, dot indicatrice, texte en français
- [x] `borderRadius: full`, compact

### 5.3 FilterBar

- [x] Créer `src/components/ui/FilterBar.jsx`
- [x] Input capacité minimum + checkboxes TV/Tableau/PC
- [x] Callback `onFilterChange`

### 5.4 LoadingSkeleton

- [x] Créer `src/components/ui/LoadingSkeleton.jsx`
- [x] Variantes : card, text, circle
- [x] Animation pulse, support `prefers-reduced-motion`

### 5.5 EmptyState

- [x] Créer `src/components/ui/EmptyState.jsx`
- [x] Props : `icon`, `title`, `description`
- [x] Message centré quand aucune donnée

---

## Phase 6 — Composants métier

### 6.1 FloorPlan

- [x] ~~Créer `src/components/floorplan/WallLayer.jsx`~~ (fusionné dans FloorPlan)
- [x] ~~Créer `src/components/floorplan/RoomShape.jsx`~~ (fusionné dans FloorPlan)
- [x] Créer `src/components/floorplan/FloorPlan.jsx` :
  - Rendu SVG complet (BureauShape background + salles polygon)
  - Pan/Zoom (pointer events, wheel, double-click reset)
  - Click salle → callback `onRoomClick`
  - Surbrillance salle sélectionnée
  - Opacité réduite salles hors filtre
  - `role="button"`, `aria-label`, navigation clavier

### 6.2 Room

- [x] Créer `src/components/room/MeetingProgress.jsx` :
  - Cercle SVG proportionnel au temps écoulé
  - Texte au centre : temps restant
- [x] Créer `src/components/room/Calendar.jsx` :
  - Liste verticale des réservations du jour
  - Bouton × pour supprimer (via DeleteModal)
  - `overflow-y` contenu, pas de scroll page
- [x] Créer `src/components/room/RoomInfoPanel.jsx` :
  - Nom, capacité, équipements avec icônes Lucide
- [x] Créer `src/components/room/RoomStatusCard.jsx` :
  - Photo salle avec overlay coloré (ou fond uni si pas de photo)
  - Gros bouton [+] si libre/starting soon
  - Cercle MeetingProgress si meeting en cours
  - Heure + date en haut

### 6.3 Booking

- [x] Créer `src/components/booking/BookingButton.jsx` :
  - Variante 'plus' : gros cercle semi-transparent
  - Variante 'default' : bouton standard "Réserver"
  - `min-width: 44px`, `min-height: 44px`
- [x] Créer `src/components/booking/BookingForm.jsx` :
  - Champs : date, début, durée, titre, nom
  - Validation + détection chevauchement côté client
  - Appel API `createReservation()`
- [x] Créer `src/components/booking/DeleteModal.jsx` :
  - Overlay + modale centrée
  - Champ "Oui" pour confirmer
  - Focus trap, gestion clavier

### 6.4 Admin

- [x] Créer `src/components/admin/AdminTabs.jsx` :
  - Conteneur à 4 onglets avec routing interne
  - `role="tablist"`, `aria-selected`
- [x] Créer `src/components/admin/RoomsTab.jsx` :
  - Tableau éditable : nom, capacité, équipements, photo upload
- [x] Créer `src/components/admin/SettingsTab.jsx` :
  - Inputs : dayStart, dayEnd, startingSoonBefore, finishingSoonBefore
- [x] Créer `src/components/admin/HistoryTab.jsx` :
  - Tableau : date, salle, titre, personne, suppression
  - Filtres : salle, date, recherche texte

---

## Phase 7 — Pages

### 7.1 Dashboard

- [x] Desktop : plan SVG occupant tout l'écran + panel coulissant droit
- [x] Click salle → panel avec RoomInfoPanel + Calendar + BookingForm
- [x] Mobile : bottom tabs (Plan, Admin)
- [x] Tab Plan : FloorPlan plein écran + bottom sheet au click salle

### 7.2 FleetRoom (tablette dédiée)

- [x] **Vue RoomView** (défaut) :
  - Split gauche/droite 50/50
  - Gauche : RoomStatusCard (photo + statut + heure/date)
  - Droite : Calendar de la salle
  - Bouton Réserver en bas à droite
- [x] **Vue BookingFlow** (après [+]) :
  - Split gauche (35%) / droite (65%)
  - Gauche : FilterBar + RoomInfoPanel + BookingForm
  - Droite : FloorPlan interactif
  - Salle racine pré-sélectionnée
  - Salles filtrées grisées
  - Click autre salle → mise à jour du formulaire
- [x] **Inactivité 15 min** :
  - Timer reset à chaque interaction
  - Après 15 min → navigate(`/fleet/${initialRoomName}`, replace)
- [x] Polling 30s pour mise à jour statut/réservations

### 7.3 Admin

- [x] Header simple + contenu plein écran
- [x] 3 onglets (Salles, Paramètres, Historique)
- [x] Fonctionnel sur tous les devices

---

## Phase 8 — Layouts responsive

### 8.1 Desktop — AppShell

- [x] Créer `src/components/layout/Header.jsx` :
  - Logo ResRoom (double R), horloge, navigation (Admin, Debug)
  - Fond `bg.secondary`, bordure basse `border`
- [x] Créer `src/components/layout/AppShell.jsx` :
  - `height: 100vh; overflow: hidden`
  - Header + plan plein écran + panel coulissant droit (420px)
  - Fond semi-transparent derrière le panel

### 8.2 Tablette dédiée — FleetShell

- [ ] Créer `src/components/layout/FleetShell.jsx` :
  - `height: 100vh; overflow: hidden`
  - Split vertical dynamique selon vue (50/50 ou 35/65)
  - Transitions fluides entre vues

### 8.3 Mobile — MobileShell

- [ ] Créer `src/components/layout/MobileShell.jsx` :
  - `height: 100dvh; overflow: hidden`
  - Bottom tab bar fixe (Plan, Admin)
  - Contenu plein écran par tab

### 8.4 Breakpoints

- [ ] Définir dans le thème : `sm: 640px`, `md: 1024px`, `lg: 1200px`
- [ ] Basculer entre les layouts selon la largeur
- [ ] Hook `useBreakpointValue` de Chakra

---

## Phase 9 — Finalisation

### 9.1 Nettoyage

- [ ] `src/App.css` : supprimer tout sauf les styles globaux nécessaires
- [ ] `src/index.css` : inchangé
- [ ] Vérifier qu'aucun import n'est cassé

### 9.2 Documentation

- [ ] Mettre à jour `README.md` :
  - Architecture du projet
  - Stack technique
  - Lancement dev / prod
  - Routes
  - Mode tablette dédiée
  - Variables d'environnement

### 9.3 Commentaires JSDoc

- [ ] Chaque composant : description + liste des props
- [ ] Chaque fonction utilitaire : description + paramètres + retour
- [ ] Conforme à `DESIGNER_AGENT.md`

### 9.4 Tests

- [ ] Tester tous les endpoints API
- [ ] Tester responsive : desktop 1920×1080, tablette 1024×768, mobile 390×844
- [ ] Tester accessibilité : clavier, contrastes, ARIA
- [ ] Tester fonctionnel : CRUD réservations, filtres, admin, inactivité
