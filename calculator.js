document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dataForm");
  const resultBox = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultBox.textContent = "";

    const province = document.getElementById("province")?.value.trim();
    const distance = Number(document.getElementById("distance")?.value || 0);
    const volume = Number(document.getElementById("volume")?.value || 0);
    const units = document.getElementById("units")?.value;
    const pack = document.getElementById("pack")?.value;
    const buildingType = document.getElementById("oa_building_type")?.value;
    const da_country = document.getElementById("da_country")?.value;


    const total_volume = units === "cbm" ? volume * 35.4 : volume;

    let total_oa_all = 0;
    let price = 0;
    let da_margin_price = NaN;
    let markupCAD = 0; // <-- ✅ ADD THIS LINE


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

    const oa_company = oa_rates.find(entry =>
      entry.assigned_province?.toLowerCase() === province.toLowerCase()
    );
    if (!oa_company) {
      resultBox.textContent = "OA company not found for selected province.";
      return;
    }

    // Travel
    let travel_charge = 0;
    const travelRow = oa_company.rates.find(rate =>
      distance >= Number(rate.travel_min) && distance <= Number(rate.travel_max)
    );
    if (travelRow) {
      const rate = parseFloat(travelRow.travel_rate || 0);
      const type = travelRow.travel_rate_type || "flat";
      travel_charge = type === "variable" ? distance * rate : rate;
    }

    // Volume rate
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
    const rawRate = parseFloat(volumeRow[rateField] || 0);
    const rateType = volumeRow[typeField] || "flat";
    let total_oa_price = rateType === "variable" ? total_volume * rawRate : rawRate;

    let declaredMin = parseFloat(oa_company.minimums?.[pack] || 0);
    if (!isNaN(declaredMin)) {
      total_oa_price = Math.max(total_oa_price, declaredMin);
    }

    // Elevator
    let elevator_charge = 0;
    if (buildingType === "apt") {
      const elevatorRow = oa_company.rates.find(rate =>
        total_volume >= Number(rate.elevator_min || 0) &&
        total_volume <= Number(rate.elevator_max || Infinity)
      );
      if (elevatorRow) {
        const rate = parseFloat(elevatorRow.elevator_rate || 0);
        const type = elevatorRow.elevator_rate_type || "flat";
        elevator_charge = type === "variable" ? total_volume * rate : rate;
      }
    }

    const adminFee = declaredMin;
    total_oa_all = total_oa_price + travel_charge + elevator_charge + adminFee;

    let resultText = `Origin (OA) Price: $${total_oa_price.toFixed(2)} + Travel: $${travel_charge.toFixed(2)} + Elevator: $${elevator_charge.toFixed(2)} + Admin: $${adminFee.toFixed(2)} = Total OA $${total_oa_all.toFixed(2)}`;

    // Freight
    const orbit_europe = ["be", "lu", "nl", "fr_north", "de", "at", "cz", "dk", "fr_south", "mc", "ch", "uk_south", "hr", "hu", "ie", "it_north", "no", "pl", "pt", "si", "es", "se", "uk_north", "balearic", "baltic", "bg", "fi", "gr", "lv", "lt", "ro", "rs", "it_south", "mt", "cy", "canary"];
    const uae_regions = ["dub", "sha", "abu", "ras", "ruw"];
    const freight_country = orbit_europe.includes(da_country)
      ? "Nl"
      : uae_regions.includes(da_country)
        ? "Uae"
        : null;

    if (freight_country) {
      try {
        const freightRes = await fetch("freight_rates.json");
        const freightData = await freightRes.json();
        const group = freightData.find(entry => entry.country_name === freight_country);
        const freightRow = group?.rates.find(rate =>
          total_volume >= Number(rate.min) && total_volume <= Number(rate.max)
        );
        if (freightRow) {
          const rate = parseFloat(freightRow.freight_rate || 0);
          const type = freightRow.freight_rate_type || "flat";
          price = type === "variable" ? total_volume * rate : rate;
          const min = parseFloat(group?.minimums?.freight || 0);
          if (!isNaN(min) && price < min) price = min;
          resultText += `\nFreight price: $${price.toFixed(2)}`;
        }
      } catch { }
    }

    // DA + margin
    if (da_country) {
      try {
        const daRes = await fetch("da_rates.json");
        const daRates = await daRes.json();

        let da_region = null;

        if (["be", "lu", "nl"].includes(da_country)) da_region = "eur1";
        else if (["fr_north", "de"].includes(da_country)) da_region = "eur2";
        else if (["at", "cz", "dk", "mc", "ch"].includes(da_country)) da_region = "eur3";
        else if (["hr", "ie", "it_north", "pt", "es"].includes(da_country)) da_region = "eur4";
        else if (["hu", "no", "pl", "si", "se", "sk"].includes(da_country)) da_region = "eur5";
        else if (["balearic", "ee", "bg", "fi", "gr", "lv", "lt", "ro", "rs", "it_south"].includes(da_country)) da_region = "eur6";
        else if (["mt", "cy"].includes(da_country)) da_region = "eur7";
        else if (["dub", "sha", "abu", "ras", "ruw"].includes(da_country)) da_region = da_country; // direct match for special UAE zones


        let company_name = "Schmidt";
        if (["dub", "abu"].includes(da_country)) {
          company_name = "Leaders";
        }
        const daCompany = daRates.find(entry => entry.company_name === company_name);



        const daRow = daCompany?.rates.find(rate => {
          const min = parseFloat(rate.min ?? "0");
          const max = parseFloat(rate.max ?? "999999");
          return rate.country?.toLowerCase() === da_region &&
            total_volume >= min &&
            total_volume <= max;
        });

        if (!daCompany) {
          resultBox.textContent += "\n[ERROR] DA Company not found!";
        }


        let markupOriginal = 0;
        let conversionRate = 1;

        let daCurrency = daCompany?.currency?.toUpperCase() || "EUR";

        if (daRow) {
          let da_rate = parseFloat(daRow.da_rate || 0);
          let da_price = 0;
          daCurrency = daCompany.currency?.toUpperCase() || "EUR";

          if (daRow.da_rate_type === "variable") {
            da_price = total_volume * da_rate;
          } else if (daRow.da_rate_type === "flat") {
            da_price = da_rate;
          } else {
            resultText += `<br><br>[DEBUG] No matching DA rate for region: ${da_region}, volume: ${total_volume}`;
          }

          // Display original DA price in its own currency
          resultText += `\nDestination (DA) Price: ${daCurrency} ${da_price.toFixed(2)}`;

          // Convert to CAD
          const fxRes = await fetch("exchange_rates.json");
          const fx = await fxRes.json();
          conversionRate = parseFloat(fx[daCurrency]);

          if (!isNaN(conversionRate)) {
            da_price = da_price * conversionRate * 1.033; // converted and markup
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
    let additionalRate = Math.ceil(23 + (total_volume * -0.01));
    if (additionalRate < 14) additionalRate = 14;
    resultText += `\nEstimated Additional Rate per CUFT: $${additionalRate}`;

    let transitTime = freight_country === "Nl"
      ? "6–22 weeks"
      : freight_country === "Uae"
        ? "10–18 weeks"
        : "";

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
