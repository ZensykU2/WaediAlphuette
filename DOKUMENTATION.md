# Technische Dokumentation — Wädi Alphütte

Diese Dokumentation richtet sich an Entwickler und beschreibt die interne Struktur, die Logik und die Datenhaltung der Applikation.

---

## Architekturübersicht

Die App basiert auf **Electron** mit einem **React** Frontend.

- **Main Process** (`electron/`): Steuert die Fenster, die SQLite-Datenbank und die Excel-Integration.
- **Renderer Process** (`src/renderer/`): Die Benutzeroberfläche (React + Vite + TailwindCSS).
- **Datenbank**: SQLite via `sql.js` (WASM-Portierung), um eine installationfreie Datenbank direkt im Benutzerverzeichnis zu ermöglichen.
- **State Management**: `Zustand` für reaktive UI-Updates (Saison-Status, etc.).

---

## Datenbankschema

Die Datenbank befindet sich unter `%APPDATA%/waedi/data/waedi.db`.

### Wichtige Tabellen:

#### `getraenke_abrechnung`
Speichert den kumulativen Zustand der Getränke pro Saison.
- `bestand_antritt`: Inventar zu Beginn der Saison.
- `lieferungen`: Summe aller Lieferungen.
- `bestand_abgabe`: Aktuell gezähltes Inventar (manuell editierbar).
- `verbrauch_gast`: Berechneter oder manuell gesetzter Verkauf.

#### `getraenke_wochen_snapshots`
Speichert Momentaufnahmen für die Wochenauswertung.
- `woche_montag`: Das Datum des Montags dieser Woche (Identifier).
- `typ`: `start` (erstellt am Montag) oder `ende` (erstellt am Sonntag).
- Speichert Kopien der Abrechnungsfelder zum Zeitpunkt des Snapshots.

#### `einnahmen` / `ausgaben`
Klassische Buchhaltungstabellen mit `saison_id` Verknüpfung.

---

## Kernlogik & Berechnungen

### Getränke-Deltas (Wochenbericht)
Die Differenz berechnet sich aus:
`Umsatz_Woche = (Gast_Ende - Gast_Anfang) * VP + (Eigen_Ende - Eigen_Anfang) * EK`

### Inventar-Logik
Wird das Feld `bestand_abgabe` (Inventar Aktuell) geändert, triggert die UI folgende Berechnung für die Gäste-Verkäufe:
`verbrauch_gast = (Anfang + Lieferungen) - Inventar_Neu - Eigen - Helfer`

### Finanz-Split (Getränke)
Einnahmen in der Kategorie "Getränke" werden automatisch gesplittet:
- **18% Privatanteil**
- **82% Vereinsanteil**
(Implementiert in `electron/db/database.ts -> calcAnteile`)

---

## IPC-Kommunikation

Die Kommunikation zwischen Main und Renderer erfolgt über getypte Kanäle in `electron/preload/index.ts`.

**Spezielle Events:**
- `window:maximizeChange`: Informiert die UI über Fenstergrößenänderungen für das Icon.
- `getraenke:snapshotCreated`: Wird vom Main-Prozess gesendet, wenn ein automatischer Snapshot (Mo/So) erstellt wurde.

---

## Entwicklung & Build

### Befehle
- `npm run dev`: Startet die Entwicklungsumgebung mit HMR.
- `npm run build`: Erstellt ein installierbares Windows-Paket (`.exe`) via `electron-builder`.

### Verzeichnisse
- `electron/db`: Migrationslogik und SQL-Queries.
- `electron/excel`: Logik für `ExcelJS` Exporte.
- `src/renderer/src/lib`: Hilfsfunktionen für Währungsformatierung und Berechnungen.

---
*Dokumentation Stand: April 2026*
