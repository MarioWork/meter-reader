# The web codebase

How `web/` is built and organised. Everything here applies inside `web/`.

[← Back to the README](../../README.md)

## Contents

- [Stack](#stack)
- [Folder structure](#folder-structure)
- [How data flows](#how-data-flows)
- [Theme and shadcn/ui](#theme-and-shadcnui)
- [Adding a feature](#adding-a-feature)
- [Conventions enforced by the compiler and the linter](#conventions-enforced-by-the-compiler-and-the-linter)

## Stack

| Area     | Tool                                                                   |
| -------- | ---------------------------------------------------------------------- |
| UI       | React 19 with the React Compiler, Tailwind CSS 4, shadcn/ui on Base UI |
| Build    | Vite 8                                                                 |
| Routing  | React Router 8, data mode (loaders and actions)                        |
| Data     | axios                                                                  |
| Forms    | react-hook-form + yup                                                  |
| Mocks    | MSW 3 (`msw/vite` plugin, `@msw/playwright` for E2E)                   |
| Tests    | Vitest 5 + Testing Library, Playwright for E2E                         |
| Lint     | ESLint (flat, type-aware) + custom rules, Prettier                     |
| Packages | Yarn 4, release committed in `.yarn/releases`                          |

## Folder structure

```
src/
  application/routes/     route table, path constants, feature route files
  common/
    api/services/         one folder per API service
    components/           shared components
    hookUtils/            shared hooks
    utils/                shared helpers and yup rules
  mocks/                  MSW handlers and mock models
  pages/                  one folder per page
  types/
    models/               API models (`*ApiModel`)
    utility/              shared types and value sets (`*Util`)
e2e/                      Playwright config, fixtures, page objects, tests
eslint-rules/             local ESLint rules
```

Aliases: `@api`, `@services`, `@application`, `@app-types`, `@utils`, `@pages`, `@components`, `@hooks`, `@mocks`,
`@test-utils`.

The brand drawings (logo, mascot, empty meter, loading wheels) also exist as standalone SVGs in the root
[`assets/`](../../assets/README.md) folder.

## How data flows

Readings show the full path:

1. **Service** (`common/api/services/readingService/`) calls the API with axios.
   - A read returns the data, and a failure throws.
   - A write goes through `axiosActions` (`common/api/axiosActions.ts`). It returns `{ success, data?, error? }`
     (`JSONResponseUtil`) and never throws on a failed request.
2. **Loader** (`pages/Home/homeLoader.ts`) reads the URL and calls the service before the page renders.
3. **Page** reads the loader's data with `useLoaderData()`.
4. **Form** validates with a yup schema, then submits through React Router's `useFetcher`.
5. **Action** (`pages/NewReading/newReadingActions.ts`) checks the payload against the same schema, then calls the
   service. The router reloads the loader afterwards.

A yup rule used by both the form and the service lives once in `common/utils/` (see `readingUtils.ts`).

## Theme and shadcn/ui

- `src/index.css` holds the light (`:root`) and dark (`.dark`) tokens. Style with them (`bg-background`,
  `text-muted-foreground`, `text-primary`, …), not Tailwind's own colours, so both themes work.
  `src/themeContrast.test.ts` fails when a light or dark pair drops below WCAG 2.2 AA.
- The theme follows the device's light or dark setting. `useTheme()` (`@hooks/useTheme`) reads and changes the user's
  choice (Light / Dark / System), kept in `localStorage`.
- `public/theme-init.js` applies the stored choice before the first paint. It mirrors
  `src/common/utils/themeUtils.ts`: change both together.
- Add a shadcn component with `yarn shadcn add <name>` (from `web/`). It lands in `src/common/components/ui/`. Join
  classes with `cn()` from `@utils/classNameUtils`.
- The CLI writes `import { cn } from "cn"` and adds the `cn` package. Change the import to `@utils/classNameUtils` and
  `yarn remove cn`. Leave the rest of the file as the CLI wrote it, so a later `yarn shadcn add <name> --diff` stays
  readable; ESLint relaxes a few style rules for `ui/` for the same reason.
- Toasts come from shadcn's Base UI `toast` (`@components/ui/toast`); the `Toaster` sits in `AppProviders`. A route
  action confirms a write that went through by passing its answer through `toastOnSuccess()` (`@utils/toastUtils`).
  Toasts sit in a polite live region, so screen readers announce them. A failure gets no toast: it shows only next to
  its form, with `role="alert"`.

## Adding a feature

1. Add the API model in `src/types/models/` and export it from the barrel.
2. Add the service in `src/common/api/services/<name>Service/`.
3. Add MSW handlers in `src/mocks/handlers/<name>/` and register them in `handlers/index.ts`.
4. Add the page in `src/pages/<Page>/`, with a `<Page>.route.ts` that exports `Component`, `loader` and `action`.
5. Add the path to `routesUtils.ts` and a lazy route in `application/routes/featureRoutes/`.

## Conventions enforced by the compiler and the linter

- `tsconfig.app.json` carries Vite's template flags: `erasableSyntaxOnly` (no `enum`, use `as const` value sets),
  `verbatimModuleSyntax` (`import type` for types), `noUncheckedSideEffectImports`.
- The React Compiler memoizes components; manual `useMemo` / `useCallback` are escape hatches, and the `react-hooks`
  compiler rules lint them.
- Route paths come from `routesUtils.ts`. A literal path in `navigate()`, `to` or `href` is an error.
- A file in `src/types/` that only exports types must end in `.type.ts`.
- Tailwind classes are checked and ordered by `eslint-plugin-better-tailwindcss`; Prettier sorts them the same way.
- E2E tests interact through page objects in `e2e/pages/`, never directly, and never use `waitForTimeout`.
- No snapshot tests.
