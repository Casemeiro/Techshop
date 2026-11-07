NEXTECH Repair Guide
====================

Overview
--------
NEXTECH is a simple tech repair guide website. Visitors can browse device guides, search and filter the catalog, view repair tips and video tutorials, and get basic troubleshooting suggestions.

Project Files
-------------
- `index.html` contains the page structure, catalog, forms, and navigation.
- `styles.css` controls the page layout, colors, and responsive design.
- `script.js` provides search and filters, troubleshooting suggestions, device details, and video links.

How It Works
------------
The browser loads `index.html`, which uses `styles.css` for its appearance and `script.js` for its behavior. Selecting a device opens its repair details and related tutorial links. The resource form saves added video links in the browser's local storage, so this demo does not use a server-side database.

The troubleshooting form displays suggested checks based on the selected device and symptom. YouTube search results can also be requested through the YouTube Data API when an API key is configured.

Run the Website
---------------
Open `index.html` in a web browser. An internet connection is needed for external resources such as YouTube links and the optional YouTube API.