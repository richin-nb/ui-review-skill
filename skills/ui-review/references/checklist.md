# What to look for

Go through each screenshot at both sizes, and look at each field and control,
not just the layout. Most findings fall into one of these groups. When the
same problem shows up on several screens, write it up once under "Across the
app", list where it appears, and fix it everywhere.

## Broken (usually "Fix first")
- Text cut off: button labels ("Send invc"), tab names, headings, figures in
  tiles ("136 mon…"), table cells shortened with "…" so they can't be read.
- The page scrolls sideways on a phone (`overflowX` in `raw/survey.json`), or
  a table runs off the screen and hides its most important columns.
- The main action on a page is hidden, cut off or pushed off the first screen.
- Two sets of save or confirm buttons for the same thing, where a wrong guess
  loses typing.
- Something that can't be reached with the keyboard: a link inside a button,
  a clickable div, a control that disappears on focus.
- Errors in the browser console, or a screen that fails to load.

## Confusing (usually "Fix soon")
- A greyed-out button that doesn't say why.
- A switch or badge that contradicts the text next to it ("on", "not set up").
- A filter or select that just says "All", with no label saying what it filters.
- Codes the user must know (country "DE", time zone "Europe/Madrid", raw IDs)
  where a searchable list of names would work.
- Locked or read-only data shown as greyed-out inputs instead of plain text.
- Colour that means nothing, or red used for things that aren't wrong.
- A number with no unit or label ("53" on a card), raw decimals ("264.46"),
  two number styles in one column, percentages written two ways.
- Very long lists with no paging, grouping or search.
- Opening a record lands straight in an edit form, when people come to look.
- Banners or summaries that fill the first phone screen before the content.
- An empty state that doesn't say what to do next.
- Wording that reads like field names or code ("Useful life (years): 4").

## Polish
- The same idea worded differently on different pages ("Show every supplier",
  "All clients").
- Side cards that hold one sentence or one unhelpful number.
- A badge or chip on a line of its own, a header that wraps mid-word.
- Something clickable that doesn't look clickable, or the reverse.
- Chips or legend entries for things with a count of 0.
- The phone and laptop versions disagreeing (counts on one, not the other).

## Every field
For each form field check: the label says what it is; the hint says why or
gives an example; the input type fits (date picker, number, searchable list);
the empty and error states say what to do; the field keeps its width on a
phone; the value is shown in the app's own number and date style.

## Things to leave alone
- Data that only looks odd because the demo data is odd. Mention it in the
  page footer, not as a finding.
- Matters of taste with no user cost. If you can't write "Why it matters" in
  terms of what a person fails to do or misreads, drop the finding.
