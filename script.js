import {
    auth,
    collection,
    createUserWithEmailAndPassword,
    db,
    deleteDoc,
    doc,
    getDocs,
    onAuthStateChanged,
    setDoc,
    signInWithEmailAndPassword,
    signOut
} from './firebase.js';

const getApiKey = () => (typeof CONFIG !== 'undefined' && CONFIG.YOUTUBE_API_KEY) ? CONFIG.YOUTUBE_API_KEY : '';

function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function decodeHtmlEntities(value) {
    const parser = new DOMParser();
    const docNode = parser.parseFromString(String(value), 'text/html');
    return docNode.documentElement.textContent || String(value);
}

function getSafeUrl(value, allowedHosts = null) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
        if (allowedHosts && !allowedHosts.includes(url.hostname.toLowerCase())) return null;
        return url.href;
    } catch {
        return null;
    }
}

function getYouTubeUrl(value) {
    return getSafeUrl(value, ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
}

function mergeYouTubeLinks(targetList, incomingLinks) {
    const existing = new Set(targetList.map(([title, url]) => `${title}\0${url}`));
    incomingLinks.forEach(([title, url]) => {
        const key = `${title}\0${url}`;
        if (!existing.has(key)) {
            existing.add(key);
            targetList.push([title, url]);
        }
    });
}

const fetchedYouTubeKeys = new Set();

async function fetchYouTubeVideos(deviceKey, deviceName) {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === 'AIzaSyYourActualAPIKeyHere') {
        return [];
    }
    if (fetchedYouTubeKeys.has(deviceKey)) {
        return [];
    }

    const query = encodeURIComponent(`${deviceName} repair teardown guide`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${query}&type=video&key=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`YouTube API request failed (${response.status})`);
        const data = await response.json();
        fetchedYouTubeKeys.add(deviceKey);
        return (data.items || [])
            .filter(item => item?.id?.videoId && item?.snippet?.title)
            .map(item => [
                decodeHtmlEntities(item.snippet.title),
                `https://www.youtube.com/watch?v=${item.id.videoId}`
            ]);
    } catch (error) {
        console.error('Error fetching YouTube API data:', error);
        return [];
    }
}

