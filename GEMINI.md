# GEMINI.md: Project Context for Gemini CLI

This document provides a comprehensive overview of the South Cotabato Convergence Data Bank project, intended for use by the Gemini CLI to understand the project's structure, purpose, and conventions.

## Project Overview

The South Cotabato Convergence Data Bank is a web application built with SvelteKit and TypeScript. Its primary purpose is to track and monitor development projects within the South Cotabato province, focusing on transparency and accountability. The system is designed to manage projects, track their progress against milestones, and identify and manage delays through a "CATCH-UP" mechanism.

The application features a public-facing portal for citizens to view project information and an administrative backend for managing projects, sitios (communities), and other system data.

### Key Technologies

*   **Framework:** SvelteKit (with Svelte 5)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **UI Components:** shadcn-svelte
*   **Package Manager:** pnpm

## Building and Running the Project

The following commands are used for common development tasks:

*   **Install dependencies:**
    ```bash
    pnpm install
    ```

*   **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

*   **Build for production:**
    ```bash
    pnpm build
    ```

*   **Preview the production build:**
    ```bash
    pnpm preview
    ```

*   **Type checking:**
    ```bash
    pnpm check
    ```

*   **Linting and formatting:**
    ```bash
    pnpm lint
    pnpm format
    ```

## Development Conventions

Based on the project's structure and files, the following conventions are in place:

*   **Component-Based Architecture:** The application is built using Svelte components, organized by feature within the `src/lib/components` directory.
*   **Typed Language:** TypeScript is used throughout the project, with type definitions located in `src/lib/types/index.ts`.
*   **Routing:** The application uses SvelteKit's file-based routing system. Routes are defined in the `src/routes` directory.
*   **Styling:** Utility-first CSS is implemented with Tailwind CSS.
*   **Data Management:** The application uses mock data for development, with a script to generate data from a CSV file. The data models are well-defined in `src/lib/types/index.ts`.
*   **Admin Section:** The administrative part of the application is located under the `/admin` route and has its own layout and components.
*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting, with configurations defined in `.prettierrc` and `eslint.config.js`.

## Project Structure Highlights

```
/
├── src/
│   ├── lib/
│   │   ├── components/       # Svelte components, including UI and admin features
│   │   ├── types/            # TypeScript type definitions
│   │   ├── config/           # Project-specific configurations
│   │   └── utils/            # Utility functions
│   └── routes/             # SvelteKit routes
│       ├── admin/            # Admin section routes
│       └── ...
├── docs/                     # Project documentation
├── scripts/                  # Custom scripts (e.g., data generation)
├── package.json              # Project dependencies and scripts
├── svelte.config.js          # SvelteKit configuration
└── vite.config.ts            # Vite configuration
```
