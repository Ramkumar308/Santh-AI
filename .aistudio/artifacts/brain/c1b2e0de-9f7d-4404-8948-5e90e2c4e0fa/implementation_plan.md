# Implementation Plan: Professional Produce Icons & Active Stall Tactile Depth

Upgrade the produce imagery across the entire application from plain emoji glyphs to professional, custom-crafted SVG badges with realistic textures, highlight depth, and vibrant gradient backdrops. Redesign the **Active Stall** card into an executive, deep emerald gradient container featuring a glowing ring, rich tactile shadows, and prominent stall identity styling.

---

## 1. Design Architecture & Visual Upgrades

### A. High-Resolution Produce Badges (`ProduceBadge.tsx`)
Create a dedicated component with handcrafted, vector-illustrated SVG icons and multi-stop gradient containers for all 6 key agricultural commodities:
1. **Tomato (தக்காளி)**: Plump ruby-crimson body with radial specular highlight, deep shadow curve, and sculpted star calyx/stem.
2. **Onion (வெங்காயம்)**: Multi-toned purplish-magenta pearl skin with natural layer striations, papery tip crest, and root tuft.
3. **Potato (உருளைக்கிழங்கு)**: Warm golden-russet tuber form with organic contour, micro-texture speckling, and realistic sprout eye dimples.
4. **Brinjal / Eggplant (கத்தரிக்காய்)**: High-gloss deep royal violet gradient with specular light sweep and textured emerald sepals.
5. **Cabbage (முட்டைக்கோஸ்)**: Layered crisp Savoy-style lime-emerald leaves with delicate white vein tracery and organic curvature.
6. **Carrot (கேரட்)**: Saturated bright orange conical body with transverse natural ring ridges and vibrant feathery green foliage.

Each badge supports flexible sizing (`sm`, `md`, `lg`, `xl`) and comes encased in a luxurious glass-morphic gradient badge container with subtle border strokes and dimensional drop shadows.

### B. "Active Stall" Card & Icon Overhaul (`App.tsx`)
Transform the Active Stall KPI tile into a flagship visual element:
- **Thick & Attractive Background**: Deep emerald gradient container (`from-emerald-950 via-emerald-900 to-teal-950`) with an organic noise overlay and emerald radial glow backdrop (`shadow-[0_12px_32px_-8px_rgba(5,150,105,0.4)]`).
- **Glowing Ring Icon**: An icon badge with a dual-ring emerald/cyan glow, thick bevel background, and an illuminated store emblem with micro-reflection.
- **Executive Typography & Micro-elements**:
  - Crisp pearl-white market complex name and bold stall badge (`#12-B`).
  - Active verified vendor indicator with an emerald breathing LED beacon.
  - Quick-action tactile "Edit Details" button with smooth hover elevation.

---

## 2. Proposed Changes & Touchpoints

### Step 1: Create `src/components/ProduceBadge.tsx`
- Build vector SVG assets for each commodity with realistic produce styling.
- Export both standalone SVG glyphs and badge containers with gradient backgrounds.
- Provide fallback and legacy emoji compatibility.

### Step 2: Refactor Vegetable Display in Key Modules
- **`src/data/commodities.ts`**: Augment commodity metadata with modern gradient color pairs and theme accents.
- **`src/components/PricesModule.tsx`**: Replace plain emoji avatars in the wholesale/retail pricing matrix and price editing drawer with `<ProduceBadge size="md" />`.
- **`src/components/StockModule.tsx`**: Update daily inventory stock logs, arrival counters, and waste recording rows with `<ProduceBadge size="sm" />`.
- **`src/components/ResQModule.tsx` & `ResQChatDrawer.tsx`**: Upgrade surplus produce clearance cards and negotiation headers with animated badge icons.
- **`src/components/DailyProfitCalculator.tsx`**: Enhance the daily profit and margin cards with professional produce icons.

### Step 3: Upgrade "Active Stall" Header Card in `src/App.tsx`
- Replace the plain white Active Stall card with the deep emerald gradient container.
- Integrate the glowing ring around a thick tactile 3D store icon badge.
- Enhance the contrast of vendor name, market complex, and verification status.

---

## 3. Verification & Quality Assurance

1. **Visual Testing**: Validate responsiveness on mobile (375px) through desktop (1440px) across both Light and Dark themes.
2. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to ensure type safety and zero warnings.
3. **Automated Tests**: Execute `npm run test` (all 57 tests) to verify business logic and calculation pipelines remain intact.
