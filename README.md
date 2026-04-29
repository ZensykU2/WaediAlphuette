# Wädi Alphütte — Finanz- & Budgetverwaltung

A high-performance desktop application designed for the precise financial management and budget tracking of the Wädi Alphütte. Built with a modern tech stack focused on local data privacy, visual excellence, and mathematical accuracy.

## Key Features

### Advanced Beverage Settlement (Getränkeabrechnung)
The crown jewel of the application. A specialized inventory and financial tracking system that handles three distinct consumption tracks:
- **Guest Sales**: Automatically calculated from stock remainders and billed at retail price.
- **Self-Consumption**: Tracking for individual usage, automatically billed at cost price (EK).
- **Helper Consumption**: Internal tracking for work-day helpers (Zero revenue, tracked for inventory costs).
- **Revenue Booking**: Direct integration with the general ledger to book seasonal beverage profits with one click.

### 💰 Comprehensive Financial Tracking
Eine moderne Desktop-Anwendung zur effizienten Verwaltung der Finanzen, Budgets und Getränkebestände für die Wädi Alphütte (Gruohubel). Entwickelt mit Electron, React und SQLite.

## 📖 Dokumentation
- [**Bedienungsanleitung (User Guide)**](BEDIENUNGSANLEITUNG.md) — Hilfe für Endbenutzer.
- [**Technische Dokumentation**](DOKUMENTATION.md) — Architektur, DB-Schema und Logik.

## Hauptfunktionen
- **Getränkeverwaltung**: Präzise Abrechnung von Verkäufen (Gäste, Helfer, Eigenkonsum) mit automatischen **Wochen-Snapshots**.
- **Finanzbuchhaltung**: Einnahmen- und Ausgabenerfassung mit automatischem Split (Verein/Privat).
- **Budgetplanung**: Überwachung von Saisonbudgets.
- **Reporting**: Grafische Auswertungen (Tages-, Wochen-, Saisonberichte) und Excel-Exporte.
- **Benutzerfreundlich**: Dark-Mode Design, intuitive Bedienung und Schutz vor Fehleingaben (keine negativen Zahlen).

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Electron](https://www.electronjs.org/) (Desktop Core) |
| **Frontend** | [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) + Vanilla CSS |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Database** | [SQL.js](https://sql.js.org/) (SQLite via WASM) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Excel** | [ExcelJS](https://github.com/exceljs/exceljs) |
| **Testing** | [Vitest](https://vitest.dev/) |

## 🏗️ Project Structure

```bash
├── electron/
│   ├── db/         # SQLite database logic & migrations
│   ├── excel/      # ExcelJS import/export handlers
│   ├── ipc/        # Main process IPC communication
│   └── main/       # Electron entry point & window management
├── src/renderer/
│   ├── src/
│   │   ├── components/ # Reusable UI components (Modals, Skeletons, etc.)
│   │   ├── lib/        # Core business logic & utilities
│   │   ├── pages/      # Application views (Dashboard, Getränke, etc.)
│   │   ├── store/      # Global state (Zustand)
│   │   └── types/      # Shared TypeScript interfaces
│   └── index.html
└── package.json
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development
Start the application in development mode with HMR:
```bash
npm run dev
```

### Building for Production
Create a distribution package for Windows (NSIS installer):
```bash
npm run build
```

### Testing
Run the logic and unit tests using Vitest:
```bash
npm run test
```

## Design Philosophy
The application follows a custom **Alpine Aesthetic**, moving away from standard UI defaults in favor of:
- **Cohesive Palettes**: Deep forest greens, slate grays, and warm alpine golds.
- **Glassmorphism**: Subtle backdrop blurs and transparency for a premium feel.
- **Micro-Animations**: Content fade-ins and smooth transitions to improve perceived performance.

