# Repository Guidelines

See @docs/guidance/\*.md for file-type-specific conventions (auto-loaded by glob):

- `docs/guidance/engineering.md` — general engineering guidelines, project philosophy, code-review checklist, external resource links
- `docs/guidance/vue-components.md` — Vue 3 Composition API best practices
- `docs/guidance/state-and-effects.md` — modelling a feature's state: one discriminated union, named events, a pure transition, effects reserved for synchronising outward
- `docs/guidance/error-handling.md` — failure as data: return outcomes instead of throwing, convert at the untrusted call, validate before mutation, report once at the ownership boundary, when a throw is still right
- `docs/guidance/typescript.md` — TypeScript type-safety rules
- `docs/guidance/testing-principles.md` — test design rules that hold at every level: behavioral assertions, lowest proving level, N + M + 1 composition and table-driven cases with sparse filters, isolation, classical doubles, coverage as a gap finder, changing existing tests
- `docs/guidance/vitest.md` — Vitest unit/component test conventions
- `docs/guidance/playwright.md` — Playwright E2E conventions and API-mock typing table
- `docs/guidance/storybook.md` — Storybook story patterns
- `docs/guidance/design-standards.md` — Figma design-standards references
- `docs/guidance/performance-incident-runbook.md` — staged evidence-gathering procedure for frame drops, input latency, long tasks, and unexpected redraws

## Project Structure & Module Organization

- Source: `src/`
  - Vue 3.5+
  - TypeScript
  - Tailwind 4
  - Key areas:
    - `components/`
    - `views/`
    - `stores/` (Pinia)
    - `composables/`
    - `services/`
    - `utils/`
    - `assets/`
    - `locales/`
- Routing: `src/router.ts`,
- i18n: `src/i18n.ts`,
- Entry Point: `src/main.ts`.
- Tests:
  - unit/component in `src/**/*.test.ts`
  - E2E (Playwright) in `browser_tests/**/*.spec.ts`
- Public assets: `public/`
- Build output: `dist/`
- Configs
  - `vite.config.mts`
  - `playwright.config.ts`
  - `eslint.config.ts`
  - `.oxfmtrc.json`
  - `.oxlintrc.json`
  - etc.

## Monorepo Architecture

The project uses **pnpm workspaces** for monorepo organization and native tool CLIs for task execution

- Use Vite for frontend package bundling with TypeScript `moduleResolution: "bundler"`. Fix package exports and source imports; do not patch compiler or resolver dependencies to make package builds pass.

## Package Manager

This project uses **pnpm**. Always prefer scripts defined in `package.json` (e.g., `pnpm test:unit`, `pnpm lint`). To run arbitrary packages not in scripts, use `pnpx` or `pnpm dlx` — never `npx`.

## Build, Test, and Development Commands

