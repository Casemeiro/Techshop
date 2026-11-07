NEXTECH Repair Guide
====================

Overview
--------
NEXTECH is a simple tech repair guide website. Visitors can browse device guides, search and filter the catalog, view repair tips and video tutorials, and get basic troubleshooting suggestions.

Project Files
-------------
- `index.html` contains the page structure, catalog, forms, and navigation.
- `styles.css` controls the page layout, colors, and responsive design.
- `script.js` provides search and filters, troubleshooting suggestions, device details, and personal saved guides.
- `firebase.js` initializes Firebase Analytics, Authentication, and Cloud Firestore.
- `firestore.rules` allows public catalog reads and restricts saved-guide access to each signed-in user.

How It Works
------------
The browser loads `index.html` over HTTP (for example, with the VS Code Live Server extension), which uses `styles.css` for its appearance and the JavaScript modules for its behavior. Selecting a device opens its repair details and related tutorial links. Users can create an account, sign in, and save guides to their private Firestore account. The Firebase web configuration is included in `firebase.js`; web API keys are public identifiers, so protect data with Firebase Authentication and Firestore Security Rules rather than relying on key secrecy.

The troubleshooting form displays suggested checks based on the selected device and symptom. YouTube search results can also be requested through the YouTube Data API when an API key is configured.

