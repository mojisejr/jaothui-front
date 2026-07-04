---
design_md_version: 1
project: jaothui-frontend
token_source: styles/globals.css :root (v2 additive semantic layer) + tailwind.config.js theme.extend
verify_tokens:
  - name: --background
    expect: "#070707"
    probe: "background-color on the v2 page shell (V2Layout root / main.bg-background)"
  - name: --surface
    expect: "#121212"
    probe: "background-color on a v2 card surface (StatCard / BuffaloCard)"
  - name: --accent-primary
    expect: "#d6b15f"
    probe: "background-color on the primary gold button (V2Button variant=gold-fill)"
  - name: --success
    expect: "#3fa66a"
    probe: "color on the wallet Connected / Verified status text"
  - name: font-sans
    expect: "Prompt"
    probe: "font-family on body text (any v2 element)"
primitives:
  - name: Avatar
    file: components/v2/Avatar.tsx
    variants: [md, lg, xl]
  - name: V2Button
    file: components/v2/Button.tsx
    variants: [gold-fill, gold-gradient, gold-outline]
  - name: StatCard
    file: components/v2/StatCard.tsx
    variants: [default]
  - name: BuffaloCard
    file: components/v2/BuffaloCard.tsx
    variants: [champion, breeding, verified, for-sale]
  - name: WalletCard
    file: components/v2/WalletCard.tsx
    variants: [connected, disconnected]
  - name: BottomNav
    file: components/v2/BottomNav.tsx
    variants: [home, buffalo, profile, wallet]
  - name: FilterChip
    file: components/v2/FilterChip.tsx
    variants: [active, inactive]
  - name: Badge
    file: components/v2/Badge.tsx
    variants: [champion, breeding, verified, for-sale]
  - name: SettingsRow
    file: components/v2/SettingsRow.tsx
    variants: [default, danger]
  - name: SearchInput
    file: components/v2/SearchInput.tsx
    variants: [default]
patterns:
  - layered-token-architecture
  - tinted-shadow-glow
  - three-zone-app-shell
  - atmospheric-canvas-background
  - status-chip-badge
  - shape-vocabulary
---

# jaothui-frontend — DESIGN.md

> **Authored** (`--author` mode) from the owner's redesign brief (`.tmp/jaothui/new-ui-brief/brief.md`
> + mockup). This is the **v2** design contract — a dark · gold · green premium reskin. It is
> **additive**: it governs new `components/v2/` + `V2Layout` + `/v2/*` routes only. The legacy
> light daisyUI UI is intentionally left untouched until a later cutover. Build primitives to match
> this contract; `/design-verify` reads the `verify_tokens` above off the rendered showcase.

## 1. Visual Theme & Atmosphere
Dark-first, premium, trustworthy — the visual voice of a Thai buffalo heritage platform. Near-black
canvas (`#070707`) carrying gold as the single hero accent, with green reserved for
"verified / connected / success" trust signals. The mood is **quiet luxury**: deep space, soft
gold-tinted glows, generous rounding — never flat, never boxy. One-line philosophy:
*"อนุรักษ์สายพันธุ์ไทยด้วยเทคโนโลยี" rendered as calm, credible, gold-on-black premium.*

## 2. Color Palette & Roles
| Token | Value | Role |
|-------|-------|------|
| --background | #070707 | app canvas (near-black base) |
| --surface | #121212 | card / panel surface |
| --surface-raised | #1a1a1a | raised surface (modal, hover) |
| --accent-primary | #d6b15f | gold — primary action, hero accent, active nav |
| --accent-hover | #e3c77a | gold hover / lighter emphasis |
| --success | #3fa66a | green — connected, verified, success states |
| --foreground | #f5f5f5 | primary text |
| --muted | #a3a3a3 | secondary / metadata text |
| --border-soft | rgba(214,177,95,0.14) | faint gold-tinted hairline borders |

Legacy `thui*` (thuiyellow `#E3A51D`, thuidark) + the daisyUI light theme remain the token source
for legacy screens and are **not** consumed by v2. Note the intentional gold shift
`#E3A51D → #d6b15f` (brighter → antique/premium) — v2 is a redesign, not a restyle.

## 3. Typography
- body: **Prompt** (weights 300 default / 500-600 emphasis / 700-800 headings) · heading: **Prompt** · mono: system
- The global `* { font-weight: 300 }` rule means v2 headings **must set weight explicitly**
  (`font-semibold`/`font-bold`) or they render thin.

## 4. Component Stylings
- **Buttons** (`V2Button`): `gold-fill` = `bg-accent` on black text, `rounded-pill`/`rounded-card`;
  `gold-outline` = transparent with `border-accent` + gold text. Clear hover to `--accent-hover`.
- **Cards** (`StatCard`/`BuffaloCard`/`WalletCard`): `bg-surface`, `rounded-card`, faint
  `border-border-soft`, gold-tinted `shadow-gold`. No card-in-card nesting.
- **Status** (`Badge`/`FilterChip`): pill chips — Champion/Breeding gold-toned, Verified green-dot,
  For-Sale muted. Active filter = gold fill, inactive = surface + soft border.
- **States**: focus uses `--focus-ring` (gold); disabled drops to `--muted`; loading uses skeletons
  (CSR runtime — see §8).

