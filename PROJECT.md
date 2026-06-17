# ResRoom — Présentation du Projet

## Contexte

ResRoom est une application web de **réservation de salles de réunion** pour les entreprises. Elle permet aux employés de visualiser la disponibilité des salles en temps réel, de réserver un créneau, et de gérer l'ensemble des réservations depuis une interface centralisée.

Le projet comprend une **tablette dédiée** dans chaque salle de réunion qui affiche le statut en direct et permet une réservation rapide depuis la salle elle-même.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, Chakra UI v3, React Router v7, Vite 8 |
| Backend | FastAPI (Python 3.14) |
| Base de données | Fichier JSON (`backend/database.json`) |
| Icônes | Lucide React |
| Animations | Framer Motion |
| Build | Vite |

---

## Fonctionnalités

### État actuel (avant refonte)

Le projet dispose déjà d'une base fonctionnelle :

- **Dashboard** (`/`) : liste des salles avec timeline visuelle (8h–20h) et plan d'étage SVG
- **Détail salle** (`/rooms/:roomName`) : agenda sur 7 jours, réservation, suppression
- **Filtres** : capacité, équipements (TV, tableau blanc, PC), disponibilité horaire
- **Statuts en temps réel** : Libre, Bientôt, En réunion, Se termine
- **Backend REST** : CRUD complet pour les salles et réservations
- **Détection de chevauchement** : impossible de réserver un créneau déjà pris
- **Plan d'étage SVG** : zones cliquables avec navigation vers la salle

### Refonte en cours (ROADMAP.md)

La refonte vise à :

- Adopter un **thème sombre professionnel** (inspiré de Linear/Notion)
- Rendre l'application **responsive** (desktop, tablette, mobile) avec **zéro scroll**
- Créer un **mode tablette dédiée** via `/fleet/:roomName` avec :
  - Photo de la salle avec overlay coloré selon le statut
  - Cercle de progression pour les réunions en cours
  - Bouton [+] géant pour réserver rapidement
  - Retour automatique après 15 min d'inactivité
- Ajouter une **page Admin** complète :
  - Gestion des salles (nom, capacité, équipements, photo)
  - Configuration des horaires d'ouverture et des seuils de statut
  - Historique des réservations avec filtres et recherche
- Supprimer la notion de taille (`small/medium/large`) au profit de la seule capacité
- Restructurer le code en dossiers modulaires (components, hooks, api, pages)
- Améliorer l'accessibilité (WCAG AA, navigation clavier, ARIA)

---

## Architecture du code (après refonte)

```
ResRoom/
├── backend/                          # API Python FastAPI
│   ├── api.py                        # Endpoints REST
│   ├── config.py                     # Constantes (log, format date)
│   ├── db.py                         # Database JSON (thread-safe)
│   ├── database.json                 # Données : salles, réservations, settings
│   └── test_api.http                 # Tests d'API
│
├── roomio-frontend/                  # Frontend React
│   └── src/
│       ├── api/                      # Appels API centralisés
│       ├── assets/
│       │   ├── plan/plan.json        # Plan d'étage (murs, salles, background)
│       │   └── rooms/                # Photos des salles
│       ├── components/
│       │   ├── layout/               # AppShell, FleetShell, MobileShell, Header
│       │   ├── floorplan/            # FloorPlan SVG, WallLayer, RoomShape
│       │   ├── room/                 # RoomStatusCard, MeetingProgress, Calendar
│       │   ├── booking/              # BookingForm, BookingButton, DeleteModal
│       │   ├── admin/                # AdminTabs, RoomsTab, SettingsTab, HistoryTab
│       │   └── ui/                   # Clock, StatusBadge, FilterBar, Skeleton, EmptyState
│       ├── config/
│       │   ├── theme.js              # Palette sombre et tokens Chakra
│       │   └── settings.js           # Constances applicatives
│       ├── hooks/                    # useRooms, usePlan, useClock
│       ├── pages/
│       │   ├── old/                  # Anciennes pages conservées intactes
│       │   ├── Dashboard.jsx         # Desktop & mobile
│       │   ├── FleetRoom.jsx         # Tablette dédiée
│       │   └── Admin.jsx             # Administration
│       └── utils/                    # planUtils, timelineUtils, shapes
│
├── ROADMAP.md                        # Plan d'implémentation détaillé
├── DESIGNER_AGENT.md                 # Instructions design (Senior Web Designer)
├── StartRoomIOProd.sh                # Script de lancement production
├── package.json                      # Dépendances racine (Chakra UI, Framer)
└── README.md                         # Documentation utilisateur
```

---

## Routes

| URL | Page | Usage |
|---|---|---|
| `/` | Dashboard | Desktop & mobile générique : plan + panel coulissant (desktop) ou bottom tabs (mobile) |
| `/fleet/:roomName` | FleetRoom | Tablette dédiée à une salle : statut + planning (RoomView) ou filtres + plan (BookingFlow) |
| `/admin` | Admin | Gestion des salles, horaires, seuils, historique |

---

## API Backend

### Endpoints existants

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | Message de bienvenue |
| `GET` | `/api/room/fetch/all` | Liste de toutes les salles |
| `GET` | `/api/room/fetch/name/{name}` | Détail d'une salle |
| `POST` | `/api/reservation/create/{name}` | Créer une réservation |
| `POST` | `/api/reservation/remove/{name}/{uid}` | Supprimer une réservation |

### Nouveaux endpoints (à implémenter)

| Méthode | Endpoint | Description |
|---|---|---|
| `PUT` | `/api/room/update/{name}` | Modifier une salle |
| `GET` | `/api/reservations/history` | Historique des réservations |
| `POST` | `/api/settings` | Modifier les paramètres globaux |
| `POST` | `/api/room/upload-photo/{name}` | Uploader une photo de salle |

---

## Modèle de données

### Room (après refonte)

```json
{
  "name": "Youri Gargarine",
  "elements": {
    "capacity": 10,
    "tv": true,
    "whiteboard": true,
    "computer": true
  },
  "reservations": [
    {
      "start": "2026-06-04 09:00",
      "end": "2026-06-04 10:00",
      "title": "Réunion équipe",
      "reserved_by": "Adrien",
      "uid": "b7c92760-..."
    }
  ]
}
```

### Settings

```json
{
  "dayStart": 8,
  "dayEnd": 20,
  "startingSoonBefore": 15,
  "finishingSoonBefore": 15
}
```

---

## Design

Le thème est **100% sombre** avec un accent bleu :

- Fond : `#0a0a0b` (page), `#141416` (cartes), `#1c1c1f` (modaux)
- Texte : `#f5f5f7` (primaire), `#a0a0ab` (secondaire)
- Accent : `#4f8cff`
- Statuts : vert (`#34d399`), jaune (`#fbbf24`), rouge (`#f87171`)

Les maquettes et instructions design détaillées sont dans `DESIGNER_AGENT.md`.

---

## Roadmap

Voir le fichier [`ROADMAP.md`](./ROADMAP.md) pour le plan d'implémentation complet en 9 phases.
