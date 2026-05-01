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
- `npm run release`: Baut die App und lädt sie direkt als Release auf GitHub hoch.

### Update-Pipeline & Versionierung
Die App verfügt über eine automatische Update-Funktion via **GitHub Releases**.

#### Versionierung:
- Die Version wird ausschliesslich in der **`package.json`** gesteuert (z. B. `"version": "1.0.1"`).
- **Wichtig**: Bei jeder neuen Veröffentlichung **muss** die Versionsnummer erhöht werden, damit der Auto-Updater erkennt, dass eine neue Version vorliegt.
- Die `package-lock.json` wird von `npm` automatisch synchronisiert, ist aber für die Update-Logik der App selbst irrelevant. Massgeblich ist nur die `version` in der `package.json`.

#### Release-Prozess:
1. Versionsnummer in `package.json` erhöhen.
2. In der PowerShell den GitHub Token setzen: `$env:GH_TOKEN="dein_token"`
3. Befehl ausführen: `npm run release`
4. Auf GitHub unter "Releases" den erstellten **Draft** bearbeiten und auf **"Publish Release"** klicken.

#### Hosting:
- Die Releases werden auf GitHub unter `ZensykU2/WaediAlphuette` gehostet.
- Der Main-Prozess (`updater.ts`) prüft bei jedem Start im Hintergrund auf neue Versionen.

### Verzeichnisse
- `electron/db`: Migrationslogik und SQL-Queries.
- `electron/excel`: Logik für `ExcelJS` Exporte.
- `src/renderer/src/lib`: Hilfsfunktionen für Währungsformatierung und Berechnungen.

---
---
*Dokumentation Stand: 1. Mai 2026 (v1.1.1)*

## Neue Management-Module (v1.1)

Seit Version 1.1 umfasst die Applikation erweiterte Module für den Hüttenbetrieb:

### Zimmerbelegung
- Verknüpft Saisons mit Zimmern.
- Verhindert Doppelbuchungen durch visuelle Auslastungsanzeige (Basiert auf gebuchten Betten).
- Automatische Deduplizierung der Stammdaten (Zimmer) beim Start.

### Menü-Management
- Ermöglicht das Verknüpfen externer PDF-Dateien pro Saison.
- Fallback auf ein integriertes System-Menü (`Menue.pdf`), falls keine Verknüpfung besteht.
- Verwendet `shell.openPath` für native PDF-Anzeige. Relative Pfade werden automatisch gegen das App-Verzeichnis aufgelöst.

### Rezept-Rechner
- Dynamische Mengenberechnung basierend auf der Personenzahl.
- Direkte Integration in die Einkaufsliste.

### To-dos & Navigation
- Offene Aufgaben werden als Badge direkt in der Sidebar angezeigt.
- Sidebar-Gruppen sind einklappbar, um den Fokus auf aktive Bereiche zu lenken.