## 5. Layout Principles
Mobile-first. Fixed bottom navigation (4 tabs), content padded `pb-24` to clear it. 2-column grids
for stats and buffalo cards. Hero uses a large rounded-bottom panel (`rounded-b-[32px]`) over an
atmospheric image. Spacing is content-led and generous; whitespace is a feature, not a gap to fill.

## 6. Depth & Elevation
Depth comes from **gold-tinted shadows** and **atmospheric glow**, not neutral drop shadows:
`--shadow-gold: 0 14px 36px rgba(214,177,95,0.18)`. Surfaces layer `--background` →
`--surface` → `--surface-raised`. Subtle gold radial glow spots keep `#070707` from reading as a
flat void (see `atmospheric-canvas-background`).

**Gradients** (premium accents, semantic tokens → Tailwind `bg-gradient-*`): `--gradient-ring`
(white→gold, the Avatar ring), `--gradient-gold` (optional premium button fill, `V2Button`
variant `gold-gradient`), `--gradient-hero` (dark hero panel). Use sparingly — gradients are
accents, not the base surface.

**Icons**: reuse `react-icons` (Feather `Fi*`, Bootstrap `Bs*`) with `currentColor` so an icon
inherits its context token (`text-accent` = gold, `text-success` = green). Brand marks (buffalo
logo, Bitkub) stay as image assets in `public/images`, not icon fonts.

## 7. Do's & Don'ts
- ✅ Use semantic tokens (`bg-surface`, `text-accent`, `text-muted`) — never raw hex in components.
- ✅ Set explicit font weight on headings (global default is 300).
- ✅ Reuse `components/v2` primitives; compose, don't recreate.
- ✅ Keep v2 additive — new routes/components only; never edit legacy or the daisyUI theme.
- ❌ No card-in-card boxes, harsh borders, or equal-width generic grids.
- ❌ No hardcoded `#hex` or off-palette colors leaking into components.
- ❌ Do not flip daisyUI `base-100` to dark globally (breaks every legacy screen).

## 8. Responsive Behavior
Mobile-first breakpoints (custom device-named scale: `mobileS 375 … desktopM 2330` — do **not**
rename). Touch targets ≥ 44px. Bottom nav respects safe-area. z-index: bottom nav above content,
modal above nav. Runtime is **CSR-only** (`ssr:false`) → every data card ships a skeleton state to
avoid layout flash.

## 9. Agent Prompt Guide
> Build jaothui v2 UI with the `components/v2/` primitives + the additive dark-gold-green semantic
> tokens (`bg-background`, `bg-surface`, `text-accent`, `text-foreground`, `text-muted`,
> `border-border-soft`, `rounded-card`, `shadow-gold`). Compose into `V2Layout` + `/v2/*` routes.
> Wire data via the existing tRPC procedures (`metadata.getBatch/getAll/getByMicrochip`,
> `user.kGetMember`) and `useBitkubNext()` — never re-implement engine/auth. Set explicit font
> weights (global default is 300). Reuse before you create; keep everything additive to the legacy
> app. Verify with `/design-verify` against the `verify_tokens` above.

## Primitives (reuse-first)
| Primitive | File | Variants |
|-----------|------|----------|
| Avatar | components/v2/Avatar.tsx | md, lg, xl (white→gold gradient ring + camera) |
| V2Button | components/v2/Button.tsx | gold-fill, gold-gradient, gold-outline |
| StatCard | components/v2/StatCard.tsx | default |
| BuffaloCard | components/v2/BuffaloCard.tsx | champion, breeding, verified, for-sale |
| WalletCard | components/v2/WalletCard.tsx | connected, disconnected |
| BottomNav | components/v2/BottomNav.tsx | home, buffalo, profile, wallet |
| FilterChip | components/v2/FilterChip.tsx | active, inactive |
| Badge | components/v2/Badge.tsx | champion, breeding, verified, for-sale |
| SettingsRow | components/v2/SettingsRow.tsx | default, danger |
| SearchInput | components/v2/SearchInput.tsx | default |

> These are **to be built** in Phase 3 (`components/v2/`). Once built, this table is the reuse
> contract: an agent imports these, never re-creates them.

## Design Brain Links
- [[layered-token-architecture]] — the reference→system→primitive token cascade v2 uses
- [[tinted-shadow-glow]] — gold-tinted shadows over the dark base (premium depth)
- [[three-zone-app-shell]] — command/canvas/bottom-nav shell (maps to the fixed BottomNav)
- [[atmospheric-canvas-background]] — subtle gold radial glow so #070707 isn't a flat void
- [[status-chip-badge]] — green-dot verified / gold status chips
- [[shape-vocabulary]] — semantic radius naming (card / pill)

## Known Drift
- **Two token systems coexist by design**: legacy `thui*` + daisyUI (light) drive legacy screens;
  v2 semantic tokens drive `components/v2`. This is intentional during the additive reskin, not a
  bug — to be consolidated when v2 fully replaces legacy (future daisyUI-removal cleanup).
- **Global `* { font-weight: 300 }`** forces thin text app-wide; v2 headings override per-element.
- **daisyUI theme is nested under a stray `theme:` key** in `tailwind.config.js` (reads as a theme
  literally named `theme`) — pre-existing; left untouched.
- **Primitives are authored-ahead**: the `primitives:` contract points at `components/v2/*` files
  that Phase 3 builds; `/design-verify` (Phase 4) is the gate that proves they resolve.
