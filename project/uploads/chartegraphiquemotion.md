# Charte graphique & motion — dissection de 3 références

- **Sites analysés** — `mont-fort.com` · `superlist.craftedbygc.com` · `www.ciaoenergy.com`
- **Conditions de mesure** — Chrome desktop, viewport 1440–1534 px de large × 881 px de haut, connexion normale
- **Date** — 25/08/2026

---

## 0. Note de méthode — comment lire ce document

Trois niveaux de fiabilité sont utilisés, jamais mélangés :

| Marque | Signification |
|---|---|
| *(rien)* | **Valeur lue** dans le DOM, les styles calculés (`getComputedStyle`), les règles CSS, ou extraite du bundle JS du site (regex sur le code livré). Certaine. |
| `[estimé]` | Valeur **non lisible** directement (rendu WebGL, tween JS non isolable, couleur échantillonnée à l'écran). Mon estimation, à vérifier avant de s'en servir comme référence. |
| `[unique]` | Effet présent sur **un seul** des trois sites. |

**Ce qui n'a pas pu être mesuré et pourquoi :**

- Les couleurs rendues **dans un canvas WebGL** (fonds de Mont-Fort et Superlist, éclairage des canettes Ciao) ne sont pas lisibles par le CSS. Elles sont marquées `[estimé]` à partir des captures.
- Sur Ciao Energy, le fichier `main.js` (moteur 3D) a fait planter l'outil d'inspection à la lecture ; le setup Three.js est reconstruit à partir de la **liste réelle des modules chargés** (fiable) mais les valeurs numériques de caméra/lumières sont `[estimé]`.
- Le preloader de Ciao ne se termine jamais dans un onglet non focalisé (le compteur est piloté par la lecture d'une vidéo, bloquée par la politique d'autoplay). J'ai forcé la sortie pour analyser la suite. La durée réelle du preloader est en revanche **mesurée exactement** : 7,048 s (durée de la vidéo).
- Sur Superlist, la molette simulée n'atteint pas ASScroll ; le scroll a été piloté par `window.scrollTo`. Les effets *scroll-linked* sont donc décrits fidèlement, mais **l'inertie perçue** de ASScroll est `[estimé]`.

---
---

# FICHE 1 — MONT-FORT.COM

> Groupe de trading de matières premières. Direction artistique : bleu pétrole sur brume, une seule scène 3D continue qui traverse tout le site (montagne → nuages → océan → globe → forêt). Signé Immersive Garden (les easings custom sont préfixés `immg.`).

## 1.1 Identité visuelle

### Palette (valeurs lues dans le CSS / styles calculés)

| Rôle | HEX | RGB | Usage approx. |
|---|---|---|---|
| Bleu primaire (texte, wordmark, nav, icônes) | `#2D628C` | 45, 98, 140 | ~35 % du texte |
| Bleu atténué (nav inactive, titres secondaires) | `#A9BFD2` | 169, 191, 210 | ~15 % |
| Bleu gris (grands titres sur fond clair) | `#81A0BB` | 129, 160, 187 | ~10 % |
| Blanc (texte sur chapitres sombres) | `#FFFFFF` | 255, 255, 255 | ~35 % |
| Noir (fallback body) | `#000000` | 0, 0, 0 | ~5 % |
| Fond « menu » / fond hero | `[estimé] #F2F4F6` | — | plein écran |

**Important** : `body` et `html` ont un `background-color: rgba(0,0,0,0)` — **il n'y a aucun fond CSS**. Tout le fond visible du site est le **canvas WebGL** (2 canvas présents). Les « inversions de section » ne sont pas des changements de `background-color` mais des changements de scène 3D.

### Mode sombre / clair — le système `data-theme`

Le thème est piloté par attribut, pas par media query :

- `data-theme="light"` → 5 occurrences
- `data-theme="dark"` → 4 occurrences
- `data-theme-chapters` → 2 (conteneurs qui orchestrent la bascule)
- `data-animation-color="#ffffff"` → 28 occurrences : la couleur cible d'un texte est **portée par l'attribut**, pas par une classe. C'est ce qui permet à GSAP de faire virer un texte de bleu à blanc en même temps que la scène 3D s'assombrit.

Ordre des chapitres (attribut `data-chapter`) : `TopChapters` → `Hero` → `WhoWeAre` → `WhatWeDo` → `GlobalConnectivity` → `Sustainability` → `Equality`.

### Effets de fond

- **Aucun grain / noise CSS.** Le grain visible sur les nuages est dans les textures 3D.
- **Aucun `mix-blend-mode`**, **aucun `clip-path`**, **aucun `filter: blur()`** dans le CSS de la page.
- Moteur : `data-engine="three.js r169"` (lu dans le DOM), `data-scene="Homepage"`.
- Textures compressées : `KTX2Loader` chargé (23 Ko) → textures GPU `.ktx2`.

### Typographie

Polices réellement chargées : **Century Gothic** (400, 700) et **Josefin Sans** (100→700). Century Gothic porte tout le site ; Josefin Sans ne sert **que** pour le wordmark du hero.

| Élément | Police | Graisse | Taille | Line-height | Letter-spacing | Transform | Couleur |
|---|---|---|---|---|---|---|---|
| Wordmark hero « MONTFORT » | Josefin Sans | 300 | 62 px | normal | **19.84 px (0.32 em)** | uppercase | `#2D628C` |
| Lien de nav | Century Gothic | 400 | 12 px | 14.4 px (1.2) | 0.48 px (0.04 em) | uppercase | `#2D628C` |
| H2 manifeste | Century Gothic | 400 | 50 px | 70 px (**1.4**) | 2.24 px (0.045 em) | uppercase | `#81A0BB` |
| Paragraphe d'intro | Century Gothic | 400 | 24 px | 38.4 px (**1.6**) | 0.48 px (0.02 em) | none | `#2D628C` |
| Eyebrow / label de section | Century Gothic | **700** | 14 px | 16.8 px (1.2) | **3.36 px (0.24 em)** | uppercase | `#2D628C` / `#fff` |
| H4 titre de division | Century Gothic | 400 | 40 px | 56 px (1.4) | 1.6 px (0.04 em) | uppercase | `#FFFFFF` |
| H3 nom de division | Century Gothic | 400 | 20 px | 28 px (1.4) | 0.8 px (0.04 em) | none | `#FFFFFF` |
| Item de menu plein écran | Century Gothic | 400 | 40 px | 56 px (1.4) | 1.6 px (0.04 em) | uppercase | `#2D628C` actif / `#A9BFD2` inactif |
| Badge numérique (News « 20 ») | Century Gothic | **700** | 8 px | 12.8 px | 0.4 px | uppercase | `#FFFFFF` |
| Micro-label (CTA) | Century Gothic | 400 | 12 px | 14.4 px | 0.4 px | uppercase | — |

**Règles de rythme typographique lisibles :**

- Échelle : 8 → 12 → 14 → 20 → 24 → 40 → 50 → 62 px. Ratio moyen ≈ **1.25–1.4**, avec un saut franc entre le corps (24) et les titres (40).
- Line-height **1.4 pour tous les titres**, **1.6 pour le corps**, **1.2 pour les labels**.
- **Aucun letter-spacing négatif.** C'est l'inverse de la mode « tracking serré » : ici tout est **espacé positivement**, de +0.02 em (corps) à +0.32 em (wordmark). C'est la signature typographique du site.

### Grille et espacement

```
.container   → width:100%; max-width:1440px;
               padding-inline: var(--container-padding-x) /* 18px */;
               margin-inline: auto;

.grid        → display:grid;
   ≥64em     → grid-template-columns: repeat(24, minmax(0,1fr)); column-gap: 20px;
   <64em     → grid-template-columns: repeat(4,  minmax(0,1fr)); column-gap: 10px;
               width: max(200px, 100% - 64px); margin: 0 auto;

.grid-no-margin → repeat(4, 1fr); column-gap: 3.75rem (60px)
```

Variables `:root` réellement déclarées (il y en a **très peu**, tout le reste est en dur) :

```css
:root{
  --vw: 1vw;                    /* recalculées en JS pour le mobile */
  --dvh: 1vh; --svh: 1vh; --lvh: 1vh;
  --container-padding-x: 18px;
  --header-padding: 1rem;
}
```

Rythme vertical mesuré (hauteurs réelles à 1440 px, `scrollHeight = 17 277 px`) :

| Section | `top` | Hauteur |
|---|---|---|
| `header` (fixed) | 80 | 82 |
| `.hero` | 0 | 1322 |
| `#WhoWeAre` | 1322 | 1190 |
| `#WhatWeDo` | 2512 | **4774** |
| `#GlobalConnectivity` | 7285 | 2643 |
| `.section-sustainability` | 9928 | 2223 |
| `.section-solutions` | 12151 | 1701 |
| `#Equality` | 13852 | 850 |
| `.section-social` | 14702 | 1742 |
| `#footer` | 16444 | 833 |

Autres espacements lus : `row-gap: 2.8125rem (45px)` sur le `main`, `gap: 6.25rem (100px)` sur les listings.

### Bordures, rayons, ombres

- **Border-radius** : uniquement `50%` (pastilles CTA, badges) et `0` partout ailleurs. Aucun rayon intermédiaire.
- **Bordures** : `1px` (traits de séparation sous les CTA, losanges de chapitre en SVG stroke).
- **Ombres** : une seule transition `background, box-shadow 0.3s linear` détectée. Le site est **quasi sans ombre** — la profondeur vient de la 3D, pas du CSS.

## 1.2 Hero — image par image

**Composition** : plein écran, aucun `<video>`, aucun `<img>` — **100 % WebGL**. Une chaîne de montagnes enneigées émergeant d'une mer de nuages, caméra en légère plongée. Le wordmark (SVG logo + « MONTFORT » en Josefin Sans 300, letter-spacing 0.32 em) est posé à gauche à mi-hauteur. En bas à gauche « SCROLL DOWN TO DISCOVER ». En bas à droite un trait horizontal de ~20 px.

**Séquence d'ouverture (mesurée par captures successives) :**

| t | Ce qui se passe |
|---|---|
| 0 → ~1.2 s | Écran blanc. Rien n'est peint. Pas de compteur, pas de masque, pas de logo de preload. |
| ~1.2 → 1.5 s | Le **header apparaît d'un bloc** (nav + NEWS + badge « 20 » + MENU + les 2 points) sur fond blanc, avant le visuel. Le trait actif sous « MONTFORT GROUP » n'est pas encore là. |
| ~1.5 → 3.5 s | Le **canvas WebGL fade-in** (`opacity 0 → 1`), le wordmark et le trait actif de nav apparaissent en même temps. `[estimé] ~0.8–1 s, ease sine.out`. |
| ~3.5 s | Interactif. `body` reçoit la classe `loaded`. |

> **Total avant interactivité : ≈ 3,5 s.** Il n'y a **pas de preloader dédié** — c'est un fade-in progressif. `[unique]` parmi les trois : c'est le seul site sans écran de chargement.

**Réaction à la souris** : aucune parallaxe, aucun tilt, aucune distorsion détectée sur le hero. Le seul élément lié au curseur est le **curseur custom** (voir §1.3).

**Au premier scroll** : la caméra 3D avance dans la scène (dolly forward). Les sommets grossissent et passent sous la ligne de nuages, le wordmark et le header **fondent à 0** dès les ~250 premiers pixels de scroll. C'est **scroll-linked** (la position exacte du scroll pilote la caméra), pas déclenché.

## 1.3 Motion & scroll

### Le système de nommage `data-animation`

C'est la clé de lecture du site. Chaque bloc animé porte `data-animation="<Type>"` :

| Type | Occurrences | Rôle |
|---|---|---|
| `FadeIn` | **60** | l'animation par défaut, de loin la plus utilisée |
| `Title` | 13 | titres découpés par SplitText |
| `SplitBlock` | 13 | blocs multi-colonnes révélés en cascade |
| `Line` | 4 | traits qui se dessinent |
| `ReadMore` | 2 | paragraphe tronqué + dépliage (`--line-count: 4`) |
| `Hero` / `TextBlock` / `GlobalConnectivity` / `ImagesContainer` / `Navigation` | 1 chacun | animations sur mesure |

Les éléments animés portent la signature inline de GSAP : `translate:none; rotate:none; scale:none; transform: translate3d(0px,0px,0px); opacity:1;` — preuve directe que c'est GSAP (et pas des transitions CSS) qui pilote les reveals.

### Easings custom — valeurs exactes extraites du bundle

Six courbes enregistrées via `CustomEase.create()` :

| Nom GSAP | cubic-bezier | Caractère |
|---|---|---|
| `immg.zoomIn` | `0.9, 0.0, 0.4, 1.0` | départ très mou, arrivée sèche |
| `immg.zoomOut` | `0.4, 0.0, 0.1, 1.0` | départ franc, freinage long |
| `immg.posIn` | `0.4, 0.0, 0.1, 1.0` | (identique à zoomOut) |
| `immg.posOut` | `0.9, 0.0, 0.4, 1.0` | (identique à zoomIn) |
| `immg.expoOut` | `0.14, 1.0, 0.34, 1.0` | quasi-expo out, très « premium » |
| `immg.expoIn` | `0.66, 0.0, 0.86, 0.0` | accélération pure |

Easings GSAP natifs également présents dans le bundle : `sine.out`, `power1.in`, `power1.out`, `power1.inOut`, `power2.out`, `power2.inOut`, `power3.out`, `linear`, `none`.

Durées présentes dans le bundle : `.05 .06 .08 .1 .2 .3 .4 .5 .6 .65 .7 .8 1 1.2 1.5 1.6 2 3` s.
Staggers : `.02`, `.075`, `.1`, `.15`, `{amount:.1}`, `{amount:.3}`, `{each:.15}`, et un **stagger négatif `-.075`** (cascade inversée en sortie).

### Tableau des effets

| Section | Effet | Déclencheur | Propriétés (de → vers) | Durée | Easing | Stagger | Librairie |
|---|---|---|---|---|---|---|---|
| Global | Smooth scroll | permanent | `html.lenis`, `smoothWheel: true`, `wheelMultiplier: 1`, `touchMultiplier: 1`, `syncTouch` | — | — | — | **Lenis** |
| — | *Inertie perçue* | — | **moyenne-légère** : `lerp: 0.1` (défaut Lenis, trouvé dans le bundle, non surchargé) → ~2–3 frames de retard, pas d'effet « flottant ». | — | — | — | — |
| Hero | Fly-through caméra 3D | **scroll-linked** (position exacte) | position caméra Z + rotation, montagne → nuages → océan → globe → forêt | continue | `none` (linéaire sur le scroll) | — | Three.js r169 + ScrollTrigger |
| Hero | Sortie du wordmark | scroll-linked, ~0 → 25 % du viewport | `opacity 1 → 0` | ~0.4 s | `linear` | — | GSAP |
| Header | Fade nav | scroll-linked | `opacity 1 → 0` puis retour | 0.4 s | `linear` | — | GSAP |
| Header | Hover lien nav | hover | `color`, `opacity` | **0.4 s** | `linear` | — | CSS |
| Tous | `FadeIn` (le reveal par défaut) | **scroll-triggered**, `start: "top bottom"` (le haut de l'élément touche le bas du viewport) | `opacity 0 → 1`, `y: "1em" → 0` | `[estimé] 0.8–1 s` | `[estimé] immg.expoOut` | 0.1 s | GSAP + ScrollTrigger |
| Titres | `Title` — split par ligne | scroll-triggered | SplitText `type:"lines"` → chaque ligne `opacity 0 → 1`, `yPercent 5 → 0` | `[estimé] 0.9 s` | `[estimé] immg.expoOut` | `{each: .15}` | GSAP SplitText |
| Titres longs | Split par caractère | scroll-triggered | SplitText `type:"lines, chars"` et `"lines, chars, words"` | — | — | `.02` (chars) | GSAP SplitText |
| Blocs | `SplitBlock` — cascade colonnes | scroll-triggered | `opacity 0 → 1` + `y` | — | — | `{amount: .3}` | GSAP |
| Traits | `Line` | scroll-triggered | `scaleX 0 → 1` `[estimé]` | `[estimé] 0.8 s` | `[estimé] immg.expoOut` | — | GSAP |
| Parallaxe | Décalage multi-couches | scroll-linked | `y: 200 → 0` et `y: -150 → 0` (deux facteurs opposés lus dans le bundle) | continue | `none` | — | ScrollTrigger |
| Carrousel images | Coverflow | drag + auto | slide active `scale(1)`, slides latérales `scale(0.7478)` + `translateX(±309.565px)` | 1 s | `immg.zoomOut` (= `cubic-bezier(.4,0,.1,1)`) | — | GSAP + Draggable (`data-cursor="draggable"`) |
| Divisions | Zoom d'image au reveal | scroll-triggered | `scale 1.1 → 1` | `[estimé] 1.2 s` | `[estimé] immg.zoomOut` | — | GSAP |
| Globe | Marqueurs de ville | scroll-linked | 12 points positionnés par `data-latitude` / `data-longitude`, `opacity 0 → 1` | — | — | `.075` | Three.js |
| ESG | Onglets ENVIRONMENTAL/SOCIAL/GOVERNANCE | clic | `opacity`, trait sous l'onglet actif | 0.4 s | `linear` | — | CSS + GSAP |
| CTA rond | Hover | hover | `background, color, transform` | 0.4 / 0.4 / **0.7 s** | `linear, linear, cubic-bezier(.4,0,.1,1)` | — | CSS |
| CTA | Trait sous le libellé | hover | `transform: scaleX()` | 0.3 s | `cubic-bezier(.4,0,.1,1)` | — | CSS |
| Boutons | Rebond léger | hover | `transform` | **0.2 s** | `cubic-bezier(.9,0,.4,1)` (= `immg.zoomIn`) | — | CSS |
| Cartes ESG | Cercle + icône | hover | `transform, border-color` | 0.4 s | `cubic-bezier(.4,0,.1,1)`, `ease` | — | CSS |
| **Curseur custom** | Suivi souris | mousemove | `top, left, transform` | **0.6 s** | `cubic-bezier(0.32, 0.94, 0.6, 1)` | — | CSS + JS |
| Curseur | Changement d'état | hover | `background` | 0.4 s | `linear` | — | CSS |
| Menu | Ouverture plein écran | clic MENU | scène 3D → fond quasi-blanc, items `opacity 0 → 1` + `y` | `[estimé] 0.8 s` | `[estimé] immg.expoOut` | `{amount: .1}` | GSAP |
| Menu | Bouton MENU → CLOSE | clic | libellé remplacé, cercle blanc `scale 0 → 1`, icône 2 points → 4 points | 0.4 s | `linear` | — | GSAP |
| Transition de page | Cross-fade | clic lien interne | `@keyframes astroFadeOut/astroFadeIn` avec **`mix-blend-mode: plus-lighter`** | `[estimé] 0.3 s` | `ease` | — | **Astro View Transitions** |
| Éléments persistants | Header + curseur | transition de page | `data-astro-transition-persist` (7 éléments) — ils ne rejouent pas leur animation | — | — | — | Astro |
| Spinner | Boucle idle | permanent | `@keyframes rotate-spinner { 0% rotate(0deg) → 100% rotate(360deg) }` | **1 s** | `linear` | infinite | CSS |

**Scroll-linked vs scroll-triggered — le partage réel :**

- **Scroll-linked** (rejoue en remontant, suit exactement la molette) : la scène 3D complète, la parallaxe, le fade du header, le fade du wordmark hero.
- **Scroll-triggered** (joue une fois, ne rejoue pas) : **tous** les `FadeIn`, `Title`, `SplitBlock`, `Line`. Vérifié : après passage, `opacity` reste à `1` et le style inline GSAP reste figé.
- **Points de déclenchement lus** : `start: "top bottom"` (le plus courant) et `start: \`${window.innerHeight} top\``. `end: "bottom bottom"` et `end: "max"`.
- **`scrub` est paramétrable, pas codé en dur** : le bundle contient `scrub: !!this.params?.scrub` — le site a une *fabrique* d'animations où chaque bloc décide s'il est scrubbé ou non. C'est ce qui permet la cohabitation propre entre reveals *triggered* et 3D *linked*.
- **`pin` n'apparaît nulle part dans le bundle** → **aucune section épinglée**. Confirmé par observation sur les 17 277 px de scroll. Aucun scroll horizontal non plus (`xPercent` absent).
- **Inertie Lenis** : la valeur `lerp: 0.1` (le défaut Lenis) est présente dans le bundle et aucune surcharge explicite n'a été trouvée → `[estimé]` **lerp ≈ 0.1**, soit ~2–3 frames de retard. Cohérent avec la sensation mesurée.

**Ce qui n'existe PAS sur Mont-Fort** (contrairement à ce qu'on pourrait attendre) : pas de marquee, pas de scroll horizontal, pas de section pinnée, pas de séquence d'images pilotée au scroll (c'est de la vraie 3D temps réel), pas de morphing SVG, pas de `clip-path`, pas de `mix-blend-mode` (hors transition de page).

