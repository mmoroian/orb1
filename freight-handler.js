// freight-handler.js — flattened FCL/DTHC/Drayage fields at top-level in JSON

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("freight_rates");
  const countrySelect = document.getElementById("freight_country");
  const countryNameInput = document.getElementById("freight_country_name");
  const addBtn = document.getElementById("addFreightRow");
  let rowCounter = 6; // default rows end at 6

  // ---------- Helpers ----------
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
  }
  function getRadioVal(name) {
    const radios = document.getElementsByName(name);
    for (const r of radios) if (r.checked) return r.value;
    return "";
  }
  function setRadioVal(name, value) {
    const radios = document.getElementsByName(name);
    for (const r of radios) r.checked = (r.value === value);
  }

  // Normalize to lowercase for key consistency
  countryNameInput.addEventListener("blur", () => {
    const val = countryNameInput.value.trim();
    if (!val) return;
    countryNameInput.value = val.toLowerCase();
  });

  // ---------- Populate dropdown ----------
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

  // ---------- Load selected country into form ----------
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

      // Core fields
      countryNameInput.value = found.country_name || "";
      if (found.minimums) {
        setVal("freight_minimum", found.minimums.freight || "");
      }

      // NEW: flattened top-level fields (match HTML IDs)
      setVal("freight_fcl20", found.freight_fcl20 || "");
      setVal("freight_fcl20_currency", found.freight_fcl20_currency || "usd");
      setVal("freight_fcl20_dthc", found.freight_fcl20_dthc || "");
      setVal("freight_fcl20_dthc_currency", found.freight_fcl20_dthc_currency || "usd");

      setVal("freight_fcl40", found.freight_fcl40 || "");
      setVal("freight_fcl40_currency", found.freight_fcl40_currency || "usd");
      setVal("freight_fcl40_dthc", found.freight_fcl40_dthc || "");
      setVal("freight_fcl40_dthc_currency", found.freight_fcl40_dthc_currency || "usd");

      setVal("freight_drayage", found.freight_drayage || "");
      setVal("freight_drayage_currency", found.freight_drayage_currency || "usd");

      // Range rows
      found.rates?.forEach((rate, i) => {
        const n = i + 1; // header row is first .freight-row
        setVal(`freight_min${n}`, rate.min || "");
        setVal(`freight_max${n}`, rate.max || "");
        setVal(`freight_rate${n}`, rate.freight_rate || "");
        setRadioVal(`freight_rate_type_${n}`, rate.freight_rate_type || "");
        setVal(`freight_markup_rate${n}`, rate.markup || "");
        setRadioVal(`freight_markup_rate_type_${n}`, rate.markup_type || "");
      });

      alert("Country loaded.");
    } catch (err) {
      console.error("Error loading country:", err);
    }
  };

  // ---------- Save (submit) ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const country_name = countryNameInput.value.trim();
    if (!country_name) return alert("Please enter a country name");

    // Collect flattened FCL/DTHC/Drayage (+ currencies)
    const data = {
      country_name,

      // minimums
      minimums: {
        freight: getVal("freight_minimum")
      },

      // flattened fields to satisfy backend writer
      freight_fcl20: getVal("freight_fcl20"),
      freight_fcl20_currency: getVal("freight_fcl20_currency"),
      freight_fcl20_dthc: getVal("freight_fcl20_dthc"),
      freight_fcl20_dthc_currency: getVal("freight_fcl20_dthc_currency"),

      freight_fcl40: getVal("freight_fcl40"),
      freight_fcl40_currency: getVal("freight_fcl40_currency"),
      freight_fcl40_dthc: getVal("freight_fcl40_dthc"),
      freight_fcl40_dthc_currency: getVal("freight_fcl40_dthc_currency"),

      freight_drayage: getVal("freight_drayage"),
      freight_drayage_currency: getVal("freight_drayage_currency"),

      rates: []
    };

    // Gather tier rows (skip blanks)
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
      if (rowData.min || rowData.max) data.rates.push(rowData);
    });

    try {
      const res = await fetch("/freight-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("Freight rates saved successfully.");
        await refreshCountryDropdown();
      } else {
        throw new Error("Failed to save data");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save freight rates.");
    }
  });

  // ---------- Add new tier row ----------
  addBtn.addEventListener("click", () => {
    rowCounter++;

    const lastRow = document.querySelector(".freight-row:last-of-type");
    if (!lastRow) return alert("No row to clone");

    const clone = lastRow.cloneNode(true);
    clone.setAttribute("data-index", rowCounter);

    // Update IDs/names and clear values/checked state
    clone.querySelectorAll("input, label").forEach(el => {
      ["id", "name", "for"].forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.setAttribute(attr, el.getAttribute(attr).replace(/\d+$/, rowCounter));
        }
      });
      if (el.tagName === "INPUT") {
        if (el.type === "radio" || el.type === "checkbox") el.checked = false;
        else el.value = "";
      }
    });

    document.querySelector(".freight_grid").appendChild(clone);
  });

  refreshCountryDropdown();






  // ---------- Populate Rows ----------
  const populateBtn = document.getElementById("populateRows");
  if (populateBtn) {
    populateBtn.addEventListener("click", async () => {
      try {
        // 1) fixed Min/Max cuft tiers (6 rows)
        const tiers = [
          [0, 200],
          [201, 300],
          [301, 400],
          [401, 600],
          [601, 900],
          [901, 9999],
        ];
        tiers.forEach((t, i) => {
          const n = i + 1;
          setVal(`freight_min${n}`, String(t[0]));
          setVal(`freight_max${n}`, String(t[1]));
          // 2) Freight Rate Type -> always "variable"
          setRadioVal(`freight_rate_type_${n}`, "variable");
        });

        // Helpers
        const num = (v) => {
          const x = parseFloat(String(v ?? "").replace(",", "."));
          return Number.isFinite(x) ? x : 0;
        };
        const upp = (s) => String(s || "").trim().toUpperCase();

        // Load exchange rates and margin settings
        const [xrRes, mrRes] = await Promise.all([
          fetch("/exchange-rates"),
          fetch("/margin-rates"),
        ]);
        if (!xrRes.ok) throw new Error("Failed to load exchange rates");
        if (!mrRes.ok) throw new Error("Failed to load margin rates");

        const xr = await xrRes.json(); // { USD, EUR, GBP, AUD, ... }
        const mr = await mrRes.json(); // { da_v_rate: ".85", ... }

        const rateMap = {
          CAD: 1,
          USD: num(xr.USD),
          EUR: num(xr.EUR),
          GBP: num(xr.GBP),
          AUD: num(xr.AUD),
        };

        // Read top-of-page prices + currencies
        const fcl40 = num(getVal("freight_fcl40"));
        const fcl40Cur = upp(getVal("freight_fcl40_currency"));

        const fcl40Dthc = num(getVal("freight_fcl40_dthc"));
        const fcl40DthcCur = upp(getVal("freight_fcl40_dthc_currency"));

        const dray = num(getVal("freight_drayage"));
        const drayCur = upp(getVal("freight_drayage_currency"));

        // Currency conversion to CAD
        const toCAD = (amt, cur) => {
          if (!amt) return 0;
          const r = rateMap[cur] ?? 0;
          if (!r) throw new Error(`Missing exchange rate for ${cur}`);
          return cur === "CAD" ? amt : amt * r;
        };

        // const totalCAD =
        //   toCAD(fcl40, fcl40Cur) +
        //   toCAD(fcl40Dthc, fcl40DthcCur) +
        //   toCAD(dray, drayCur); // convert drayage only if not already CAD


        // Helper: build the CAD total for a given price type ("variable" => FCL20, "flat" => FCL40)
        const fcl20 = num(getVal("freight_fcl20"));
        const fcl20Cur = upp(getVal("freight_fcl20_currency"));

        const fcl20Dthc = num(getVal("freight_fcl20_dthc"));
        const fcl20DthcCur = upp(getVal("freight_fcl20_dthc_currency"));




        const totalForTypeCAD = (markupType /* "variable" | "flat" */) => {
          const use20 = markupType === "variable";   // "FCL20" radio
          const base = use20 ? fcl20 : fcl40;
          const baseCur = use20 ? fcl20Cur : fcl40Cur;
          const dthc = use20 ? fcl20Dthc : fcl40Dthc;
          const dthcCur = use20 ? fcl20DthcCur : fcl40DthcCur;

          return (
            toCAD(base, baseCur) +
            toCAD(dthc, dthcCur) +
            toCAD(dray, drayCur)
          );
        };




        const da_v = num(mr.da_v_rate || 0);
        if (!da_v) throw new Error("da_v_rate is missing or zero");

        // 3) Fill Freight Rate per row:
        //    ((FCL40 CAD + FCL40 DTHC CAD + Drayage CAD) / da_v_rate) / Divisor(row)
        for (let n = 1; n <= 6; n++) {
          const divisor = num(getVal(`freight_markup_rate${n}`)); // "Divisor" column
          if (divisor > 0) {
            const markupType = getRadioVal(`freight_markup_rate_type_${n}`) || "flat";
            const totalCAD = totalForTypeCAD(markupType);



            const rate = (totalCAD / da_v) / divisor;


            const uplift = 1.036; // +%
            const adjusted = (rate * uplift).toFixed(2);  // string with 2 decimals
            setVal(`freight_rate${n}`, adjusted);


            // setVal(`freight_rate${n}`, rate.toFixed(2));
          } else {
            // leave blank if divisor empty/zero
            setVal(`freight_rate${n}`, "");
          }
        }

        alert("Rows populated.");
      } catch (err) {
        console.error(err);
        alert(`Populate failed: ${err.message}`);
      }
    });
  }



  // Recalculate all rows using latest FX + current inputs (no tier resets)
  async function recalcFreightRates() {
    try {
      const num = (v) => {
        const x = parseFloat(String(v ?? "").replace(",", "."));
        return Number.isFinite(x) ? x : 0;
      };
      const upp = (s) => String(s || "").trim().toUpperCase();

      const [xrRes, mrRes] = await Promise.all([
        fetch("/exchange-rates"),
        fetch("/margin-rates"),
      ]);
      if (!xrRes.ok) throw new Error("Failed to load exchange rates");
      if (!mrRes.ok) throw new Error("Failed to load margin rates");

      const xr = await xrRes.json();
      const mr = await mrRes.json();

      const rateMap = {
        CAD: 1,
        USD: num(xr.USD),
        EUR: num(xr.EUR),
        GBP: num(xr.GBP),
        AUD: num(xr.AUD),
      };

      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? "";
      };
      const getRadioVal = (name) => {
        const radios = document.getElementsByName(name);
        for (const r of radios) if (r.checked) return r.value;
        return "";
      };

      const toCAD = (amt, cur) => {
        if (!amt) return 0;
        const r = rateMap[cur] ?? 0;
        if (!r) throw new Error(`Missing exchange rate for ${cur}`);
        return cur === "CAD" ? amt : amt * r;
      };

      // Read top-of-page values
      const fcl20 = num(getVal("freight_fcl20"));
      const fcl20Cur = upp(getVal("freight_fcl20_currency"));
      const fcl20Dthc = num(getVal("freight_fcl20_dthc"));
      const fcl20DthcCur = upp(getVal("freight_fcl20_dthc_currency"));

      const fcl40 = num(getVal("freight_fcl40"));
      const fcl40Cur = upp(getVal("freight_fcl40_currency"));
      const fcl40Dthc = num(getVal("freight_fcl40_dthc"));
      const fcl40DthcCur = upp(getVal("freight_fcl40_dthc_currency"));

      const dray = num(getVal("freight_drayage"));
      const drayCur = upp(getVal("freight_drayage_currency"));

      const totalForTypeCAD = (markupType /* "variable" | "flat" */) => {
        const use20 = markupType === "variable";
        const base = use20 ? fcl20 : fcl40;
        const baseCur = use20 ? fcl20Cur : fcl40Cur;
        const dthc = use20 ? fcl20Dthc : fcl40Dthc;
        const dthcCur = use20 ? fcl20DthcCur : fcl40DthcCur;
        return toCAD(base, baseCur) + toCAD(dthc, dthcCur) + toCAD(dray, drayCur);
      };

      const da_v = num(mr.da_v_rate || 0);
      if (!da_v) throw new Error("da_v_rate is missing or zero");

      for (let n = 1; n <= 6; n++) {
        const divisor = num(getVal(`freight_markup_rate${n}`));
        if (divisor > 0) {
          const markupType = getRadioVal(`freight_markup_rate_type_${n}`) || "flat";
          const totalCAD = totalForTypeCAD(markupType);
          const rate = (totalCAD / da_v) / divisor;
          const uplift = 1.036;
          const adjusted = (rate * uplift).toFixed(2);
          setVal(`freight_rate${n}`, adjusted);
        } else {
          setVal(`freight_rate${n}`, "");
        }
      }
    } catch (err) {
      console.error("Freight recalc failed:", err);
    }
  }

  // Listen only for real FX updates from the server (no polling)
  try {
    const es = new EventSource("/events");
    es.addEventListener("fx_update", () => {
      recalcFreightRates().catch(console.error);
    });
    window.addEventListener("beforeunload", () => { try { es.close(); } catch { } });
  } catch (e) {
    console.error("SSE unavailable:", e);
  }

















});