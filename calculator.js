document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dataForm");
  const resultBox = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultBox.textContent = "";

    const province = document.getElementById("oa_province")?.value.trim();
    let distance = Number(document.getElementById("distance")?.value || 0);
    const volume = Number(document.getElementById("volume")?.value || 0);
    const units = document.getElementById("units")?.value;
    const pack = document.getElementById("pack")?.value;
    const buildingType = document.getElementById("oa_building_type")?.value;
    const da_country = document.getElementById("da_country")?.value;


    // OG vol calc
    // const total_volume = units === "cbm" ? volume * 35.4 : volume;

    // const gross_volume = total_volume * 1.1767;


    // Use gross CUFT (net × 1.1767) for all provinces EXCEPT Ontario
    // Determine total_volume based on province
    const isOntario = (province || "").toLowerCase() === "on";

    const net_volume_cuft = (units === "cbm") ? (volume * 35.4) : volume;
    const gross_volume_cuft = net_volume_cuft * 1.1767;



    const total_volume = isOntario ? net_volume_cuft : gross_volume_cuft;


    // Keep gross_volume for later trucking_to_toronto logic
    let gross_volume = total_volume;

    // NEW: Freight must always use NET volume regardless of origin
    const freight_volume = net_volume_cuft;



    let total_oa_all = 0;
    let price = 0;
    let da_margin_price = NaN;
    let markupCAD = 0;

    if (!province || !pack) {
      resultBox.textContent = "Please select both province and packing type.";
      return;
    }

    // Fetch OA
    let oa_rates;
    try {
      const res = await fetch("oa_rates.json");
      if (!res.ok) throw new Error("OA rate fetch failed");
      oa_rates = await res.json();
    } catch {
      resultBox.textContent = "Could not load OA rates.";
      return;
    }

    // Finding OA rates
    const oa_company = oa_rates.find(entry =>
      entry.assigned_province?.toLowerCase() === province.toLowerCase()
    );

    if (!oa_company) {
      resultBox.textContent = `[ERROR] OA company not found for selected province. Contact the Rating Team!`;
      const msg = `⚠️ OA company not found for selected province. \n Contact the Rating Team!`;
      resultBox.textContent = msg;
      alert(msg);  // 🔔 popup window

      return;
    }

    // ---------- Load Margin Settings ----------
    let oa_v_rate = 1;
    let oa_min_flat_rate = 0;
    try {
      const marginRes = await fetch("margin_rates.json");
      if (marginRes.ok) {
        const marginData = await marginRes.json();
        oa_v_rate = parseFloat(marginData.oa_v_rate || "1");
        oa_min_flat_rate = parseFloat(marginData.oa_min_flat_rate || "0");
      }
    } catch { }

    // ---------- Margin Functions ----------
    const shouldApplyOAMargin = province.toLowerCase() !== "on";

    const applyOAVariableMargin = (raw) => {
      return raw / oa_v_rate;
    };

    const applyOAFlatMargin = (raw) => {
      return raw + oa_min_flat_rate;
    };


    // ---------- Travel ----------
    // let travel_charge = 0;
    // const travelRow = oa_company.rates.find(rate =>
    //   distance >= Number(rate.travel_min) && distance <= Number(rate.travel_max)
    // );
    // if (travelRow) {
    //   const perUnit = parseFloat(travelRow.travel_rate || 0);
    //   const type = travelRow.travel_rate_type || "flat";

    //   // 1) raw cost from oa_rates.json
    //   let rawTravel = 0;
    //   if (perUnit === 0) {
    //     rawTravel = 0;
    //   } else if (type === "variable") {
    //     const start = Number(travelRow.travel_min || 0);
    //     // inclusive of the start km (e.g., 51 → 1 km)
    //     const units = Math.max(1, distance - start + 1);



    //     // rawTravel = units * perUnit;
    //     rawTravel = distance * perUnit;

    //   } else {
    //     rawTravel = perUnit;
    //   }

    //   // 2) margin once, on the total (all provinces except ON)
    //   travel_charge = (province.toLowerCase() !== "on") ? (rawTravel / oa_v_rate) : rawTravel;
    // }

    // Rule: If Packing type is "Drop off at warehouse", travel is always $0.
    let travel_charge = 0;
    if ((String(pack) || "").toLowerCase() !== "dropoff") {
      const travelRow = oa_company.rates.find(rate =>
        distance >= Number(rate.travel_min) && distance <= Number(rate.travel_max)
      );
      if (travelRow) {
        const perUnit = parseFloat(travelRow.travel_rate || 0);
        const type = travelRow.travel_rate_type || "flat";

        // 1) raw cost from oa_rates.json
        let rawTravel = 0;
        if (perUnit === 0) {
          rawTravel = 0;
        } else if (type === "variable") {
          const start = Number(travelRow.travel_min || 0);
          // inclusive of the start km (e.g., 51 → 1 km)
          const units = Math.max(1, distance - start + 1);
          // rawTravel = units * perUnit;
          rawTravel = distance * perUnit;
        } else {
          rawTravel = perUnit;
        }

        // 2) margin once, on the total (all provinces except ON)
        travel_charge = (province.toLowerCase() !== "on") ? (rawTravel / oa_v_rate) : rawTravel;
      }
    }

    if ((String(pack) || "").toLowerCase() === "dropoff") {
      // distance = 0;  // force GUI + settings to 0
      const distanceEl = document.getElementById("distance");
      if (distanceEl) {
        distanceEl.value = "0";
        distanceEl.dispatchEvent(new Event("input", { bubbles: true }));
        distanceEl.setAttribute("title", "Drop-off at warehouse: distance forced to 0; travel = $0");
      }
    }











    // ---------- Volume Rate ----------
    const volumeRow = oa_company.rates.find(rate =>
      total_volume >= Number(rate.min) && total_volume <= Number(rate.max)
    );
    if (!volumeRow) {
      resultBox.textContent = "No OA rate range matched your volume.";
      return;
    }

    const rateMap = {
      full: ["full_rate", "full_rate_type"],
      wrap: ["wrap_rate", "wrap_rate_type"],
      pbo: ["pbo_rate", "pbo_rate_type"],
      dropoff: ["dropoff_rate", "dropoff_rate_type"]
    };
    if (!rateMap[pack]) {
      resultBox.textContent = "Invalid pack type.";
      return;
    }

    const [rateField, typeField] = rateMap[pack];
    const rawRate = parseFloat(volumeRow[rateField]);
    const rateType = volumeRow[typeField] || "flat";

    let total_oa_price;
    if (rateType === "variable") {
      const adjustedRate = shouldApplyOAMargin ? applyOAVariableMargin(rawRate) : rawRate;
      total_oa_price = total_volume * adjustedRate;
    } else { // 'flat'
      total_oa_price = shouldApplyOAMargin ? applyOAVariableMargin(rawRate) : rawRate;
    }

    if (shouldApplyOAMargin) {
      const flatAdjustedPrice = rateType === "variable"
        ? (total_volume * rawRate) + oa_min_flat_rate
        : rawRate + oa_min_flat_rate;
      total_oa_price = Math.max(total_oa_price, flatAdjustedPrice);
    }

    // ---------- Minimums (NOT adjusted) ----------
    let declaredMin = parseFloat(oa_company.minimums?.[pack] || 0);
    if (!isNaN(declaredMin)) {
      total_oa_price = Math.max(total_oa_price, declaredMin);
    }

    // ---------- Elevator ----------
    let elevator_charge = 0;
    if (buildingType === "apt") {
      const elevatorRow = oa_company.rates.find(rate =>
        total_volume >= Number(rate.elevator_min || 0) &&
        total_volume <= Number(rate.elevator_max || Infinity)
      );
      if (elevatorRow) {
        const perUnit = parseFloat(elevatorRow.elevator_rate || 0);
        const type = elevatorRow.elevator_rate_type || "flat";

        // 1) raw cost from oa_rates.json
        let rawElevator = 0;
        if (type === "variable") {
          rawElevator = total_volume * perUnit;
        } else {
          rawElevator = perUnit;
        }

        // 2) margin once, on the total
        // elevator_charge = shouldApplyOAMargin ? (rawElevator / oa_v_rate) : rawElevator;

        const net_volume_cuft = (units === "cbm") ? (volume * 35.4) : volume;

        if (type === "variable") {
          rawElevator = net_volume_cuft * perUnit; // always use net volume
        } else {
          rawElevator = perUnit; // flat fee stays as is
        }

        // No margin on elevator for any province
        if (type === "variable") {
          rawElevator = net_volume_cuft * perUnit; // always use net volume
        } else {
          rawElevator = perUnit;
        }
        elevator_charge = rawElevator;



      }
    }


    // ---------- Accessorial Charges (OA) ----------
    let accessorial_total = 0;
    let accessorial_lines = [];

    /* try {
      // load margin accessorials
      const mRes = await fetch("margin_rates.json", { cache: "no-store" });
      const mJson = await mRes.json();
      const accessorials = Array.isArray(mJson?.accessorials) ? mJson.accessorials : [];

      // helper: slug transform used by form-handler.js when building ids
      const slug = (txt) =>
        String(txt || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 48) || "accessorial";

      // build name -> config map
      const byName = new Map();
      accessorials.forEach(a => {
        const name = String(a?.name || "").trim();
        if (!name) return;
        byName.set(name, {
          rate: parseFloat(a.rate || "0") || 0,
          minimum: parseFloat(a.minimum || "0") || 0,
          type: (a.type || "flat").toLowerCase() // "variable" | "flat"
        });
      });

      // collect selected checkboxes generated in form-handler.js
      const checked = Array.from(
        document.querySelectorAll('input[id^="accessorial_chx_"]')
      ).filter(ch => ch.checked);

      for (const ch of checked) {
        // custom row?
        if (ch.id === "accessorial_chx_custom") {
          const descEl = document.querySelector('input#acx[type="text"]');
          const priceEl = document.querySelector('input#acx[type="number"]');
          const desc = (descEl?.value || "").trim();
          const price = parseFloat(priceEl?.value || "0") || 0;
          if (desc && price > 0) {
            accessorial_total += price;
            accessorial_lines.push(`${desc}: $${price.toFixed(2)}`);
          }
          continue;
        }

        // checkbox id encodes the name (slug). Find the display name by reverse lookup
        // against our map using the slugifier used when rendering.
        let matchedName = null;
        for (const name of byName.keys()) {
          if (`accessorial_chx_${slug(name)}` === ch.id) {
            matchedName = name;
            break;
          }
        }
        if (!matchedName) continue;

        const cfg = byName.get(matchedName);
        let amt = 0;

        if (cfg.type === "variable") {
          // Accessorials based on volume: use NET cuft (like Elevator)
          amt = (net_volume_cuft || 0) * (cfg.rate || 0);
        } else {
          // flat
          amt = cfg.rate || 0;
        }

        // apply per-item minimum if present
        if (cfg.minimum && amt < cfg.minimum) amt = cfg.minimum;

        if (amt > 0) {
          accessorial_total += amt;
          accessorial_lines.push(`${matchedName}: $${amt.toFixed(2)}`);
        }
      }
    } catch (e) {
      console.warn("[ACCESSORIALS] load/calc failed:", e);
    } */


















    // ---------- Trucking to Toronto (no margin; only if province != 'on') ----------
    let trucking_to_toronto_charge = 0;
    if (province.toLowerCase() !== "on" && Array.isArray(oa_company.trucking_to_toronto)) {
      const ttRow = oa_company.trucking_to_toronto.find(r =>
        gross_volume >= Number(r.min || 0) && gross_volume <= Number(r.max || Infinity)
      );
      if (ttRow) {
        const r = parseFloat(ttRow.rate || 0);
        const t = ttRow.type || "flat";    // "variable" | "flat"
        trucking_to_toronto_charge = (t === "variable") ? (gross_volume * r) : r;
      }
    }


    //////////////////////
    const adminFee = declaredMin;
    // total_oa_all = total_oa_price + travel_charge + elevator_charge + adminFee;
    // let resultText = `Origin (OA) Price: $${total_oa_price.toFixed(2)} + Travel: $${travel_charge.toFixed(2)} + Elevator: $${elevator_charge.toFixed(2)} + Admin: $${adminFee.toFixed(2)} = Total OA $${total_oa_all.toFixed(2)}`;


    // total_oa_all = total_oa_price + travel_charge + elevator_charge + trucking_to_toronto_charge + adminFee;

    // let resultText =
    //   `Origin (OA) Price: $${total_oa_price.toFixed(2)}\n` +
    //   `Travel: $${travel_charge.toFixed(2)}\n` +
    //   `Elevator: $${elevator_charge.toFixed(2)}\n` +
    //   `Trucking to Toronto: $${trucking_to_toronto_charge.toFixed(2)}\n` +
    //   `Admin: $${adminFee.toFixed(2)}\n` +
    //   `Total OA: $${total_oa_all.toFixed(2)}`;


    // total_oa_all = total_oa_price + travel_charge + elevator_charge + trucking_to_toronto_charge + adminFee + accessorial_total;
    total_oa_all = total_oa_price + travel_charge + elevator_charge + trucking_to_toronto_charge + adminFee;

    let resultText =
      `Origin (OA) Price: $${total_oa_price.toFixed(2)}\n` +
      `Travel: $${travel_charge.toFixed(2)}\n` +
      `Elevator: $${elevator_charge.toFixed(2)}\n` +
      `Trucking to Toronto: $${trucking_to_toronto_charge.toFixed(2)}\n` +
      `Admin: $${adminFee.toFixed(2)}`;

    // if (accessorial_lines.length) {
    //   resultText += `\nAccessorial charges:\n` + accessorial_lines.map(s => `${s}`).join("\n");
    // }

    resultText += `\nTotal OA: $${total_oa_all.toFixed(2)}`;







    // Freight
    const europeCodes = new Set([
      "be", "lu", "nl", "fr_north", "de", "at", "cz", "dk", "fr_south", "mc", "ch",
      "hr", "ie", "it_north", "pt", "es", "se", "hu", "no", "pl", "si", "sk", "balearic",
      "baltic", "ee", "bg", "fi", "gr", "lv", "lt", "ro", "rs", "it_south", "mt", "cy",
      "ba", "me", "al"
    ]);

    // Include all emirates / zones we use elsewhere:
    const uaeCodes = new Set(["dub", "abu"]);



    // UK postcode area → Lares zone.
    // Fill from your Lares poster; this is a starter you can extend.
    const UK_ZONE_MAP = {
      // ZONE 1 (incl. London areas shown as [ZONE 1] on the poster)
      AL: "uk1", B: "uk1", BA: "uk1", BS: "uk1", CB: "uk1", CM: "uk1", CO: "uk1", CV: "uk1",
      DE: "uk1", DY: "uk1", GL: "uk1", GU: "uk1", HP: "uk1", HR: "uk1", IP: "uk1", LE: "uk1",
      LN: "uk1", LU: "uk1", ME: "uk1", MK: "uk1", NG: "uk1", NN: "uk1", NR: "uk1", OX: "uk1",
      PE: "uk1", RG: "uk1", RH: "uk1", SG: "uk1", SL: "uk1", SN: "uk1", SP: "uk1", ST: "uk1",
      TF: "uk1", WR: "uk1", WS: "uk1", WV: "uk1",
      // London [ZONE 1]
      BR: "uk1", CR: "uk1", DA: "uk1", E: "uk1", EC: "uk1", EN: "uk1", HA: "uk1", IG: "uk1",
      KT: "uk1", N: "uk1", NW: "uk1", RM: "uk1", SE: "uk1", SM: "uk1", SW: "uk1", W: "uk1",
      WC: "uk1", UB: "uk1", WD: "uk1", TW: "uk1",

      // ZONE 2
      BB: "uk2", BD: "uk2", BH: "uk2", BL: "uk2", BN: "uk2", CA: "uk2", CH: "uk2", CT: "uk2",
      DH: "uk2", DL: "uk2", DN: "uk2", FY: "uk2", HG: "uk2", HU: "uk2", HX: "uk2", L: "uk2",
      LA: "uk2", LS: "uk2", M: "uk2", NE: "uk2", NP: "uk2", OL: "uk2", PO: "uk2", PR: "uk2",
      S: "uk2", SK: "uk2", SR: "uk2", TS: "uk2", WA: "uk2", WF: "uk2", WN: "uk2", YO: "uk2",

      // ZONE 3 (Scotland belt)
      AB: "uk3", DD: "uk3", DG: "uk3", EH: "uk3", FK: "uk3", G: "uk3", KA: "uk3",
      KY: "uk3", ML: "uk3", PA: "uk3", PH: "uk3", TD: "uk3",

      // ZONE 4 (Highlands/Islands & far SW if your poster shows them)
      IV: "uk4", KW: "uk4", ZE: "uk4", HS: "uk4", PL: "uk4", TR: "uk4"
    };

    function ukPostcodeArea(pc) {
      if (!pc) return null;
      const clean = pc.toUpperCase().replace(/\s+/g, "");
      // typical UK outward code starts with 1–2 letters (rare 1–4 exists; we use the common case)
      const m = clean.match(/^[A-Z]{1,2}/);
      return m ? m[0] : null;
    }



    let freight_country = null;

    if (da_country === "uk") {
      freight_country = "uk";          // ← enables UK freight table
    } else if (europeCodes.has(da_country)) {
      freight_country = "nl";          // Europe ships via NL
    } else if (uaeCodes.has(da_country)) {
      freight_country = "uae";         // UAE lanes
    } else if (da_country === "in") {
      freight_country = "in"; // ← NEW: India uses its own freight table
    }






    if (freight_country) {
      try {
        const freightRes = await fetch("freight_rates.json");
        const freightData = await freightRes.json();

        // case-insensitive match against JSON
        const group = freightData.find(
          (entry) => (entry.country_name || "").toLowerCase() === freight_country
        );

        const freightRow = group?.rates.find(rate =>
          freight_volume >= Number(rate.min) && freight_volume <= Number(rate.max)
        );

        if (freightRow) {
          const rate = parseFloat(freightRow.freight_rate || 0);
          const type = freightRow.freight_rate_type || "flat";
          // Freight must always be based on NET volume (per Orbit rule)
          price = (type === "variable") ? (freight_volume * rate) : rate;

          const min = parseFloat(group?.minimums?.freight || 0);
          if (!isNaN(min) && price < min) price = min;

          resultText += `\nFreight price: $${price.toFixed(2)}`;
        }

      } catch {
        // swallow gracefully
      }
    }


    // DA + margin
    if (da_country) {
      try {
        const daRes = await fetch("da_rates.json");
        const daRates = await daRes.json();

        let da_region = null;

        if (["be", "lu", "nl"].includes(da_country)) da_region = "eur1";
        else if (["fr_north", "de"].includes(da_country)) da_region = "eur2";
        else if (["at", "cz", "dk", "mc", "ch", "fr_south"].includes(da_country)) da_region = "eur3";
        else if (["hr", "ie", "it_north", "pt", "es"].includes(da_country)) da_region = "eur4";
        else if (["hu", "no", "pl", "si", "se", "sk"].includes(da_country)) da_region = "eur5";
        else if (["balearic", "ee", "bg", "fi", "gr", "lv", "lt", "ro", "rs", "it_south"].includes(da_country)) da_region = "eur6";
        else if (["ba", "me", "al"].includes(da_country)) da_region = "eur610";

        else if (["mt", "cy"].includes(da_country)) da_region = "eur7";
        else if (["dub", "abu"].includes(da_country)) da_region = da_country; // direct match for special UAE zones
        // else if (["uk"].includes(da_country)) da_region = da_country; // direct match for special UAE zones



        // let company_name = "Schmidt";
        let country_name = "eur";



        if (["dub", "abu"].includes(da_country)) {
          // company_name = "Leaders";
          country_name = "uae";
        }


        // NEW: UK branch — use Lares + uk1..uk4 based on postcode area
        if (da_country === "uk") {
          const da_postal = document.getElementById("da_postal")?.value?.trim() || "";
          const area = ukPostcodeArea(da_postal);     // e.g., "SW" from "SW1A 1AA"
          const zone = area ? UK_ZONE_MAP[area] : null;
          if (!zone) {
            const da_city = document.getElementById("da_city")?.value?.trim() || "";
            if (da_city.toLowerCase() === "london") zone = "uk1"; // fallback for London
          }
          if (!zone) {
            alert("Unknown UK postcode area. Please check the Postal code.");
            return;
          }
          // company_name = "Lares";
          country_name = "uk";
          da_region = zone;                            // "uk1".."uk4"
        }



        // NEW: India — IGL + city dropdown value becomes the DA "zone"
        if (da_country === "in") {
          const city = document.getElementById("da_india_city")?.value?.trim().toLowerCase() || "";
          if (!city) {
            alert("Please select the Indian city.");
            return;
          }
          // company_name = "Igl";
          country_name = "in";
          da_region = city; // e.g., "mumbai", "kolkata", "chennai"
        }

        // const daCompany = daRates.find(entry => entry.company_name === company_name);
        const daCompany = daRates.find(entry => entry.country_name === country_name);






        // Change the DA calculation to use the gross volume
        const daRow = daCompany?.rates.find(rate => {
          const min = parseFloat(rate.min ?? "0");
          const max = parseFloat(rate.max ?? "999999");
          return rate.country?.toLowerCase() === da_region &&
            gross_volume >= min &&
            gross_volume <= max;
        });




        if (!daCompany) {
          resultBox.textContent = `\n[ERROR] DA company not found. Contact the Rating Team!`;
          const msg = `⚠️ DA company not found. \n Contact the Rating Team!`;
          resultBox.textContent = msg;
          alert(msg);  // 🔔 popup window

          return;
        }


        let markupOriginal = 0;
        let conversionRate = 1;

        let daCurrency = daCompany?.currency?.toUpperCase() || "EUR";

        // if (daRow) {
        //   let da_rate = parseFloat(daRow.da_rate || 0);
        //   let da_price = 0;
        //   daCurrency = daCompany.currency?.toUpperCase() || "EUR";

        //   if (daRow.da_rate_type === "variable") {
        //     da_price = total_volume * da_rate;
        //   } else if (daRow.da_rate_type === "flat") {
        //     da_price = da_rate;
        //   } else {
        //     resultText += `<br><br>[DEBUG] No matching DA rate for region: ${da_region}, volume: ${total_volume}`;
        //   }




        if (daRow) {
          let da_rate = parseFloat(daRow.da_rate || 0);
          let da_price = 0;
          daCurrency = daCompany.currency?.toUpperCase() || "EUR";

          if (daRow.da_rate_type === "variable") {
            da_price = gross_volume * da_rate; // Changed from total_volume to gross_volume
          } else if (daRow.da_rate_type === "flat") {
            da_price = da_rate;
          } else {
            resultText += `<br><br>[DEBUG] No matching DA rate for region: ${da_region}, volume: ${total_volume}`;
          }




          // Display original DA price in its own currency
          // resultText += `\nDestination (DA) Price: ${daCurrency} ${da_price.toFixed(2)}`;
          // Display original DA price; add UK zone tag if applicable
          let zoneTag = "";
          if (da_country === "uk") {
            const m = /^uk(\d)$/i.exec(da_region || "");   // da_region is "uk1".."uk4"
            zoneTag = m ? ` (UK Zone ${m[1]})` : "";
          }
          else if (da_country === "in") {
            zoneTag = ` (${da_region.replace(/\b\w/g, c => c.toUpperCase())})`; // show city name
          }
          const displayCurr = (da_country === "uk") ? "GBP" : daCurrency;
          resultText += `\nDestination (DA) Price: ${displayCurr} ${da_price.toFixed(2)}${zoneTag}`;






          // Convert to CAD
          const fxRes = await fetch("exchange_rates.json");
          const fx = await fxRes.json();
          conversionRate = parseFloat(fx[daCurrency]);

          if (!isNaN(conversionRate)) {
            da_price = da_price * conversionRate * 1.05; // converted and markup should be 1.05 but discr. in calculator sheet or 1.135
          } else {
            resultText += `<br><br>[ERROR] Missing FX rate for ${daCurrency}`;
          }

          const min = parseFloat(daRow.minimum || 0);
          if (!isNaN(min)) da_price = Math.max(da_price, min);

          const marginRes = await fetch("margin_rates.json");
          const marginData = await marginRes.json();
          const da_v_rate = parseFloat(marginData.da_v_rate || 1);
          const da_min_flat_rate = parseFloat(marginData.da_min_flat_rate || 0);

          da_margin_price = (da_price / da_v_rate) < (da_price + da_min_flat_rate)
            ? da_price + da_min_flat_rate
            : da_price / da_v_rate;

          resultText += `\nDA Rate with Margin: $${da_margin_price.toFixed(2)}`;
        }
        // --- Apply markup (in original currency, converted after everything else)


        if (daRow.markup) {
          const markupType = daRow.markup_type || "flat";
          const markupVal = parseFloat(daRow.markup) || 0;

          if (markupType === "flat") {
            markupOriginal = markupVal;
          } else if (markupType === "variable") {
            markupOriginal = total_volume * markupVal;
          }

          markupCAD = markupOriginal * conversionRate * 1.033;
          resultText += `\nCustoms: ${daCurrency} ${markupOriginal.toFixed(2)}`;
          resultText += `\nCustoms Converted: $${markupCAD.toFixed(2)}`;
        } else {
          resultText += `\nCustoms: ${daCurrency} 0.00`;
          resultText += `\nCustoms Converted: $0.00`;
        }


      } catch { }
    }




    // Total price
    const grandTotal = !isNaN(da_margin_price)
      ? Math.ceil(total_oa_all + (price || 0) + da_margin_price + markupCAD)
      : "???";



    resultText += `\nTotal Price (Ceiling): $${grandTotal}`;


    // Additional rate
    // let additionalRate = Math.ceil(20 + (total_volume * -0.01));
    // if (additionalRate < 10) additionalRate = 10;
    // resultText += `\nEstimated Additional Rate per CUFT: $${additionalRate}`;

    // Additional rate — Wilbin style: (OA + TT + Freight + DA) / Volume
    // Additional rate — Wilbin style: (OA + Freight + DA) / Volume
    // Additional rate — Wilbin: (OA + TT + Elevator + Freight + DA) / Volume, then +10%, ceil
    let additionalRate = 0;

    // OA core only (exclude Travel/Admin) + the specific extras
    const oaCore = total_oa_price || 0;                // packing only
    const tt = trucking_to_toronto_charge || 0;    // TT to Toronto
    const elevator = elevator_charge || 0;               // elevator
    const freight = price || 0;                         // freight total (min-protected)
    const daAllIn = Number.isFinite(da_margin_price) ? da_margin_price : 0; // DA with margin (exclude customs)

    // Use the same chargeable volume you quote with (gross for non-ON, net for ON)
    const denom = Math.max(1, total_volume || 0);

    // Base per-cuft
    const basePerCuft = (oaCore + tt + elevator + freight + daAllIn) / denom;

    // +10% uplift and ceiling at the end (keep your $10 floor if desired)
    additionalRate = Math.ceil(basePerCuft * 1.10);
    if (additionalRate < 10) additionalRate = 10;

    resultText += `\nEstimated Additional Rate per CUFT: $${additionalRate}`;













    //////////////////////////




    let transitTime =
      freight_country === "nl" ? "6–22 weeks" :
        freight_country === "uae" ? "10–18 weeks" :
          freight_country === "uk" ? "6–14 weeks" :
            freight_country === "in" ? "12–28 weeks" : ""; // example, adjust to your SLA





    resultText += `\nTransit Time: ${transitTime}`;


    // Save to globals
    window._quoteGrandTotal = grandTotal;
    window._quoteAdditionalRate = additionalRate;
    window._quoteTransitTime = transitTime;


    document.dispatchEvent(new CustomEvent("quote:calculated", {
      detail: { grandTotal, additionalRate, transitTime }
    }));



    resultBox.innerHTML = resultText.replace(/\n/g, "<br><br>");
  });




});