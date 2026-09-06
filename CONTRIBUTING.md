# Contributing

The dataset's value is its provenance. One rule governs everything: **no value
without a source, and no guess in place of a gap.**

## Adding a jurisdiction

1. Add an entry to `state-hours.ts`. Copy the shape of an existing one.
2. For each field, cite the document you read:
   - the Act, its rules, an amendment Act, or a gazette notification → leave
     `secondary` unset;
   - a compliance vendor or law-firm summary, where no primary document is
     online → set `secondary: true`.
3. If two sources disagree, record both in `conflict` and explain the
   disagreement. Do not pick a winner silently.
4. If you cannot verify a field, leave it `null`. A `null` renders as an
   explicit "not verified" row, which is a usable answer. An invented statutory
   number is a liability.
5. Put amendment history, Labour Code transition notes and data-availability
   caveats in `notes`.

## Before opening a PR

```bash
npm run check
```

This regenerates `data/` and runs the validators. CI fails if `data/` was not
regenerated, so run it — a hand-edited CSV that disagrees with the JSON is the
one failure mode that would make the dataset untrustworthy.

## Corrections

Open an issue with the document that contradicts the published value. A citation
beats an assertion; if the source is a PDF that is hard to find, link it and say
where it came from.