## 1.4 3D / WebGL

- **Moteur** : Three.js **r169** (déclaré dans `data-engine`), 2 `<canvas>`.
- **Scène** : `data-scene="Homepage"` — **une seule scène continue** qui traverse tout le site. C'est le parti pris fort : au lieu d'une 3D par section, une caméra unique voyage.
- **Étapes traversées** (observées) : sommets au-dessus des nuages → traversée de la couche nuageuse → ciel de tempête → océan avec pétrolier → montée en orbite → globe terrestre texturé avec marqueurs de villes → descente en forêt avec rayons de lumière et particules.
- **Matériaux / lumières** : `[estimé]` — éclairage de type HDRI diffus, brouillard volumétrique (`Fog` ou shader de nuages), pas de reflets spéculaires marqués.
- **Textures** : compressées **KTX2** (`KTX2Loader` chargé) → décodage GPU, indispensable vu le volume.
- **Particules** : oui, dans la séquence forêt (points lumineux flottants).
- **Post-processing** : `[estimé]` — bloom léger sur le globe, vignettage.
- **Réaction souris** : aucune détectée.
- **Réaction scroll** : totale — c'est le seul pilote de la caméra.
- **Fallback mobile** : la 3D **reste active** en mobile (vérifié : la scène tourne à 390 px de large). Aucun fallback image détecté. Ce qui est retiré en mobile, c'est l'UI (voir §1.6).

## 1.5 Imagerie & médias

- **Zéro `<img>` de contenu, zéro `<video>`.** Toute l'imagerie est dans la 3D. C'est extrêmement rare et c'est la raison du poids/qualité perçue.
- Les seules images sont des **SVG inline** (logo, icônes ESG, losanges de chapitre, flèches).
- Les losanges numérotés (« 1 », « 2 », « 3 », « 4 ») sont des SVG avec `data-svg-origin` — **attribut posé par GSAP** quand on anime un `transformOrigin` sur du SVG. Preuve qu'ils sont animés (rotation/scale au reveal).
- Carrousel : slides en `transform: scale()` + `translateX()`, hauteur conteneur figée à `230px` par style inline (recalculée en JS).

## 1.6 Responsive (lu dans les media queries)

Breakpoints en `em` (base 16 px) :

| Query | px | Effet |
|---|---|---|
| `max-width: 48em` | 768 | `.montfort-menu nav` → `display:none` (la nav horizontale disparaît du menu) |
| `max-width: 63.99em` | 1023 | `.text-number` masqué ; `.mb\:grid` passe à **4 colonnes / gap 10px** |
| `max-width: 64em` | 1024 | `.hero-inner .scroll-to-ct` masqué ; `footer .footer-container` → `flex-direction: column` ; `footer .menu-left` et `footer .line` masqués |
| `min-width: 48em` | 768 | grille intermédiaire |
| `min-width: 64em` | 1024 | grille **24 colonnes / gap 20px** |
| `min-width: 80em` | 1280 | ajustements de taille |
| `max-width: 105em` | 1680 | **`.chapters-navigation` masquée** — la navigation latérale par chapitre n'apparaît qu'au-dessus de 1680 px |
| `min-width: 105em` / `120em` | 1680 / 1920 | paliers larges |
| `max-height: 43.75em` | 700 | adaptation écrans bas |
| `(hover: none)` | tactile | **`.cursor` masqué** — le curseur custom disparaît proprement |
| `(hover: hover) and (pointer: fine)` | souris | tous les hovers conditionnés |

## 1.7 `prefers-reduced-motion`

**2 règles CSS** trouvées — mais elles ne désactivent **que les transitions de page Astro** :

```css
@media (prefers-reduced-motion) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*),
  [data-astro-transition-scope] { animation: none !important; }
}
```

`prefers-reduced-motion` n'apparaît **0 fois** dans le bundle JS. **Conclusion honnête : les animations GSAP et la scène 3D continuent de tourner intégralement en mode « mouvement réduit ».** C'est un défaut d'accessibilité à ne pas reproduire.

## 1.8 Signature moves — top 5

**1. Le voyage 3D continu unique (montagne → nuages → océan → globe → forêt)**
*Pourquoi ça marque* : il n'y a aucune « couture » entre les sections. Le site ne se lit pas comme une suite de blocs mais comme un travelling de 17 000 px. Le contenu vient se poser sur la scène.
*Reproduction* : une seule `Scene` Three.js persistante dans un canvas `position: fixed`. Un `ScrollTrigger` global avec `scrub: true` sur `document.body` mappe `progress 0→1` vers une `CatmullRomCurve3` (chemin de caméra). Les « chapitres » HTML sont des `<section>` transparentes empilées par-dessus qui ne servent qu'à donner la hauteur de scroll et à porter le texte.

