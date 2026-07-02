# Design system — Shaxsiy O'yin

One system: **terminal / brutalist, monochrome + one electric brand accent.** Every screen
must read as the same product. When in doubt, match `Button` and `Card` in `packages/ui`.

## Principles

1. **Sharp, not soft.** Corners are square. `--radius` is `0`. Never use `rounded`,
   `rounded-md/lg/xl/2xl/3xl` on structural elements. `rounded-none` is the default and
   rarely needs to be written. `rounded-full` is allowed **only** for genuine circles:
   avatars and small live/status dots (`animate-ping`, `animate-pulse`). Everything else is square.
2. **Monochrome first, accent on purpose.** The UI is greys/ink. Color appears only to carry
   meaning or to mark the single most important action/state on a screen.
3. **Borders and rings, not shadows.** Separation comes from `border` / `ring-1`, not drop
   shadows. Avoid `shadow-lg`/`shadow-2xl`; a subtle `shadow-sm` at most.
4. **Labels are uppercase.** Section labels, meta labels, badges, and eyebrows use
   `uppercase tracking-widest` (or `tracking-wider`) at `text-xs`/`text-[10px]`,
   `text-muted-foreground`. Headings use `font-heading` (Space Grotesk).
5. **Restraint in motion.** Framer-motion is fine for entrance (`opacity`/`y`) and layout,
   but keep it subtle and consistent. No gratuitous infinite bounces.

## Tokens — use these, never raw palette colors

Defined in `packages/ui/src/styles/globals.css`, theme-aware (light + dark):

| Token | Tailwind class | Use for |
| --- | --- | --- |
| `--primary` / `-foreground` | `bg-primary` `text-primary` | Ink. Default buttons, strong emphasis text. |
| `--brand` / `-foreground` | `bg-brand` `text-brand` | THE accent. Primary CTA on a screen, active/selected state, the one highlight that matters (host marker, current step, timer fill), links. Use sparingly. |
| `--success` / `-foreground` | `bg-success` `text-success` | Correct answers, connected, ready, positive status. |
| `--warning` / `-foreground` | `bg-warning` `text-warning` | Awaiting/attention, waiting-for-answer. |
| `--destructive` / `-foreground` | `bg-destructive` `text-destructive` | Errors, locked, wrong answers. |
| `--muted` / `-foreground` | `bg-muted` `text-muted-foreground` | Neutral surfaces, secondary text. |
| `--border` | `border` | All separators/outlines. |

### Banned — replace on sight

- `text-green-500`, `bg-green-500/…`, `border-green-500` → `success` token.
- `text-yellow-500`, `bg-yellow-500/…` → `warning` token.
- Hardcoded `oklch(…)` accent literals in TSX (e.g. the purple `oklch(0.627 0.265 303.9)`
  in progress dots) → `brand` / token classes.
- Soft radii (`rounded`, `rounded-md/lg/xl`) on cards, panels, inputs, badges, buttons, options.

## Opacity conventions (stop the `/5 /10 /20 /30 /50` soup)

Pick from this small set only:

- Tinted surface for an accent/semantic block: `bg-<token>/10` with `border-<token>/30` and `text-<token>`.
- Neutral inset surface: `bg-muted` (or `bg-muted/50` for a lighter inset). Not `/20`, not `/30`.
- Hover on a neutral row/card: `hover:border-brand/50` (selectable) or `hover:bg-muted`.
- Disabled: `disabled:opacity-50`.

## Components — reach for these before hand-rolling

- **Button** (`@shaxsiy-oyin/ui/components/button`): variants `default` (ink), `brand` (accent CTA),
  `outline`, `secondary`, `ghost`, `destructive`, `link`. Buttons are already uppercase +
  `rounded-none`; don't override those. The single most important action on a screen =
  `variant="brand"`; everything secondary = `outline`/`ghost`/`secondary`.
- **Badge** (`@shaxsiy-oyin/ui/components/badge`): tones `default` `brand` `primary` `success`
  `warning` `destructive` `outline`. Already uppercase + tracking + square. Use for all
  pills/tags/chips/eyebrows (HOST, status, "QUESTION 1/5", "worth 200", category).
- **StatusBadge** (`@/shared/components/StatusBadge`): wraps Badge; maps room status strings to tones.
- **Card** (`@shaxsiy-oyin/ui/components/card`): already square, `ring-1`, uppercase `CardTitle`.
  Use `size="sm"` for denser cards. Don't add `rounded-*` or heavy shadows.

## Patterns

- **Meta label**: `<span className="text-xs uppercase tracking-widest text-muted-foreground">…</span>`
- **Eyebrow / tag**: use `Badge`, not a hand-built `rounded-full bg-primary/10` span.
- **Selectable option** (quiz answer, pickable card): square, `border`, default neutral;
  hover `hover:border-brand/50`; selected `border-brand bg-brand/10`;
  correct `border-success bg-success/10 text-success`; wrong `border-destructive bg-destructive/10 text-destructive`.
- **Icon tile** (leading icon in a row): square `size-8`/`size-10`, `bg-muted` (or `bg-brand/10 text-brand`
  when it's the accent), never `rounded-lg`.
- **Player/list row**: square `border bg-muted/50 p-3`, name `font-medium text-sm`, host marked with a `Badge tone="brand"`.

## Code hygiene

- Double quotes for JSX attributes (match the primitives), 2-space indent, Prettier defaults.
- No code comments (project rule).
- Prefer semantic tokens and the shared components over ad-hoc utility stacks so the next screen inherits the system for free.
