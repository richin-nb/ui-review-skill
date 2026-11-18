# Writing the findings

The reader is the person who owns the app, deciding quickly. Write so each
finding can be decided from the card alone.

- **Title**: the problem as the user meets it, in plain words: "Invoice
  buttons are cut off on a phone", not "Header overflow at 390px".
- **What's wrong**: what is on the screen, quoting the exact text you see
  ("the buttons read “Invoic”, “PD” and “Send invc”"). Say where.
- **Why it matters**: what a person fails to do, misreads, or wastes time on.
  One or two sentences. No design jargon ("affordance", "visual hierarchy").
- **Planned fix**: concrete enough to build without asking again: what moves
  where, the new wording in quotes, what happens on a phone. Reuse a pattern
  the app already has where one fits, and name it ("the same chips as
  Invoices").
- **Alternative**: a real second choice with a different trade-off. Skip it
  rather than inventing a weak one.

## Severity
- **Fix first**: broken, or stops someone finishing a task.
- **Fix soon**: confusing, slow, or easy to get wrong.
- **Polish**: small on its own, but adds up.
Be sparing with "Fix first". When nothing is broken, say so and leave it empty.

## Screenshots
- Circle only the problem. One to four marks per shot. If the whole card is
  the problem, circle the card (`"card": true`).
- Phone findings get phone shots. A finding that affects both sizes can show
  one of each (`"shots": ["x-desk", "x-phone"]`).
- Open every image after shooting and check the circle is on the right thing.
  A circle in the wrong place is worse than none.

## Mock-ups
- Draw only the part of the screen that changes, plus enough around it to
  place it. Mark each change with `class="chg" data-tag="Short label"` on a
  block element.
- Use the app's real names, wording and data where you can. Say in the page
  footer that figures in mock-ups may be made up.
- Keep phone mock-ups under about 1100 px tall and desktop ones under 900; the
  renderer warns when one is cut.
- Look at every rendered mock-up before publishing. Check the labels don't
  wrap or overlap.