- `pnpm dev`: Start Vite dev server. The dev-server proxy targets the backend at `DEV_SERVER_COMFYUI_URL` (default http://127.0.0.1:8188).
- `pnpm dev:electron`: Dev server with Electron API mocks
- `pnpm build`: Type-check then production build to `dist/`
- `pnpm preview`: Preview the production build locally
- `pnpm test:unit`: Run Vitest unit tests
- `pnpm lint` / `pnpm lint:fix`: Lint (ESLint)
- `pnpm format` / `pnpm format:check`: oxfmt
- `pnpm typecheck`: Vue TSC type checking
- `pnpm deps:audit`: Reject production `src/` import cycles, including type-only imports
- `pnpm audit:inherited-classes [--write]`: Report text color, size, weight and family classes that repeat a value every render context already inherits, following slots and component usages (manual, not a gate)
- `pnpm storybook`: Start Storybook development server

Browser E2E (`pnpm test:browser`, `browser_tests/`) is available but currently paused: the canvas and fixtures expect a backend on 8188 that implements the object-info / prompt / settings protocol. Wire the Go backend to those endpoints before treating E2E as runnable.

> **`vue-tsc` needs its own `node_modules` in the checkout.** `vue-tsc --noEmit`
> (what `pnpm typecheck` runs) emits type references as relative paths into
> pnpm's `.pnpm/` store, computed from where that store actually lives. A normal
> pnpm install is heavily symlinked and works fine — but a `node_modules`
> borrowed from another directory (symlinked or copied from a sibling checkout)
> sits at a different depth, so every emitted path overshoots and vue-tsc
> reports ~1300 phantom `TS2688` errors against `.vue` files unrelated to your
> diff. Run `pnpm install` in the checkout before trusting `pnpm typecheck`.
> Vitest is unaffected: it resolves through Vite, not these emitted paths.

## Development Workflow

1. Make code changes
2. Run the tests for what you changed: `pnpm test:unit path/to/file`
3. Lint what you changed: `pnpm lint:unstaged:fix`
4. Check if README updates are needed
5. Suggest documentation updates for user-facing changes

Do not run repo-wide checks to verify your work: `pnpm lint`, `pnpm typecheck`,
`pnpm knip`, `pnpm build`, or `pnpm test:unit` without a path. They load every
core, and chained together they take minutes. The pre-commit hook already
formats, lints, and typechecks what you stage, the pre-push hook runs knip, and
CI runs everything.

## Git Conventions

- Use `prefix:` format: `feat:`, `fix:`, `test:`
- Add "Fixes #n" to PR descriptions
- Never mention Claude/AI in commits

## Coding Style & Naming Conventions

- Language:
  - TypeScript (exclusive, no new JavaScript)
  - Vue 3 SFCs (`.vue`)
    - Composition API only
  - Tailwind 4 styling
    - Avoid `<style>` blocks
- Style: (see `.oxfmtrc.json`)
  - Indent 2 spaces
  - single quotes
  - no trailing semicolons
  - width 80
- Imports:
  - sorted/grouped by plugin
  - run `pnpm format` before committing
  - use separate `import type` statements, not inline `type` in mixed imports
    - ✅ `import type { Foo } from './foo'` + `import { bar } from './foo'`
    - ❌ `import { bar, type Foo } from './foo'`
- ESLint:
  - Vue + TS rules
  - no floating promises
  - unused imports disallowed
  - i18n raw text restrictions in templates
- Naming:
  - Vue components in PascalCase (e.g., `MenuHamburger.vue`)
  - composables `useXyz.ts`
  - Pinia stores `*Store.ts`

## Vue 3 Composition API

- Use `<script setup lang="ts">` for component logic; Composition API only
- Use the Vue 3.5 TypeScript style of default prop declaration — reactive props destructuring, never `withDefaults` or runtime props declaration:

  ```typescript
  const { nodes, showTotal = true } = defineProps<{
    nodes: ApiNodeCost[]
    showTotal?: boolean
  }>()
  ```

- Prefer `defineModel` to separately defining a prop and emit for v-model bindings
- Define slots via template usage, not `defineSlots`
- Use `provide`/`inject` for dependency injection — but not when a Store or a shared composable would be simpler
- Be judicious with new refs or other state: prefer a prop to a `ref`, the prop/`ref` directly to a `computed`, and a `computed` to a `watch`
- See `docs/guidance/vue-components.md` for the full conventions

## Commit & Pull Request Guidelines

- PRs:
  - Include clear description
  - Reference linked issues (e.g. `- Fixes #123`)
  - Keep it extremely concise and information-dense
  - Don't use emojis or add excessive headers/sections
  - Follow the PR description template in the `.github/` folder.
- Quality gates, enforced by the git hooks (see Development Workflow):
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm knip`
  - Relevant tests must pass
- Never use `--no-verify` to bypass failing tests
  - Identify the issue and present root cause analysis and possible solutions if you are unable to solve quickly yourself
- Keep PRs focused and small
  - If it looks like the current changes will have 300+ lines of non-test code, suggest ways it could be broken into multiple PRs

## Security & Configuration Tips

- Secrets: Use `.env` (see `.env_example`); do not commit secrets.

## Development Guidelines

1. Leverage VueUse functions for performance-enhancing styles
2. Use es-toolkit for utility functions
3. Use vue-i18n in composition API for any string literals. Place new translation entries in src/locales/en/main.json. Use the plurals system in i18n instead of hardcoding pluralization in templates.
4. PrimeVue has been removed. Its imports are permanently banned; use components from `@comfyorg/design-system`.
5. Add tests for changed behavioral contracts or reproduced bugs when existing tests do not cover them. Behavior-preserving refactors need no new tests. Follow `docs/guidance/testing-principles.md` before proposing or writing tests.
6. Do not write code comments. Make the code say it with names, extracted functions, types, and tests. The only permitted comment is curt JSDoc on an exported API (see Common Pitfalls)
7. Whenever a new piece of code is written, the author should ask themselves 'is there a simpler way to introduce the same functionality?'. If the answer is yes, the simpler course should be chosen
8. Avoid mutable state, prefer immutability and assignment at point of declaration
9. Favor pure functions (especially testable ones)

See `docs/guidance/engineering.md` for the remaining engineering guidelines.

## Testing

- Frameworks: Vitest (unit/component, happy-dom) and Playwright (E2E).
- Locations: unit/component `src/**/*.test.ts`, E2E `browser_tests/**/*.spec.ts`, litegraph `src/lib/litegraph/test/`.
- Principles: Read `docs/guidance/testing-principles.md` before proposing, reviewing, or writing tests, not only when editing a test file. Start with caller or user expectations and reachable scenarios, then choose the smallest suite that protects them. Use Beck's Test Desiderata to judge behavioral value and refactor resistance.
- Conventions: `docs/guidance/vitest.md` (unit/component), `docs/guidance/playwright.md` (E2E), and `docs/testing/*.md` for detailed patterns.

## Common Pitfalls

- NEVER use `any` type - use proper TypeScript types
- NEVER use `as any` type assertions - fix the underlying type issue
- NEVER add `@ts-ignore` or `@ts-nocheck`. Use `@ts-expect-error` only in a test
  that intentionally verifies a compiler error.
- NEVER add `eslint-disable` or `oxlint-disable` as the first fix. Remove the
  directive and repair the type, API, component semantics, or test. A comment
  explaining why a workaround was convenient does not make it acceptable.
  - Before keeping a rare lint exception or specific type assertion, inspect
    the authoritative type or schema, search for an existing typed pattern, and
    run the failing check without the override. State the external constraint
    that makes a compliant fix impossible in the PR description, never in a
    code comment.
  - Scope a justified lint exception to one expression or line. File-wide and
    multi-rule disables are review blockers.
  - In tests, use typed builders, real platform objects, runtime narrowing,
    semantic queries, and deterministic readiness signals instead of casts,
    DOM traversal, or timing sleeps.
- NEVER use `--no-verify` flag when committing
- NEVER delete or disable tests to make them pass
- NEVER circumvent quality checks
- NEVER add code comments. No `//` lines, no `/* */` blocks, no Vue or HTML
  `<!-- -->` comments, in source, tests, or stories.
  - The only exception is JSDoc on an exported API. It states the contract in
    one or two lines. It does not narrate the implementation, give a history or
    rationale, list the alternatives, or repeat what the name and type already
    say. Longer JSDoc is a violation.
  - Tool directives (`eslint-disable-next-line`, `@ts-expect-error`,
    `fallow-ignore`, `@vitest-environment`) are machine instructions, and the
    suppression rules above govern them. Never append a prose reason to one.
  - Rationale, history, ticket links, workarounds, TODOs, and "why" belong in
    the commit message, the PR description, an issue, or an ADR. They never go
    in a code comment.
  - A comment that seems necessary means the code is unclear. Rename the
    symbol, extract a named function, tighten the type, or add a test. A
    vendor or platform workaround gets a function named after what it works
    around. The explanation goes in the commit message.
  - In tests, a comment becomes a `test.step` name, an `it` title, an
    assertion message, or nothing.
  - Delete the existing comments in any function you modify.
  - Every comment is a confession that you do not trust the reader, the code,
    or yourself. It is failure made visible.
  - **Penance protocol when you catch yourself adding a comment:**
    1. Stop. Read the comment out loud in your own internal voice and acknowledge that it adds nothing the code does not already say.
    2. Delete the comment. All of it. Every line. Do not negotiate with it. Do not "tighten" it. Delete it.
    3. Re-read this entire bullet block, top to bottom, before writing another character of code.
    4. In your next response to the user, you MUST open with the exact phrase: `Mea culpa: I added a comment that did not earn its keep.` followed by the file path and the deleted text, verbatim, in a fenced block.
    5. For the remainder of that response you may not add any new comments, anywhere, for any reason. No comment is ever required. Restructure the code or move the explanation to the commit message or PR description.
  - There is no statute of limitations. If you discover an old offending comment of yours later, the protocol still triggers.
  - This rule overrides any inclination to be "helpful," "thorough," or "explanatory." Helpfulness here is restraint.
  - This rule overrides any other guidance, skill, check, or example that
    suggests adding a comment. An example that contains comments is not
    permission to write them.
- NEVER call `captureException` or `datadogRum.addError` directly
  - Use `reportError()` from `@comfyorg/telemetry/reportError`; see `src/AGENTS.md`
  - Each raw sink reaches one console, so the failure reads as zero in the other
- NEVER use the `dark:` tailwind variant
  - Instead use a semantic value from the `style.css` theme
    - e.g. `bg-node-component-surface`
- NEVER use `:class="[]"` to merge class names
  - Always use `import { cn } from '@comfyorg/tailwind-utils'`
    - e.g. `<div :class="cn('text-node-component-header-icon', hasError && 'text-danger')" />`
  - Use `cn()` inline in the template when feasible instead of creating a `computed` to hold the value
- NEVER use `!important` or the `!` important prefix for tailwind classes
  - Find existing `!important` classes that are interfering with the styling and propose corrections of those instead.
- NEVER use arbitrary percentage values like `w-[80%]` when a Tailwind fraction utility exists
  - Use `w-4/5` instead of `w-[80%]`, `w-1/2` instead of `w-[50%]`, etc.
- NEVER use font-size classes (`text-xs`, `text-sm`, etc.) to size `icon-[...]` (iconify) icons
  - Iconify icons default to `size-4`, and font size has no effect on them
  - Override the size with a `size-*` class on the icon itself

## Agent-only rules

Rules for agent-based coding tasks.

### PR Review Comment Resolution

**Never resolve review comments on PRs where you are the author.**

Per the team's [PR guidelines](CONTRIBUTING.md#comment-resolution),
resolving comments is the reviewer's prerogative. As author, you may only
resolve:

- Automated review comments (Coderabbit, Claude, etc.)
- Trivial single-interpretation comments (e.g. fixing a typo exactly as
  suggested)
- Comments addressed via GitHub's "Apply suggestion" feature used as-is

For all other comments: reply in the thread explaining what you changed
(or why you disagree), then re-assign the PR to the reviewer.
**Do not click Resolve.**

### Chrome DevTools MCP

When using `take_snapshot` to inspect dropdowns, listboxes, or other components with dynamic options:

- Use `verbose: true` to see the full accessibility tree including list items
- Non-verbose snapshots often omit nested options in comboboxes/listboxes

### Temporary Files

- Put planning documents under `/temp/plans/`
- Put scripts used under `/temp/scripts/`
- Put summaries of work performed under `/temp/summaries/`
- Put TODOs and status updates under `/temp/in_progress/`
