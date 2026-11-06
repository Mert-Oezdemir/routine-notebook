# Routine Notebook

A small browser journal for recording how your skin feels, which products you used, and what changed from day to day. It makes no medical assessments and does not request photos.

Open `index.html` in a modern browser. To use a stable local origin for browser storage, run `python -m http.server 8000 --bind 127.0.0.1` from this directory and visit `http://127.0.0.1:8000`.

- Add or update one entry per date.
- Reopen past entries to edit or delete them.
- Download your entries as JSON.

Entries are stored in the current browser profile. Clearing site data can remove them. The app does not send entries anywhere.

This independent implementation takes its broad skincare theme from [skinsight](https://github.com/YildizDikme/skinsight). The source code, assets, and third-party analysis service from that project are absent from this notebook.
