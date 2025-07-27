document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("da_rates");
  const companySelect = document.getElementById("da_company");
  const companyNameInput = document.getElementById("da_company_name");
  const currencySelect = document.getElementById("da_currency");

  companyNameInput.addEventListener("blur", () => {
    const val = companyNameInput.value.trim();
    if (!val) return;
    const capitalized = val
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    companyNameInput.value = capitalized;
  });

  async function refreshCompanyDropdown() {
    try {
      const res = await fetch("/da-rates");
      const all = await res.json();
      companySelect.innerHTML = `<option value="">-- Please choose --</option>`;
      all.forEach(entry => {
        const opt = document.createElement("option");
        opt.value = entry.company_name;
        opt.textContent = entry.company_name;
        companySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to fetch company list", err);
    }
  }

  window.loadDACompanyByName = async () => {
    const selected = companySelect.value;
    if (!selected) {
      alert("Please select a company.");
      return;
    }

    try {
      const res = await fetch("/da-rates");
      const all = await res.json();
      const found = all.find(entry => entry.company_name === selected);
      if (!found) return alert("Company not found.");

      companyNameInput.value = found.company_name || "";
      currencySelect.value = found.currency || "";

      const required = found.rates.length;
      while (daRangeCounter < required) {
        addDARowBtn.click();
      }



      for (let i = 1; i <= daRangeCounter; i++) {
        const rate = found.rates?.[i - 1] || {};
        setVal(`da_country${i}`, rate.country || "");
        setVal(`da_minimum${i}`, rate.minimum || "");
        setVal(`da_min${i}`, rate.min || "");
        setVal(`da_max${i}`, rate.max || "");
        setVal(`da_rate${i}`, rate.da_rate || "");
        setRadioVal(`da_rate_type_${i}`, rate.da_rate_type || "");
        setVal(`da_markup_rate${i}`, rate.markup || "");
        setRadioVal(`da_markup_rate_type_${i}`, rate.markup_type || "");

        setVal(`da_travel_min${i}`, rate.da_travel_min || "");
        setVal(`da_travel_max${i}`, rate.da_travel_max || "");
        setVal(`da_travel_rate${i}`, rate.da_travel_rate || "");
        setRadioVal(`da_travel_type_${i}`, rate.da_travel_rate_type || "");

        setVal(`da_elevator_min${i}`, rate.da_elevator_min || "");
        setVal(`da_elevator_max${i}`, rate.da_elevator_max || "");
        setVal(`da_elevator_rate${i}`, rate.da_elevator_rate || "");
        setRadioVal(`da_elevator_type_${i}`, rate.da_elevator_rate_type || "");

        setVal(`da_longcarry_min${i}`, rate.da_longcarry_min || "");
        setVal(`da_longcarry_max${i}`, rate.da_longcarry_max || "");
        setVal(`da_longcarry_rate${i}`, rate.da_longcarry_rate || "");
        setRadioVal(`da_longcarry_type_${i}`, rate.da_longcarry_rate_type || "");

      }

      alert("Company loaded.");
    } catch (err) {
      console.error("Error loading company:", err);
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const company_name = companyNameInput.value.trim();
    if (!company_name) return alert("Please enter a company name");

    const data = {
      company_name,
      currency: currencySelect.value,
      rates: []
    };

    for (let i = 1; i <= daRangeCounter; i++) {
      const row = {
        country: getVal(`da_country${i}`),
        minimum: getVal(`da_minimum${i}`),
        min: getVal(`da_min${i}`),
        max: getVal(`da_max${i}`),
        da_rate: getVal(`da_rate${i}`),
        da_rate_type: getRadioVal(`da_rate_type_${i}`),
        markup: getVal(`da_markup_rate${i}`),
        markup_type: getRadioVal(`da_markup_rate_type_${i}`),

        da_travel_min: getVal(`da_travel_min${i}`),
        da_travel_max: getVal(`da_travel_max${i}`),
        da_travel_rate: getVal(`da_travel_rate${i}`),
        da_travel_rate_type: getRadioVal(`da_travel_type_${i}`),

        da_elevator_min: getVal(`da_elevator_min${i}`),
        da_elevator_max: getVal(`da_elevator_max${i}`),
        da_elevator_rate: getVal(`da_elevator_rate${i}`),
        da_elevator_rate_type: getRadioVal(`da_elevator_type_${i}`),

        da_longcarry_min: getVal(`da_longcarry_min${i}`),
        da_longcarry_max: getVal(`da_longcarry_max${i}`),
        da_longcarry_rate: getVal(`da_longcarry_rate${i}`),
        da_longcarry_rate_type: getRadioVal(`da_longcarry_type_${i}`)

      };

      if (!row.country && !row.minimum && !row.min && !row.max) continue;
      data.rates.push(row);
    }

    try {
      const res = await fetch("/da-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Server error");
      alert("Company saved.");
      await refreshCompanyDropdown();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed.");
    }
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

  refreshCompanyDropdown();
});


// Add new line button
const addDARowBtn = document.getElementById("addDARow");
let daRangeCounter = 8;

addDARowBtn.addEventListener("click", () => {
  daRangeCounter++;

  const daGrid = document.querySelector(".da_grid");

  // Row: da_country
  const inputCountry = document.createElement("input");
  inputCountry.type = "text";
  inputCountry.id = `da_country${daRangeCounter}`;
  inputCountry.name = `da_country${daRangeCounter}`;
  daGrid.appendChild(inputCountry);

  // Row: da_minimum
  const inputMinimum = document.createElement("input");
  inputMinimum.type = "number";
  inputMinimum.step = "0.01";
  inputMinimum.id = `da_minimum${daRangeCounter}`;
  inputMinimum.name = `da_minimum${daRangeCounter}`;
  daGrid.appendChild(inputMinimum);

  // Row: da_min
  const inputMin = document.createElement("input");
  inputMin.type = "number";
  inputMin.step = "0.01";
  inputMin.id = `da_min${daRangeCounter}`;
  inputMin.name = `da_min${daRangeCounter}`;
  daGrid.appendChild(inputMin);

  // Row: da_max
  const inputMax = document.createElement("input");
  inputMax.type = "number";
  inputMax.step = "0.01";
  inputMax.id = `da_max${daRangeCounter}`;
  inputMax.name = `da_max${daRangeCounter}`;
  daGrid.appendChild(inputMax);

  // Row: da_rate
  const inputRate = document.createElement("input");
  inputRate.type = "number";
  inputRate.step = "0.01";
  inputRate.id = `da_rate${daRangeCounter}`;
  inputRate.name = `da_rate${daRangeCounter}`;
  daGrid.appendChild(inputRate);

  // Row: da_rate_type (radio group in div)
  const rateDiv = document.createElement("div");

  const rateRadioVar = document.createElement("input");
  rateRadioVar.type = "radio";
  rateRadioVar.id = `da_rate_type_v_${daRangeCounter}`;
  rateRadioVar.name = `da_rate_type_${daRangeCounter}`;
  rateRadioVar.value = "variable";
  const rateLabelVar = document.createElement("label");
  rateLabelVar.setAttribute("for", rateRadioVar.id);
  rateLabelVar.textContent = "Variable";

  const br1 = document.createElement("br");

  const rateRadioFlat = document.createElement("input");
  rateRadioFlat.type = "radio";
  rateRadioFlat.id = `da_rate_type_f_${daRangeCounter}`;
  rateRadioFlat.name = `da_rate_type_${daRangeCounter}`;
  rateRadioFlat.value = "flat";
  const rateLabelFlat = document.createElement("label");
  rateLabelFlat.setAttribute("for", rateRadioFlat.id);
  rateLabelFlat.textContent = "Flat";

  rateDiv.append(rateRadioVar, rateLabelVar, br1, rateRadioFlat, rateLabelFlat);
  daGrid.appendChild(rateDiv);

  // Row: da_markup_rate
  const inputMarkup = document.createElement("input");
  inputMarkup.type = "number";
  inputMarkup.step = "0.01";
  inputMarkup.id = `da_markup_rate${daRangeCounter}`;
  inputMarkup.name = `da_markup_rate${daRangeCounter}`;
  daGrid.appendChild(inputMarkup);

  // Row: da_markup_rate_type (radio group in div)
  const markupDiv = document.createElement("div");

  const markupRadioVar = document.createElement("input");
  markupRadioVar.type = "radio";
  markupRadioVar.id = `da_markup_rate_type_v_${daRangeCounter}`;
  markupRadioVar.name = `da_markup_rate_type_${daRangeCounter}`;
  markupRadioVar.value = "variable";
  const markupLabelVar = document.createElement("label");
  markupLabelVar.setAttribute("for", markupRadioVar.id);
  markupLabelVar.textContent = "Multip.";

  const br2 = document.createElement("br");

  const markupRadioFlat = document.createElement("input");
  markupRadioFlat.type = "radio";
  markupRadioFlat.id = `da_markup_rate_type_f_${daRangeCounter}`;
  markupRadioFlat.name = `da_markup_rate_type_${daRangeCounter}`;
  markupRadioFlat.value = "flat";
  const markupLabelFlat = document.createElement("label");
  markupLabelFlat.setAttribute("for", markupRadioFlat.id);
  markupLabelFlat.textContent = "Flat";

  markupDiv.append(markupRadioVar, markupLabelVar, br2, markupRadioFlat, markupLabelFlat);
  daGrid.appendChild(markupDiv);
});