**2. Le letter-spacing positif systématique (jusqu'à 0.32 em)**
*Pourquoi ça marque* : à contre-courant total du tracking serré ambiant. Ça donne une lenteur, une respiration, un côté « institution » qui colle au sujet.
*Reproduction* : `letter-spacing: 0.32em` sur le wordmark, `0.24em` sur les eyebrows, `0.04em` partout ailleurs. **Toujours compenser** par un `text-indent` négatif égal au tracking pour que le bloc reste optiquement aligné à gauche.

**3. `data-animation` comme langage d'animation déclaratif**
*Pourquoi ça marque* : 97 éléments animés, 10 types seulement. C'est ce qui rend le motion cohérent sur tout le site sans une ligne de JS par bloc.
*Reproduction* : au boot, `document.querySelectorAll('[data-animation]')` → `switch` sur la valeur → un `ScrollTrigger` par élément. Ajouter `data-animation-color` pour porter la couleur cible. Un développeur peut ensuite animer un nouveau bloc sans toucher au JS.

**4. Le curseur custom à traînée longue (0.6 s)**
*Pourquoi ça marque* : la plupart des curseurs custom suivent en 0.1–0.2 s. Ici 0.6 s en `cubic-bezier(.32,.94,.6,1)` : le curseur « nage » derrière la souris, ce qui donne exactement la même sensation que la brume à l'écran.
*Reproduction* : un `div.cursor` en `position: fixed`, `transition: top .6s cubic-bezier(.32,.94,.6,1), left .6s ..., transform .6s ...`. Sur `mousemove`, on écrit `top`/`left` (pas `transform`) — c'est la transition CSS qui fait le lissage. Masquer sous `@media (hover: none)`.

**5. La bascule de thème par chapitre (`data-theme` light/dark) synchronisée avec la 3D**
*Pourquoi ça marque* : le texte passe de bleu à blanc **exactement** quand la scène passe du ciel clair à l'océan sombre. Aucune transition de fond n'est visible parce qu'il n'y a pas de fond.
*Reproduction* : chaque chapitre porte `data-theme="light|dark"`. Un `ScrollTrigger` par chapitre (`start: "top center"`) déclenche à la fois un `gsap.to(texts, {color: el.dataset.animationColor, duration: .6})` et le changement de cible de la caméra/lumière 3D, sur la **même timeline**.

---
---

# FICHE 2 — SUPERLIST.CRAFTEDBYGC.COM

> Landing de teasing produit. Direction artistique : rouge saturé plein écran, objets 3D noirs mats, typo grasse blanche, transitions de section en **diagonale**. Build sur mesure (pas de framework), smooth scroll **ASScroll**.

## 2.1 Identité visuelle

### Palette (comptage réel des occurrences dans les feuilles de style)

| Rôle | HEX | RGB | Occurrences CSS | Usage approx. |
|---|---|---|---|---|
| Blanc (texte principal) | `#FFFFFF` | 255,255,255 | 21 | ~35 % |
| Quasi-noir (fond section Manifesto, texte sur clair) | `#161616` | 22,22,22 | 21 | ~30 % |
| **Rouge de marque** | `#FF5043` | 255,80,67 | 13 | ~20 % (hero + footer plein écran) |
| Noir pur | `#000000` | 0,0,0 | 3 | ~2 % |
| Rouge foncé (état pressé / variante) | `#ED4439` | 237,68,57 | 2 | ~1 % |
| Gris moyen (texte secondaire) | `#646464` | 100,100,100 | 2 | ~3 % |
| Gris clair (texte tertiaire) | `#ABABAB` | 171,171,171 | 2 | ~2 % |
| Off-white (fond section Team/Jobs) | `#F5F5F5` | 245,245,245 | 2 | ~5 % |
| Séparateur clair | `#EDEDED` | 237,237,237 | 1 | traits |
| Séparateur clair 2 | `#E3E3E3` | 227,227,227 | 1 | traits |
| Noir tiède 1 | `#222322` | 34,35,34 | 1 | dégradés |
| Noir tiède 2 | `#131311` | 19,19,17 | 1 | dégradés |
| Vert accent | `#7ED377` | 126,211,119 | 1 | `[unique]` coche / état « done » |
| Voile d'overlay | `rgba(22,22,22,0.4)` | — | 1 | `.header__overlay` plein écran |

### Inversions de section

Le site alterne **rouge → noir → blanc → noir → rouge** :

| Section | Fond | Texte |
|---|---|---|
| Hero | `#FF5043` | `#FFFFFF` |
| Manifesto | `#161616` | `#FFFFFF` + gris de scrub |
| Founders / Team | `#F5F5F5` | `#161616` |
| News | `#161616` | `#FFFFFF` |
| Jobs | `#F5F5F5` | `#161616` |
| Footer | `#FF5043` (lu : `rgb(255,80,67)`) | `#FFFFFF` |

**Point critique** : les `<section>` ont toutes `background-color: rgba(0,0,0,0)`. La couleur de fond visible vient d'un **`div.background` en `position: fixed` contenant un canvas WebGL**. Les transitions de couleur entre sections sont donc **rendues en WebGL**, pas en CSS. Et les séparations en diagonale sont des **SVG** (`.footer__bg-svg`, `.footer__bg-wrapper`) animés en `transform`.

### Effets de fond

- Pas de grain, pas de noise, pas de vignette CSS.
- **Pas de `mix-blend-mode`, pas de `clip-path` dans le CSS** — mais la découpe en forme d'éclair des photos de l'équipe est une **`<mask>` SVG** `[estimé]`.
- Séparateurs de section : bandes diagonales `[estimé] ~ -7° / 353°`, blanches ou noires selon le sens, qui **glissent verticalement au scroll** (scroll-linked) pour donner l'impression d'un rideau oblique.

### Typographie

Police unique : **Aeonik** (`AeonikWeb`), graisses **400 / 500 / 600**. Aucune autre police.

Les tailles sont exprimées en **vw calibrés sur 1440 px** (mesuré à un viewport de 1534 px ; la colonne « @1440 » est la valeur de référence du design) :

| Élément | Graisse | Mesuré @1534 | **@1440 (référence)** | vw | Line-height | Ratio LH |
|---|---|---|---|---|---|---|
| `h1.hero__title` | **500** | 111.85 px | **105 px** | 7.2917vw | 116.64 px | **1.043** |
| `p.header__panel-title.h1` (panneau « Be the first to know ») | 400 | 95.875 px | **90 px** | 6.25vw | 86.29 px | **0.90** |
| `h2.h3--l` (Manifesto) | 400 | 61.52 px | **57.75 px** | 4.0104vw | 67.67 px | 1.10 |
| `h2.hero__subtitle.p2` | 400 | 19.175 px | **18 px** | 1.25vw | 25.56 px | 1.333 |
| Lien de nav | 400 | 14.38 px | **13.5 px** | 0.9375vw | 14.38 px | 1.0 |
| Corps `p` | 400 | 16 px | 16 px | fixe | 22.4 px | **1.40** |
| `span` label | 500 | 15 px | 15 px | fixe | 15 px | 1.0 |
| Bouton cookie | 400 | 13.33 px | 13.33 px | fixe | normal | — |

**Règles lisibles :**

- `letter-spacing: normal` **partout**. Aucun tracking, ni positif ni négatif. `[unique]` par rapport à Mont-Fort (tout espacé) et Ciao (titres condensés).
- **Line-height sous 1 sur les gros titres** (0.90 sur le panneau) et ~1.04 sur le H1 : les lignes se touchent presque. C'est ce qui donne le bloc typographique compact.
- Corps de texte : 16 px / 1.4 — volontairement petit face à un H1 de 105 px. **Ratio H1/corps ≈ 6.6:1**, un contraste d'échelle très violent.
- Les tailles fluides ne sont pas en `clamp()` mais en `vw` pur → **la typo grossit indéfiniment** au-delà de 1920 px (media query `min-width: 1920px` pour corriger).

### Grille et espacement

- Système de colonnes maison : classes `col col-m--18 col-tl--8` → grille à **24 colonnes** `[estimé]` avec suffixes de breakpoint (`-m` = mobile, `-tl` = tablet landscape…).
- Wrapper de scroll : `.asscroll-wrapper` de 8009 px de haut.
- Rythme vertical mesuré (`scrollHeight = 8010 px`, viewport 881 px) :

> *Les valeurs de `top` ci-dessous sont mesurées à travers le wrapper transformé d'ASScroll ; les **hauteurs** sont exactes, les `top` sont à ±200 px près.*

| Section | `top` | Hauteur | En viewports |
|---|---|---|---|
| `.hero` | ~178 | 881 | 1.00 |
| `.manifesto.section` | 1279 | **3471** | 3.94 |
| `.founders.section` | 4751 | 1010 | 1.15 |
| `.news.section` | 5760 | 892 | 1.01 |
| `.jobs.section` | 6652 | 881 | 1.00 |
| `.footer` | 7533 | 653 | 0.74 |

> La section Manifesto fait **4 écrans** à elle seule : c'est la piste de scroll de la révélation caractère par caractère.

### Rayons, bordures, ombres

**Border-radius mesurés** : `82px`, `60px`, `58px`, `123px`, `50%` (pilules et cercles) ; `35.95px` ; `12px` / `11.98px` ; `10px`.
→ Deux familles seulement : **pilule** (`border-radius` ≥ moitié de la hauteur) et **12 px** pour les cartes.

**Box-shadows exactes** (bouton « Get notified ») :

```css
/* liseré interne clair, donne le volume du pill noir */
box-shadow: rgba(255,255,255,0.07) -2px -1px 3px 1px inset;

/* pastille rouge : halo interne */
box-shadow: rgba(217,119,87,0.7) 0 0 15px 0 inset,
            rgba(217,119,87,0.5) /* … */;

/* ombre portée chaude et très diffuse */
box-shadow: rgba(217,119,87,0.24) 0 40px 80px 0,
            rgba(217,119,87,0.24) 0 /* … */;
```

À noter : l'ombre n'est **pas noire** mais **rouge désaturée** (`#D97757` à 24 %), ce qui la fond dans le fond rouge au lieu de le salir.

**Bordures** : `1px` sur les pilules blanches (`Okay` du bandeau cookies), `#EDEDED`/`#E3E3E3` sur les séparateurs de liste.

## 2.2 Hero — image par image

**Preloader** (mesuré) :

| t | État |
|---|---|
| 0 → ~0.3 s | Fond noir `#000000`, un éclair (logo Superlist) **à moitié rempli** : la moitié haute est gris foncé `[estimé] #2A2A2A`, la moitié basse est rouge `#FF5043`. |
| 0.3 → ~2 s | Le **remplissage rouge monte** dans la forme de l'éclair — c'est une barre de progression **contenue dans le logo**. |
| ~2 → 4.5 s | 100 % rouge → **cut** vers le fond rouge plein écran ; les objets 3D noirs sont déjà en scène, en cours d'assemblage. |
| ~4.5 → 7.5 s | Le H1 « Supercharged productivity » et le sous-titre apparaissent, la pastille de scroll et le bandeau cookies arrivent en dernier. |

> **Total avant interactivité : ≈ 4,5 s** (visuel) / **≈ 7,5 s** (composition complète).
> `[unique]` : le compteur n'est pas un chiffre mais **le remplissage du logo lui-même**.

**Composition du hero** : fond rouge `#FF5043` plein écran. Au centre, une **grappe d'objets 3D noirs mats** (carnet, casque, clavier, stylo, étoile, palets) enlacés dans un **trombone géant en métal chromé** en forme d'éclair. Le H1 blanc (105 px, 2 lignes, centré) est **derrière certains objets et devant d'autres** — les objets 3D traversent le plan du texte. Sous-titre 18 px centré sur 2 lignes. Pastille blanche 60 px avec flèche ↓.

**Séquence d'arrivée** (déduite des états initiaux lus dans `index.js`) :

| Élément | De → Vers | Durée | Easing | Stagger |
|---|---|---|---|---|
| Objets 3D | dispersés hors champ → position finale, rotation continue | `[estimé] 2 s` | `[estimé] expo.out` | `[estimé] 0.075` |
| H1 (par caractère) | `{y: -10, opacity: 0}` → `{y: 0, opacity: 1}` | **0.5 s** | **`power2.out`** | **0.02 s** |
| Sous-titre (par ligne) | `{y: 30, opacity: 0}` → `0, 1` | `[estimé] 0.8 s` | `[estimé] expo.out` | `[estimé] 0.1` |
| Pastille scroll | `{opacity: 0, scale: …}` → 1 | `[estimé] 0.6 s` | `[estimé] back.out(2)` | — |

**Réaction à la souris** : les objets 3D ont une **rotation continue lente** (idle loop) `[estimé]` et suivent légèrement la souris `[estimé]`. Aucun curseur custom, aucun magnétisme CSS détecté.

**Au premier scroll** : la grappe d'objets **se disperse et sort du champ vers le bas** pendant que le fond passe du rouge au noir — cross-fade rendu en WebGL. Le H1 reste plus longtemps que le fond (effet de décalage).

## 2.3 Motion & scroll

### Easings — valeurs exactes

**CSS** — deux courbes seulement, mais très présentes :

| cubic-bezier | Durée dominante | Usage |
|---|---|---|
| `cubic-bezier(0.32, 0.94, 0.6, 1)` | **0.6 s** (et 0.8 s, 0.5 s) | *la* courbe du site : hovers, opacité, transform, couleur, `stroke-dashoffset` |
| `cubic-bezier(0.77, 0, 0.18, 1)` | 0.6 / 0.8 s | in-out symétrique : `width`, `visibility`, rideaux |

> **Recoupement inter-sites** : `cubic-bezier(0.32, 0.94, 0.6, 1)` est **aussi** la courbe du curseur de Mont-Fort. Les deux studios (Immersive Garden / Crafted by GC) utilisent la même signature.

**GSAP** (extraits de `index.js`) : `none`, `power2.out`, `power2.inOut`, `power4.out`, `expo.out`, `expo.inOut`, `cubic.inOut`, **`back.out(2)`**, **`elastic.out(1, 0.2)`**, **`elastic.out(1, 0.3)`**, **`elastic.out(1, 0.4)`**.

> `back.out(2)` et `elastic.out()` sont **absents de Mont-Fort et de Ciao** `[unique]`. C'est ce qui donne le côté « joueur » de Superlist : les micro-éléments rebondissent.

Durées présentes : `.1 .3 .4 .5 .6 .8 .9 1 1.4 1.5 1.7 2 3 3.5` s.
Staggers : `.02` (chars), `.03`, `.05`, `.075`, `.1`.

### États de départ exacts (lus dans le bundle)

```js
{ y: 50, opacity: 0 }                                  // gros blocs
{ y: 40, opacity: 0 }                                  // blocs moyens
{ y: 30, opacity: 0 }                                  // paragraphes
{ opacity: 0, y: 10 }                                  // micro-éléments
{ y: -10, opacity: 0, duration: .5, ease: "power2.out", stagger: .02 }  // caractères (descente inversée)
{ scaleY: 1.6, opacity: 0 }                            // ligne étirée verticalement
{ scaleY: 2,   opacity: 0 }                            // variante plus violente
{ opacity: 0, duration: .3 }                           // fondu simple
{ opacity: 0, duration: .1 }                           // coupe
```

> **`scaleY: 1.6 → 1` + `opacity 0 → 1`** est l'effet le plus caractéristique : le texte apparaît **écrasé verticalement puis se détend**. Personne d'autre parmi les trois ne fait ça. `[unique]`

### Tableau des effets

| Section | Effet | Déclencheur | Propriétés (de → vers) | Durée | Easing | Stagger | Librairie |
|---|---|---|---|---|---|---|---|
| Global | Smooth scroll | permanent | wrapper `.asscroll-wrapper`, mode scrollbar native | — | — | — | **ASScroll** |
| — | *Inertie perçue* | — | `[estimé]` **lourde** : ~4–6 frames de retard, arrêt long, sensation « masse » | — | — | — | — |
| Global | Fond de page | scroll-linked | rouge `#FF5043` → `#161616` → `#F5F5F5` → `#161616` → `#FF5043` | continue | `none` | — | WebGL (`div.background` fixed) |
| Global | Séparateur diagonale | scroll-linked | bande SVG `[estimé] ~ -7°` translatée verticalement | continue | `none` | — | GSAP + SVG |
| Hero | Dispersion des objets 3D | scroll-linked, `scrub: .2` | position + rotation + `opacity` | continue | lissé par `scrub` | — | Three.js + ScrollTrigger |
| **Manifesto** | **Titre géant révélé caractère par caractère** | **scroll-linked**, `scrub: .1` sur 4 écrans | chaque `char` : `color/opacity` gris `#646464` → blanc `#FFFFFF` | continue | linéaire sur le scroll | `.02` implicite (décalage par index) | SplitText `type:"chars"` + ScrollTrigger |
| Manifesto | Titre épinglé | scroll | `pin: e.title` — le titre reste collé pendant que la colonne de droite défile | ~3.9 écrans | — | — | ScrollTrigger `pin` |
| Manifesto | Formes 3D morphing | scroll-linked | cubes → sphère → cube rouge + sphère noire → palets rouges/noirs | continue | `none` | — | Three.js |
| Colonne droite | Blocs de texte | scroll-triggered, `start: "top 60%"` | `{y: 50, opacity: 0}` → `{y: 0, opacity: 1}` | `[estimé] 0.8 s` | `[estimé] expo.out` | `.1` | GSAP |
| Team | Photos en masque éclair | scroll-triggered, `start: "top bottom+=25%"` | `scale 1.1 → 1` + `opacity` | `[estimé] 1.4 s` | `[estimé] power4.out` | `.075` | GSAP |
| News | Boîte aux lettres 3D | scroll-linked | rotation + ouverture du volet | continue | `none` | — | Three.js |
| Jobs | Mégaphone 3D | scroll-linked | rotation, particules blanches | continue | `none` | — | Three.js |
| Header | Item de nav actif | scroll (section courante) | `color` blanc → `#FF5043` | **0.6 s** | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Header | Inversion en section claire | scroll-triggered | `color` blanc → `#161616` | 0.6 s | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Bouton « Get notified » | Hover | hover | `background-color, color` | **0.6 s** | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Bouton | Pastille rouge | hover | `transform` (scale) | **0.8 s** | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Icônes SVG | Hover | hover | `fill` 0.6 s + `transform` **0.8 s** | — | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Traits animés | Dessin de ligne | scroll-triggered | `stroke-dashoffset` + `stroke` | **0.6 s** | `cubic-bezier(.32,.94,.6,1)` | — | CSS |
| Panneau « Be the first to know » | Ouverture | clic | `transform, opacity, width` — `width` en `cubic-bezier(.77,0,.18,1)` | 0.6 s | `cubic-bezier(.32,.94,.6,1)` / `(.77,0,.18,1)` | — | CSS |
| Transition de page | Rideau | clic lien | `.p-cover` (fixed, `z-index: 600`) `opacity, visibility` | **0.6 s** | `cubic-bezier(.77,0,.18,1)` | — | CSS + GSAP |
| Overlay header | Voile | ouverture panneau | `.header__overlay` `rgba(22,22,22,.4)` `opacity 0 → 1` | 0.5 s | `cubic-bezier(.32,.94,.6,1)` | — | CSS |

**Points de déclenchement ScrollTrigger — liste exhaustive lue dans le bundle :**

```
start: "top 30%"          start: "top bottom"        start: "top bottom+=30%"
start: "top bottom+=25%"  start: "top 60%"           start: "top 10%"
start: "top top"          start: "top-=15% top"      start: "top -5%"

end: "bottom 65%"   end: "top top"       end: "bottom top-=90%"   end: "bottom top"
end: "bottom 10%"   end: "bottom center" end: "bottom bottom-=25%"
end: "bottom 50%"   end: "bottom 80%"    end: "+=30%"

scrub: .1     scrub: .2     scrub: true
pin: true     pin: e.title
```

> **Lecture** : `scrub: .1` et `.2` (et non `true`) → les effets scroll-linked ont un **lissage de 100–200 ms**, ce qui évite le côté « collé à la molette » et donne cette élasticité.

**Ce qui n'existe PAS sur Superlist** : aucun marquee, aucun scroll horizontal, aucun carrousel, aucun curseur custom, aucune `@keyframes` CSS (hors celles de mon propre agent) — **tout le motion est GSAP ou WebGL**, zéro animation CSS déclarative. Aucun `mix-blend-mode`, aucun `clip-path` CSS.

## 2.4 3D / WebGL

- **Moteur** : Three.js (présent dans `vendor.js` de 889 Ko), **3 `<canvas>`**.
- **Architecture** : un canvas de fond en `position: fixed` (`div.background`) qui porte à la fois **la couleur de fond** et **les objets 3D**. Les sections HTML sont transparentes par-dessus.
- **Nature des modèles** : objets de bureau stylisés en **noir mat** (roughness élevée, quasi pas de spéculaire) sauf le trombone-éclair en **chrome poli** (réflexion nette). Contraste mat/brillant = tout l'effet.
- **Lumières** : `[estimé]` une key light directionnelle en haut-gauche + une rim light, ou une HDRI studio simple ; les ombres portées au sol sont absentes → les objets flottent.
- **Mouvement caméra** : `[estimé]` la caméra bouge peu ; ce sont les **objets** qui sont animés par le scroll (position + rotation).
- **Réaction souris** : `[estimé]` léger parallaxe des objets.
- **Post-processing** : `[estimé]` aucun effet marqué (pas de bloom, pas d'aberration).
- **Particules** : oui, sur la section Jobs (poussière blanche autour du mégaphone).
- **Fallback** : aucun fallback image détecté ; la 3D reste active sur tous les breakpoints `[estimé]`.

## 2.5 Imagerie & médias

- **Zéro `<video>`.** Les photos réelles n'existent que dans la section Team.
- **Photos d'équipe** : détourées sur fond transparent, posées dans un **masque en forme d'éclair** (la silhouette du logo) `[estimé] <mask> SVG`. Ratio ~1:1, recadrage buste.
- Pas de filtre `grayscale`, pas de conversion couleur au hover détectée.
- Séparateurs de liste `founders__list-item-divider` : `background: #EDEDED`, 1 px.
- Lazy-load : `[estimé]` géré par le bundle, pas d'attribut `loading="lazy"` visible.

## 2.6 Responsive

Breakpoints (lus) : `min-width: 768px`, `min-width: 1024px`, `min-width: 1240px`, `min-width: 1920px`, `max-width: 1239px`, plus `print`.

- Le point de bascule principal est **1240 px** (et non 1024) : c'est là que la mise en page desktop 2 colonnes du Manifesto s'effondre.
- `min-width: 1920px` sert uniquement à **plafonner la typo en vw** qui sinon devient énorme.
- Aucune règle `display: none` conditionnelle massive n'a été trouvée sous `max-width: 1239px` → **le site ne retire pas de contenu en mobile**, il ré-empile. `[estimé]` la 3D est conservée.

## 2.7 `prefers-reduced-motion`

Une media query `(prefers-reduced-motion: reduce)` existe dans la feuille de style, **mais aucune règle du site à l'intérieur** (le seul contenu trouvé provient de mon propre agent injecté). `prefers-reduced-motion` apparaît **0 fois** dans `index.js`.

**Conclusion : Superlist n'implémente pas `prefers-reduced-motion`.** Smooth scroll, WebGL et reveals tournent identiquement.

## 2.8 Signature moves — top 5

**1. La révélation caractère par caractère pilotée au scroll sur 4 écrans**
*Pourquoi ça marque* : « We're building the future » s'écrit littéralement sous vos doigts, un caractère par cran de molette, en gris qui vire au blanc. La phrase devient une barre de progression.
*Reproduction* :
```js
const split = new SplitText(title, {type:"chars"});
gsap.fromTo(split.chars, {color:"#646464"}, {
  color:"#FFFFFF", stagger: 0.02, ease:"none",
  scrollTrigger:{ trigger: section, start:"top top", end:"bottom bottom",
                  scrub: 0.1, pin: title }
});
```
La clé est `ease:"none"` + `scrub` : le stagger devient une **position dans le scroll**, pas une durée.

**2. Le remplissage du logo comme barre de chargement**
*Pourquoi ça marque* : pas de chiffre, pas de barre — la marque **se remplit**. On lit la progression et le logo en même temps.
*Reproduction* : deux copies superposées du SVG du logo ; celle du dessus est en `clip-path: inset(X% 0 0 0)` (ou dans un `<clipPath>` SVG) piloté par `X = 100 - progress`. Animer avec `gsap.to(target,{value:100, ease:"none"})` branché sur le vrai compteur de chargement.

**3. Les transitions de section en diagonale**
*Pourquoi ça marque* : une coupe droite entre deux couleurs est banale ; une coupe à -7° qui glisse crée un mouvement latéral gratuit à chaque changement de chapitre.
*Reproduction* : une `<svg>` `position:absolute` en haut de section contenant un `<polygon>` (0,0 / 100%,0 / 100%,80% / 0,100%) rempli de la couleur de la section suivante. `gsap.to(polygon, {y: -H, ease:"none", scrollTrigger:{scrub: .2}})`.

**4. `scaleY: 1.6 → 1` comme reveal de texte**
*Pourquoi ça marque* : le texte se « détend » au lieu de monter. C'est un mouvement d'élasticité qu'on lit sans le nommer.
*Reproduction* : `gsap.from(lines, {scaleY: 1.6, opacity: 0, transformOrigin:"50% 100%", duration: .8, ease:"expo.out", stagger: .05})`. Attention : `scaleY` sur du texte demande un conteneur avec `overflow: hidden` sinon les jambages débordent.

**5. L'ombre portée colorée (rouge à 24 %) au lieu du noir**
*Pourquoi ça marque* : sur un fond rouge saturé, une ombre noire ferait une tache sale. L'ombre `rgba(217,119,87,.24) 0 40px 80px` fait « briller » le bouton au lieu de le poser.
*Reproduction* : prendre la teinte du fond, la désaturer d'environ 40 % et la foncer, puis l'utiliser en `box-shadow` très diffuse (`blur` ≥ 2× l'offset Y). Ajouter un `inset` clair (`rgba(255,255,255,.07) -2px -1px 3px 1px inset`) pour le volume.

---
---

# FICHE 3 — WWW.CIAOENERGY.COM

> Marque de boisson énergisante. Direction artistique : noir absolu, éclairage studio, canettes 3D photoréalistes, HUD technique (crochets d'angle, lettres éparses, barre de progression), et un **thème couleur qui change avec le parfum**. Base **Webflow** + moteur 3D custom. Studio : Skaald.

## 3.1 Identité visuelle

### Design tokens réels (variables CSS déclarées sur `:root`)

C'est le seul des trois sites avec un **vrai système de tokens**. Valeurs exactes :

```css
/* ---------- Couleurs primitives ---------- */
--_primitives---colors--white:            #fff;
--_primitives---colors--neutral-darkest:  black;
--_primitives---colors--neutral-darker:   #222;
--_primitives---colors--neutral-dark:     #444;
--_primitives---colors--neutral:          #666;
--_primitives---colors--neutral-light:    #aaa;
--_primitives---colors--neutral-lighter:  #ccc;
--_primitives---colors--neutral-lightest: #eee;
--_primitives---brand--camel-lightest:    #f9f8ee;   /* crème, usage marginal */

/* ---------- Échelle d'opacité blanche (LE point fort) ---------- */
--_primitives---opacity--white-0:   #ffffff00;
--_primitives---opacity--white-5:   #ffffff0d;   /*  5 % */
--_primitives---opacity--white-20:  #fff3;       /* 20 % */
--_primitives---opacity--white-30:  #ffffff4d;   /* 30 % */
--_primitives---opacity--white-50:  #ffffff80;   /* 50 % */
--_primitives---opacity--white-60:  #fff9;       /* 60 % */
--_primitives---opacity--white-80:  #fffc;       /* 80 % */
--_primitives---opacity--transparent: transparent;

/* ---------- Schéma appliqué ---------- */
--color-scheme-1--background: var(--_primitives---colors--neutral-darkest); /* noir */
--color-scheme-1--text:       var(--_primitives---colors--white);
--color-scheme-1--accent:     var(--_primitives---colors--white);
--color-scheme-1--border:     var(--_primitives---opacity--white-20);
--color-scheme-1--background-0: var(--_primitives---opacity--white-0);

/* ---------- Couleurs de PARFUM (changées en JS, transitionnées en CSS) ---------- */
--color-scheme-1--taste-primary:   #800035;  /* défaut : Framboise */
--color-scheme-1--taste-secondary: #ff659d;
```

**Valeurs de parfum relevées en direct** (Double Litchi, lues pendant le scroll) :
`--taste-primary: rgb(61, 43, 104)` = **`#3D2B68`** · `--taste-secondary: rgb(144, 137, 211)` = **`#9089D3`**

Les six parfums (déduits des noms de vidéos de fond, valeurs de couleur `[estimé]` sauf les deux ci-dessus) :

| Parfum | `taste-primary` | `taste-secondary` |
|---|---|---|
| Framboise | `#800035` | `#FF659D` |
| Double Litchi | `#3D2B68` | `#9089D3` |
| Coco Citron | `[estimé] #14313D` | `[estimé] #6FD3E0` |
| Kiwi Concombre | `[estimé] #16351F` | `[estimé] #7FD98C` |
| Pêche Blanche | `[estimé] #4A2418` | `[estimé] #F0A882` |
| Pomme Rhubarbe | `[estimé] #4A0F1E` | `[estimé] #E86A7A` |

### Répartition d'usage approximative

| Couleur | Part de l'écran |
|---|---|
| Noir (`#000`) + dégradé vers `taste-primary` | **~75 %** |
| Blanc (texte, logo, UI) | ~10 % |
| `white-20` / `white-30` (traits, bordures, HUD) | ~8 % |
| `taste-secondary` (canette, halos) | ~7 % |

### Effets de fond

- **Dégradé radial/linéaire** noir → `taste-primary` sur toute la hauteur du viewport, **animé** : quand on change de parfum, ce sont les **variables CSS elles-mêmes** qui transitionnent :

```css
transition: --color-scheme-1--taste-primary   0.6s ease-in-out,
            --color-scheme-1--taste-secondary 0.6s ease-in-out;
```
> `[unique]` — transitionner une **custom property** (nécessite `@property` avec `syntax: "<color>"`). Aucun des deux autres sites ne fait ça.

- **6 vidéos WebM de fond** (`Ciao-energy_background_<parfum>.webm`), `loop`, `muted`, `autoplay: false` — jouées/mises en pause selon le parfum actif. Elles apportent la texture animée du fond (fumée / lumière).
- **Backdrop-filter** mesurés : `blur(7px)`, `blur(14px)`, `blur(28px)` et **`blur(210px)`** — ce dernier est un immense halo flou derrière la canette.
- Pas de grain CSS ; le grain visible vient du rendu 3D `[estimé]`.
- **HUD** : crochets d'angle `⌐ ¬ ∟ ⌐` aux quatre coins du viewport, et des lettres isolées (`C`, `E`, `—`, `L`, `I`, `T`, `H`) réparties sur les bords : ce sont les caractères du nom du parfum **éclatés et positionnés en absolu**, qui se rassemblent au centre lors de la transition. `[unique]`

### Typographie

`html { font-size: 14px }` — **toute l'échelle en `rem` est donc rebasée sur 14** (et non 16).

```css
--_typography---font-styles--heading:        "Franklin Gothic Atf", Arial, sans-serif;
--_typography---font-styles--heading-weight: 500;
--_typography---font-styles--body:           Geist, Arial, sans-serif;
--_typography---font-styles--mono:           Geistmono, Arial, sans-serif;
```

Polices chargées : **Franklin Gothic ATF** (500 et 900 — italique condensée), **Geist** (300, 400, 500), **Geist Mono**.

| Élément | Police | Graisse | Taille | Line-height | Ratio LH | Transform |
|---|---|---|---|---|---|---|
| `h2.heading-style-custom` (« FOIRE AUX QUESTIONS ») | Franklin Gothic ATF | 500 | **115.05 px** | 92.04 px | **0.80** | uppercase |
| `p.heading-style-h2` (« REJOIGNEZ-NOUS ») | Franklin Gothic ATF | 500 | 42 px | 33.6 px | **0.80** | uppercase |
| Titre de parfum (« DOUBLE LITCHI ») | Franklin Gothic ATF | 500 | `[estimé] ~64 px` | `[estimé] 0.80` | 0.80 | uppercase |
| `div.heading-style-h5` (question FAQ) | Geist | 500 | 19.175 px | 26.845 px | 1.40 | none |
| Lien de nav (menu) | Geist | 400 | 30.68 px | 46.02 px | 1.50 | uppercase |
| `p.text-size-medium` (corps) | Geist | **300** | 15.75 px | 23.625 px | **1.50** | none |
| `p.text-size-small` | Geist | 500 | 12.25 px | 18.375 px | 1.50 | none |
| `div.text-size-tiny` (© footer) | Geist | 300 | 10.5 px | 15.75 px | 1.50 | none |
| Bouton `CONTACT` | Geist | 400 | 14 px | 14 px | 1.00 | uppercase |
| Bouton petit | Geist | 400 | 12.25 px | 12.25 px | 1.00 | uppercase |
| `MENU` | Geist | 300 | 12.25 px | 18.375 px | 1.50 | uppercase |

**Règles lisibles :**

- **Deux familles, deux rôles stricts** : Franklin Gothic ATF **uniquement** pour les titres (italique, condensée, uppercase, `line-height: 0.80`) ; Geist **uniquement** pour l'interface et le corps (`line-height: 1.50`).
- `line-height: 0.80` sur les titres = les lignes **se chevauchent presque**. Combiné à l'italique condensée, ça donne le côté « logo de canette ».
- Corps en **Geist 300** (light) : la légèreté du corps fait ressortir la brutalité des titres.
- Échelle en rem sur base 14 : 10.5 (0.75rem) → 12.25 (0.875) → 14 (1) → 15.75 (1.125) → 19.175 (1.37) → 42 (3) → 115.05 (8.22). **Ratio ~1.125 sur le petit, ~2.7 sur le grand.**
- `letter-spacing: normal` partout (le condensé vient de la police, pas du tracking).

### Grille et espacement (tokens réels)

```css
--_spacing-sizing---container--container-xlarge: 120rem;  /* = 1680px @14px */
--_spacing-sizing---page-padding--padding-global: 4%;
--_spacing-sizing---booking--nav-height: 8rem;            /* = 112px */

/* Échelle d'espacement — 11 crans, tous fluides */
--element-padding--t:   .25rem;                       /*   3.5px */
--element-padding--xxs: .5rem;                        /*     7px */
--element-padding--xs:  clamp(.75rem, .65vw, 1rem);   /* 10.5 → 14px */
--element-padding--s:   clamp(1.25rem, 1.1vw, 1.5rem);/* 17.5 → 21px */
--element-padding--m:   clamp(1.5rem, 1.4vw, 2rem);   /*   21 → 28px */
--element-padding--l:   clamp(2rem, 2vw, 3rem);       /*   28 → 42px */
--element-padding--xl:  clamp(2.5rem, 2.8vw, 4rem);   /* 35 → 56px */
--element-padding--xxl: clamp(3rem, 3.5vw, 5rem);     /* 42 → 70px */
--element-padding--h:   clamp(3.5rem, 4vw, 6rem);     /* 49 → 84px */
--element-padding--xh:  clamp(4rem, 4.8vw, 7rem);     /* 56 → 98px */
--element-padding--xxh: clamp(5rem, 6.5vw, 10rem);    /* 70 → 140px */
```

**Rythme vertical** : 11 `<section>`, dont **10 font exactement 1101 px** (= 1.25 × la hauteur de viewport de 881 px) et la FAQ 1627 px. `scrollHeight` total = **12 639 px**.

> Architecture réelle : les conteneurs de section (`.gamme_container`, `.profile_container`, `.benefits_container`…) sont en **`position: fixed`** et se croisent en `opacity: 0 ↔ 1`. Les `<section>` ne servent **qu'à donner de la hauteur de scroll**. C'est un « slideshow piloté par le scroll », pas un flux vertical.

### Rayons, bordures, ombres

```css
--_ui-styles---radius--xsmall: .25rem;  /*  3.5px */
--_ui-styles---radius--small:  .5rem;   /*    7px */
--_ui-styles---radius--medium: 1rem;    /*   14px */
--_ui-styles---radius--large:  2rem;    /*   28px */
--_ui-styles---radius--button: var(--_ui-styles---radius--small);
--_ui-styles---stroke--border-width:  1px;
--_ui-styles---stroke--divider-width: 1px;
--_ui-styles---blur--backdrop: 2rem;    /*   28px */
```
Rayons réellement mesurés dans le rendu : `3.5px`, `7px`, `14px`, et **`767px`** (pilule du bouton CONTACT).

**Box-shadows exactes :**
```css
/* halo blanc — état actif d'une icône d'ingrédient */
box-shadow: 0 0 20px 0 rgba(255,255,255,0.6);

/* anneau 1px — bordure des pastilles */
box-shadow: 0 0 0 1px rgba(255,255,255,0.2);
```

## 3.2 Hero — image par image

### Preloader (mesuré précisément)

| t | État |
|---|---|
| 0 s | Fond noir `#000`. Le logo **CIAO ENERGY tourné à 90°** (vertical, occupe ~50 % de la hauteur) apparaît en gris très sombre. Sous lui, le compteur : chiffres blancs, espacés (`0 %`). |
| 0 → 7.048 s | Une **lueur chromée** balaie le logo de bas en haut : la partie « remplie » passe du gris `[estimé] #3A3A3A` au blanc métallisé. Le compteur monte en parallèle. |
| — | **Le compteur n'est pas un vrai chargement** : il vaut exactement `video.currentTime / video.duration × 100`. La vidéo `Ciao-energy_loader-v2.webm` fait **7,048 s**. Le preloader dure donc **toujours 7,048 s**, quelle que soit la connexion. |
| ~7 s | Le logo **s'éteint** (retour au noir sur noir, en relief), puis **se transforme en canette 3D noire** vue de face, éclairée par un simple rim light. |
| ~7.5 → 8.5 s | Le header (logo, `ON ▮▮▯▯`, `MENU`, `CONTACT` en pilule blanche), la barre de progression fine en haut, et le HUD d'angle apparaissent. |

> **Total avant interactivité : ≈ 8 s.** C'est le plus long des trois, et de loin. `[unique]` : le pourcentage est **piloté par une vidéo**, ce qui garantit la durée du spectacle mais **bloque l'utilisateur** — et casse complètement si l'autoplay est refusé (constaté : dans un onglet non focalisé, le compteur reste figé et le site ne s'ouvre jamais).

### Hero

**Composition** : noir quasi total. Une **canette 3D photoréaliste** au centre, noir mat, texte de l'étiquette en noir légèrement plus clair — lisible seulement par les reflets. Aucun texte, aucun titre. Juste l'objet.

Au premier scroll, la canette **bascule et pivote**, un **dégradé de parfum** monte du bas de l'écran, le nom du parfum s'écrit, et le rail d'icônes d'ingrédients apparaît à droite.

**Réaction à la souris** : `mousemove` est bien branché (trouvé dans le code) → parallaxe légère de la caméra `[estimé]`.

## 3.3 Motion & scroll

### Configuration Lenis — valeurs exactes

```js
new Lenis({
  duration: 1.5,
  easing: (t) => 1 - Math.pow(1 - t, 3),   // easeOutCubic
  infinite: true,                           // ← le scroll BOUCLE
  syncTouch: true
})
```

> **`infinite: true`** : arrivé en bas, la page **repart en haut sans coupure**. Vérifié en direct — la barre de progression du header se remet à zéro et la scène 3D reprend. `[unique]`
> **`duration: 1.5` + easeOutCubic** = inertie **très lourde**, la plus lourde des trois. Après un cran de molette, le défilement continue visiblement pendant ~1 s.

### Easings & durées

**GSAP** (extraits du code inline, 90 593 caractères) : `power1.out`, `power1.inOut`, `power2.in`, `power2.out`, `power2.inOut`, `power3.out`, `power3.inOut`, **`power4.out`**, **`back.out(2)`**.
Durées : `0.3 · 0.4 · 0.45 · 0.5 · 0.6 · 0.8 · 0.9 · 1 · 1.2 · 1.5 · 2.5 · 8` s.
Staggers : `0.04 · 0.05 · 0.08 · 0.15 · 0.25`, `{each: 0.08, from: 'start'}`, `{each: 0.1, from: 'start'}`.

**CSS** — toutes les transitions mesurées :

| Propriétés | Durée | Easing |
|---|---|---|
| `--taste-primary`, `--taste-secondary` | **0.6 s** | `ease-in-out` |
| `opacity` | 0.2 s | `ease` |
| `color` | 0.2 s | `ease` |
| `opacity` | 0.4 s | `ease` |
| `background-color` | 0.4 s | `ease` |
| `border`, `background-color` | 0.4 s | `ease` |
| `color`, `border-color`, `box-shadow` | 0.4 / 0.2 / 0.4 s | `ease` |
| `box-shadow` | 0.2 s | `ease` |
| `font-size`, `transform` | 0.2 s | `ease` |

> Contrairement aux deux autres sites, **Ciao n'utilise aucun `cubic-bezier` custom en CSS** — uniquement `ease` et `ease-in-out`. Toute la finesse est côté GSAP.

### États de départ exacts

```js
{ opacity: 0, scale: 0, transformOrigin: '50% 50%' }             // pastilles / icônes
{ height: 0, opacity: 0, display: 'none', overflow: 'hidden' }   // accordéon FAQ
yPercent: 110 → 0        // ligne qui monte depuis sous le masque
yPercent: 0   → -110     // ligne qui sort par le haut
y: 10 / 30 / 35 / 45 / 50   // décalages verticaux en px
```

> **`yPercent: 110 → 0` avec conteneur `overflow: hidden`** = le **masque de ligne** classique : chaque ligne de texte est cachée sous son propre conteneur puis remonte. C'est le reveal principal du site.
> **`scale: 0 → 1` avec `transformOrigin: 50% 50%` + `back.out(2)`** = les pastilles d'ingrédients **éclosent** avec un léger dépassement.

### Tableau des effets

| Section | Effet | Déclencheur | Propriétés (de → vers) | Durée | Easing | Stagger | Librairie |
|---|---|---|---|---|---|---|---|
| Global | Smooth scroll | permanent | `duration: 1.5`, `easing: 1-(1-t)³`, `infinite: true`, `syncTouch: true` | — | — | — | **Lenis** |
| — | *Inertie perçue* | — | **très lourde** (~1 s de continuation après la molette) | — | — | — | — |
| Global | **Boucle infinie** | fin de page | retour à `scrollTop: 0` sans coupure | — | — | — | Lenis `infinite` |
| Header | Barre de progression | scroll-linked | trait blanc `width 0 → 100%` en haut du viewport, avec un point lumineux qui glisse | continue | `none` | — | GSAP |
| Header | Indicateur `ON ▮▮▯▯` | boucle idle | 4 barres qui s'allument séquentiellement | `[estimé] 1.2 s` | `[estimé] steps` | — | CSS/GSAP |
| Global | Chapitres empilés | scroll-triggered, `start: 'top bottom'` / `'bottom bottom'` | `.xxx_container` fixed : `opacity 0 ↔ 1`, `visibility` | `[estimé] 0.8 s` | `[estimé] power2.inOut` | — | GSAP + ScrollTrigger |
| Global | **Thème de parfum** | scroll (entrée de chapitre) | `--taste-primary` et `--taste-secondary` interpolées | **0.6 s** | `ease-in-out` | — | CSS `@property` + JS |
| Global | Vidéo de fond | changement de parfum | cross-fade entre 6 `<video>` WebM en boucle | `[estimé] 0.6 s` | `[estimé] ease-in-out` | — | JS |
| Canette | Rotation / bascule | **scroll-linked** | rotation X/Y/Z + position + focale caméra | continue | `none` | — | Three.js + ScrollTrigger |
| Canette | Parallaxe souris | `mousemove` | rotation caméra ±`[estimé] 2°` | `[estimé] lissage 0.6 s` | `[estimé] power2.out` | — | JS |
| Titres | Masque de ligne | scroll-triggered | `yPercent 110 → 0` dans conteneur `overflow: hidden` | `[estimé] 0.9 s` | `[estimé] power4.out` | `{each: .08, from:'start'}` | GSAP SplitText `type:'lines'` |
| Titres | Sortie | scroll-triggered | `yPercent 0 → -110` | `[estimé] 0.6 s` | `[estimé] power2.in` | `{each: .08}` | GSAP |
| Titres longs | Cascade caractère | scroll-triggered | SplitText `type:'lines,chars'` | — | — | `.04` | GSAP SplitText |
| Corps | Fade-up | scroll-triggered | `{y: 30, opacity: 0}` → `{y: 0, opacity: 1}` | `[estimé] 0.8 s` | `[estimé] power3.out` | `{each: .1}` | GSAP |
| Icônes ingrédients | Éclosion | scroll-triggered | `{opacity: 0, scale: 0, transformOrigin:'50% 50%'}` → `1, 1` | `[estimé] 0.6 s` | **`back.out(2)`** | `.15` | GSAP |
| Icône active | Halo | scroll (icône courante) | `box-shadow: 0 0 20px rgba(255,255,255,.6)`, `opacity 0.4 → 1` | 0.4 s | `ease` | — | CSS |
| HUD | Lettres du parfum | scroll-triggered | lettres éparses sur les bords → assemblage | `[estimé] 1.2 s` | `[estimé] power3.inOut` | `.25` | GSAP |
| FAQ | Accordéon | clic | `{height: 0, opacity: 0, display:'none', overflow:'hidden'}` → auto | `[estimé] 0.5 s` | `[estimé] power2.inOut` | — | GSAP |
| Boutons | Hover | hover | `background-color`, `color`, `border-color`, `box-shadow` | 0.4 / 0.4 / 0.2 / 0.4 s | `ease` | — | CSS |
| Liens | Hover | hover | `color` | 0.2 s | `ease` | — | CSS |
| Nav | Item hover | hover | `font-size`, `transform` | **0.2 s** | `ease` | — | CSS |
| Spinner de chargement | Boucle idle | permanent | `@keyframes indicator-spin` | **1.3 s** | **`cubic-bezier(0.46, 0.35, 0.39, 0.85)`** | infinite | CSS |
| Panneaux | Verre dépoli | permanent | `backdrop-filter: blur(7px / 14px / 28px / 210px)` | — | — | — | CSS |

**Déclencheurs ScrollTrigger réellement utilisés :**
```
start: 'top bottom'   start: 'bottom bottom'
end:   'bottom top'   end:   'bottom bottom'
pin: 0        (aucun pin)
scrub: —      (aucun scrub déclaré côté GSAP)
```
> Le scroll-linked de la 3D ne passe **pas** par `scrub` de ScrollTrigger mais par une lecture directe de la progression Lenis dans la boucle de rendu `[estimé]`.

**Ce qui n'existe PAS sur Ciao** : aucun curseur custom, aucun marquee, aucun scroll horizontal, aucun `mix-blend-mode`, aucun `clip-path` CSS, aucune section pinnée au sens ScrollTrigger.

## 3.4 3D / WebGL

**Modules réellement chargés** (liste exhaustive lue dans les ressources réseau) :
```
three.module.js       GLTFLoader.js
EffectComposer.js     RenderPass.js     ShaderPass.js     SMAAPass.js
base.glb              can.glb           hdri2.hdr
```

- **Contexte** : `webgl2`, un `<canvas>` de 1534 × 881 dans `.main-wrapper`.
- **Scène** : `base.glb` (le socle / le plateau vu en bas de page) + `can.glb` (la canette, instanciée 6 fois avec des textures d'étiquette différentes en **AVIF**).
- **Éclairage** : **image-based lighting via `hdri2.hdr`** — c'est ce qui donne les reflets métalliques réalistes sur l'aluminium et le liseré du couvercle. Plus, `[estimé]`, une ou deux lumières directionnelles pour les rim lights.
- **Matériaux** : `[estimé]` `MeshPhysicalMaterial` — corps de canette avec `metalness` élevé et `roughness` variable (mat sur l'étiquette, poli sur le couvercle et le fond).
- **Post-processing** : `EffectComposer` → `RenderPass` → `ShaderPass` (**un shader custom**, probablement le dégradé de parfum + grain + vignette) → **`SMAAPass`** (anticrénelage de qualité, indispensable sur les arêtes de canette).
- **Mouvement caméra** : piloté au scroll (dolly + orbit) + parallaxe souris légère.
- **Fallback mobile / machine lente** : **aucun détecté**. Pas de `prefers-reduced-motion`, pas de test de perfs visible. Le site charge la 3D + une vidéo de 7 s avant d'afficher quoi que ce soit. C'est le point faible de la référence.

## 3.5 Imagerie & médias

- **7 `<video>` WebM** : 1 pour le preloader (`autoplay`, non `loop`) + 6 fonds de parfum (`loop`, `muted`, `autoplay: false`, pilotés en JS).
- **Textures 3D en AVIF** — bon choix de poids.
- **Aucune photo produit bitmap** : tout est rendu en temps réel.
- **2 `<img>` seulement** dans le DOM (dont une du loader).
- Rayons d'image : les pastilles d'ingrédient sont des cercles (`border-radius: 767px`) avec `backdrop-filter: blur(14px)` et anneau `0 0 0 1px rgba(255,255,255,.2)`.

## 3.6 Responsive

Breakpoints **Webflow standard** :

| Query | px | Rôle |
|---|---|---|
| `screen and (max-width: 991px)` | 991 | tablette |
| `screen and (max-width: 767px)` | 767 | mobile paysage |
| `screen and (max-width: 479px)` | 479 | mobile portrait |
| `screen and (min-width: 991px)` / `(min-width: 768px)` | — | desktop |

Les tailles étant en `clamp()` + `rem` sur base 14 px, **rien ne « casse » brutalement** ; l'échelle se comprime. Des classes utilitaires `hide-t…` (masqué en tablette) existent sur les boutons secondaires.

## 3.7 `prefers-reduced-motion`

**Zéro règle CSS, zéro occurrence dans les ~90 000 caractères de code inline.**
Le site ne respecte pas `prefers-reduced-motion`. Pire, avec le preloader vidéo obligatoire de 7 s et le scroll `infinite`, c'est le moins accessible des trois.

## 3.8 Signature moves — top 5

**1. Le thème de couleur transitionné via des custom properties**
*Pourquoi ça marque* : tout l'écran (dégradé de fond, halos, traits, textes accentués) vire d'un parfum à l'autre **d'un seul mouvement** de 0,6 s, sans qu'aucun élément ne clignote.
*Reproduction* :
```css
@property --taste-primary   { syntax: "<color>"; initial-value: #800035; inherits: true; }
@property --taste-secondary { syntax: "<color>"; initial-value: #ff659d; inherits: true; }
:root { transition: --taste-primary .6s ease-in-out, --taste-secondary .6s ease-in-out; }
```
Puis en JS : `document.documentElement.style.setProperty('--taste-primary', flavour.primary)`. Sans `@property`, la transition ne fonctionne pas (le navigateur traite la variable comme une chaîne).

**2. Le compteur de chargement piloté par une vidéo**
*Pourquoi ça marque* : le balayage chromé sur le logo est une vraie animation 3D rendue en amont, impossible à faire en CSS. Le compteur est synchronisé au frame près.
*Reproduction* : `<video>` muet en autoplay ; sur `timeupdate`, `counter.textContent = Math.round(v.currentTime / v.duration * 100) + '%'`. **À ne pas copier tel quel** : ajouter un timeout de secours (`setTimeout(forceEnd, duration*1000 + 2000)`) et un `catch` sur `play()`, sinon le site est inaccessible dès que l'autoplay est refusé — c'est exactement ce qui s'est produit pendant cette analyse.

**3. Les chapitres en `position: fixed` qui se croisent en opacité**
*Pourquoi ça marque* : le contenu ne défile pas, il **se substitue**. Ça libère la scène 3D qui, elle, avance en continu. Le site donne l'impression d'un film avec des cartons.
*Reproduction* : chaque `<section>` fait 1.25× la hauteur du viewport et est **vide** (elle ne fait que créer de la hauteur). Son contenu réel vit dans un `div.container` en `position: fixed; inset: 0; opacity: 0`. Un `ScrollTrigger` par section (`start:'top bottom'`, `end:'bottom bottom'`) pilote `opacity` et `visibility`.

**4. Le HUD éclaté (crochets d'angle + lettres réparties sur les bords)**
*Pourquoi ça marque* : ça remplit le vide du noir sans ajouter de « décor ». Les lettres éparses sont en réalité le nom du parfum, ce qui crée un lien entre le bord de l'écran et le sujet central.
*Reproduction* : quatre `<span>` en `position: fixed` avec les caractères `⌐ ¬ ∟ ⌐` aux quatre coins (`--element-padding--l` de marge). Pour les lettres : `name.split('')` → un `<span>` par lettre, positionné en absolu à des `top`/`left` prédéfinis, `color: var(--white-30)`, puis `gsap.to(letters, {x: targetX, y: targetY, stagger: .25, ease:'power3.inOut'})` pour l'assemblage.

**5. L'échelle d'opacité blanche comme unique système de gris**
*Pourquoi ça marque* : sur fond noir + dégradé coloré, un gris opaque (`#666`) devient sale dès que le fond vire au violet. Une opacité blanche reste toujours juste.
*Reproduction* : ne définir **aucun gris opaque** pour l'UI. Uniquement `#ffffff0d / #fff3 / #ffffff4d / #ffffff80 / #fff9 / #fffc` (5/20/30/50/60/80 %). Bordures = `white-20`, texte secondaire = `white-60`, texte tertiaire = `white-30`.

---
---

# SYNTHÈSE — La charte fusionnée

> Ce qui suit est **la livraison**. Les trois fiches sont la matière première ; ce bloc est le système à coller dans un projet.
> Principe de fusion retenu : **la rigueur de tokens de Ciao** + **la grammaire de motion déclarative de Mont-Fort** + **la brutalité typographique et les courbes de Superlist**.

## A. Design tokens — bloc `:root` prêt à coller

```css
/* ==========================================================================
   DESIGN TOKENS
   Base : 16px. Thème sombre par défaut, inversion par [data-theme="light"].
   ========================================================================== */

@property --accent-1 { syntax: "<color>"; initial-value: #2D628C; inherits: true; }
@property --accent-2 { syntax: "<color>"; initial-value: #A9BFD2; inherits: true; }

:root {
  /* ---------- 1. Primitives neutres ---------- */
  --c-black:        #000000;
  --c-ink:          #161616;   /* noir tiède, préféré au noir pur pour les fonds */
  --c-ink-2:        #222222;
  --c-ink-3:        #444444;
  --c-grey:         #666666;
  --c-grey-2:       #AAAAAA;
  --c-grey-3:       #CCCCCC;
  --c-mist:         #EEEEEE;
  --c-paper:        #F5F5F5;   /* fond "clair" — jamais du blanc pur */
  --c-white:        #FFFFFF;

  /* ---------- 2. Échelle d'opacité (LE système d'UI sur fond sombre) ------ */
  --w-0:   #FFFFFF00;
  --w-5:   #FFFFFF0D;
  --w-10:  #FFFFFF1A;
  --w-20:  #FFFFFF33;
  --w-30:  #FFFFFF4D;
  --w-50:  #FFFFFF80;
  --w-60:  #FFFFFF99;
  --w-80:  #FFFFFFCC;
  --k-10:  #0000001A;
  --k-20:  #00000033;
  --k-40:  #00000066;   /* voile d'overlay */

  /* ---------- 3. Accent thématique (interpolable) ------------------------- */
  --accent-1: #2D628C;   /* profond   — fonds, dégradés, textes forts */
  --accent-2: #A9BFD2;   /* clair     — halos, états actifs, liserés */

  /* ---------- 4. Rôles sémantiques --------------------------------------- */
  --bg:            var(--c-ink);
  --bg-2:          var(--c-black);
  --bg-invert:     var(--c-paper);
  --text:          var(--c-white);
  --text-muted:    var(--w-60);
  --text-faint:    var(--w-30);
  --border:        var(--w-20);
  --divider:       var(--w-10);
  --overlay:       var(--k-40);
  --focus-ring:    var(--accent-2);

  /* ---------- 5. Typographie --------------------------------------------- */
  --font-display: "Franklin Gothic ATF", "Aeonik", Arial, sans-serif;
  --font-body:    "Geist", "Aeonik", "Century Gothic", system-ui, sans-serif;
  --font-mono:    "Geist Mono", ui-monospace, monospace;

  --fw-light: 300;  --fw-regular: 400;  --fw-medium: 500;  --fw-bold: 700;

  /* Échelle fluide — interpolation exacte entre 390px et 1440px de viewport.
     Formule : slope = (max-min)/10.5 en vw ; intercept = min - (max-min)*0.371428 */
  --fs-tiny:    clamp(0.625rem, 0.190vw + 0.579rem, 0.750rem);  /* 10 → 12  */
  --fs-small:   clamp(0.750rem, 0.190vw + 0.704rem, 0.875rem);  /* 12 → 14  */
  --fs-body:    clamp(0.938rem, 0.095vw + 0.914rem, 1.000rem);  /* 15 → 16  */
  --fs-body-l:  clamp(1.063rem, 0.667vw + 0.900rem, 1.500rem);  /* 17 → 24  */
  --fs-h5:      clamp(1.125rem, 0.286vw + 1.055rem, 1.313rem);  /* 18 → 21  */
  --fs-h4:      clamp(1.375rem, 1.714vw + 0.957rem, 2.500rem);  /* 22 → 40  */
  --fs-h3:      clamp(1.750rem, 2.857vw + 1.054rem, 3.625rem);  /* 28 → 58  */
  --fs-h2:      clamp(2.250rem, 5.143vw + 0.996rem, 5.625rem);  /* 36 → 90  */
  --fs-h1:      clamp(2.750rem, 5.810vw + 1.334rem, 6.563rem);  /* 44 → 105 */
  --fs-mega:    clamp(3.500rem, 8.000vw + 1.550rem, 8.750rem);  /* 56 → 140 */

  /* Interlignes — 3 régimes, jamais autre chose */
  --lh-tight:  0.80;   /* display uppercase condensé */
  --lh-snug:   1.05;   /* H1 / H2 */
  --lh-normal: 1.40;   /* H3–H5 et corps dense */
  --lh-loose:  1.60;   /* corps de lecture */

  /* Tracking — positif pour les labels, 0 ou négatif pour le display */
  --ls-mega:    -0.02em;
  --ls-display: -0.01em;
  --ls-normal:   0em;
  --ls-label:    0.04em;
  --ls-eyebrow:  0.24em;   /* label majuscule très espacé */
  --ls-brand:    0.32em;   /* wordmark uniquement */

  /* ---------- 6. Espacement — base 8, 11 crans, fluides ------------------- */
  --sp-3xs: 0.25rem;                                  /*  4 */
  --sp-2xs: 0.50rem;                                  /*  8 */
  --sp-xs:  clamp(0.75rem, 0.65vw, 1.00rem);          /* 12 → 16 */
  --sp-s:   clamp(1.25rem, 1.10vw, 1.50rem);          /* 20 → 24 */
  --sp-m:   clamp(1.50rem, 1.40vw, 2.00rem);          /* 24 → 32 */
  --sp-l:   clamp(2.00rem, 2.00vw, 3.00rem);          /* 32 → 48 */
  --sp-xl:  clamp(2.50rem, 2.80vw, 4.00rem);          /* 40 → 64 */
  --sp-2xl: clamp(3.00rem, 3.50vw, 5.00rem);          /* 48 → 80 */
  --sp-3xl: clamp(3.50rem, 4.00vw, 6.00rem);          /* 56 → 96 */
  --sp-4xl: clamp(4.00rem, 4.80vw, 7.00rem);          /* 64 → 112 */
  --sp-5xl: clamp(5.00rem, 6.50vw, 10.0rem);          /* 80 → 160 */

  /* ---------- 7. Grille -------------------------------------------------- */
  --container:      90rem;    /* 1440px */
  --container-wide: 105rem;   /* 1680px */
  --gutter:         1.25rem;  /* 20px desktop */
  --gutter-mobile:  0.625rem; /* 10px mobile */
  --page-pad:       clamp(1.125rem, 4vw, 4rem);  /* 18px → 64px */
  --cols:           24;       /* 24 colonnes desktop */
  --cols-mobile:     4;
  --header-h:       5rem;     /* 80px */

  /* ---------- 8. Rayons, traits, flous ----------------------------------- */
  --r-xs:   0.25rem;   /*  4px */
  --r-s:    0.50rem;   /*  8px */
  --r-m:    0.75rem;   /* 12px — rayon des cartes */
  --r-l:    1.75rem;   /* 28px */
  --r-pill: 62.4375rem;/* 999px */
  --r-full: 50%;

  --stroke:   1px;
  --blur-s:   7px;
  --blur-m:   14px;
  --blur-l:   28px;
  --blur-halo: 210px;  /* halo de fond derrière un sujet */

  /* ---------- 9. Ombres --------------------------------------------------- */
  /* Règle : jamais de noir pur sur fond coloré. Teinter l'ombre. */
  --sh-inset-light: inset -2px -1px 3px 1px rgba(255,255,255,0.07);
  --sh-ring:        0 0 0 1px rgba(255,255,255,0.20);
  --sh-glow:        0 0 20px 0 rgba(255,255,255,0.60);
  --sh-soft:        0 40px 80px 0 rgba(0,0,0,0.24);
  --sh-soft-tinted: 0 40px 80px 0 color-mix(in srgb, var(--accent-1) 24%, transparent);

  /* ---------- 10. Durées -------------------------------------------------- */
  --dur-instant: 0.20s;
  --dur-fast:    0.30s;
  --dur-base:    0.40s;
  --dur-slow:    0.60s;
  --dur-slower:  0.80s;
  --dur-reveal:  0.90s;
  --dur-long:    1.20s;
  --dur-scene:   1.50s;

  /* ---------- 11. Easings ------------------------------------------------- */
  --ease-signature:  cubic-bezier(0.32, 0.94, 0.60, 1);  /* la courbe des 2 studios */
  --ease-out-expo:   cubic-bezier(0.14, 1.00, 0.34, 1);
  --ease-in-expo:    cubic-bezier(0.66, 0.00, 0.86, 0);
  --ease-out-strong: cubic-bezier(0.40, 0.00, 0.10, 1);
  --ease-in-strong:  cubic-bezier(0.90, 0.00, 0.40, 1);
  --ease-in-out:     cubic-bezier(0.77, 0.00, 0.18, 1);
  --ease-out-quart:  cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-out-cubic:  cubic-bezier(0.33, 1.00, 0.68, 1);
  --ease-back:       cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-linear:     linear;

  /* ---------- 12. Motion — constantes ------------------------------------ */
  --move-s:  10px;   /* micro-éléments */
  --move-m:  30px;   /* paragraphes */
  --move-l:  50px;   /* blocs */
  --stagger-char: 0.02s;
  --stagger-word: 0.04s;
  --stagger-line: 0.08s;
  --stagger-block: 0.10s;
  --stagger-card: 0.15s;

  /* ---------- 13. Z-index ------------------------------------------------- */
  --z-canvas: 0;  --z-content: 1;  --z-hud: 5;
  --z-header: 10; --z-menu: 20;    --z-cursor: 50;  --z-transition: 600;
}

:root[data-theme="light"] {
  --bg: var(--c-paper);  --bg-2: var(--c-white);  --bg-invert: var(--c-ink);
  --text: var(--c-ink);  --text-muted: var(--c-grey);  --text-faint: var(--c-grey-2);
  --border: var(--k-20); --divider: var(--k-10);
  --sh-ring: 0 0 0 1px rgba(0,0,0,0.12);
  --sh-glow: 0 0 20px 0 rgba(0,0,0,0.12);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* mêmes overrides que ci-dessus */ }
}
```

## B. Table des easings et durées — quand utiliser quoi

### Easings

| Token | cubic-bezier | Équivalent GSAP | Origine | Usage recommandé |
|---|---|---|---|---|
| `--ease-signature` | `0.32, 0.94, 0.60, 1` | ≈ `power2.out` adouci | **Mont-Fort + Superlist** | **Défaut absolu pour tout hover et micro-interaction.** Démarre vite, freine longtemps, ne rebondit jamais. |
| `--ease-out-expo` | `0.14, 1.00, 0.34, 1` | `expo.out` | Mont-Fort (`immg.expoOut`) | **Reveals au scroll.** Entrée quasi instantanée + long glissement. C'est ce qui fait « cher ». |
| `--ease-out-quart` | `0.165, 0.84, 0.44, 1` | `power4.out` | Superlist / Ciao | Reveals de titres et d'images. Un cran moins spectaculaire que expo. |
| `--ease-out-cubic` | `0.33, 1.00, 0.68, 1` | `power3.out` | Ciao (easing Lenis) | **Smooth scroll** et tout ce qui doit paraître « physique » sans être théâtral. |
| `--ease-out-strong` | `0.40, 0.00, 0.10, 1` | — | Mont-Fort (`immg.zoomOut`/`posIn`) | Déplacements et zooms **entrants** d'éléments lourds (images, cartes, carrousel). |
| `--ease-in-strong` | `0.90, 0.00, 0.40, 1` | — | Mont-Fort (`immg.zoomIn`/`posOut`) | Le **retour** / la sortie des mêmes éléments. Toujours l'appairer avec `--ease-out-strong`. |
| `--ease-in-out` | `0.77, 0.00, 0.18, 1` | `expo.inOut` | Superlist | **Rideaux, overlays, transitions de page.** Symétrique, autoritaire. |
| `--ease-in-expo` | `0.66, 0.00, 0.86, 0` | `expo.in` | Mont-Fort (`immg.expoIn`) | Sorties d'écran (un élément qui « part »). Jamais pour une entrée. |
| `--ease-back` | `0.34, 1.56, 0.64, 1` | `back.out(2)` | Superlist + Ciao | **Uniquement** sur des éléments circulaires/petits qui « éclosent » (pastilles, badges, icônes). Dépassement ~12 %. |
| `--ease-linear` | `linear` | `none` | les 3 | **Obligatoire** pour tout ce qui est *scroll-linked*. Un easing sur du scrub casse la relation main/écran. |

> **Règle d'or** : un easing avec rebond (`--ease-back`) ne s'applique **jamais** à un bloc de texte ni à une image. Uniquement à des formes.

### Durées

| Token | Valeur | Usage |
|---|---|---|
| `--dur-instant` | 0.20 s | `color`, `opacity` sur un lien ; retour d'état immédiat |
| `--dur-fast` | 0.30 s | `background-color` de bouton, apparition d'un tooltip |
| `--dur-base` | 0.40 s | **hover par défaut** : fond + couleur + bordure d'un bouton |
| `--dur-slow` | 0.60 s | changement de thème, transform d'un élément moyen, transition de page |
| `--dur-slower` | 0.80 s | reveal de bloc, transform d'un élément large, ouverture de menu |
| `--dur-reveal` | 0.90 s | **reveal de titre au scroll** (avec `--ease-out-expo`) |
| `--dur-long` | 1.20 s | zoom d'image (`scale 1.1 → 1`), assemblage d'éléments |
| `--dur-scene` | 1.50 s | changement de scène 3D, inertie du smooth scroll |

> **Trois durées suffisent pour 90 % du site** : `0.4s` (hover), `0.6s` (état), `0.9s` (reveal). Le reste est de l'exception.

## C. Système de motion — les règles générales

### C.1 Distances de translation

| Type d'élément | `y` de départ | Raison |
|---|---|---|
| Micro (badge, icône, flèche) | `10px` | il ne doit pas « voyager » |
| Ligne de texte dans un masque | `yPercent: 110` | elle vient de sous son propre conteneur |
| Paragraphe / bloc de texte | `30px` | ≈ 2 interlignes |
| Bloc entier / carte | `50px` | jamais plus |
| Titre display | `y: "1em"` | proportionnel à la taille de police (Mont-Fort) — **la meilleure idée des trois** |

> **Ne jamais dépasser 50 px** de translation sur un reveal. Au-delà, l'œil lit un déplacement, pas une apparition.

### C.2 Seuils de déclenchement

```js
// Reveal standard : l'élément commence à entrer dans l'écran
ScrollTrigger.create({ trigger: el, start: "top bottom-=10%", once: true })

// Reveal "tardif" (titre de section, on veut qu'il soit déjà bien visible)
start: "top 70%"

// Effet scroll-linked
{ start: "top bottom", end: "bottom top", scrub: 0.2 }
```

| Situation | `start` | `once` / `scrub` |
|---|---|---|
| Texte et blocs standard | `"top bottom-=10%"` | `once: true` |
| Gros titre de section | `"top 70%"` | `once: true` |
| Parallaxe, 3D, barre de progression | `"top bottom"` → `"bottom top"` | `scrub: 0.2` |
| Section épinglée | `"top top"` → `"+=100%"` | `pin: true, scrub: 0.1` |

> **`scrub: 0.1` à `0.2`, jamais `true`.** Les trois sites qui font du scroll-linked propre utilisent un lissage. `scrub: true` colle l'animation à la molette et fait « saccadé ».

### C.3 Staggers standards

| Granularité | Valeur | Note |
|---|---|---|
| Caractère | `0.02 s` | au-delà de ~40 caractères, passer au mot |
| Mot | `0.04 s` | |
| Ligne | `0.08 s` | `{ each: 0.08, from: "start" }` |
| Bloc / paragraphe | `0.10 s` | |
| Carte de grille | `0.15 s` | ou `{ amount: 0.3 }` pour borner le total |

> Utiliser `{ amount: X }` plutôt que `{ each: X }` dès que le nombre d'éléments est variable : la durée totale de la cascade reste constante quel que soit le nombre de cartes.

### C.4 Premier chargement vs scroll

**Ce sont deux grammaires différentes. Ne pas les confondre.**

| | Premier chargement | Reveal au scroll |
|---|---|---|
| Objectif | poser la marque | ne pas gêner la lecture |
| Durée par élément | 0.8 – 1.2 s | 0.6 – 0.9 s |
| Stagger | large (0.1 – 0.25 s) | serré (0.02 – 0.1 s) |
| Easing | `--ease-out-expo` | `--ease-out-quart` |
| Translation | plus ample (jusqu'à `y: 60`) | ≤ 50 px |
| Rejoue ? | non | **non** (`once: true`) |
| Délai d'entrée | `0.2 s` après le fade du preloader | aucun |

**Budget de chargement** : les trois références vont de 3,5 s (Mont-Fort) à 8 s (Ciao). **Viser 2,5 s maximum** et ne jamais bloquer sur un média dont la lecture peut être refusée.

### C.5 Modèle d'animation déclaratif (repris de Mont-Fort)

Ne pas écrire de JS par bloc. Poser des attributs dans le HTML :

```html
<h2 data-anim="title"  data-anim-split="lines">…</h2>
<p  data-anim="fade"   data-anim-delay="0.1">…</p>
<ul data-anim="stagger" data-anim-stagger="0.15">…</ul>
<img data-anim="zoom" />
<div data-anim="parallax" data-anim-speed="-0.2"></div>
<section data-theme="dark" data-anim-color="#ffffff">…</section>
```

```js
const PRESETS = {
  fade:     { from:{opacity:0, y:30},                 dur:0.9, ease:"expo.out" },
  title:    { from:{opacity:0, yPercent:110},         dur:0.9, ease:"expo.out", stagger:0.08 },
  stagger:  { from:{opacity:0, y:50},                 dur:0.8, ease:"power4.out", stagger:0.15 },
  zoom:     { from:{scale:1.1},                       dur:1.2, ease:"power2.out" },
  pop:      { from:{opacity:0, scale:0},              dur:0.6, ease:"back.out(2)", stagger:0.15 },
  stretch:  { from:{opacity:0, scaleY:1.6},           dur:0.8, ease:"expo.out", stagger:0.05 },
};
```

Un seul `querySelectorAll('[data-anim]')` au boot, un `switch`, terminé. Un nouveau bloc s'anime sans toucher au JS.

## D. Inventaire de composants

### D.1 Header

- **Structure** : `position: fixed`, hauteur `--header-h` (80 px), `padding-inline: --page-pad`. Trois zones : logo à gauche, nav au centre-gauche, actions à droite (badge + MENU + CTA pilule).
- **Fond** : transparent par défaut. Sur fond clair, ajouter `backdrop-filter: blur(--blur-m)` + `background: var(--w-5)`.
- **Au scroll** : *ne pas* réduire la hauteur (aucun des trois ne le fait). Deux comportements retenus :
  1. **Fade-out** dans le hero puis retour (Mont-Fort) : `opacity 1 → 0` sur les 25 premiers % du viewport, `scrub`.
  2. **Inversion de couleur** selon la section (Superlist) : `color` blanc ↔ `--c-ink`, `--dur-slow --ease-signature`.
- **Item actif** : trait `1px` de `--accent-1` sous le libellé, `transform: scaleX(0 → 1)`, `--dur-fast --ease-out-strong`, `transform-origin: left`.
- **Barre de progression** (Ciao) : trait `1px` en `position: absolute; top: 0`, `width` piloté au scroll, `ease: none`. Ajouter un point lumineux `box-shadow: var(--sh-glow)` à son extrémité.

### D.2 Hero

- **Occupation** : `100svh`, contenu centré ou aligné à gauche à ~50 % de hauteur.
- **Fond** : canvas WebGL en `position: fixed; z-index: var(--z-canvas)`, ou vidéo `object-fit: cover` + voile `--overlay`.
- **Entrée** : `1.` fade du fond (`--dur-scene`, `--ease-out-cubic`) → `2.` titre par ligne (`yPercent 110 → 0`, `--dur-reveal`, `--ease-out-expo`, stagger `--stagger-line`) → `3.` sous-titre (`y 30 → 0`, délai +0.2 s) → `4.` CTA/indicateur (`scale 0 → 1`, `--ease-back`).
- **Sortie au scroll** : le titre sort **plus lentement que le fond** (facteur de parallaxe `-0.15`), ce qui crée la profondeur.
- **Indicateur de scroll** : cercle `--r-full`, `56 px`, bordure `--border`, flèche ↓ ; boucle idle `translateY(0 → 4px → 0)` en `1.6s ease-in-out infinite`.

### D.3 Section de texte

- Grille 24 colonnes : titre sur `col 1 → 14`, corps sur `col 14 → 22` (asymétrie volontaire, présente sur les trois).
- Eyebrow : `--fs-small`, `--fw-bold`, `--ls-eyebrow`, uppercase, `--text-muted`. Reveal en premier (délai 0).
- Titre : `--fs-h2`, `--lh-snug`, split par ligne, masque `overflow: hidden`.
- Corps : `--fs-body-l`, `--lh-loose`, `max-width: 34ch`, reveal `fade` avec délai +0.15 s après le titre.
- Padding vertical : `--sp-4xl` en haut et en bas.

### D.4 Grille de cartes

- `display: grid; gap: var(--sp-m); grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr))`.
- Carte : `border-radius: var(--r-m)`, `border: var(--stroke) solid var(--border)`, `background: var(--w-5)`, `backdrop-filter: blur(var(--blur-m))`.
- **Reveal** : preset `stagger` (`y: 50 → 0`, `--dur-slower`, `--ease-out-quart`, `{amount: 0.3}`).
- **Hover** : `transform: translateY(-4px)` + `border-color: var(--w-30)` + `box-shadow: var(--sh-soft-tinted)`, `--dur-base --ease-signature`. **Pas de `scale`** sur une carte contenant du texte (ça floute le rendu).

### D.5 Galerie / carrousel

- **Coverflow** (Mont-Fort) : slide active `scale(1)`, voisines `scale(0.748)` + `translateX(±21.5%)`, `--dur-long --ease-out-strong`.
- Drag : `Draggable` GSAP + `data-cursor="draggable"` pour changer l'état du curseur custom.
- Image : `border-radius: var(--r-m)`, ratio fixé par `aspect-ratio`, `object-fit: cover`.
- **Hover image** : `scale(1.04)` sur l'image **à l'intérieur** d'un conteneur `overflow: hidden`, `--dur-slower --ease-signature`. Aucun `grayscale → couleur` sur les trois références : c'est un effet daté, ne pas l'ajouter.

### D.6 CTA / boutons

Trois variantes seulement :

| Variante | Fond | Texte | Bordure | Rayon |
|---|---|---|---|---|
| Primaire | `--c-white` | `--c-ink` | — | `--r-pill` |
| Secondaire | `transparent` | `--text` | `--stroke solid var(--border)` | `--r-pill` |
| Texte + pastille | `transparent` | `--text` | trait `1px` sous le libellé | — |

- **Hover primaire** : `background-color` → `--accent-2`, `--dur-base --ease-signature`.
- **Hover secondaire** : `border-color` → `--w-50`, `background` → `--w-5`.
- **Hover « texte + pastille »** (la meilleure des trois, Mont-Fort) : la pastille ronde `translateX(6px)` en `--dur-slower --ease-out-strong`, le trait sous le libellé `scaleX(0 → 1)` en `--dur-fast`, la flèche à l'intérieur `translateX(2px)`.
- **Magnétisme** : présent nulle part explicitement dans les trois. Si ajouté, limiter le déplacement à **8 px** et lisser en `--dur-slow --ease-signature`.

### D.7 Footer

- Fond : inversion complète (`--bg-invert` ou couleur d'accent pleine — Superlist passe en rouge `#FF5043`).
- Grille : logo + colonnes de liens + mentions. Sur `< 1024px`, `flex-direction: column`, colonnes secondaires masquées.
- Reveal : preset `fade` avec `stagger: 0.1` sur les colonnes.
- Contient le bouton « retour en haut » : cercle `--r-full`, hover `translateY(-4px)`.

### D.8 Curseur custom (optionnel — Mont-Fort uniquement)

```css
.cursor{
  position: fixed; z-index: var(--z-cursor); pointer-events: none;
  width: 12px; height: 12px; border-radius: var(--r-full);
  background: var(--accent-1); mix-blend-mode: normal;
  transition: top var(--dur-slow) var(--ease-signature),
              left var(--dur-slow) var(--ease-signature),
              transform var(--dur-slow) var(--ease-signature),
              background var(--dur-base) linear;
}
.cursor[data-state="link"]{ transform: scale(3); background: var(--w-30); }
.cursor[data-state="draggable"]{ transform: scale(4); }
@media (hover: none){ .cursor{ display: none; } }
```
On écrit `top`/`left` en JS ; c'est la transition CSS qui lisse. Aucune boucle `requestAnimationFrame` nécessaire.

## E. Stack technique recommandée

| Rôle | Librairie | Version | Pourquoi (et qui l'utilise) |
|---|---|---|---|
| Smooth scroll | **Lenis** | 1.x | Mont-Fort et Ciao. Plus léger et mieux maintenu qu'ASScroll (Superlist) ou Locomotive. Config : `duration: 1.2`, `easing: t => 1 - Math.pow(1-t, 3)`. |
| Moteur d'animation | **GSAP** | 3.15 | Les trois. Non négociable. |
| Scroll | **ScrollTrigger** | 3.15 | Les trois. |
| Découpe de texte | **SplitText** | 3.15 | Les trois (`type: "lines"`, `"chars"`, `"lines,chars"`). Depuis GSAP 3.13 il est gratuit — plus besoin de Splitting.js. |
| Courbes sur mesure | **CustomEase** | 3.15 | Mont-Fort. Indispensable pour enregistrer les 6 courbes maison. |
| Réordonnancement DOM animé | **Flip** | 3.15 | Mont-Fort + Superlist. Pour les filtres de grille et les transitions de layout. |
| Gestes / molette | **Observer** | 3.15 | Les trois. |
| Drag | **Draggable** | 3.15 | Mont-Fort (carrousel). |
| 3D | **Three.js** | r169+ | Les trois. Modules à charger : `GLTFLoader`, `KTX2Loader` (textures GPU), `EffectComposer` + `RenderPass` + `ShaderPass` + `SMAAPass`. |
| Transitions de page | **Astro View Transitions** (si Astro) ou **Barba.js** | — | Mont-Fort utilise l'API native `::view-transition` ; Superlist un `.p-cover` maison. Le natif est préférable. |

**Ce dont on n'a PAS besoin** (aucun des trois ne les utilise) : Swiper, Locomotive Scroll, Matter.js, Framer Motion, ScrollMagic, Splitting.js, AOS.

**Formats d'assets** :

| Contenu | Format | Référence |
|---|---|---|
| Textures 3D | **KTX2** (Basis) ou **AVIF** | Mont-Fort / Ciao |
| Vidéos de fond | **WebM** (VP9), `muted`, `loop`, `playsinline` | Ciao |
| Modèles | **glTF binaire (.glb)** + Draco | Ciao |
| Environnement lumineux | **.hdr** | Ciao |
| Images | AVIF avec fallback WebP | — |
| Polices | WOFF2, `font-display: swap`, `preload` sur la display | les trois |

## F. Règles d'adaptation mobile & dégradation

### F.1 Breakpoints unifiés

```css
/* Mobile first. Les 3 sites convergent vers ces paliers. */
@media (min-width: 30rem)  { /* 480 — mobile large */ }
@media (min-width: 48rem)  { /* 768 — tablette */ }
@media (min-width: 62rem)  { /* 992 — tablette paysage */ }
@media (min-width: 64rem)  { /* 1024 — desktop : passage grille 4 → 24 colonnes */ }
@media (min-width: 80rem)  { /* 1280 */ }
@media (min-width: 105rem) { /* 1680 — UI secondaire (nav de chapitres) */ }
@media (min-width: 120rem) { /* 1920 — plafonnement de la typo fluide */ }
```

### F.2 Ce qu'on retire en mobile

| Élément | Seuil | Référence |
|---|---|---|
| Curseur custom | `@media (hover: none)` | Mont-Fort |
| Navigation latérale par chapitre | `< 1680px` | Mont-Fort |
| Indicateur « scroll to discover » | `< 1024px` | Mont-Fort |
| Numérotation de section | `< 1024px` | Mont-Fort |
| Colonnes secondaires du footer | `< 1024px` | Mont-Fort |
| Nav horizontale dans le menu plein écran | `< 768px` | Mont-Fort |
| Parallaxe multi-couches | `< 768px` | recommandation |
| Post-processing WebGL (bloom, SMAA) | `< 768px` ou `hardwareConcurrency < 4` | recommandation |

### F.3 Ce qu'on conserve toujours

Les reveals de texte, le smooth scroll (avec `touchMultiplier: 1`), le changement de thème par section, les hovers convertis en états `:active`.

### F.4 Dégradation de performance

```js
const LOW_END =
  navigator.hardwareConcurrency <= 4 ||
  navigator.deviceMemory <= 4 ||
  matchMedia('(max-width: 768px)').matches;

renderer.setPixelRatio(Math.min(devicePixelRatio, LOW_END ? 1 : 2));
if (LOW_END) { composer.removePass(bloomPass); scene.fog.density *= 0.5; }
```

Poser aussi un **fallback image** : une capture statique du premier frame de la scène 3D en `<img>` derrière le canvas, révélée si `webglcontextlost` ou si l'init dépasse 3 s. **Aucun des trois ne le fait — c'est leur défaut commun.**

### F.5 `prefers-reduced-motion` — ce que les trois ratent

**Aucun des trois sites n'implémente correctement `prefers-reduced-motion`.** Mont-Fort ne coupe que les transitions de page Astro ; Superlist et Ciao ne font rien du tout. À faire :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduce) {
  lenis.destroy();                       // scroll natif
  gsap.globalTimeline.timeScale(100);    // les tweens se résolvent instantanément
  ScrollTrigger.getAll().forEach(st => { st.scroll(st.start); st.disable(); });
  gsap.set('[data-anim]', { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
  renderer.setAnimationLoop(null);       // 3D figée sur une pose
  document.querySelectorAll('video').forEach(v => v.pause());
}
```

**Règle** : en mode réduit, l'utilisateur doit voir **le même contenu**, seulement immobile. Jamais de contenu manquant.

## G. Les 10 règles d'or

| # | À FAIRE | À NE PAS FAIRE |
|---|---|---|
| **1** | **Une seule scène 3D continue** qui traverse le site, dans un canvas `fixed`, pilotée par la progression de scroll. Le HTML n'est qu'une piste de scroll transparente posée dessus. | Mettre une animation 3D différente par section : ça multiplie le poids, casse la continuité et fait clignoter le GPU à chaque `IntersectionObserver`. |
| **2** | **Trois durées pour tout le site** : `0.4s` (hover), `0.6s` (état / thème), `0.9s` (reveal au scroll). Tout le reste est une exception justifiée. | Improviser une durée par composant. C'est la première cause d'un motion qui « sonne faux ». |
| **3** | **`ease: none` sur tout ce qui est scroll-linked**, `scrub: 0.1–0.2` pour lisser. | `scrub: true` (saccadé) ou un easing sur du scrub (l'animation « décroche » de la main). |
| **4** | **Translations ≤ 50 px** sur un reveal, ou `y: "1em"` pour les titres (proportionnel à la police). | `y: 100` ou plus : l'œil lit un déplacement, plus une apparition, et le layout shift devient perceptible. |
| **5** | **Un langage déclaratif** : `data-anim="fade|title|stagger|zoom|pop"` + un seul dispatcher JS. Un nouveau bloc s'anime sans une ligne de code. | Écrire un `gsap.from()` à la main par section : au bout de 20 sections, plus personne ne sait quelle durée est utilisée où. |
| **6** | **Une seule courbe de hover** (`--ease-signature`, `cubic-bezier(.32,.94,.6,1)`) sur toute l'interface. Deux studios différents y arrivent indépendamment — ce n'est pas un hasard. | Mélanger `ease`, `ease-in-out`, `linear` et des béziers custom sur des boutons voisins. |
| **7** | **Sur fond sombre, tout l'UI en opacité blanche** (`5 / 20 / 30 / 50 / 60 / 80 %`), jamais en gris opaque. Les bordures, les textes secondaires, les voiles. | Poser `#666` sur un fond qui vire au violet ou au rouge : le gris devient sale instantanément. |
| **8** | **Teinter les ombres** avec la couleur du fond, désaturée : `0 40px 80px color-mix(in srgb, var(--accent-1) 24%, transparent)`. | `box-shadow: 0 4px 12px rgba(0,0,0,.2)` sur un fond coloré saturé — ça fait une tache grise. |
| **9** | **Budget de chargement ≤ 2,5 s**, avec un timeout de secours qui force la sortie du preloader, et un `catch` sur `video.play()`. | Piloter un compteur de chargement par la lecture d'une vidéo sans filet : si l'autoplay est refusé, le site ne s'ouvre jamais. C'est exactement ce qui est arrivé sur Ciao pendant cette analyse. |
| **10** | **Implémenter `prefers-reduced-motion`** dès le premier jour : destruction de Lenis, `ScrollTrigger.disable()`, `clearProps`, 3D figée sur une pose, vidéos en pause. Même contenu, immobile. | Copier les trois références sur ce point : aucune ne le gère, et c'est leur seul défaut commun. |

---

## Annexe — Tableau comparatif express

| | Mont-Fort | Superlist | Ciao Energy |
|---|---|---|---|
| **Base technique** | Astro + View Transitions | Build maison (webpack) | Webflow + jQuery |
| **Smooth scroll** | Lenis | **ASScroll** | Lenis (`duration: 1.5`, `infinite: true`) |
| **Inertie perçue** | moyenne-légère | **lourde** | **très lourde** |
| **3D** | Three.js r169 + KTX2 | Three.js | Three.js + GLTF + HDRI + SMAA |
| **Preloader** | aucun (fade 3.5 s) | remplissage du logo (~4.5 s) | vidéo 7.048 s + compteur |
| **Polices** | Century Gothic + Josefin Sans | **Aeonik seule** | Franklin Gothic ATF + Geist + Geist Mono |
| **Tracking** | **+0.04 à +0.32 em** | **0 partout** | 0 (condensé par la police) |
| **Line-height titres** | 1.4 | **0.90 – 1.04** | **0.80** |
| **Custom properties** | 5 seulement | **aucune** | **système complet (65)** |
| **Grille** | 24 col / 20px → 4 col / 10px | 24 col `[estimé]` | conteneur 120rem + `clamp()` |
| **Rayons** | `50%` uniquement | pilule + 12px | 3.5 / 7 / 14 / 28 / pilule |
| **Courbe dominante** | `immg.expoOut (.14,1,.34,1)` | **`(.32,.94,.6,1)`** | `ease` / `ease-in-out` (CSS), `power4.out` (GSAP) |
| **Curseur custom** | **oui** (0.6 s de traînée) | non | non |
| **Section pinnée** | non | **oui** (Manifesto) | non |
| **Scroll horizontal** | non | non | non |
| **Marquee** | non | non | non |
| **Split text** | lines / chars / words | chars / lines | lines / lines,chars |
| **Transition de page** | `::view-transition` + `plus-lighter` | rideau `.p-cover` | — |
| **Thème par section** | `data-theme` light/dark | inversion de fond WebGL | **variables CSS interpolées** |
| **`prefers-reduced-motion`** | partiel (view-transitions) | **non** | **non** |
| **Fallback 3D** | non | non | non |

