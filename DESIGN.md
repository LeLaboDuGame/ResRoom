# RoomIO — Design System

## Identité visuelle

RoomIO est une application professionnelle de réservation de salles de réunion. L'identité visuelle se veut **sobre, élégante et fonctionnelle**, comparable aux outils SaaS modernes comme Linear, Notion ou Stripe Dashboard.

- **Ambiance** : sombre, minimaliste, haute lisibilité
- **Ton** : sérieux, efficace, non ludique
- **Public** : employés de bureau, managers, équipes techniques

---

## Palette de couleurs

La palette est conçue pour offrir un contraste élevé (WCAG AA minimum) et une hiérarchie visuelle claire.

### Couleurs de fond

| Token | Couleur | Usage |
|---|---|---|
| `bg.primary` | `#0a0a0b` | Fond de page principal |
| `bg.secondary` | `#141416` | Cartes, panneaux, conteneurs |
| `bg.elevated` | `#1c1c1f` | Modaux, drawers, menus déroulants |
| `bg.overlay` | `rgba(0,0,0,0.6)` | Overlay derrière modaux/drawers |

### Couleurs de texte

| Token | Couleur | Usage |
|---|---|---|
| `text.primary` | `#f5f5f7` | Titres, textes principaux |
| `text.secondary` | `#a0a0ab` | Sous-titres, métadonnées |
| `text.muted` | `#6b6b76` | Indices, placeholders, textes discrets |

### Couleurs de bordure

| Token | Couleur | Usage |
|---|---|---|
| `border` | `#2c2c30` | Bordures de cartes, séparateurs |
| `border.hover` | `#3d3d44` | Bordure au survol |

### Accent

| Token | Couleur | Usage |
|---|---|---|
| `accent.default` | `#4f8cff` | Boutons primaires, liens, éléments actifs |
| `accent.hover` | `#3b72e3` | Survol des éléments accent |
| `accent.muted` | `#1a3366` | Fond des badges/indicateurs accent |
| `accent.text` | `#ffffff` | Texte sur fond accent |

### Statuts (couleurs sémantiques)

| Statut | Fond | Texte | Contexte |
|---|---|---|---|
| Libre | `#34d399` | `#0a0a0b` | Salle disponible |
| Bientôt | `#fbbf24` | `#0a0a0b` | Réunion dans ≤15 min |
| En réunion | `#f87171` | `#ffffff` | Réunion en cours |
| Se termine | `#fb923c` | `#0a0a0b` | Réunion finit dans ≤15 min |

### États d'interaction

| État | Transformation |
|---|---|
| Hover | `filter: brightness(1.15)` ou `opacity: 0.85` |
| Active | `transform: scale(0.97)` |
| Focus visible | `outline: 2px solid #4f8cff; outline-offset: 2px` |
| Disabled | `opacity: 0.4; cursor: not-allowed` |

---

## Typographie

La typographie utilise le système de **Chakra UI** avec des ajustements spécifiques.

### Famille

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Échelle

| Niveau | Taille | Poids | Usage |
|---|---|---|---|
| Hero | `3xl` (30px) | Extrabold (800) | Logo RoomIO |
| Titre page | `2xl` (24px) | Bold (700) | Titres de pages |
| Titre section | `lg` (18px) | Semibold (600) | Titres de sections |
| Sous-titre | `md` (16px) | Medium (500) | Noms de salles |
| Corps | `sm` (14px) | Normal (400) | Texte courant |
| Météo | `xs` (12px) | Normal (400) | Heures, labels, métadonnées |
| Micro | `2xs` (10px) | Medium (500) | Badges, timestamps compressés |

### Hiérarchie

- **Desktop / tablette** : échelle standard
- **Mobile** : réduire d'un cran la taille des titres pour tenir dans la viewport

---

## Ombres

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
--shadow-xl: 0 12px 40px rgba(0,0,0,0.6);
```

---

## Bordures

- **Cartes** : `1px solid #2c2c30`, `borderRadius: xl` (12px)
- **Inputs** : `1px solid #2c2c30`, `borderRadius: lg` (8px)
- **Badges** : `borderRadius: full` (9999px)
- **Boutons** : `borderRadius: lg` (8px)

---

## Composants globaux — Spécifications visuelles

### 1. Header

