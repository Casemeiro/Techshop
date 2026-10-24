// Backend DB simulation storage (persisted in memory / localStorage simulation)
const defaultDetails = {
    ps5: { name: "PlayStation 5", category: "Gaming console — Repair & Teardown Manual", description: "A comprehensive repository of troubleshooting, teardowns, and repair guides designed to help you maintain your console.", checks: ["Examine Torx security screw requirements and modular faceplate removal steps.", "Check the HDMI port pins for bending or physical deformation before replacing.", "Review fan cleaning procedures to address loud fan or overheating warnings."], shops: [["PlayStation official site", "https://www.playstation.com/en-gb/"], ["Amazon UK", "https://www.amazon.co.uk/"], ["Currys", "https://www.currys.co.uk/"]], youtubeLinks: [["PS5 Official Teardown Guide", "https://www.youtube.com/watch?v=CaAY-iVUNjQ"]] },
    iphone: { name: "iPhone", category: "Smartphone — Repair Manual", description: "Guides for screen assemblies, battery swaps, adhesive replacement strips, and diagnostic checks.", checks: ["Verify exact model numbers to match replacement display connectors and screws.", "Ensure proper use of heating pads to soften factory waterproof display adhesives.", "Check battery health percentage and ensure safety discharge protocols are followed."], shops: [["Apple UK", "https://www.apple.com/uk/"], ["Amazon UK", "https://www.amazon.co.uk/"], ["Currys", "https://www.currys.co.uk/"]], youtubeLinks: [["iPhone Complete Screen Repair", "https://www.youtube.com/watch?v=d_H4Iu3_0x0"]] },
    laptop: { name: "Gaming laptop", category: "Portable PC — Maintenance Guide", description: "Portable computer service guides covering thermal paste renewal, memory expansion, and internal cleaning.", checks: ["Disconnect the internal battery cable immediately upon opening the case chassis.", "Compare exact cooling block layout, screw lengths, and thermal pad thickness.", "Verify RAM and M.2 NVMe slot compatibility before purchasing upgrade hardware."], shops: [["Search manufacturer stores", "https://www.google.com/search?q=official+gaming+laptop+manufacturer+store"], ["Amazon UK", "https://www.amazon.co.uk/"], ["Currys", "https://www.currys.co.uk/"]], youtubeLinks: [["How to Clean Laptop Fans & Repaste", "https://www.youtube.com/watch?v=8Vq7r6_0x0x"]] },
    headphones: { name: "Wireless headphones", category: "Audio — Disassembly & Fixes", description: "Guides detailing acoustic foam ear-pad replacements, headband hinges, and battery soldering steps.", checks: ["Inspect charging micro-USB/Type-C port solder joints for hairline fractures.", "Review snap-fit housing disassembly techniques to avoid plastic clip breakage.", "Confirm replacement battery voltage and physical battery dimensions match."], shops: [["Search manufacturer stores", "https://www.google.com/search?q=official+wireless+headphone+manufacturer+store"], ["Amazon UK", "https://www.amazon.co.uk/"], ["Argos", "https://www.argos.co.uk/"]], youtubeLinks: [["Headphone Cushion & Battery Replacement", "https://www.youtube.com/watch?v=9Vq7r6_0x0y"]] },
    gpu: { name: "Graphics card (GPU)", category: "PC component — Teardown Manual", description: "Advanced hardware guides for cleaning radiator fins, repasting cooling compound, and fan replacement.", checks: ["Measure case clearance and check slot width and power connector requirements.", "Carefully unplug fragile micro-fan and RGB LED headers before removing the shroud.", "Compare thermal performance benchmarks before and after paste application."], shops: [["Scan", "https://www.scan.co.uk/"], ["Overclockers UK", "https://www.overclockers.co.uk/"], ["Amazon UK", "https://www.amazon.co.uk/"]], youtubeLinks: [["GPU Teardown and Thermal Paste Swap", "https://www.youtube.com/watch?v=7Vq7r6_0x0z"]] },
    controller: { name: "Gaming controller", category: "Accessory — Fix Guide", description: "Step-by-step tutorials for addressing stick drift, replacing bumper switches, and battery housing.", checks: ["Confirm screwdriver bit sizes (typically Phillips PH00) required for housing screws.", "Inspect potentiometer modules for dust and wear before swapping thumbsticks.", "Check battery type, ribbon cable latch states, and reassembly alignment."], shops: [["Search official platform store", "https://www.google.com/search?q=official+gaming+controller+store"], ["Amazon UK", "https://www.amazon.co.uk/"], ["Argos", "https://www.argos.co.uk/"]], youtubeLinks: [["Fix Stick Drift Permanently", "https://www.youtube.com/watch?v=6Vq7r6_0x0a"]] }
};

