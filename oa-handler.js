document.addEventListener("DOMContentLoaded", () => { // Loader function
  const form = document.getElementById("oa_rates");
  const companySelect = document.getElementById("oa_company");
  const companyNameInput = document.getElementById("oa_company_name");


  // Capitalize company name
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

  // Load all companies into the dropdown
  async function refreshCompanyDropdown() {
    try {
      const res = await fetch("/oa-rates");
      const all = await res.json();
      companySelect.innerHTML = `<option value="">-- Please choose --</option>`;
      Object.values(all).forEach(entry => {
        const opt = document.createElement("option");
        opt.value = entry.company_name;
        opt.textContent = entry.company_name;
        companySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to fetch company list", err);
    }
  }

  // Load selected company
  window.loadCompanyByName = async () => {
    const selected = companySelect.value;
    if (!selected) {
      alert("Please select a company.");
      return;
    }

    try {
      const res = await fetch("/oa-rates");
      const all = await res.json();
      const found = all.find(entry => entry.company_name === selected);
      if (!found) {
        alert("Company not found.");
        return;
      }

      companyNameInput.value = found.company_name;
      setVal("oa_assigned_province", found.assigned_province || "");

      if (found.minimums) {
        setVal("full_minimum", found.minimums.full || "");
        setVal("wrap_minimum", found.minimums.wrap || "");
        setVal("pbo_minimum", found.minimums.pbo || "");
        setVal("dropoff_minimum", found.minimums.dropoff || "");
        setVal("markup_minimum", found.minimums.markup || "");
      }

      found.rates.forEach((rate, i) => {
        const n = i + 1;
        setVal(`min${n}`, rate.min);
        setVal(`max${n}`, rate.max);
        setVal(`full_rate${n}`, rate.full_rate);
        setRadioVal(`oa_full_rate_type_${n}`, rate.full_rate_type);
        setVal(`wrap_rate${n}`, rate.wrap_rate);
        setRadioVal(`oa_wrap_rate_type_${n}`, rate.wrap_rate_type);      // ✅
        setVal(`pbo_rate${n}`, rate.pbo_rate);
        setRadioVal(`oa_pbo_rate_type_${n}`, rate.pbo_rate_type);        // ✅
        setVal(`dropoff_rate${n}`, rate.dropoff_rate);
        setRadioVal(`oa_dropoff_rate_type_${n}`, rate.dropoff_rate_type);
        setVal(`markup_rate${n}`, rate.markup);                              // ✅
        setRadioVal(`oa_markup_rate_type_${n}`, rate.markup_type);
        setVal(`travel_min${n}`, rate.travel_min);
        setVal(`travel_max${n}`, rate.travel_max);
        setRadioVal(`travel_type_${n}`, rate.travel_rate_type);
        setVal(`elevator_min${n}`, rate.elevator_min);
        setVal(`elevator_max${n}`, rate.elevator_max);
        setRadioVal(`elevator_type_${n}`, rate.elevator_rate_type);
        setVal(`longcarry_min${n}`, rate.longcarry_min);
        setVal(`longcarry_max${n}`, rate.longcarry_max);
        setRadioVal(`longcarry_type_${n}`, rate.longcarry_rate_type);
        setVal(`travel_rate${n}`, rate.travel_rate);
        setVal(`elevator_rate${n}`, rate.elevator_rate);
        setVal(`longcarry_rate${n}`, rate.longcarry_rate);
      });


      alert("Company loaded.");
    } catch (err) {
      console.error("Error loading company:", err);
    }
  };

  // Save company
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const company_name = companyNameInput.value.trim();
    if (!company_name) return alert("Please enter a company name");

    const data = {
      company_name,
      assigned_province: getVal("oa_assigned_province"), // Assigned province to OA provider
      rates: []
    };

    data.minimums = {
      full: getVal("full_minimum"),
      wrap: getVal("wrap_minimum"),
      pbo: getVal("pbo_minimum"),
      dropoff: getVal("dropoff_minimum"),
      markup: getVal("markup_minimum")
    };

    for (let i = 1; i <= 10; i++) {
      const row = {
        min: getVal(`min${i}`),
        max: getVal(`max${i}`),
        full_rate: getVal(`full_rate${i}`),
        full_rate_type: getRadioVal(`oa_full_rate_type_${i}`),
        wrap_rate: getVal(`wrap_rate${i}`),
        wrap_rate_type: getRadioVal(`oa_wrap_rate_type_${i}`),        // ✅ ADDED
        pbo_rate: getVal(`pbo_rate${i}`),
        pbo_rate_type: getRadioVal(`oa_pbo_rate_type_${i}`),          // ✅ ADDED
        dropoff_rate: getVal(`dropoff_rate${i}`),
        dropoff_rate_type: getRadioVal(`oa_dropoff_rate_type_${i}`),
        markup: getVal(`markup_rate${i}`),                                // ✅ ADDED
        markup_type: getRadioVal(`oa_markup_rate_type_${i}`),
        travel_min: getVal(`travel_min${i}`),
        travel_max: getVal(`travel_max${i}`),
        travel_rate_type: getRadioVal(`travel_type_${i}`),
        elevator_min: getVal(`elevator_min${i}`),
        elevator_max: getVal(`elevator_max${i}`),
        elevator_rate_type: getRadioVal(`elevator_type_${i}`),
        longcarry_min: getVal(`longcarry_min${i}`),
        longcarry_max: getVal(`longcarry_max${i}`),
        longcarry_rate_type: getRadioVal(`longcarry_type_${i}`),
        travel_rate: getVal(`travel_rate${i}`),
        elevator_rate: getVal(`elevator_rate${i}`),
        longcarry_rate: getVal(`longcarry_rate${i}`)
      };


      if (!row.min && !row.max) continue;
      data.rates.push(row);
    }

    try {
      const res = await fetch("/oa-rates", {
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
