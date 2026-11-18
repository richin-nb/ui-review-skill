# ui-review: an agent skill for UI reviews

Your AI coding agent goes through every screen of your running web app on a
laptop and a phone. It then builds a review page. Each finding on the page
has:

- a screenshot of the screen now, with the problem circled in red;
- a mock-up of the fix, with the change outlined in green;
- what's wrong, why it matters, the planned fix and an alternative;
- **Accept fix**, **Use alternative** and **Something else** buttons.

You pick a choice for each finding. The agent reads your choices back,
builds what you accepted, then reviews every screen again.

## Tested on

So far this skill has only been tested with **Claude Code**. It uses the
standard Agent Skills format (`SKILL.md`), and its scripts are plain Node
and Python, so it should work with other agents that read Agent Skills
(Codex, Cursor and others). Reports from other agents are welcome.

Parts marked **[Claude only]** below need Claude. Everything else works
with any agent.

## Install

### Claude Code

```
/plugin marketplace add richin-nb/ui-review-skill
/plugin install ui-review@neurabyte-ui-review
```

Restart Claude Code, then ask: "Review the UI of this app", or run `/ui-review`.

To try a local copy without GitHub:

```
/plugin marketplace add /path/to/ui-review-skill
/plugin install ui-review@neurabyte-ui-review
```

### Other agents (untested)

Copy the `skills/ui-review/` folder into your agent's skills folder, then
ask it to review the UI of your app.

## Needs

- The app running locally, with realistic demo data, and a way to sign in:
  a session cookie, a Playwright storage state, or localStorage keys.
- Node 18+ with Playwright in the review folder. Use `npm i -D
  playwright-core` if Chrome is installed; otherwise `npm i -D playwright &&
  npx playwright install chromium`.
- Python 3 (standard library only).

## What works where

| Part | Works with |
| --- | --- |
| Surveying every screen, circling problems, drawing mock-ups | Any agent |
| Building the review page (`report/index.html`) | Any agent |
| Choices saved in your browser, sent back with "Copy my choices" | Any agent |
| Hosted review page, with choices saved to the page itself | **[Claude only]** needs claude.ai Artifacts |
| Agent reads your choices straight from the page | **[Claude only]** needs claude.ai Artifacts |
| `/plugin` install and updates | **[Claude only]** Claude Code plugin system |

Without Artifacts, open `report/index.html` in a browser, make your
choices, press "Copy my choices" and paste the text back to the agent.

## What's inside

```
skills/ui-review/
  SKILL.md                 the workflow the agent follows
  scripts/survey.mjs       full-page shots of every screen + overflow/clipping report
  scripts/shoot.mjs        one shot per finding, problem circled
  scripts/mockup.mjs       renders HTML mock-ups inside a drawing of the app shell
  scripts/build.py         findings.json -> the review page
  assets/                  page template, mock-up kit, example configs
  references/              what to look for, how to write findings, file formats
```

## Update

Bump `version` in `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json`, then push. Claude Code users get the
update by running `/plugin marketplace update neurabyte-ui-review`. Users of
other agents copy the folder again.

## License

MIT. See [LICENSE](LICENSE).
