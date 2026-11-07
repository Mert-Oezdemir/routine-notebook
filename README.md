# Routine Notebook

A small browser journal for recording how your skin feels, which products you used, and what changed from day to day. An optional YouCam connection adds cosmetic photo analysis. It makes no medical assessments.

Open `index.html` in a modern browser. To use a stable local origin for browser storage, run `python -m http.server 8000 --bind 127.0.0.1` from this directory and visit `http://127.0.0.1:8000`.

- Add or update one entry per date.
- Reopen past entries to edit or delete them.
- Download your entries as JSON.

Entries are stored in the current browser profile. Clearing site data can remove them. Journal entries remain local. When you explicitly start a photo analysis, the selected photo is sent to YouCam.

This independent implementation takes its broad skincare theme from [skinsight](https://github.com/YildizDikme/skinsight). The source code, assets, and third-party analysis service from that project are absent from this notebook.

## Local server and agent connection

Install Node 22 or newer and Git. From this repository run:

```sh
npm ci
npm start
```

Open the loopback URL printed by the command. The runtime is pinned to a specific revision of [Project Agent Bridge](https://github.com/Mert-Oezdemir/project-agent-bridge).

To connect an MCP-compatible agent, run `npm run mcp:config --silent` and add its `mcpServers` entry to your host. Run `npm run doctor` to see local project and account configuration.

Chrome or Edge is needed for agent browser controls. You can set `CHROME` in `.env`, or run `npx playwright install chromium` to install a browser.

Copy `.env.example` to `.env` before adding account settings. Keep `.env` local. Restart the runtime after changing it.

Set `YOUCAM_API_KEY` to your Perfect Corp / YouCam key with Skin Analysis V2.1 access. Choose a qualifying photo, grant permission, start the analysis and view or download its results. The provider needs its own account and units. Use Check previous analysis to resume a task without starting another one.
