# Math Knowledge Check

Modern React application foundation for building math knowledge checks and assessment flows.

## Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS
- React Router
- ESLint, Prettier

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run format:check
```

## Project Structure

```text
src/
  app/          App shell, providers, routing setup
  pages/        Route-level pages
  shared/       Shared config, UI components, utilities
```

Use `@/*` imports for files under `src`. Tailwind is connected through the Vite plugin and `src/index.css`.

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```
