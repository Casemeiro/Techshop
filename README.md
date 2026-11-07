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

Firebase Setup
--------------
1. In the Firebase console for `techshop-13eeb`, enable Cloud Firestore and the Email/Password sign-in provider in Authentication.
2. Deploy `firestore.rules` to the project. The rules allow public catalog reads and each signed-in user can only read or change their own saved guide list.
3. Add the local and deployed site hostnames to Firebase Authentication's authorized domains.
4. Serve the site over HTTP and open it. Do not use `file://`; browsers block ES module imports from local files.

Run the Website
---------------
An internet connection is needed for Firebase, Analytics, and external resources such as YouTube links and the optional YouTube API.