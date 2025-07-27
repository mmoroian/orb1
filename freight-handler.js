document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("freight_rates");
  const countryDropdown = document.getElementById("freight_country");
  const countrySelect = document.getElementById("freight_country");
  const countryNameInput = document.getElementById("freight_country_name");

  // Capitalize country name
  countryNameInput.addEventListener("blur", () => {
    const val = countryNameInput.value.trim();
    if (!val) return;
    const capitalized = val
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    countryNameInput.value = capitalized;
  });

  // Populate dropdown
  async function refreshCountryDropdown() {
    try {
      const res = await fetch("/freight-rates");
      const all = await res.json();
      countrySelect.innerHTML = `<option value="">-- Please choose --</option>`;
      all.forEach(entry => {
        const opt = document.createElement("option");
        opt.value = entry.country_name;
        opt.textContent = entry.country_name;
        countrySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to fetch country list", err);
    }
  }


  // Load selected country
  window.loadCountryByName = async () => {
    const selected = countrySelect.value;
    if (!selected) {
      alert("Please select a country.");
      return;
    }

    try {
      const res = await fetch("/freight-rates");
      const all = await res.json();
      const found = all.find(entry => entry.country_name === selected);
      if (!found) {
        alert("Country not found.");
        return;
      }

      countryNameInput.value = found.country_name;
      if (found.minimums) {
        setVal("freight_minimum", found.minimums.freight || "");
      }

      found.rates.forEach((rate, i) => {
        const n = i + 1;
        setVal(`freight_min${n}`, rate.min);
        setVal(`freight_max${n}`, rate.max);
        setVal(`freight_rate${n}`, rate.freight_rate);
        setRadioVal(`freight_rate_type_${n}`, rate.freight_rate_type);
        setVal(`freight_markup_rate${n}`, rate.markup);
        setRadioVal(`freight_markup_rate_type_${n}`, rate.markup_type);
      });

      alert("Country loaded.");
    } catch (err) {
      console.error("Error loading country:", err);
    }
  };

  // Save country
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const country_name = countryNameInput.value.trim();
    if (!country_name) return alert("Please enter a country name");

    const data = { country_name, rates: [] };
    data.minimums = {
      freight: getVal("freight_minimum")
    };

    const rows = document.querySelectorAll(".freight-row");
    rows.forEach((row, i) => {
      const n = i + 1;

      const rowData = {
        min: getVal(`freight_min${n}`),
        max: getVal(`freight_max${n}`),
        freight_rate: getVal(`freight_rate${n}`),
        freight_rate_type: getRadioVal(`freight_rate_type_${n}`),
        markup: getVal(`freight_markup_rate${n}`),
        markup_type: getRadioVal(`freight_markup_rate_type_${n}`)
      };

      if (!rowData.min && !rowData.max) return;
      data.rates.push(rowData);
    });

    try {
      const res = await fetch("/freight-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("Freight rates saved successfully.");
        await refreshCountryDropdown(); // also defined in your script
      } else {
        throw new Error("Failed to save data");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save freight rates.");
    }
  });



  const addBtn = document.getElementById("addFreightRow");
  let rowCounter = 6;

  addBtn.addEventListener("click", () => {
    rowCounter++;

    const lastRow = document.querySelector(".freight-row:last-of-type");
    if (!lastRow) return alert("No row to clone");

    const clone = lastRow.cloneNode(true);
    clone.setAttribute("data-index", rowCounter);

    // Update IDs and names
    clone.querySelectorAll("input, label").forEach(el => {
      ["id", "name", "for"].forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.setAttribute(attr, el.getAttribute(attr).replace(/\d+$/, rowCounter));
        }
      });

      // Uncheck radio buttons and clear values
      if (el.type === "radio" || el.type === "checkbox") {
        el.checked = false;
      } else if (el.tagName === "INPUT") {
        el.value = "";
      }
    });

    document.querySelector(".freight_grid").appendChild(clone);
  });

  refreshCountryDropdown();

});


function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getRadioVal(name) {
  const radios = document.getElementsByName(name);
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return "";
}

function setRadioVal(name, value) {
  const radios = document.getElementsByName(name);
  for (const r of radios) {
    r.checked = (r.value === value);
  }
}

// freight-handler.js (corrected with working load logic)

// Helper functions
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getRadioVal(name) {
  const radios = document.getElementsByName(name);
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return "";
}

function setRadioVal(name, value) {
  const radios = document.getElementsByName(name);
  for (const r of radios) {
    r.checked = (r.value === value);
  }
}