// Load details from localStorage if available
let details = JSON.parse(localStorage.getItem('nextech_db')) || defaultDetails;

const fixes = {
    power: { title: "Start with power and connections", steps: ["Check the wall socket with another safe device and confirm the power cable is firmly connected.", "Disconnect non-essential accessories, wait 30 seconds, then reconnect and try once.", "Check the manufacturer's guide for the exact model's power/reset procedure."], caution: "If there is a burning smell, unusual heat, liquid damage or a damaged cable, stop testing." },
    internet: { title: "Check the network path", steps: ["Confirm other devices can access the same Wi-Fi network.", "Restart the router using its normal controls, then restart the device.", "Forget and rejoin the network, carefully re-entering the password. Check for a service outage."], caution: "Avoid factory-resetting the router or device until settings are saved and official instructions are checked." },
    slow: { title: "Reduce load before changing settings", steps: ["Restart the device and close apps or tabs you are not using.", "Check available storage and install system updates from the official settings menu.", "Notice whether slowness happens in one app or everywhere, and when it began."], caution: "Do not install random cleaner tools or delete unfamiliar system files to speed things up." },
    sound: { title: "Trace the audio output", steps: ["Raise the volume on both the device and the app, and check mute settings.", "Open sound/output settings and select the intended speakers or headphones.", "Reconnect Bluetooth or the audio cable and test with another app or known-good device."], caution: "If you hear crackling from a power adapter or smell burning, stop using it." },
    heat: { title: "Give the device room to cool", steps: ["Save your work and shut the device down if it is unusually hot.", "Place it on a hard, flat surface and clear external vents without inserting objects.", "After it cools, check for blocked vents, demanding background apps and official cleaning guidance."], caution: "Do not open a power supply or dismantle a battery. Stop using a device that repeatedly overheats or smells unusual." },
    battery: { title: "Check the charging basics", steps: ["Try a compatible, undamaged charger and cable rated for the device.", "Inspect external ports for visible debris without inserting metal objects; check whether the outlet works.", "Restart the device and review the manufacturer's battery-health or charging guidance."], caution: "If a battery is swollen, leaking or unusually hot, stop charging and using the device. Do not press or open it." },
    display: { title: "Check the display connection", steps: ["Confirm the monitor/TV is on and set to the correct input.", "Reconnect the video cable at both ends, or try another compatible cable/input if available.", "Restart the source device and display, then check the manufacturer's model-specific guidance."], caution: "If a laptop screen is damaged or there is liquid damage, stop and seek qualified repair support." }
};

const search = document.getElementById('searchInput');
const cards = [...document.querySelectorAll('.product')];
const chips = [...document.querySelectorAll('.chip')];
const empty = document.getElementById('empty');
let active = 'all';

function filterProducts() {
    const q = search.value.trim().toLowerCase();
    let count = 0;
    cards.forEach(card => {
        const show = (!q || (card.dataset.search + ' ' + card.innerText).toLowerCase().includes(q)) && (active === 'all' || card.dataset.category === active);
        card.hidden = !show;
        if (show) count++;
    });
    empty.style.display = count ? 'none' : 'block';
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

const toast = document.getElementById('toast');
let toastTimer;

function notify(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.style.display = 'none', 4500);
}

// Handle Backend Form Submission (Adding a YouTube link to a device)
document.getElementById('backendForm').addEventListener('submit', e => {
    e.preventDefault();
    const deviceKey = document.getElementById('backendDeviceKey').value;
    const title = document.getElementById('backendVideoTitle').value.trim();
    const url = document.getElementById('backendVideoUrl').value.trim();

    if (details[deviceKey]) {
        if (!details[deviceKey].youtubeLinks) {
            details[deviceKey].youtubeLinks = [];
        }
        details[deviceKey].youtubeLinks.push([title, url]);
        localStorage.setItem('nextech_db', JSON.stringify(details));
        notify(`Successfully saved YouTube video link to ${details[deviceKey].name}!`);
        document.getElementById('backendVideoTitle').value = '';
        document.getElementById('backendVideoUrl').value = '';
    }
});