const defaultDetails = {
    ps5: {
        name: "PlayStation 5",
        category: "Gaming Console — Repair & Teardown Manual",
        difficulty: "Moderate",
        badgeClass: "badge-moderate",
        description: "Comprehensive troubleshooting, teardown, and maintenance manual for PlayStation 5 hardware.",
        checks: [
            "Examine Torx T8 security screw requirements and slide off the modular faceplates carefully.",
            "Inspect the HDMI 2.1 port pins for bending or lifted pads before assuming a board fault.",
            "Clean dust catchers and fan blades regularly to prevent loud fan noise or overheating shutdowns."
        ],
        shops: [
            ["PlayStation official support", "https://www.playstation.com/en-gb/"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Currys", "https://www.currys.co.uk/"]
        ],
        youtubeLinks: [
            ["PS5 Complete Cleaning & Overheating Fix", "https://www.youtube.com/watch?v=4ZusQZnFObI"],
            ["PlayStation 5 Ultimate Troubleshooting & Repair Guide", "https://www.youtube.com/watch?v=KBA9Pf1kaak"]
        ]
    },
    xbox: {
        name: "Xbox Series X|S",
        category: "Gaming Console — Cooling & Teardown Manual",
        difficulty: "Moderate",
        badgeClass: "badge-moderate",
        description: "Disassembly, airflow clearing, and common power or display diagnostics for Xbox Series X and Series S consoles.",
        checks: [
            "Disconnect AC power and wait several minutes before opening the rear case with a Torx T8 driver.",
            "Keep the internal heatsink clear of lint and avoid spinning the exhaust fan rapidly with compressed air.",
            "Verify HDMI cable rating (Ultra High Speed) and test another TV input before suspecting the retimer IC."
        ],
        shops: [
            ["Xbox Support", "https://support.xbox.com/"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Currys", "https://www.currys.co.uk/"]
        ],
        youtubeLinks: [
            ["Search Xbox Series X|S Teardown & Cleaning Guides", "https://www.youtube.com/results?search_query=Xbox+Series+X+S+teardown+cleaning+repair+guide"]
        ]
    },
    switch: {
        name: "Nintendo Switch",
        category: "Handheld Console — Modular Repair Guide",
        difficulty: "Moderate",
        badgeClass: "badge-moderate",
        description: "Practical maintenance steps for Joy-Con rails, thumbsticks, cooling fans, microSD readers, and batteries.",
        checks: [
            "Use a properly sized tri-point Y00 driver on external Joy-Con and Switch housing screws to avoid stripping.",
            "Power off completely (hold Power for 3+ seconds) and disconnect the battery connector first.",
            "Apply fresh thermal paste if you remove the copper heat pipe during fan or game-card reader service."
        ],
        shops: [
            ["Nintendo Support", "https://www.nintendo.com/en-gb/Support/Welcome-to-Nintendo-Support-11593.html"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Argos", "https://www.argos.co.uk/"]
        ],
        youtubeLinks: [
            ["Search Nintendo Switch & Joy-Con Repair Guides", "https://www.youtube.com/results?search_query=Nintendo+Switch+JoyCon+drift+fan+battery+repair+guide"]
        ]
    },
    iphone: {
        name: "iPhone",
        category: "Smartphone — Screen & Battery Manual",
        difficulty: "Variable",
        badgeClass: "badge-variable",
        description: "Screen assembly, battery pull-tab, and charging port maintenance tutorials for iPhone models.",
        checks: [
            "Verify the exact iPhone model identifier and screen flex layout before ordering replacement parts.",
            "Back up important data and keep track of screw lengths with a magnetic mat to prevent board damage.",
            "Test the replacement display, Face ID sensors, and touch response before sealing new perimeter adhesive."
        ],
        shops: [
            ["Apple UK Support", "https://www.apple.com/uk/"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Currys", "https://www.currys.co.uk/"]
        ],
        youtubeLinks: [
            ["iPhone 15 Pro Genuine Screen Replacement", "https://www.youtube.com/watch?v=3HVwqz_0Prg"],
            ["iPhone 14 Plus Screen Replacement", "https://www.youtube.com/watch?v=X0U3QBuZT9Y"],
            ["iPhone 11 Screen Replacement Tutorial", "https://www.youtube.com/watch?v=fLZcA3LKPSo"],
            ["3 Steps To Fix Any iPhone | iPhone Screen Replacement", "https://www.youtube.com/watch?v=YVuRlWswx58"]
        ]
    },
    android: {
        name: "Android phone",
        category: "Smartphone — Screen Repair Manual",
        difficulty: "Model-specific",
        badgeClass: "badge-variable",
        description: "Screen and back-glass repair tutorials for Android devices from Samsung, Google Pixel, Xiaomi, Oppo, and Vivo.",
        checks: [
            "Identify the exact model code and whether the device opens from the back glass or front display.",
            "Back up data and check official model-specific safety and disassembly guidance.",
            "Use plastic picks and controlled low heat; never pry against or puncture the lithium battery."
        ],
        shops: [
            ["Samsung Support", "https://www.samsung.com/uk/support/"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Currys", "https://www.currys.co.uk/"]
        ],
        youtubeLinks: [
            ["How To Replace a Cracked Smartphone Screen!", "https://www.youtube.com/watch?v=6kNNGNAQtZA"],
            ["How to Repair a Broken Android Phone Screen (DIY Tutorial)", "https://www.youtube.com/watch?v=Shh26Rcn9Ps"],
            ["Fix ANY Android Screen! Fast & Simple DIY Tutorial", "https://www.youtube.com/watch?v=w9gLrYHZ0fM"],
            ["How to Fix Android Broken Screen (Full Guide)", "https://www.youtube.com/watch?v=iFwo9jdMCe8"],
            ["How to Fix Screen Problem Android - Step by Step", "https://www.youtube.com/watch?v=FqHwgL8l6WQ"]
        ]
    },
    tablet: {
        name: "Tablet / iPad",
        category: "Tablet — Display & Battery Manual",
        difficulty: "Difficult",
        badgeClass: "badge-difficult",
        description: "Guidance for loosening strong perimeter display adhesive, handling delicate digitizer flexes, and replacing large cells.",
        checks: [
            "Confirm whether the glass digitizer and LCD are laminated together or separate on your exact model.",
            "Limit pry-tool insertion depth around edges to avoid slicing Wi-Fi antennas or display cables.",
            "Clean old adhesive residue thoroughly with isopropyl alcohol before installing fresh mounting tape."
        ],
        shops: [
            ["Apple iPad Support", "https://support.apple.com/en-gb/ipad"],
            ["Samsung Support", "https://www.samsung.com/uk/support/"],
            ["Amazon UK", "https://www.amazon.co.uk/"]
        ],
        youtubeLinks: [
            ["Search iPad & Tablet Screen Repair Guides", "https://www.youtube.com/results?search_query=iPad+tablet+screen+battery+replacement+repair+guide"]
        ]
    },
    laptop: {
        name: "Gaming laptop",
        category: "Portable PC — Maintenance & Upgrade Guide",
        difficulty: "Moderate",
        badgeClass: "badge-moderate",
        description: "Portable computer service guides covering thermal maintenance, fan cleaning, and RAM/SSD upgrades.",
        checks: [
            "Unplug AC power, open the bottom panel, and disconnect the internal battery cable before touching components.",
            "Compare heatsink screw numbering, fan connectors, and thermal pad thickness before reassembly.",
            "Verify DDR generation and M.2 NVMe key/length compatibility before ordering upgrade hardware."
        ],
        shops: [
            ["Search manufacturer stores", "https://www.google.com/search?q=official+gaming+laptop+manufacturer+store"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Currys", "https://www.currys.co.uk/"]
        ],
        youtubeLinks: [
            ["Gaming Laptop Teardown, Cleaning, and Thermal Maintenance", "https://www.youtube.com/watch?v=-r_s8aOqgUs"],
            ["Step-by-Step Laptop Disassembly and Assembly Guide", "https://www.youtube.com/watch?v=naKp6gWQYwI"]
        ]
    },
    gpu: {
        name: "Graphics card (GPU)",
        category: "PC Component — Teardown Manual",
        difficulty: "Advanced",
        badgeClass: "badge-advanced",
        description: "Advanced hardware guides for cleaning fin stacks, repasting the GPU die, replacing thermal pads, and checking fans.",
        checks: [
            "Measure exact thermal pad thicknesses (e.g. 1.0mm vs 1.5mm) so VRAM and VRMs make proper cooler contact.",
            "Unplug micro-fan and RGB LED headers gently from the PCB before lifting the shroud.",
            "Use non-conductive thermal paste and verify hotspot temperatures under load after reassembly."
        ],
        shops: [
            ["Scan", "https://www.scan.co.uk/"],
            ["Overclockers UK", "https://www.overclockers.co.uk/"],
            ["Amazon UK", "https://www.amazon.co.uk/"]
        ],
        youtubeLinks: [
            ["GPU Repair Course - Diagnostic & Fix Guide Part 1", "https://www.youtube.com/watch?v=Jj_vziChgIU"],
            ["Advanced GPU Troubleshooting & Repair", "https://www.youtube.com/watch?v=eF19Qp9LMzw"]
        ]
    },
    headphones: {
        name: "Wireless headphones",
        category: "Audio — Disassembly & Battery Fixes",
        difficulty: "Difficult",
        badgeClass: "badge-difficult",
        description: "Guides detailing ear-pad cushion replacements, headband hinge repairs, and internal battery swaps.",
        checks: [
            "Inspect USB-C or micro-USB charging ports for lint buildup or fractured solder joints.",
            "Note snap-fit plastic clip locations inside the earcup before prying to avoid snapping tabs.",
            "Confirm replacement Li-Po battery voltage, polarity, and thermistor (3-wire vs 2-wire) layout."
        ],
        shops: [
            ["Search manufacturer stores", "https://www.google.com/search?q=official+wireless+headphone+manufacturer+store"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Argos", "https://www.argos.co.uk/"]
        ],
        youtubeLinks: [
            ["How to Repair ANY Broken Headphones at Home", "https://www.youtube.com/watch?v=sGdqtyjhTNE"]
        ]
    },
    earbuds: {
        name: "Wireless earbuds",
        category: "Audio — Acoustic Mesh & Charging Fixes",
        difficulty: "Difficult",
        badgeClass: "badge-difficult",
        description: "Maintenance steps for muffled audio, uneven volume, charging case pogo pins, and pairing issues.",
        checks: [
            "Gently clean speaker meshes with a dry soft brush and minimal isopropyl alcohol—never soak drivers.",
            "Clean recessed gold charging pins inside the case and on each earbud stem to fix single-bud charging.",
            "Perform a full hardware reset inside the case before assuming a dead earbud battery."
        ],
        shops: [
            ["Apple Audio Support", "https://support.apple.com/en-gb/airpods"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Argos", "https://www.argos.co.uk/"]
        ],
        youtubeLinks: [
            ["Search Wireless Earbuds Cleaning & Charging Fix Guides", "https://www.youtube.com/results?search_query=wireless+earbuds+airpods+one+side+quiet+charging+fix"]
        ]
    },
    controller: {
        name: "Gaming controller",
        category: "Peripheral — Stick Drift & Trigger Guide",
        difficulty: "Easy",
        badgeClass: "badge-easy",
        description: "Step-by-step tutorials for resolving stick drift, replacing bumper switches, and refreshing battery packs.",
        checks: [
            "Confirm bit sizes (typically Phillips PH00 or Torx T8 security for Xbox) before opening the shell.",
            "Clean potentiometer wipers carefully or consider Hall-effect stick module upgrades if soldering.",
            "Check ribbon cable latch orientation and trigger spring seating before snapping the shell closed."
        ],
        shops: [
            ["Search official platform store", "https://www.google.com/search?q=official+gaming+controller+store"],
            ["Amazon UK", "https://www.amazon.co.uk/"],
            ["Argos", "https://www.argos.co.uk/"]
        ],
        youtubeLinks: [
            ["How to Fix Xbox & Console Controller Joysticks", "https://www.youtube.com/watch?v=hZKP0SQhVyA"]
        ]
    },
    keyboard: {
        name: "Mechanical keyboard",
        category: "Peripheral — Switches & Stabilizer Guide",
        difficulty: "Easy",
        badgeClass: "badge-easy",
        description: "Switch replacement, key chatter troubleshooting, stabilizer tuning, and USB daughterboard checks.",
        checks: [
            "Verify whether your PCB is hot-swappable or soldered before pulling switches out.",
            "Inspect bent switch pins carefully before pressing a new switch into a hot-swap socket.",
            "Swap a suspect switch with a working key (like Pause) to isolate switch vs PCB faults."
        ],
        shops: [
            ["Overclockers UK", "https://www.overclockers.co.uk/"],
            ["Scan", "https://www.scan.co.uk/"],
            ["Amazon UK", "https://www.amazon.co.uk/"]
        ],
        youtubeLinks: [
            ["Search Mechanical Keyboard Switch & Chatter Repair Guides", "https://www.youtube.com/results?search_query=mechanical+keyboard+switch+replacement+chatter+fix"]
        ]
    }
};

const details = Object.fromEntries(
    Object.entries(defaultDetails).map(([key, device]) => [
        key,
        { ...device, youtubeLinks: [...device.youtubeLinks] }
    ])
);

const fixes = {
    power: {
        title: "Start with power and connections",
        steps: [
            "Check the wall socket with another known-good device and confirm the power cable is firmly seated.",
            "Disconnect non-essential accessories, wait 30 seconds, then reconnect and test once.",
            "Check the manufacturer's guide for your exact model's hard-reset or power-drain sequence."
        ],
        caution: "If there is a burning smell, unusual heat, liquid damage, or a frayed cable, stop testing immediately."
    },
    internet: {
        title: "Check the network path",
        steps: [
            "Confirm other devices can reach the internet on the same Wi-Fi network.",
            "Restart the router using its normal power controls, then restart your device.",
            "Forget and rejoin the Wi-Fi network, carefully re-entering the password, and check for service outages."
        ],
        caution: "Avoid factory-resetting the router or device until important data and settings are backed up."
    },
    slow: {
        title: "Reduce load before changing settings",
        steps: [
            "Restart the device and close background apps or heavy browser tabs.",
            "Check free storage (keep at least 10–15% free) and install official OS/firmware updates.",
            "Note whether slowdown happens in one specific app, on battery power, or right after an update."
        ],
        caution: "Do not install unverified third-party cleaner utilities or delete unfamiliar system files."
    },
    sound: {
        title: "Trace the audio output",
        steps: [
            "Raise volume on both the hardware and the app, and confirm mute or Do Not Disturb is off.",
            "Open sound output settings and verify the intended speakers or Bluetooth headset is selected.",
            "Re-pair Bluetooth or test another cable/app to separate hardware faults from software settings."
        ],
        caution: "If you hear electrical crackling from a power brick or smell burning, unplug the device."
    },
    heat: {
        title: "Give the device room to cool",
        steps: [
            "Save your work and shut the device down if the chassis is uncomfortably hot.",
            "Place it on a hard, flat surface and inspect external vents for dust buildup without poking metal tools inside.",
            "Once cool, check background CPU/GPU load and review model-specific fan cleaning guides."
        ],
        caution: "Never open a power supply unit or puncture a battery. Stop using hardware that repeatedly thermal-shuts down."
    },
    battery: {
        title: "Check the charging basics",
        steps: [
            "Test with a known-good, properly rated charger and USB cable from a working wall outlet.",
            "Inspect the charging port with a flashlight for lint; clear gently with a wooden/plastic pick only.",
            "Restart the device and check built-in battery health diagnostics if available."
        ],
        caution: "If a battery is swollen, bulging the case, leaking, or hot to the touch, stop charging and do not press on it."
    },
    display: {
        title: "Check the display connection",
        steps: [
            "Confirm the monitor or TV is powered on and switched to the matching HDMI/DisplayPort input.",
            "Reseat the video cable at both ends, or test a spare known-good cable and port.",
            "Reboot the source device and check manufacturer display reset/safe-mode shortcuts."
        ],
        caution: "If a screen has cracked internal glass or liquid behind the panel, stop powering it on and seek repair support."
    }
};

// Catalog Search & Filtering
const search = document.getElementById('searchInput');
const cards = [...document.querySelectorAll('.product')];
const chips = [...document.querySelectorAll('.chip')];
const empty = document.getElementById('empty');
const catalogCount = document.getElementById('catalogCount');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
let active = 'all';

function updateCategoryCounts() {
    const counts = { all: cards.length };
    cards.forEach(card => {
        const cat = card.dataset.category;
        counts[cat] = (counts[cat] || 0) + 1;
    });
    document.querySelectorAll('[data-count-for]').forEach(el => {
        const key = el.dataset.countFor;
        el.textContent = String(counts[key] ?? 0);
    });
}

function filterProducts() {
    const q = search.value.trim().toLowerCase();
    let count = 0;
    cards.forEach(card => {
        const haystack = `${card.dataset.search || ''} ${card.textContent || ''}`.toLowerCase();
        const show = (!q || haystack.includes(q)) && (active === 'all' || card.dataset.category === active);
        card.hidden = !show;
        if (show) count++;
    });
    empty.style.display = count ? 'none' : 'block';
    catalogCount.textContent = `Showing ${count} of ${cards.length} guides`;
    resetFiltersBtn.hidden = !(q || active !== 'all');
}

document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    filterProducts();
    document.getElementById('productsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

search.addEventListener('input', filterProducts);

chips.forEach(chip => chip.addEventListener('click', () => {
    active = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    filterProducts();
}));

resetFiltersBtn.addEventListener('click', () => {
    search.value = '';
    active = 'all';
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
    filterProducts();
});

updateCategoryCounts();
filterProducts();

// Toast Notifications
const toast = document.getElementById('toast');
let toastTimer;

function notify(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 4500);
}

// Cloud Links from Firestore
async function loadCloudLinks() {
    try {
        const snapshot = await getDocs(collection(db, 'devices'));
        snapshot.forEach(deviceDocument => {
            const key = deviceDocument.id;
            if (!Object.hasOwn(details, key)) return;
            const links = deviceDocument.data().youtubeLinks;
            if (!Array.isArray(links)) return;

            const safeLinks = links
                .filter(link => link && typeof link.title === 'string' && typeof link.url === 'string')
                .map(link => [link.title, getYouTubeUrl(link.url)])
                .filter(([, url]) => url);
            mergeYouTubeLinks(details[key].youtubeLinks, safeLinks);
        });
    } catch (error) {
        console.error('Failed to load Firebase video links.', error);
    }
}

// Account & Saved Guides
const accountStatus = document.getElementById('accountStatus');
const accountForm = document.getElementById('accountForm');
const accountToggle = document.getElementById('accountToggle');
const accountDrawer = document.getElementById('accountDrawer');
const signOutButton = document.getElementById('signOutButton');
const savedGuidesSection = document.getElementById('savedGuidesSection');
const savedGuidesList = document.getElementById('savedGuides');
const savedGuidesEmpty = document.getElementById('savedGuidesEmpty');
const savedGuideKeys = new Set();
let currentUser = null;
let openModalDeviceKey = null;

function updateAccountToggleLabel() {
    const isOpen = !accountDrawer.hidden;
    accountToggle.setAttribute('aria-expanded', String(isOpen));
    if (currentUser) {
        accountToggle.textContent = isOpen
            ? 'Hide saved'
            : `Saved (${savedGuideKeys.size})`;
    } else {
        accountToggle.textContent = isOpen ? 'Hide sign in' : 'Sign in / Save';
    }
}

function setAccountDrawerOpen(open, focusEmail = false) {
    accountDrawer.hidden = !open;
    updateAccountToggleLabel();
    if (open && focusEmail && !currentUser) {
        document.getElementById('accountEmail').focus();
    }
}

accountToggle.addEventListener('click', () => {
    setAccountDrawerOpen(accountDrawer.hidden);
});

document.querySelectorAll('[data-open-account]').forEach(link => {
    link.addEventListener('click', () => {
        setAccountDrawerOpen(true, !currentUser);
    });
});

function syncSaveButtonState(button, isSaved) {
    if (!button) return;
    button.textContent = isSaved ? 'Saved' : 'Save';
    button.setAttribute('aria-pressed', String(isSaved));
}

function renderSavedGuides() {
    savedGuidesList.replaceChildren();
    savedGuidesEmpty.hidden = savedGuideKeys.size > 0;

    savedGuideKeys.forEach(key => {
        const device = details[key];
        if (!device) return;

        const item = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = device.name;

        const openButton = document.createElement('button');
        openButton.className = 'smallbtn';
        openButton.type = 'button';
        openButton.dataset.openGuide = key;
        openButton.textContent = 'Open guide';

        const removeButton = document.createElement('button');
        removeButton.className = 'smallbtn';
        removeButton.type = 'button';
        removeButton.dataset.removeGuide = key;
        removeButton.textContent = 'Remove';

        item.append(name, openButton, removeButton);
        savedGuidesList.append(item);
    });

    document.querySelectorAll('.save-guide').forEach(button => {
        syncSaveButtonState(button, savedGuideKeys.has(button.dataset.product));
    });

    if (openModalDeviceKey) {
        const isSaved = savedGuideKeys.has(openModalDeviceKey);
        modalSaveBtn.textContent = isSaved ? 'Saved to account' : 'Save guide';
        modalSaveBtn.setAttribute('aria-pressed', String(isSaved));
    }

    updateAccountToggleLabel();
}

async function loadSavedGuides(user) {
    savedGuideKeys.clear();
    renderSavedGuides();
    try {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'savedDevices'));
        if (currentUser?.uid !== user.uid) return;
        snapshot.forEach(savedDevice => {
            if (Object.hasOwn(details, savedDevice.id)) savedGuideKeys.add(savedDevice.id);
        });
        renderSavedGuides();
    } catch (error) {
        console.error('Could not load this account’s saved guides.', error);
        if (currentUser?.uid === user.uid) {
            accountStatus.textContent = 'Signed in, but saved guides could not be loaded.';
            notify('Could not load your saved guides. Check your connection and Firebase setup.');
        }
    }
}

function getAuthErrorMessage(error, action) {
    const code = error?.code || '';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Try signing in instead.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters long.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return 'Incorrect email or password. Please check your details and try again.';
    }
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment before trying again.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection and try again.';
    return action === 'sign-up'
        ? 'Could not create your account. Please check your details and try again.'
        : 'Could not sign in. Please check your email and password.';
}

accountForm.addEventListener('submit', async event => {
    event.preventDefault();
    const action = event.submitter?.dataset.action;
    const email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    const buttons = accountForm.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => { button.disabled = true; });

    try {
        if (action === 'sign-up') {
            await createUserWithEmailAndPassword(auth, email, password);
            notify('Account created and signed in.');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            notify('Signed in successfully.');
        }
        accountForm.reset();
    } catch (error) {
        console.error(`Firebase ${action === 'sign-up' ? 'account creation' : 'sign-in'} failed.`, error);
        notify(getAuthErrorMessage(error, action));
    } finally {
        buttons.forEach(button => { button.disabled = false; });
    }
});

signOutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        notify('Signed out.');
    } catch (error) {
        console.error('Sign-out failed.', error);
        notify('Could not sign out. Please try again.');
    }
});

onAuthStateChanged(auth, user => {
    currentUser = user;
    accountForm.hidden = Boolean(user);
    signOutButton.hidden = !user;
    savedGuidesSection.hidden = !user;
    savedGuideKeys.clear();
    renderSavedGuides();

    if (!user) {
        accountStatus.textContent = 'Sign in to save repair guides across your devices.';
        return;
    }

    accountStatus.textContent = `Signed in as ${user.email || 'your account'}.`;
    loadSavedGuides(user);
}, error => {
    console.error('Firebase Authentication state could not be read.', error);
    accountStatus.textContent = 'Could not check account status. Please reload the page.';
});

async function toggleSavedGuide(key, triggerButton = null) {
    if (!Object.hasOwn(details, key)) return;
    const user = currentUser;
    if (!user) {
        notify('Sign in or create an account to save this guide.');
        setAccountDrawerOpen(true, true);
        document.getElementById('accountSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (triggerButton) triggerButton.disabled = true;
    try {
        const savedDeviceRef = doc(db, 'users', user.uid, 'savedDevices', key);
        if (savedGuideKeys.has(key)) {
            await deleteDoc(savedDeviceRef);
            if (currentUser?.uid === user.uid) savedGuideKeys.delete(key);
            notify(`Removed ${details[key].name} from saved guides.`);
        } else {
            await setDoc(savedDeviceRef, { deviceKey: key });
            if (currentUser?.uid === user.uid) savedGuideKeys.add(key);
            notify(`Saved ${details[key].name} to your account.`);
        }
        renderSavedGuides();
    } catch (error) {
        console.error('Could not update this account’s saved guides.', error);
        notify('Could not update your saved guides. Check your connection and Firebase setup.');
    } finally {
        if (triggerButton) triggerButton.disabled = false;
    }
}

cards.forEach(card => {
    const productKey = card.querySelector('.detail')?.dataset.product;
    const cardBottom = card.querySelector('.card-bottom');
    if (!productKey || !cardBottom) return;

    const saveButton = document.createElement('button');
    saveButton.className = 'smallbtn save-guide';
    saveButton.dataset.product = productKey;
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    saveButton.setAttribute('aria-pressed', 'false');
    cardBottom.append(saveButton);
});

document.getElementById('productsGrid').addEventListener('click', event => {
    const button = event.target.closest('.save-guide');
    if (!button) return;
    toggleSavedGuide(button.dataset.product, button);
});

savedGuidesList.addEventListener('click', event => {
    const openButton = event.target.closest('[data-open-guide]');
    if (openButton) {
        openGuideModal(openButton.dataset.openGuide);
        return;
    }

    const removeButton = event.target.closest('[data-remove-guide]');
    if (removeButton) {
        toggleSavedGuide(removeButton.dataset.removeGuide, removeButton);
    }
});

// In-Page Guide Modal
const guideModal = document.getElementById('guideModal');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalDifficulty = document.getElementById('modalDifficulty');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalDoneBtn = document.getElementById('modalDoneBtn');
const modalSaveBtn = document.getElementById('modalSaveBtn');

function renderYouTubeSection(device) {
    if (!device.youtubeLinks || device.youtubeLinks.length === 0) {
        return '<p class="modal-empty">No YouTube links are available for this device yet.</p>';
    }
    return `<div class="modal-links">${device.youtubeLinks.map(([title, rawUrl]) => {
        const safeUrl = getYouTubeUrl(rawUrl) || '#';
        return `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${esc(title)} <span aria-hidden="true">▶</span></a>`;
    }).join('')}</div>`;
}

function renderGuideModalContent(device) {
    modalCategory.textContent = device.category;
    modalTitle.textContent = device.name;
    modalDifficulty.textContent = device.difficulty;
    modalDifficulty.className = `repair-badge ${device.badgeClass || ''}`;

    const shopsHtml = device.shops.map(([name, rawUrl]) => {
        const safeUrl = getSafeUrl(rawUrl) || '#';
        return `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${esc(name)} <span aria-hidden="true">↗</span></a>`;
    }).join('');

    modalBody.innerHTML = `
        <p class="modal-lead">${esc(device.description)}</p>
        <section class="modal-section">
            <h3>Key repair considerations</h3>
            <ul>${device.checks.map(step => `<li>${esc(step)}</li>`).join('')}</ul>
        </section>
        <section class="modal-section" id="modalYoutubeSection">
            <h3>Video tutorials</h3>
            <div id="modalYoutubeLinks">${renderYouTubeSection(device)}</div>
        </section>
        <section class="modal-section">
            <h3>Parts, tools &amp; official support</h3>
            <div class="modal-links">${shopsHtml}</div>
        </section>
    `;
}

async function openGuideModal(pKey) {
    const device = details[pKey];
    if (!device) return;

    openModalDeviceKey = pKey;
    renderGuideModalContent(device);
    renderSavedGuides();

    if (typeof guideModal.showModal === 'function') {
        if (!guideModal.open) guideModal.showModal();
    } else {
        guideModal.setAttribute('open', '');
    }

    if (getApiKey() && !fetchedYouTubeKeys.has(pKey)) {
        const liveVideos = await fetchYouTubeVideos(pKey, device.name);
        if (liveVideos.length > 0) {
            mergeYouTubeLinks(device.youtubeLinks, liveVideos);
            if (openModalDeviceKey === pKey) {
                const container = document.getElementById('modalYoutubeLinks');
                if (container) container.innerHTML = renderYouTubeSection(device);
            }
        }
    }
}

function closeGuideModal() {
    openModalDeviceKey = null;
    if (typeof guideModal.close === 'function' && guideModal.open) {
        guideModal.close();
    } else {
        guideModal.removeAttribute('open');
    }
}

document.querySelectorAll('.detail').forEach(button => {
    button.addEventListener('click', () => {
        openGuideModal(button.dataset.product);
    });
});

modalClose.addEventListener('click', closeGuideModal);
modalDoneBtn.addEventListener('click', closeGuideModal);
modalSaveBtn.addEventListener('click', () => {
    if (openModalDeviceKey) {
        toggleSavedGuide(openModalDeviceKey, modalSaveBtn);
    }
});

guideModal.addEventListener('click', event => {
    if (event.target === guideModal) {
        closeGuideModal();
    }
});

guideModal.addEventListener('close', () => {
    openModalDeviceKey = null;
});

loadCloudLinks();

// Troubleshooting Assistant
const deviceNotes = {
    console: 'For home consoles, check official network status pages and airflow vents before attempting recovery resets.',
    handheld: 'For handheld consoles, test both docked and handheld modes to isolate screen vs dock/charger faults.',
    phone: 'For phones, check the manufacturer support guide and back up important data before updates or resets.',
    tablet: 'For tablets, test a high-wattage charger/cable and force-restart before assuming a display failure.',
    laptop: 'For computers, save your work and avoid BIOS/firmware changes unless the manufacturer recommends them.',
    audio: 'For audio gear, check the selected output, clean charging contacts, and reset Bluetooth pairing.',
    gpu: 'For graphics cards, do not open the card or power supply. Check driver guidance and seated PCIe power cables.',
    controller: 'For controllers and keyboards, check pairing mode, cable/battery level, and firmware updates.',
    other: 'Use the exact model number to find the manufacturer’s official support steps.'
};

document.getElementById('troubleForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = document.getElementById('device').value;
    const s = document.getElementById('symptom').value;
    const notes = document.getElementById('notes').value.trim();
    const f = fixes[s];
    if (!d || !f) return;
    const result = document.getElementById('solution');
    result.innerHTML = `<h4>${esc(f.title)}</h4><p><strong>Device:</strong> ${esc(document.getElementById('device').selectedOptions[0].text)}</p><ol>${f.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p><strong>Device-specific note:</strong> ${esc(deviceNotes[d] || deviceNotes.other)}</p><p class="caution"><strong>Stop if:</strong> ${esc(f.caution)}</p>${notes ? `<p><strong>Your notes:</strong> ${esc(notes)}</p>` : ''}<p>If these checks do not help, record the exact model and any error code, then contact the manufacturer's support team or a qualified repair professional.</p>`;
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Mobile Navigation Toggle
const menu = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
}));
