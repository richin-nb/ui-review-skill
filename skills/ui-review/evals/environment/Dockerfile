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

WORKDIR /workspace
