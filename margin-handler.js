document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("freight_rates");

  window.loadOrbit = async () => {
    try {
      const res = await fetch("/margin-rates");
      if (!res.ok) throw new Error("Failed to load margin data");
      const data = await res.json();

      // top-level margins
      setVal("oa_v_rate", data.oa_v_rate || "");
      setVal("oa_min_flat_rate", data.oa_min_flat_rate || "");
      setVal("oa_min_add_rate", data.oa_min_add_rate || "");

      setVal("da_v_rate", data.da_v_rate || "");
      setVal("da_min_flat_rate", data.da_min_flat_rate || "");
      setVal("da_min_add_rate", data.da_min_add_rate || "");

      setVal("aqis_v_rate", data.aqis_v_rate || "");
      setVal("aqis_min_flat_rate", data.aqis_min_flat_rate || "");
      setVal("aqis_min_add_rate", data.aqis_min_add_rate || "");

      // ---- Accessorial Charges ----
      const accessorials = Array.isArray(data.accessorials) ? data.accessorials : [];
      // Ensure enough UI rows exist
      ensureAccessorialRows(accessorials.length);

      // Populate rows
      accessorials.forEach((item, idx) => {
        const i = idx + 1;
        setVal(`accessorial_name${i}`, item.name || "");
        setVal(`accessorial_rate${i}`, item.rate || "");
        setVal(`accessorial_min${i}`, item.minimum || "");
        setAccessorialType(i, item.type || "");
      });

      alert("Orbit margin rates loaded.");
    } catch (err) {
      console.error("Load error:", err);
      alert("Failed to load Orbit margin rates.");
    }
  };


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      // existing top-level fields
      oa_v_rate: getVal("oa_v_rate"),
      oa_min_flat_rate: getVal("oa_min_flat_rate"),
      oa_min_add_rate: getVal("oa_min_add_rate"),
      da_v_rate: getVal("da_v_rate"),
      da_min_flat_rate: getVal("da_min_flat_rate"),
      da_min_add_rate: getVal("da_min_add_rate"),
      aqis_v_rate: getVal("aqis_v_rate"),
      aqis_min_flat_rate: getVal("aqis_min_flat_rate"),
      aqis_min_add_rate: getVal("aqis_min_add_rate"),

      // NEW: accessorials array
      accessorials: []
    };

    // Gather all current accessorial UI rows (initial + any added)
    const total = getAccessorialRowCount();
    for (let i = 1; i <= total; i++) {
      const name = getVal(`accessorial_name${i}`);
      const rate = getVal(`accessorial_rate${i}`);
      const minimum = getVal(`accessorial_min${i}`);
      const type = getAccessorialType(i); // "variable" | "flat" | ""

      // Save only non-empty rows (any field populated)
      if (name || rate || minimum || type) {
        data.accessorials.push({ name, rate, minimum, type });
      }
    }

    try {
      const res = await fetch("/margin-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Orbit margin rates saved.");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save Orbit margin rates.");
    }
  });

});

// Helper functions
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getAccessorialRowCount() {
  return document.querySelectorAll('.trucking_grid input[id^="accessorial_name"]').length || 0;
}

// Ensure we have N rows; uses your existing "Add New Line" button.
function ensureAccessorialRows(n) {
  const btn = document.getElementById("addnRow");
  if (!btn) return;
  while (getAccessorialRowCount() < n) btn.click();
}

// Read radio choice for a row i (your HTML gives separate names per radio)
function getAccessorialType(i) {
  const varEl = document.getElementById(`accessorial_v_${i}`);
  const flatEl = document.getElementById(`accessorial_f_${i}`);

  // Handle odd cases where both unchecked or both checked
  if (varEl?.checked && !flatEl?.checked) return "variable";
  if (flatEl?.checked && !varEl?.checked) return "flat";
  if (varEl?.checked) return "variable";
  if (flatEl?.checked) return "flat";
  return "";
}

// Set radio choice for a row i
function setAccessorialType(i, value) {
  const varEl = document.getElementById(`accessorial_v_${i}`);
  const flatEl = document.getElementById(`accessorial_f_${i}`);
  if (!varEl || !flatEl) return;
  varEl.checked = (value === "variable");
  flatEl.checked = (value === "flat");
}







// Accessorial Charges: Add New Line (append to bottom grid, not the top section)
const addAccessorialRowBtn =
  document.getElementById("addnRow") || document.getElementById("addDARow");
if (addAccessorialRowBtn) {
  // start from existing count (HTML ships with 5 rows)
  let accessorialCounter =
    document.querySelectorAll('.trucking_grid input[id^="accessorial_name"]').length || 5;

  addAccessorialRowBtn.addEventListener("click", () => {
    accessorialCounter++;

    const grid = document.querySelector(".trucking_grid");

    // Name
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = `accessorial_name${accessorialCounter}`;
    nameInput.name = `accessorial_name${accessorialCounter}`;
    grid.appendChild(nameInput);

    // Rate $
    const rateInput = document.createElement("input");
    rateInput.type = "number";
    rateInput.step = "0.01";
    rateInput.id = `accessorial_rate${accessorialCounter}`;
    rateInput.name = `accessorial_rate${accessorialCounter}`;
    grid.appendChild(rateInput);

    // Minimum (flat) $
    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.step = "0.01";
    minInput.id = `accessorial_min${accessorialCounter}`;
    minInput.name = `accessorial_min${accessorialCounter}`;
    grid.appendChild(minInput);

    // Rate Type (match existing markup style)
    const typeDiv = document.createElement("div");

    const varRadio = document.createElement("input");
    varRadio.type = "radio";
    varRadio.id = `accessorial_v_${accessorialCounter}`;
    varRadio.name = `accessorial_v_${accessorialCounter}`; // mirrors existing rows
    varRadio.value = "variable";
    const varLabel = document.createElement("label");
    varLabel.setAttribute("for", varRadio.id);
    varLabel.textContent = "Variable";

    const br = document.createElement("br");

    const flatRadio = document.createElement("input");
    flatRadio.type = "radio";
    flatRadio.id = `accessorial_f_${accessorialCounter}`;
    flatRadio.name = `accessorial_f_${accessorialCounter}`; // mirrors existing rows
    flatRadio.value = "flat";
    const flatLabel = document.createElement("label");
    flatLabel.setAttribute("for", flatRadio.id);
    flatLabel.textContent = "Flat";

    typeDiv.append(varRadio, varLabel, br, flatRadio, flatLabel);
    grid.appendChild(typeDiv);
  });
}
