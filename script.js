// Checklist zone keys -> SVG shape ids
const ZONE_TO_SVG = {
  front_truck: 'zone-front',
  back_truck: 'zone-back',
  job_box_1: 'zone-job-left',
  job_box_2: 'zone-job-right',
  front_seat: 'zone-seat-front',
  back_seat: 'zone-seat-back',
  engine: 'zone-engine',
  fuel: 'zone-fuel',
  // Auxiliary kit zones - now in dedicated spaces
  ppe_kit: 'zone-aux-1',
  spc_kit: 'zone-aux-2',
  maintenance_kit: 'zone-aux-3',
  mc4_kit: 'zone-aux-4'
};

// Auxiliary kit keys
const AUX_KEYS = ["ppe_kit", "spc_kit", "maintenance_kit", "mc4_kit"];

// Default loadout configuration
const defaultLoadout = {
  front_truck: ["Windshield", "Tires", "Lights"],
  back_truck: ["Lights", "Tires"],
  front_seat: ["Phone", "Tablet/Computer", "Paperwork", "Procedure/Instructions", "Keys", "Nut Driver"],
  back_seat: ["Medkit – 40 cal", "Kit for Mc4 or other", "Drills", "Impact drill", "Power tools"],
  engine: ["Oil", "Leaks"],
  fuel: ["Cap is Closed", "Vehicle Mileage", "Fuel Level"],
  job_box_1: ["Hot Stick", "Screw driver", "Zip Ties", "Locks", "Torque Wrench", "8 PVC"], 
  job_box_2: ["Loto Boxes", "Eye Loops", "Sockets Torque Wrench"]
};

// Auxiliary kit configurations
const auxiliaryKits = {
  spc_kit: {
    spc_kit: ["Battery", "Row Turner", "Serial", "Cable", "Screw Driver"]
  },
  maintenance_kit: {
    maintenance_kit: [
      "Leaf blower", "Desiccants", "Brushes", "Paper towels", "Trash bags",
      "RIV Nut Pieces", "Rags", "Lint free cloth", "Spill Kill", "Putty and Pig mat"
    ]
  },
  mc4_kit: {
    mc4_kit: ["Male/Female Ends", "Stripper", "Zip ties", "Clamshells", "Plugs", "Tags"]
  },
  ppe_kit: {
    ppe_kit: ["Helmet", "Glasses", "Gloves", "Boots"]
  }
};

// Application state
let currentLoadout = {};
let checkedItems = {};
let activeKits = [];

// Helper functions for SVG zone management
function setSvgZoneDone(svgId, isDone) {
  const el = document.getElementById(svgId);
  if (el) el.classList.toggle('done', !!isDone);
}

function setSvgZoneInactive(svgId, inactive) {
  const el = document.getElementById(svgId);
  if (el) el.classList.toggle('inactive', !!inactive);
}

function refreshAuxPadStates() {
  AUX_KEYS.forEach(k => {
    const svgId = ZONE_TO_SVG[k];
    if (!svgId) return;
    const isActive = activeKits.includes(k);
    setSvgZoneInactive(svgId, !isActive);
    if (!isActive) setSvgZoneDone(svgId, false); // never show green when off
  });
}

// Initialize the application
function init() {
  loadFromStorage();
  renderChecklist();
}

// Render the checklist and update visual states
function renderChecklist() {
  document.querySelectorAll(".zone").forEach(zoneEl => {
    const zone = zoneEl.dataset.zone;
    const listEl = zoneEl.querySelector("ul");
    listEl.innerHTML = "";

    const items = currentLoadout[zone] || [];
    items.forEach((item, i) => {
      const li = document.createElement("li");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checkedItems[zone]?.[i] || false;
      input.onchange = () => {
        checkedItems[zone][i] = input.checked;
        saveToStorage();
        renderChecklist();
      };
      li.appendChild(input);
      li.append(` ${item}`);
      listEl.appendChild(li);
    });

    // Check if zone is completed
    const allChecked = items.length > 0 && checkedItems[zone]?.every(Boolean);
    zoneEl.classList.toggle("completed", allChecked);

    // Update SVG visual state
    if (ZONE_TO_SVG[zone]) {
      setSvgZoneDone(ZONE_TO_SVG[zone], allChecked);
    }

    // Hide auxiliary kit zones if not active
    const isAuxZone = AUX_KEYS.includes(zone);
    const shouldShow = currentLoadout[zone] && currentLoadout[zone].length > 0;
    zoneEl.style.display = (!isAuxZone || shouldShow) ? "" : "none";
  });

  // Highlight active auxiliary kit buttons
  document.querySelectorAll("aside button").forEach(btn => {
    const kit = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
    btn.classList.toggle("active", activeKits.includes(kit));
  });

  // Update auxiliary kit visual states
  refreshAuxPadStates();
}

// Reset the entire checklist
function resetChecklist() {
  checkedItems = {};
  activeKits = [];
  loadDefaultLoadout();
  renderChecklist();
  saveToStorage();
}

// Toggle auxiliary kit on/off
function toggleKit(kitKey) {
  const isActive = activeKits.includes(kitKey);
  if (isActive) {
    activeKits = activeKits.filter(k => k !== kitKey);
  } else {
    activeKits.push(kitKey);
  }
  updateCurrentLoadout();
  renderChecklist();
  saveToStorage();
}

// Update the current loadout based on default + active kits
function updateCurrentLoadout() {
  const previousChecked = JSON.parse(JSON.stringify(checkedItems || {}));
  loadDefaultLoadout();

  activeKits.forEach(kitKey => {
    const kit = auxiliaryKits[kitKey];
    for (const zone in kit) {
      if (!currentLoadout[zone]) currentLoadout[zone] = [];
      currentLoadout[zone] = currentLoadout[zone].concat(kit[zone]);
    }
  });

  // Preserve previous check states where possible
  for (const zone in currentLoadout) {
    const old = previousChecked[zone] || [];
    checkedItems[zone] = currentLoadout[zone].map((_, i) => old[i] || false);
  }
}

// Load the default truck loadout
function loadDefaultLoadout() {
  currentLoadout = JSON.parse(JSON.stringify(defaultLoadout));
  for (const zone in currentLoadout) {
    if (!checkedItems[zone]) {
      checkedItems[zone] = new Array(currentLoadout[zone].length).fill(false);
    }
  }
}

// Save state to localStorage
function saveToStorage() {
  localStorage.setItem("checkedItems", JSON.stringify(checkedItems));
  localStorage.setItem("activeKits", JSON.stringify(activeKits));
  localStorage.setItem("lastSaved", new Date().toISOString());
  document.getElementById("last-saved").textContent = "Last saved: just now";
}

// Load state from localStorage
function loadFromStorage() {
  const storedChecked = JSON.parse(localStorage.getItem("checkedItems"));
  const storedKits = JSON.parse(localStorage.getItem("activeKits"));
  const lastSaved = localStorage.getItem("lastSaved");

  checkedItems = storedChecked || {};
  activeKits = storedKits || [];

  updateCurrentLoadout();

  if (lastSaved) {
    document.getElementById("last-saved").textContent = "Last saved: " + new Date(lastSaved).toLocaleString();
  }
}

// Initialize the application when page loads
init();
