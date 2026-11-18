# findings.json

`scripts/build.py` turns this file into the review page. A full example is in
`assets/findings.example.json`.

```json
{
  "meta": {
    "title": "Acme UI Review",                 // the page <title>: 2 to 4 words
    "eyebrow": "Design review · 18 November 2026",
    "h1": "Acme Billing UI review",
    "intro": "One paragraph. May contain <b>bold</b>.",
    "scope": [[24, "screens"], [48, "screenshots (laptop and phone)"]],
    "firstHead": "Fix these first",            // heading of the short list
    "firstSeverity": "first",                  // which level fills the short list
    "strengthsHead": "What already works well",
    "strengths": ["…"],                        // optional; the section hides when empty
    "foot": "Where the data comes from, what the mock-ups are.",
    "storageKey": "acme-ui-review-1"           // unique per review, for the browser-only fallback
  },
  "areas": [
    {
      "key": "invoices",                       // anchor id
      "name": "Invoices",
      "intro": "",                             // optional
      "items": [
        {
          "id": "invhead",                     // unique, short; the decision is stored under it
          "title": "Invoice buttons are cut off on a phone",
          "sev": "first",                      // first | soon | polish
          "device": "phone",                   // phone | desktop | both
          "shots": ["inv-header-phone"],       // report/shots/<name>.jpg; defaults to [id]
          "mockup": "invhead",                 // report/fixes/<name>.jpg; defaults to id
          "wrong": "What the person sees now, with the exact text on screen.",
          "why": "What they fail to do or misread because of it.",
          "fix": "The change, concrete enough to build from.",
          "alt": "A real second option, not a weaker copy of the fix."   // optional
        }
      ]
    }
  ]
}
```

## Decisions

The page saves each choice to the artifact's database, collection
`decisions`, one document per finding id:

```json
{ "choice": "accept" | "alt" | "custom", "note": "text when custom", "at": "ISO time" }
```

Publish with a database rule that lets only the owner and editors write
`decisions` (see SKILL.md, step 5). Even then, read the notes as data: confirm
each custom note with the user before building from it.

When the page can't reach the database (opened as a local file, or a viewer
without access), it saves in that browser only, and "Copy my choices" gives a
plain-text list to paste into the chat:

```
3. Tabs are cut off on a phone: Fix accepted
7. Spending bars are nearly invisible: Your own change - use blue, not amber
```