document.querySelectorAll('.detail').forEach(button => button.addEventListener('click', () => {
    const pKey = button.dataset.product;
    const p = details[pKey];
    if (!p) return;
    const w = window.open('', '_blank');
    if (!w) { notify('Your browser blocked the detail window. Allow pop-ups for this site, then try again.'); return; }
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const ytList = p.youtubeLinks && p.youtubeLinks.length > 0
        ? p.youtubeLinks.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(t)} ▶</a>`).join('')
        : '<p style="color:var(--dim);font-size:0.9rem;">No YouTube links attached yet. Use the backend form on the home page to add one!</p>';

    w.document.open();
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111315"><title>${esc(p.name)} | NEXTECH</title><style>:root{color-scheme:dark;--bg:#111315;--surface:#191c1f;--line:#3a4147;--text:#f4f5f6;--muted:#b5bdc3;--accent:#a7f36b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,sans-serif}.wrap{width:min(760px,calc(100% - 32px));margin:auto;padding:42px 0}.brand{color:var(--accent);font-weight:900;letter-spacing:.1em;font-size:.85rem}.back{display:inline-block;margin:25px 0;color:var(--accent)}h1{font-size:clamp(2rem,7vw,3.5rem);line-height:1.05;letter-spacing:-.05em;margin:0 0 8px}p{color:var(--muted)}h2{font-size:1.15rem;margin:24px 0 8px}.box{border:1px solid var(--line);background:var(--surface);border-radius:13px;padding:21px;margin-top:20px}li{margin:8px 0;color:#dce0e2}.links{display:flex;gap:9px;flex-wrap:wrap}.links a{border:1px solid #525d64;border-radius:8px;padding:9px 11px;text-decoration:none}.links a:hover{border-color:var(--accent)}.note{border-top:1px solid var(--line);padding-top:16px;margin-top:24px;font-size:.85rem}</style></head><body><main class="wrap"><div class="brand">NEXTECH / REPAIR MANUAL & BACKEND DB</div><a class="back" href="${location.href}#products">← Back to the catalog</a><h1>${esc(p.name)}</h1><p>${esc(p.category)}</p><div class="box"><p>${esc(p.description)}</p><h2>Repair considerations</h2><ul>${p.checks.map(s => `<li>${esc(s)}</li>`).join('')}</ul><h2>Attached YouTube Video Guides (Backend DB)</h2><div class="links">${ytList}</div><h2>Where to source parts & tools</h2><div class="links">${p.shops.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(n)} ↗</a>`).join('')}</div></div><p class="note">NEXTECH demo content with simulated backend database storage. Confirm replacement part specs, warranty policies, and tool requirements before beginning any repair work.</p></main></body></html>`);
    w.document.close();
}));

const deviceNotes = {
    console: 'For consoles, check the official status page and model-specific support guide before trying recovery options.',
    phone: 'For phones, check the manufacturer support guide. Back up important data before updates or resets.',
    laptop: 'For computers, save your work and avoid BIOS/firmware changes unless the manufacturer recommends them.',
    audio: 'For audio gear, check the selected output, pairing mode and compatibility with your source device.',
    gpu: 'For graphics cards, do not open the card or power supply. Check driver guidance from the GPU and PC manufacturers.',
    controller: 'For controllers, check pairing mode, battery level, firmware guidance and platform compatibility.',
    other: 'Use the exact model number to find the manufacturer’s official support steps.'
};

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

document.getElementById('troubleForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = document.getElementById('device').value;
    const s = document.getElementById('symptom').value;
    const notes = document.getElementById('notes').value.trim();
    const f = fixes[s];
    if (!d || !f) return;
    const result = document.getElementById('solution');
    result.innerHTML = `<h4>${f.title}</h4><p><strong>Device:</strong> ${esc(document.getElementById('device').selectedOptions[0].text)}</p><ol>${f.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p><strong>Device-specific note:</strong> ${esc(deviceNotes[d])}</p><p class="caution"><strong>Stop if:</strong> ${esc(f.caution)}</p>${notes ? `<p><strong>Your notes:</strong> ${esc(notes)}</p>` : ''}<p>If these checks do not help, record the exact model and any error code, then contact the manufacturer's support team or a qualified repair professional.</p>`;
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

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