# India Shops & Establishments — working-hours rules

Machine-readable working-hours rules under India's state Shops and Establishments
Acts: daily and weekly caps, spread-over, rest intervals, overtime rate and cap,
weekly off, IT/ITES exemptions, and rules on women working night shifts.

**Every value carries the source it was verified against. Fields we could not
verify are `null`, not guessed.**

That second rule is the reason this exists. Working-hours content for India is
routinely wrong, because a state's figures get copied from a neighbouring state
and the amendment that changed them is missed. Rajasthan pays overtime at 1.5×
while most states pay 2×; Goa caps the day at 8 hours where most cap at 9. A
dataset that quietly fills those gaps is worse than one that admits them.

**Coverage: 8 of 36 states and union territories.** See
[Contributing](#contributing) — the missing 28 are the point, not an oversight.

Maintained by [Workclave](https://workclave.com), attendance and timesheet
software for teams in India. These are the rules it applies in production; see
[Who maintains this, and why](#who-maintains-this-and-why).

## Data

| File | Shape |
|---|---|
| [`data/state-hours.json`](data/state-hours.json) | Full dataset, nested, with coverage metadata |
| [`data/state-hours.csv`](data/state-hours.csv) | One row per jurisdiction × field |
| [`data/sources.csv`](data/sources.csv) | Every field mapped to the document it came from |
| [`state-hours.ts`](state-hours.ts) | Typed source of truth — edit this, not `data/` |

Everything under `data/` is generated. Run `npm run build` after editing
`state-hours.ts`, and `npm test` to check the provenance rules still hold.

```bash
npm run check   # build, then validate
```

### Shape

```jsonc
{
  "slug": "rajasthan",
  "name": "Rajasthan",
  "kind": "state",              // "state" | "ut"
  "region": "North",
  "hubs": ["Jaipur", "Udaipur", "Jodhpur"],

  "dailyHours": {
    "value": "10 hours (s.7(1), raised from 9 by the 2026 amendment) …",
    "source": "https://prsindia.org/…/Bill5of2026RJ.pdf",
    "secondary": false,         // true = law-firm or vendor summary, not the Act
    "conflict": "…"             // present only when sources disagreed
  },

  "itExemption": null,          // null = not verified, never "none"
  "notes": ["…"]                // amendments, transition caveats
}
```

### Fields

`actName`, `dailyHours`, `weeklyHours`, `spreadOver`, `restInterval`,
`overtimeRate`, `overtimeCap`, `weeklyOff`, `womenNightShift`, `itExemption`.

### Reading it

```js
import { readFileSync } from 'node:fs';
const { jurisdictions } = JSON.parse(readFileSync('data/state-hours.json', 'utf8'));

const rj = jurisdictions.find((j) => j.slug === 'rajasthan');
console.log(rj.overtimeRate.value, '\nsource:', rj.overtimeRate.source);
```

```python
import pandas as pd
df = pd.read_csv("data/state-hours.csv")
df[df.field == "overtimeRate"][["jurisdiction", "value", "source"]]
```

## What the data shows: one shift, four answers

The rules do not vary by a little. Take a single employee working a **9½-hour
day** and move them between four of the states in this dataset — same shift,
same wage, four different payroll outcomes:

| State | Daily cap | Overtime on a 9½h day | Rate |
|---|---|---|---|
| [Goa](https://workclave.com/compliance/working-hours/goa) | 8h | **1½ hours** | 2× |
| [Himachal Pradesh](https://workclave.com/compliance/working-hours/himachal-pradesh) | 9h | **½ hour** | 2× |
| [Rajasthan](https://workclave.com/compliance/working-hours/rajasthan) | 10h | **½ hour** | **1.5×** |
| [Uttarakhand](https://workclave.com/compliance/working-hours/uttarakhand) | 10h | **none** | 2× |

Rajasthan is the trap. The 2026 amendment raised the daily cap from 9 to 10
hours but left s.8 untouched, so the overtime premium still triggers past **9**
hours while the day may legally run to 10 — and it pays 1.5×, where nearly every
other state pays 2×. Uttarakhand raised its cap the same year and *did* move the
overtime trigger with it, so the identical shift attracts nothing.

Two states, same year, same reform, opposite payroll consequences. This is why
copying a neighbouring state's figures produces wrong numbers, and why a
single national "overtime after 9 hours" rule in a payroll system is incorrect
in most of India.

## What "verified" means here

- **Primary source** — the Act, its rules, an amendment Act, or a gazette
  notification. `secondary: false`.
- **Secondary source** — a compliance vendor or law-firm summary, used only when
  no primary document could be located online. Flagged `secondary: true` so you
  can weight it, or replace it with a primary citation.
- **Conflict** — sources disagreed. Both readings are recorded rather than one
  being picked silently.

Current state: 79 of 80 possible fields populated across 8 jurisdictions, from
22 distinct sources, of which 14 fields rest on secondary sources and 2 carry a
recorded conflict. Those three numbers are regenerated by `npm run build`, so
they cannot drift from the data.

## Not legal advice

This is a research dataset, published so its sources can be checked. Statutory
positions change with amendments, notifications and exemptions that are often
not published centrally, and several states are mid-transition to the Labour
Codes. Verify against the cited document — and take advice — before relying on
any figure operationally.

## Contributing

The most useful contribution is **one jurisdiction, fully sourced**, rather than
a sweep of partial rows.

1. Add an entry to `state-hours.ts`.
2. Cite a primary document per field where one exists. If only a secondary
   source is available, mark `secondary: true` — that is accepted, and honest.
3. Leave a field `null` rather than inferring it from a neighbouring state.
4. Run `npm run check`. The validators fail on a value without a source, a
   non-null unverified field, or a conflict flagged without an explanation.

Missing: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Delhi, Gujarat,
Haryana, Jharkhand, Karnataka, Kerala, Maharashtra, Manipur, Meghalaya, Mizoram,
Nagaland, Odisha, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, West
Bengal, and the remaining union territories.

Corrections to published rows are equally welcome — open an issue with the
document that contradicts what is here.

## Licence

Data: [CC BY 4.0](LICENSE) — use it commercially, attribute the source.
Scripts: MIT.

## Who maintains this, and why

Maintained by the team behind [**Workclave**](https://workclave.com) — attendance
and timesheet software for teams in India — built by
[Mecverse](https://mecverse.com).

The incentive is worth stating plainly rather than leaving you to infer it.
Workclave has to compute attendance, overtime and loss-of-pay correctly in every
state its customers operate in, which means we had to do this research anyway.
Publishing it costs us nothing we had not already spent, and being corrected in
public makes our own product more accurate. That is the whole trade: you get a
sourced dataset, we get scrutiny we could not buy.

The rules in this repository are the same ones Workclave applies when it decides
whether a 9½-hour day in Goa attracted overtime and a 9½-hour day in Uttarakhand
did not. If you would rather not implement per-state working-hours logic
yourself — the divergence above is a fair preview of what that involves —
[Workclave handles it](https://workclave.com/compliance/working-hours).

**Human-readable version:** every jurisdiction here also has a page at
[workclave.com/compliance/working-hours](https://workclave.com/compliance/working-hours),
with the same values and the same sources.

**Related:** [FlowTux](https://flowtux.com) — AI-powered internal support, also
by Mecverse.
