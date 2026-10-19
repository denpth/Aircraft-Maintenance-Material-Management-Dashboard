# Aircraft Maintenance Material Management Dashboard

Interactive aircraft maintenance dashboard with a self-contained SQLite/WASM engine.

- [Live dashboard](https://denpth.github.io/Aircraft-Maintenance-Material-Management-Dashboard/)
- [SQLite Workbench](https://denpth.github.io/Aircraft-Maintenance-Material-Management-Dashboard/engine.html)
- [Synthetic demo database](database.synthetic.db)
- [Repository file and purpose guide](FILE_GUIDE.md)

## Projected trends

Monthly charts extend four months ahead using a rolling three-month robust linear trend. Each projected month enters the next window. Dashed lines show the projected trend; shaded illustrative ranges use variance from the same three inputs and widen across future months. These are directional aids for considering changes, not validated predictions or confidence intervals.

Run `node scripts/verify-projections.cjs` to check the rolling windows, formulas, illustrative ranges, and connected chart paths.

## Demo data

All database records are synthetic. Identifiers, organizations, aircraft, WUC descriptions, dates, metadata, and numeric measures were generated independently. No operational records or original-to-demo mappings were copied. The dataset covers January–December 2024 with 12 Wings, 108 Commands, and 384 aircraft. Some Commands intentionally lack aircraft or SCIR data to demonstrate coverage messages.

The dashboard and workbench load `database.synthetic.db` from this repository. No private services, sign-in, or server-side database are required. Workbench edits remain in browser memory; Save downloads a local copy and does not update the hosted database.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/. WebAssembly and database fetching require a modern browser and an HTTP(S) page.

## Hosting

GitHub Pages publishes the repository root from the `main` branch. `.nojekyll` serves the HTML and database as static files. Both HTML files embed the sql.js library and WASM binary; no separate WASM deployment is required. This packaging addresses the original SharePoint deployment’s limitations loading separate JavaScript/WASM assets during startup. Preserve both embedded components when editing the pages. See the [embedding rationale](FILE_GUIDE.md#why-javascript-and-wasm-are-embedded). Inter is loaded from Google Fonts.

The embedded sql.js code retains its license notices. This is demonstration data and must not be used for operational reporting.
