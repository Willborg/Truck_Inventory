const defaultLoadout = {
  front_truck: ["Windshield", "Tires", "Lights"],
  back_truck: ["Lights", "Tires"],
  front_seat: ["Phone", "Tablet/Computer", "Paperwork", "Procedure/Instructions", "Keys", "Nut Driver"],
  back_seat: ["Medkit – 40 cal", "Keit for Mc4 or other", "Drills", "Impact drill", "Power tools"],
  engine: ["Oil", "Leaks"],
  fuel: ["Cap is Closed", "Vehicle Milage", "Fuel Level"],
  job_box_1: ["Hot Stick", "Screw driver", "Zip Times", "Locks", "Torque Wrench", "8” PVC"],
  job_box_2: ["Loto Boxes", "Eye Loops", "Sockets Torque Wrench"]
};

const auxiliaryKits = {
  spc_kit: {
    spc_kit: ["Battery", "Row Turner", "Serial", "Cable", "Screw Driver"]
  },
  maintenance_kit: {
    maintenance_kit: [
      "Leaf blower", "Desecants", "Brushes", "Paper towels", "Trash bags",
      "RIV Nut Pieces", "Rags", "Lint free cloth", "Spill Kill", "Puddy and Pig mat"
    ]
  },
  mc4_kit: {
    mc4_kit: ["Male/Female Ends", "Stripper", "Zip ties", "Clamshells", "Plugs", "Tags"]
  },
  ppe_kit: {
    ppe_kit: ["Helmet", "Glasses", "Gloved", "Boots"]
  }
};

let currentLoadout = {};
let checkedItems = {};
let activeKits = [];

function init() {
  loadFromStorage();
  renderChecklist();
}

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
        renderChecklist(); // rerender to check zone state
      };
      li.appendChild(input);
      li.append(` ${item}`);
      listEl.appendChild(li);
    });

    const allChecked = checkedItems[zone]?.every(Boolean);
    zoneEl.classList.toggle("completed", allChecked);

    // Hide auxiliary kit zones if not active
    const isAuxZone = ["ppe_kit", "spc_kit", "maintenance_kit", "mc4_kit"].includes(zone);
    const shouldShow = currentLoadout[zone] && currentLoadout[zone].length > 0;
    zoneEl.style.display = (!isAuxZone || shouldShow) ? "" : "none";

  });

  // Highlight active buttons
  document.querySelectorAll("aside button").forEach(btn => {
    const kit = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
    btn.classList.toggle("active", activeKits.includes(kit));
  });
}

function resetChecklist() {
  checkedItems = {};
  activeKits = [];
  loadDefaultLoadout();
  renderChecklist();
  saveToStorage();
}

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

function updateCurrentLoadout() {
  const previousChecked = structuredClone(checkedItems);
  loadDefaultLoadout();

  activeKits.forEach(kitKey => {
    const kit = auxiliaryKits[kitKey];
    for (const zone in kit) {
      if (!currentLoadout[zone]) currentLoadout[zone] = [];
      currentLoadout[zone] = currentLoadout[zone].concat(kit[zone]);
    }
  });

  for (const zone in currentLoadout) {
    const old = previousChecked[zone] || [];
    checkedItems[zone] = currentLoadout[zone].map((_, i) => old[i] || false);
  }
}

function loadDefaultLoadout() {
  currentLoadout = JSON.parse(JSON.stringify(defaultLoadout));
  for (const zone in currentLoadout) {
    checkedItems[zone] = new Array(currentLoadout[zone].length).fill(false);
  }
}

function saveToStorage() {
  localStorage.setItem("checkedItems", JSON.stringify(checkedItems));
  localStorage.setItem("activeKits", JSON.stringify(activeKits));
  localStorage.setItem("lastSaved", new Date().toISOString());
  document.getElementById("last-saved").textContent = "Last saved: just now";
}

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

init();
