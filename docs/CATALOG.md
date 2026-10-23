# Catalog and cost estimates

Every concept Reno renders can carry a price. This is what turns "nice picture"
into something a client can act on, and it's the hook that makes vendor and
contractor partnerships worth something.

## How it works

1. A catalog holds **vendors** (furniture stores, design studios, renovation
   contractors, marketplaces) and **items** with a low/high price, a category,
   and style/room tags.
2. `estimateForConcept()` in `@reno/core` picks one item per applicable
   category for the concept's room, style and mode, multiplies by a sensible
   quantity, and returns an itemized range.
3. The UI shows that range under the render in Studio, on each concept in the
   Demo View, and in the printed client proposal.

Estimation is **deterministic** — the same concept and catalog always produce
the same numbers, so a proposal you print today matches the one you emailed
last week.

### What drives the numbers

| Input | Effect |
| --- | --- |
| `mode` | `restyle` excludes surfaces, fixtures and labor; `renovate` includes them. Matches the prompt contract. |
| `room` | Sets quantities per category (a restaurant needs more seating than a bedroom) and the area used for per-sq-ft items. |
| `style` | Filters items by `styleTags`; untagged items match any style. |
| `tier` | `essential` picks the cheapest candidate per category, `standard` the median, `premium` the dearest. |
| `vendorIds` | Restricts pricing to one company's own product line. |

Area-priced items (`unit: "per sq ft"`) multiply by `ROOM_AREA_SQFT[room]`, not
by a category count — otherwise a kitchen floor would price out at $30.

## Loading your own price list

The bundled catalog is **sample data with plausible US mid-market prices. It is
not a quote and no vendor in it is a real partner.** Replace it before showing
numbers to a paying client.

Drop a `catalog.json` into `$RENO_DATA_DIR`:

```json
{
  "vendors": [
    {
      "id": "acme-furniture",
      "name": "Acme Furniture",
      "kind": "furniture_store",
      "region": "Austin",
      "url": "https://example.com"
    }
  ],
  "items": [
    {
      "id": "acme-sofa-01",
      "vendorId": "acme-furniture",
      "name": "Halston 3-seat sofa",
      "category": "furniture",
      "priceLow": 1800,
      "priceHigh": 2400,
      "currency": "USD",
      "styleTags": ["mid-century", "modern-minimal"],
      "roomTags": ["living room"],
      "unit": "each",
      "url": "https://example.com/halston"
    }
  ]
}
```

Rules: `category` is one of `furniture`, `lighting`, `textiles`, `decor`,
`surfaces`, `fixtures`, `labor`. Empty `styleTags` / `roomTags` mean "matches
anything". Set `"renovateOnly": true` for anything involving construction.
Malformed entries are skipped, and if the file has no usable vendors or items
Reno falls back to the sample catalog.

`GET /api/catalog` reports `source: "sample" | "custom"` so you can confirm your
list loaded. The UI says so too, in the estimate caveat.

## API

```bash
# browse, with filters
curl "localhost:3000/api/catalog?style=japandi&room=living%20room&furnishingsOnly=true"

# price a concept
curl -X POST localhost:3000/api/estimate \
  -H 'content-type: application/json' \
  -d '{"room":"kitchen","style":"japandi","mode":"renovate","tier":"standard"}'
```

`npm run smoke:marketplace` exercises both plus the company portal.

## Honesty rules (do not remove)

- Every estimate ships with `notes` saying it is indicative and not a quote.
  The UI always renders them. Don't display a total without them.
- The sample catalog is labeled as sample in the API response and the UI.
- Estimates are not a substitute for a site visit, measurements or a real bid.

## Where this goes next

- Per-item selection ("swap this sofa for that one") with live totals.
- Real vendor feeds: CSV import, then affiliate/partner APIs.
- Regional pricing multipliers, tax and delivery.
- Attaching a specific estimate to a saved render so proposals lock their
  pricing at the moment they were sent.
