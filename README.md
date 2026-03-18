# Fashion Nova Wishlist Migrator

This script:

1. Logs into the source account
2. Scrapes every product link from the wishlist
3. Saves links to JSON and CSV
4. Logs into the target account
5. Opens each product link
6. Adds the product to the target wishlist if available
7. Skips out of stock or coming soon items
8. Saves logs, screenshots, and a final report

## Install

```bash
npm install
npx playwright install
```

## Setup

Copy `.env.example` to `.env` and fill in values.

```bash
cp .env.example .env
```

## Run

```bash
npm run migrate
```

## Output

- `data/wishlist-links.json`
- `data/wishlist-links.csv`
- `data/wishlist-import-report.json`
- `logs/run-*.log`
- `screenshots/*.png`

## Notes

- Session state is saved to:
  - `storage/source.json`
  - `storage/target.json`
- Re-runs are safe because duplicate links are removed before import.
- Failures create screenshots automatically.
