# ui-review: a Claude Code skill

Claude goes through every screen of your running web app on a laptop and a
phone. It then publishes a review page. Each finding on the page has:

- a screenshot of the screen now, with the problem circled in red;
- a mock-up of the fix, with the change outlined in green;
- what's wrong, why it matters, the planned fix and an alternative;
- **Accept fix**, **Use alternative** and **Something else** buttons.

Your choices save to the page. Claude reads them back, builds what you
accepted, then reviews every screen again.

## Install

In Claude Code:

```
/plugin marketplace add <github-user>/claude-ui-review
/plugin install ui-review@neurabyte-ui-review
```

Restart Claude Code, then ask: "Review the UI of this app", or run `/ui-review`.

To try a local copy without GitHub:

```
/plugin marketplace add /path/to/claude-ui-review
/plugin install ui-review@neurabyte-ui-review
```

## Needs

- The app running locally, with realistic demo data, and a way to sign in:
  a session cookie, a Playwright storage state, or localStorage keys.
- Node 18+ with Playwright in the review folder. Use `npm i -D
  playwright-core` if Chrome is installed; otherwise `npm i -D playwright &&
  npx playwright install chromium`.
- Python 3 (standard library only).
- Optional: claude.ai Artifacts, so the review page is hosted and your
  choices save to it. Without Artifacts you get an HTML file, and you send
  your choices back with its "Copy my choices" button.

## What's inside

```
skills/ui-review/
  SKILL.md                 the workflow Claude follows
  scripts/survey.mjs       full-page shots of every screen + overflow/clipping report
  scripts/shoot.mjs        one shot per finding, problem circled
  scripts/mockup.mjs       renders HTML mock-ups inside a drawing of the app shell
  scripts/build.py         findings.json -> the review page
  assets/                  page template, mock-up kit, example configs
  references/              what to look for, how to write findings, file formats
```

## Update

Bump `version` in `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json`, then push. Users get the update by
running `/plugin marketplace update neurabyte-ui-review`.
