# Repository files and purpose

This public repository provides an interactive aircraft maintenance dashboard and an accompanying SQLite workbench. It runs as a static website on GitHub Pages. The bundled database contains fully synthetic demonstration records.

## File guide

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | Main dashboard. Displays readiness, capability impact, manpower, job-status/AWM, material support, and Top Five WUC views. Includes filters, metric tiles, charts, tables, and navigation. Automatically downloads the bundled synthetic database and opens a read-only copy in browser memory. |
| [`engine.html`](engine.html) | SQLite Workbench. Automatically opens the synthetic database, lists tables, runs SQL, browses records, and supports local database/CSV import and database export. Edits remain in browser memory; saving downloads a file and does not modify the hosted dataset. |
| [`database.synthetic.db`](database.synthetic.db) | SQLite database used by both HTML pages. All identifiers, descriptions, dates, metadata, and measures are generated demo data. Contains 12 Wings, 108 Commands, 384 aircraft, and January–December 2024 reporting periods. |
| [`database.synthetic.report.json`](database.synthetic.report.json) | Machine-readable dataset summary: table row counts, generated entity counts, reporting period, validation status, and synthetic-data notes. |
| [`README.md`](README.md) | Project introduction, links to the live pages, synthetic-data explanation, and local hosting instructions. |
| [`FILE_GUIDE.md`](FILE_GUIDE.md) | This guide to the repository files, database tables, and application operation. |
| [`.nojekyll`](.nojekyll) | Tells GitHub Pages to serve the repository as static files without Jekyll processing. |
| [`.gitignore`](.gitignore) | Excludes ordinary database files, SQLite sidecars, backups, CSV exports, and local artifacts from Git tracking. Explicitly permits `database.synthetic.db`. |

## Database tables

| Table | Dashboard purpose |
| --- | --- |
| `tblMaint1` | Maintenance and flight measures, capability-impact hours, direct maintenance man-hours, cannibalization, corrosion prevention/treatment, and inspection measures. Also helps resolve organization codes to Commands. |
| `tblMaint2` | Aircraft readiness measures, including MC/FMC/PMC and equipment-in-service hours. Supports weighted readiness rates and in-reporting aircraft counts. |
| `tblMaint3` | Monthly NMCS/PMCS hours by organization and WUC, with WUC descriptions. Supports Top Five rankings, command contributions, and trends. |
| `tblMaint5` | Inspection and maintenance labor measures, available for separate source comparison. Overlapping measures are not added to `tblMaint1` totals. |
| `tblSCIR` | SCIR-impacted M-status hours and the NMC scheduled, NMC unscheduled, and PMC unscheduled man-hour measures. |
| `tblJobStatusAcft` | Aircraft job-status hours by month, Command, Wing, and M code. Used by the All Aircraft source selection. |
| `tblJobStatusAll` | All-MAF job-status hours by month, Command, Wing, and M code. Supplies the broad Wing/Command population and the All MAFs source selection. |
| `tblCannWUC` | Cannibalization man-hours by month, Command, Wing, aircraft type code, and WUC. Supports the Top Five Cannibalization WUC ranking. |

Some demo Commands intentionally have no SCIR or aircraft coverage so the no-data messages and independent filter scopes can be demonstrated.

## How the pages work

1. A visitor opens `index.html` or `engine.html` over HTTP(S).
2. The page initializes its embedded sql.js library and WebAssembly binary.
3. It automatically downloads `database.synthetic.db` from the same site using a relative URL.
4. SQLite opens the downloaded data in browser memory. Dashboard queries and chart calculations execute on the visitor’s device.
5. Dashboard filters update the displayed views. The workbench can edit its own in-memory copy and export a separate database download.

There is no server-side application or database service, and no sign-in is required. Both HTML files retain their embedded SQLite library, WASM binary, and associated license notices. The dashboard loads Inter from Google Fonts.

## Why JavaScript and WASM are embedded

The original SharePoint deployment had limitations loading separate JavaScript and WebAssembly assets during page startup. Loading an external sql.js script or fetching a separate `.wasm` binary could prevent the SQLite runtime from initializing.

To accommodate that deployment, **both `index.html` and `engine.html` embed the sql.js JavaScript library and the WASM binary directly in the HTML**. The binary is stored as Base64, decoded in the browser, and passed to sql.js through its `wasmBinary` initialization option. The SQLite runtime can therefore initialize without downloading separate JavaScript or WASM files.

Preserve these embedded sections when editing or optimizing either HTML file. They are required application components and account for much of each file’s size. The public GitHub Pages version retains the same packaging for portability.

The database remains a separate download: `database.synthetic.db` loads automatically from the same public site. The dashboard’s Google Fonts stylesheet is also separate; its font stack provides a fallback if the font cannot load. The embedded-runtime design removes the SQLite runtime’s separate-asset loading dependency; it does not make the entire application offline.

## Hosting and updates

- [Live dashboard](https://demodashboard.pothier.dev/)
- [Live SQLite Workbench](https://demoworkbench.pothier.dev/)
- [Public repository](https://github.com/denpth/Aircraft-Maintenance-Material-Management-Dashboard)

GitHub Pages publishes the root of the `main` branch. Pushing changes to that branch triggers the Pages deployment. Keep the two HTML pages and `database.synthetic.db` together so the automatic database URLs continue to work.

For local use, run `python3 -m http.server 8000` from the repository directory and open `http://localhost:8000/`.

## Intended use

This repository is a public demonstration of the dashboard and its SQLite workflow. Its generated records must not be used for operational reporting. The workbench’s ability to import a local file does not upload that file to GitHub or change the public database.