```
┌─────────────────────────────────────────────────┐
│ [RoomIO]    Dashboard    Admin          14:32:08 │
├─────────────────────────────────────────────────┤
```

- **Hauteur** : 56px
- **Fond** : `bg.secondary` (#141416)
- **Bordure basse** : `1px solid #2c2c30`
- **Logo** : texte "RoomIO" en `accent.default`, poids Extrabold
- **Navigation** : liens en `text.secondary`, actif en `text.primary` avec soulignement accent
- **Horloge** : `text.muted`, monospace (optionnel)
- **Desktop uniquement** — caché sur tablette et mobile

### 2. StatusBadge

```
 [●] Libre       → fond #34d399, texte #0a0a0b
 [●] Bientôt     → fond #fbbf24, texte #0a0a0b
 [●] En réunion  → fond #f87171, texte #ffffff
 [●] Se termine  → fond #fb923c, texte #0a0a0b
```

- Dot ronde (8px) à gauche du texte
- `padding: 4px 12px`, `gap: 6px`
- Texte en `xs` Medium
- Texte localisé en français

### 3. RoomStatusCard (tablette dédiée)

```
┌─────────────────────────────┐
│                             │
│  14:30                      │  ← heure, text.primary, 2xl Bold
│  Jeu 4 juin 2026            │  ← date, text.secondary, sm
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   PHOTO DE LA SALLE   │  │  ← 100% largeur disponible
│  │   avec overlay coloré │  │  ← overlay: rgba(couleur_status, 0.4)
│  │                       │  │
│  │        ┌───┐          │  │  ← bouton [+], 80x80px, cercle
│  │        │ + │          │  │  ← bg: rgba(255,255,255,0.2)
│  │        └───┘          │  │  ← border: 2px solid white
│  │                       │  │  ← si salle libre ou starting soon
│  │        ┌───┐          │  │
│  │        │ ◉ │          │  │  ← MeetingProgress (cercle)
│  │        │ ◉ │          │  │  ← si meeting en cours
│  │        └───┘          │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**Dimensions :**
- L'image/zone occupe toute la moitié gauche de l'écran
- Photo : `object-fit: cover`, `width: 100%`, `aspect-ratio: 4/3` minimum
- Si pas de photo : fond uni de la couleur du statut

**Overlay photo :**
- `position: absolute`, inset 0
- `background-color: rgba(couleur_status, 0.35)`
- `mix-blend-mode: multiply` (ou simplement overlay si l'image est claire)
- Transition douce entre les statuts (0.3s ease)

**Bouton [+] :**
- Cercle parfait : `width: 80px`, `height: 80px`, `borderRadius: 50%`
- Fond : `rgba(255,255,255,0.15)`
- Bordure : `2px solid rgba(255,255,255,0.6)`
- Icône `+` : `#ffffff`, poids Light, taille 48px
- Hover : fond `rgba(255,255,255,0.25)`, échelle 1.05
- Active : échelle 0.95
- `min-width: 44px`, `min-height: 44px` (conformité tactile)

### 4. MeetingProgress (cercle de progression)

```
       ╭─────────╮
       │ 42 min  │
       │  rest.  │
       ╰─────────╯
```

- **Taille** : 120x120px
- **Cercle de fond** : `stroke: #2c2c30`, `strokeWidth: 8`
- **Arc de progression** : `stroke: #4f8cff`, `strokeWidth: 8`, `strokeLinecap: round`
- **Transition** : `stroke-dashoffset` animé en 0.5s ease
- **Texte central** : `text.primary`, `sm` Bold — temps restant
- **Label en dessous** : `text.muted`, `xs` — "restantes"

### 5. ReservationList

```
┌─────────────────────────────────┐
│ AUJOURD'HUI                     │  ← titre section, text.secondary, xs Bold
│                                 │
│ ─────────────────────────────── │  ← ligne séparation, #2c2c30
│                                 │
│ 09:00 - 10:00                   │  ← text.secondary, sm
│ Réunion équipe                  │  ← text.primary, md Bold
│ Adrien                     [×]  │  ← text.secondary, sm + bouton danger
│                                 │
│ ─────────────────────────────── │
│                                 │
│ 14:00 - 15:00                   │
│ Test technique                  │
│ Jean                       [×]  │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ (bouton Réserver en bas)        │
└─────────────────────────────────┘
```

- `max-height` calculé pour ne pas dépasser la viewport (avec `overflow-y: auto`)
- Chaque réservation : `padding: 12px 0`
- Bouton [×] : `color: #f87171`, `opacity: 0.6` → `1.0` au hover, `min-width: 44px`
- Si aucune réservation : EmptyState centré

### 6. FloorPlan

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌───────────────────────────────────┐     │
│   │  SVG PLAN D'ÉTAGE                │     │
│   │                                   │     │
│   │   ┌────┐  ┌────┐                 │     │
│   │   │ A  │  │ B  │                 │     │
│   │   └────┘  └────┘                 │     │
│   │   ┌──────────────┐               │     │
│   │   │      C       │    ← surbr.   │     │
│   │   └──────────────┘               │     │
│   │   ┌────┐                         │     │
│   │   │ D  │  ← grisé (hors filtre) │     │
│   │   └────┘                         │     │
│   └───────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

**Background :**
- Image SVG depuis `plan.json` (backgroundImage.dataUrl)
- `width: 100%`, `height: auto`, `preserveAspectRatio: xMidYMid meet`

**Murs :**
- Lignes SVG `<line>` avec `stroke: #444444`, `strokeWidth: thickness`
- Pas de remplissage

**Salles (polygones) :**
- Remplissage : `bg.primary` (#0a0a0b) par défaut
- Sélectionnée : `accent.muted` (#1a3366) + bordure `accent.default` 2px
- Filtrée (hors critères) : `opacity: 0.2`
- Label centré : `text.primary`, `sm` Medium
- Survol : échelle 1.05 (transform-origin: center)
- `cursor: pointer`
- `role="button"`, `tabIndex`, `aria-label="Salle [nom]"`

### 7. BookingForm

```
┌──────────────────────┐
│ FILTRES              │
│ Capacité min: [____] │  ← input sm, bg #141416
│                      │
│ ☐ TV                 │  ← checkbox Chakra
│ ☐ Tableau blanc      │
│ ☐ PC                 │
│                      │
│ ── SALLE ─────────── │  ← text.secondary, xs Bold
│ Youri Gargarine      │  ← text.primary, md Bold
│ Capacité: 10 pers.   │  ← text.secondary, sm
│ TV ✓  Tableau ✓  PC ✓│  ← indices verts
│                      │
│ ── CRÉNEAU ───────── │
│ Date   : [04/06/2026]│
│ Début  : [09:00 ▾]   │
│ Durée  : [1h ▾]      │
│ Titre  : [________]  │
│ Nom    : [________]  │
│                      │
│ ┌──────────────────┐ │
│ │    RÉSERVER       │ │  ← bouton plein accent
│ └──────────────────┘ │
└──────────────────────┘
```

**Inputs :**
- Fond : `bg.secondary` (#141416)
- Bordure : `1px solid #2c2c30`, focus : `#4f8cff`
- Texte : `text.primary`, placeholder : `text.muted`
- Hauteur : 36px (sm)

**Bouton Réserver :**
- Fond : `accent.default` (#4f8cff)
- Hover : `accent.hover` (#3b72e3)
- Texte : `#ffffff`, Poids Semibold
- Hauteur : 40px
- `width: 100%`
- Disabled si champs manquants

### 8. DeleteModal

```
┌──────────────────────────────────────┐
│                                      │
│  Supprimer la réservation        [×] │  ← titre + close
│                                      │
│  Voulez-vous vraiment supprimer      │
│  "Réunion équipe" par Adrien ?       │
│                                      │
│  Pour éviter les erreurs, veuillez   │
│  saisir "Oui" ci-dessous :           │
│                                      │
│  [________________________]          │  ← input
│                                      │
│           [Annuler]   [Supprimer]    │  ← boutons
│                                      │
└──────────────────────────────────────┘
```

- **Fond modal** : `bg.elevated` (#1c1c1f)
- **Bordure** : `1px solid #2c2c30`
- **Radius** : `xl` (12px)
- **Largeur** : 440px max
- **Overlay** : `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- **Bouton Supprimer** : `bg: #dc2626`, désactivé tant que "Oui" pas tapé
- **Bouton Annuler** : outline, bordure `#2c2c30`

---

## Layouts par device

### Desktop (≥ 1200px)

```
┌──────────────────────────────────────────────────┐
│ Header : 56px                                    │
├─────────────────────────────┬────────────────────┤
│                             │                    │
│   FLOOR PLAN                │  PANEL (420px)     │
│   (SVG, occupe l'espace)    │  - slide depuis    │
│                             │    la droite       │
│   Click salle ─────────────>│  - RoomInfoPanel   │
│                             │  - ReservationList │
│                             │  - BookingForm     │
│                             │                    │
│                             │  [×] pour fermer   │
└─────────────────────────────┴────────────────────┘
```

- **Plan** : redimensionné pour tenir dans l'espace disponible (svg `width: 100%`)
- **Panel** : `position: fixed`, `right: 0`, `top: 56px`, `bottom: 0`, `width: 420px`
  - Fond : `bg.secondary`, bordure gauche `border`
  - Slide : `transform: translateX(0)` → `translateX(100%)`
  - Transition : `0.3s cubic-bezier(0.16, 1, 0.3, 1)`
  - Fermeture : click overlay ou bouton ×

### Tablette dédiée (1024px, paysage)

La tablette dédiée a **deux vues** qui s'échangent sans navigation.

**Vue 1 — RoomView (accueil) :**
```
┌───────────────────────┬──────────────────────────┐
│                       │                          │
│  RoomStatusCard       │  ReservationList         │
│  (photo + overlay     │  (réservations du jour)  │
│   + statut)           │                          │
│                       │  Liste verticale sans    │
│   [+] ou cercle       │  scroll page             │
│   progression         │                          │
│                       │  [Réserver] en bas       │
│   heure / date        │                          │
└───────────────────────┴──────────────────────────┘
```

**Vue 2 — BookingFlow :**
```
┌───────────────────────┬──────────────────────────┐
│  35%                  │  65%                     │
│                       │                          │
│  FilterBar            │  FloorPlan               │
│  RoomInfoPanel        │  (interactif)            │
│  BookingForm          │                          │
│                       │  Salle racine en         │
│  [Retour] en haut     │  surbrillance            │
│                       │  Salles filtrées grisées │
└───────────────────────┴──────────────────────────┘
```

- Transition entre vues : slide horizontale ou fade (0.3s)
- Aucun scroll possible
- 15 min inactivité → retour forcé à RoomView

### Tablette générique / petit écran (< 1200px, ≥ 640px)

Même comportement que desktop mais adapté :
- Panel coulissant : 100% width si < 768px
- Header réduit (juste clock + nav compacte)

### Mobile (< 640px)

```
┌────────────────────┐
│                    │
│   CONTENU          │
│   plein écran      │
│                    │
│   FloorPlan SVG    │
│   (centré, zoomé)  │
│                    │
│                    │
├────────────────────┤
│ 🗺️ Plan  │ ⚙️ Admin │
└────────────────────┘
```

- Bottom tab bar : `height: 56px`, fond `bg.secondary`
- Tab active : icône + label en accent
- Tab inactive : icône + label en `text.muted`
- Click salle → bottom sheet : `borderRadius: xl` en haut, `max-height: 70%`
- Bottom sheet : fond `bg.elevated`, glisse depuis le bas

---

## Animations

| Élément | Animation | Durée | Timing |
|---|---|---|---|
| Panel coulissant | `translateX` | 0.3s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Vue FleetRoom | `opacity` + `translateX` | 0.3s | ease |
| Hover salle plan | `scale(1.05)` | 0.2s | ease |
| Cercle progression | `stroke-dashoffset` | 0.5s | ease |
| Bouton actif | `scale(0.97)` | 0.1s | ease |
| Bottom sheet mobile | `translateY` | 0.3s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Tooltip / badge apparition | `opacity` | 0.2s | ease |
| Changement statut | `background-color` | 0.3s | ease |

Toutes les animations doivent être désactivées quand `prefers-reduced-motion: reduce` est détecté.

---

## Icônes

Utilisation de **Lucide React** (déjà dans les dépendances).

| Contexte | Icône | Nom Lucide |
|---|---|---|
| TV | Écran | `Monitor` |
| Tableau blanc | Clipboard | `Clipboard` |
| Ordinateur | Écran + check | `MonitorCheck` |
| Capacité | Personnes | `Users` |
| Supprimer | Croix | `X` |
| Réserver | Plus | `Plus` |
| Retour | Flèche gauche | `ArrowLeft` |
| Horloge | Horloge | `Clock` |
| Libre | Check | `CheckCircle` |
| Occupé | X cercle | `XCircle` |

- Taille standard : 16px (sm), 20px (md)
- Bouton [+] : 48px (Lucide Plus, poids thin)

---

## Accessibilité (WCAG AA)

### Contrastes

| Combinaison | Ratio | Conformité |
|---|---|---|
| `#f5f5f7` sur `#0a0a0b` | ~15:1 | AAA ✓ |
| `#a0a0ab` sur `#0a0a0b` | ~8:1 | AA ✓ |
| `#6b6b76` sur `#0a0a0b` | ~5:1 | AA ✓ |
| `#4f8cff` sur `#0a0a0b` | ~5.5:1 | AA ✓ |
| `#ffffff` sur `#4f8cff` | ~4.5:1 | AA ✓ |
| `#0a0a0b` sur `#34d399` | ~7:1 | AA ✓ |

### Navigation clavier

- `Tab` : parcourir les éléments focusables dans l'ordre
- `Enter` / `Espace` : activer un élément
- `Escape` : fermer modale, drawer, panel
- `ArrowLeft` / `ArrowRight` : navigation entre tabs (Admin)
- Focus trap dans les modales (DeleteModal, BookingForm)
- `:focus-visible` visible sur tous les éléments interactifs

### Attributs ARIA

- `role="button"` sur les polygones du plan
- `aria-label="Salle [nom]"` sur chaque polygone
- `aria-current="page"` sur le tab actif
- `role="tablist"`, `role="tab"`, `role="tabpanel"` pour les tabs
- `aria-selected` sur les tabs
- `role="dialog"`, `aria-modal="true"` sur les modales
- `aria-describedby` sur les messages de confirmation

### Touch (mobile et tablette)

- Tous les boutons : `min-width: 44px`, `min-height: 44px`
- Espacement minimal entre éléments cliquables : 8px
- Pas de hover-dépendant pour les actions (fonctionnel au tap)
- `touch-action: manipulation` sur les cibles tactiles

---

## Responsive — Points de rupture

| Breakpoint | Largeur | Layout |
|---|---|---|
| Desktop | ≥ 1200px | AppShell (header + plan + panel) |
| Tablette | 640px – 1199px | AppShell adapté (panel pleine largeur si nécessaire) |
| Mobile | < 640px | MobileShell (bottom tabs) |

**Tablette dédiée** : toujours en paysage 1024×768 optimisé, mais fonctionne aussi en portrait.

---

## États de chargement et d'erreur

### LoadingSkeleton

- **Card** : rectange arrondi `bg.secondary` avec pulse
- **Text** : ligne grise animée
- **Circle** : cercle `bg.secondary` animé
- Applicable sur : RoomStatusCard, ReservationList, FloorPlan

### EmptyState

- Icône centrée (Lucide) en `text.muted`
- Titre : `text.primary`, `md` Bold
- Description : `text.secondary`, `sm`
- Utilisé pour : aucune réservation, aucune salle, aucun résultat de filtre

### Erreur API

- Toast ou message inline selon le contexte
- Fond `#3b1a1a` (danger muted), texte `#f87171`
- Bouton "Réessayer" si pertinent
- Pas de crash silencieux

---

## Espacement

Système d'espacement Chakra UI (base 4px) :

| Token | Pixels | Usage |
|---|---|---|
| `1` | 4px | Très petit espacement |
| `2` | 8px | Gap entre éléments proches |
| `3` | 12px | Padding interne compact |
| `4` | 16px | Espacement standard |
| `5` | 20px | Gap entre sections |
| `6` | 24px | Padding de cartes |
| `8` | 32px | Marge entre grandes sections |
| `10` | 40px | Padding de page |

---

## Structure des fichiers de design

Les fichiers suivants contiennent les spécifications :

| Fichier | Contenu |
|---|---|
| `DESIGN.md` | Ce document — design system complet |
| `DESIGNER_AGENT.md` | Instructions pour le designer (processus, règles) |
| `ROADMAP.md` | Plan d'implémentation détaillé |
| `roomio-frontend/src/config/theme.js` | Tokens de couleurs et thème Chakra UI |
| `roomio-frontend/src/config/settings.js` | Constantes applicatives |
