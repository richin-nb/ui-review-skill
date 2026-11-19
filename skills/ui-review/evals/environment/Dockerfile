# Test container for the ui-review skill: Node, Chromium and Python.
# Matches the Playwright version the skill pins.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

# python-is-python3 and pip: the evaluator installs its grading tools
# with `python -m pip`. Ubuntu blocks system-wide pip by default.
ENV PIP_BREAK_SYSTEM_PACKAGES=1
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pil python3-pip python-is-python3 \
 && rm -rf /var/lib/apt/lists/*

# The skill's scripts look for Playwright in the working folder, then globally.
RUN npm install -g playwright-core@1.65.1

# Agents sometimes check pages with Python Playwright. Its Chromium build
# can differ from the Node package's, so it fetches its own.
# SKIP_BROWSER_GC keeps the Node package's browsers from being deleted.
RUN python -m pip install --no-cache-dir playwright==1.65.1 \
 && PLAYWRIGHT_SKIP_BROWSER_GC=1 python -m playwright install chromium-headless-shell

WORKDIR /workspace
