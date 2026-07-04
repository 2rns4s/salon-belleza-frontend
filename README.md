# Salón de Belleza - Frontend

This is the central entry point for the frontend project.

## Quick Start / Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Run the test suite:
   ```bash
   npm run test
   ```

4. Build the project and preview:
   ```bash
   npm run build
   npm run preview
   ```

## Architecture Overview

This project is a Single Page Application (SPA). The SPA routing mechanism uses history API to load views without full page reloads. The codebase directory structure separates concerns by feature.

## Key Design Patterns

We use the following patterns:
- **Controller**: Manages user input and updates the view.
- **Service**: Handles business logic and data access.
- **View**: Renders the UI components.
- **Routes**: Manages navigation.
- **Constants**: Shared configurations.
- **Mappers**: Maps data between API responses and models.

## Core Technologies

- **Vanilla JavaScript**: For core logic without heavy frameworks.
- **Vitest**: Our testing runner.
- **jsdom**: Simulates the DOM for tests.
- **BEM CSS**: For styling methodology.
- **HttpClient**: Handles API requests.

For detailed API documentation and frontend rules, see [MANUAL_FRONTEND.md](./MANUAL_FRONTEND.md).
