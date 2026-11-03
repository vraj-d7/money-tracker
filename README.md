# Money Tracker

Inhandy, a money app for salaried people, built with [Astro](https://docs.astro.build).

## Getting started

```
npm install
npm run dev
```

## Designs

Screens are built from the Inhandy design canvas. A local `designs/` folder holds
its source (`*.dc.html`, plus `canvas.json` listing the pages and screen sizes) for
reference while building; it is not part of the build and is kept out of the repo.

## Data

There is no backend yet. Sample numbers live in `src/data/`, and anything the user
changes (profile, plan, goals, checklists) is saved in the browser's localStorage
under `inhandy:*` keys.
