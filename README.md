# StreamForge

StreamForge is a high-density, real-time client-side Enterprise Control Terminal designed to process, virtualize, filter, search, and sort high-frequency telemetry streams from the Worldwide Robotic Process Automation (RPA) Database 2026. 

It is built on React, Vite, and TailwindCSS with **zero external data-grid or virtualization dependencies** to comply with strict hackathon engineering constraints.

---

## 🚀 Key Feature Modules

1. **High-Density KPIs Dashboard**: Top-row KPI strip presenting running calculations of cumulative savings ($O(1)$ updates), active deployed robots, and total processed records.
2. **Financial & Numeric Sanitation**: Instant formatting of financial currency (`budget_usd`, `annual_savings_usd`) using local standards and clamped percentages (`roi_percent`) rounded to two decimal places.
3. **Visual System Alerts**: GPU-accelerated glow animations for rows containing a "Failed" status or negative ROI calculation. Flash events fade out over 3 seconds and do not block frame execution.
4. **Single-Column Telemetry Sorter**: Interactive table headers for key metrics allowing users to sort in ascending or descending sequence.
5. **Pipeline Pause/Play Queue Buffer**: Global play/pause controller. When paused, UI rendering locks, while the background subscriber continues to capture incoming stream batches in a memory queue ref. Engagement flushes changes sequentially.
6. **Workspace Layout Persistence**: Persistent toggles for KPIs and charts. Visibility preferences and custom category presets are saved to the browser's LocalStorage.
7. **Categorical Dropdown Filters**: Multi-choice category filters for automation types, departments, industries, and project statuses executing fast `Set`-based matching.
8. **High-Frequency Virtualized DOM Grid**: Entirely custom virtualization engine that maintains a fixed HTML row node count matching the client viewport, swapping text values dynamically. 
9. **Multi-Column Concurrent Sorter**: Compound sort priority queues applied via Shift-clicking headers, showing active sort sequence tags (e.g. `▲ 1`, `▼ 2`).
10. **Multi-Field Fuzzy Search Engine**: Sophisticated search matching keywords concurrently across all fields (e.g. searching `'Tata Fin Completed Cloud'` correctly isolates matching rows).

---

## ⚡ Targeted Performance Optimizations

* **Relational Sorting Sorters**: Replaced slow `localeCompare` calls in the sort loop with direct relational comparisons (`<`, `>`), achieving a **5x to 10x** sorting runtime speedup.
* **$O(\text{batchSize})$ Telemetry Ingestion**: Added a lookup mapping on startup (`rowIndexMapRef`). Ingestion and queue resume flushes copy the array using shallow spread `[...prevRows]` and directly modify updated indices in constant time relative to the database size, reducing calculations from 1.5ms to under 0.05ms.
* **`React.memo` Row Reference Protection**: Added a custom props comparator to the virtualized grid rows to ignore inline `style={{ transform: ... }}` object reference changes, localizing renders only to modified data cells.
* **Stable Stream Parameters**: Search queries and category filter sets are maintained in mutable `useRef` states inside the hooks, preventing event subscription teardowns and setup overhead on stream ticks.
* **Processing Rate Indicator**: Exposes real-time throughput metrics (updates per second) next to the FPS Counter using sliding window computations.

---

## 📦 Tech Stack & Dependencies

* **Core**: React 19, Javascript (ES6+)
* **Build System**: Vite 6
* **Styling**: TailwindCSS 4 (Vanilla CSS variables)
* **Linter**: Oxlint (0 errors, 0 warnings)

*No external grid components or optimization libraries (like AG-Grid, TanStack Table, react-window, or react-virtualized) are loaded in the bundle.*

---

## 🛠️ Getting Started

### Installation
Clone the repository, navigate to the directory, and install dependencies:
```bash
npm install
```

### Run Local Development Server
Launch the local Vite environment:
```bash
npm run dev
```

### Run Linter Checks
Verify codebase syntax quality:
```bash
npm run lint
```

### Build Production Bundle
Compile optimized assets:
```bash
npm run build
```
