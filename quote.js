document.addEventListener("DOMContentLoaded", () => {
  const quoteBox = document.getElementById("quotePreview");
  const buttonBox = document.getElementById("quoteButtons");

  // const downloadBtn = document.createElement("button");
  // // downloadBtn.textContent = "Download DOCX";
  // downloadBtn.id = "downloadDocxBtn";
  // downloadBtn.style.display = "none";
  // buttonBox.appendChild(downloadBtn);

  const printBtn = document.createElement("button");
  printBtn.textContent = "Save Quote as PDF";
  printBtn.id = "printPdfBtn";
  printBtn.className = "btn save hundred";
  printBtn.style.display = "none";
  buttonBox.appendChild(printBtn);

  // document.addEventListener("quote:calculated", (event) => {
  document.addEventListener("quote:calculated", async (event) => {

    const { grandTotal, additionalRate, transitTime } = event.detail;

    const form = document.getElementById("dataForm");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.grandTotal = grandTotal;
    data.additionalRate = additionalRate;
    data.transitTime = transitTime;

    ///// PLACEHOLDER Handling


    // === Generate numeric, monotonic quote number ===
    // (function assignQuoteNo() {
    //   const MINUTE = 60000;
    //   const baseUtc = Date.UTC(2025, 0, 1, 0, 0);
    //   const nowUtc = Date.now();
    //   let minutesSince = Math.floor((nowUtc - baseUtc) / MINUTE);

    //   // Subtract an offset so it starts smaller
    //   const OFFSET = 310000;   // pick the value at deployment time
    //   const serial = minutesSince - OFFSET;

    //   data.quote_no = String(serial);
    // })();





    // NEW: Set pack_var0 based on pack
    switch (data.pack) {
      case "full":
        data.pack_var0 = "Full service";
        break;
      case "pbo":
        data.pack_var0 = "All packed and wrapped by owner";
        break;
      case "wrap":
        data.pack_var0 = "All boxes packed by owner";
        break;
      case "dropoff":
        data.pack_var0 = "Drop off at warehouse";
        break;
      default:
        data.pack_var0 = "";
    }


    switch (data.oa_building_type) {
      case "house":
        data.oa_building_typex = "House";
        break;
      case "apt":
        data.oa_building_typex = "Apartment";
        break;
      default:
        data.oa_building_typex = "";
    }

    switch (data.da_building_type) {
      case "house":
        data.da_building_typex = "House";
        break;
      case "apt":
        data.da_building_typex = "Apartment";
        break;
      default:
        data.da_building_typex = "";
    }





    // Map country codes to full names
    const countryNames = {
      be: "Belgium",
      lu: "Luxembourg",
      nl: "Netherlands",
      fr_north: "France (north of Caen - Basel line)",
      de: "Germany",
      at: "Austria",
      cz: "Czech",
      dk: "Denmark",
      fr_south: "France (south of Caen - Basel line)",
      mc: "Monaco",
      ch: "Switzerland",
      uk_south: "UK (below Manchester)",
      hr: "Croatia",
      ie: "Ireland",
      it_north: "Italy (above Rome)",
      pt: "Portugal",
      es: "Spain",
      uk_north: "UK (above Manchester)",
      hu: "Hungary",
      no: "Norway (south)",
      pl: "Poland",
      si: "Slovenia",
      se: "Sweden (south)",
      sk: "Slovakia",
      balearic: "Balearic Islands",
      ee: "Estonia",
      bg: "Bulgaria",
      fi: "Finland south",
      gr: "Greece (except islands)",
      lv: "Latvia",
      lt: "Lithuania",
      ro: "Romania",
      rs: "Serbia",
      it_south: "Southern Italy (+ Rome & Sicily)",
      ba: "Bosnia and Herzegovina",
      me: "Montenegro",
      al: "Albania",
      mt: "Malta",
      cy: "Cyprus",
      dub: "Dubai, UAE",
      abu: "Abu Dhabi, UAE",
      in: "India",
      uk: "United Kingdom"
    };

    // Add a friendly name for template
    data.da_countryx = countryNames[data.da_country] || data.da_country || "";


    if (data.survey && data.survey.trim() !== "") {
      data.survey_line = `(as per survey SRV-${data.survey})`;
    } else {
      data.survey_line = `(pending survey)`;
    }








    switch (data.oa_building_type) {
      case "house":
        data.house_var1 = `<li>House: Pickup from a residence on ground floor or the level above where the total distance from the truck to the entry of the residence is no more than 50 feet.</li>`;
        break;
      case "apt":
        data.house_var1 = `<li>Apartment: Pickup from an apartment with 1 service elevator, where the total distance from the truck or container to the entry of the apartment is no more than 75 feet.</li>`;
        break;
      default:
        data.house_var1 = "";
    }


    switch (data.oa_building_type) {
      case "house":
        data.house_var2 = `If pick-up address is not a private house or has limited access, $0.55 / CUF, min. $75 will be added for any of these cases: <br>
   (a) Use of building elevator (elevator must be on service mode as required) <br>
   (b) Stair carry per floor (ground and one level above are included) / long carry, per additional 50' carrying distance (first 50' are free)`;
        break;
      case "apt":
        data.house_var2 = `If pick-up address is not a private house or has limited access, $0.55 / CUF, min. $75 will be added for any of these cases: <br>
   (a) Stair carry per floor (ground and one level above are included) / long carry, per additional 50' carrying distance (first 50' are free)`;
        break;
      default:
        data.house_var2 = "";
    }

    switch (data.pack) {
      case "full":
        data.pack_var1 = `Dismantling USED beds, kitchen and dining room tables with 8 screws or less.</li>
        <li>All packing and wrapping materials. Packing, wrapping, preparation of inventory list, loading and/or bracing and preparation of all shipping documents.`;
        break;
      case "pbo":
        data.pack_var1 = `Client to provide inventory.`;
        break;
      case "wrap":
        data.pack_var1 = `Client to pack and provide an inventory list for all boxes.</li>
        <li>Dismantling USED beds, kitchen and dining room tables with 8 screws or less.</li>
        <li>Wrapping materials. </li>
        <li>Wrapping, preparation of inventory list, loading and/or bracing and preparation of all shipping documents.`;
        break;
      case "dropoff":
        data.pack_var1 = `Receive professionally packed goods at the warehouse. (One time drop off)`;
        data.house_var1 = "";
        break;
      default:
        data.pack_var1 = "";
    }

    switch (data.pack) {
      case "full":
        data.pack_var3 = `<li>Unwrapping and basic set-up of furniture. Basic set-up is limited to the reassembly of USED beds, kitchen and dining room tables with 8 screws or less. Extensive assembly of bookcases, exercise equipment, wall units, armoires, IKEA or Shrank type furniture, bunk beds, beds with many parts, cribs and new items is not included in this service.</li>
        <li>Removal of used packing material on the day of the delivery.</li>`;
        break;
      case "pbo":
        data.pack_var3 = `<li>Delivery includes verification of packing inventory.</li>`;
        break;
      case "wrap":
        data.pack_var3 = `<li>Delivery includes verification of packing inventory.</li>
        Unwrapping and basic set-up of furniture. Basic set-up is limited to the reassembly of USED beds, kitchen and dining room tables with 8 screws or less. Extensive assembly of bookcases, exercise equipment, wall units, armoires, IKEA or Shrank type furniture, bunk beds, beds with many parts, cribs and new items is not included in this service.</li>
        <li>Removal of used packing material on the day of the delivery</li>`;
        break;
      default:
        data.pack_var3 = "";
    }

    switch (data.pack) {
      case "full":
        data.pack_var5 = "";
        break;
      case "pbo":
        data.pack_var5 = `<li>Pack, wrap, prepare inventory. Unpacking & unwrapping at destination.</li>`;
        break;
      case "wrap":
        data.pack_var5 = "";
        break;
      case "dropoff":
        data.pack_var5 = `<li>Pack, wrap, pick up, prepare inventory. Unpacking & unwrapping at destination.</li>`;
        break;
      default:
        data.pack_var5 = "";
    }

    // Country-specific blurb to add an extra <li> in clean.html
    const countryBlurbs = {
      at: `<li>Most of the shipping lines allow return of the container to Vienna. If not, we will have to return to POE with additional charges – EUR 850 – 1200. This will be billed at actuals, if applicable.</li>`,
      de: `<li>Customs Inspection at port via Xray- Eur300-500 per container. This will be billled at actuals.</li>`,
      cz: `<li>Container return to POE is excluded. Most shipping lines accept returns to the nearest inland port. If applicable, charges will apply and will be billed at actual cost, typically ranging from EUR 100 to 350. Certain shipping lines may require a deposit before releasing shipments. In such cases, we will invoice the deposit amount to you, along with an additional EUR 75 administrative fee. The deposit will be refunded once the shipping line processes and returns the refund. There are problems with registering a vehicle older than 8 years. The car first must be localised and then pass a technical inspection and emission test. Please note that there might be difficulty in registering cars especially with diesel engines. </li>`,
      ch: `<li>Drop off and re-positioning charges: CHF 100.- to CHF 600.- depending of the shipping line. Return of empty container to the port of Antwerp / Rotterdam / Hamburg if applicable: CHF 700.- / CHF 950.- per 20' & CHF 900.- / CHF 1'100.- per 40'/40'HC. All these charges will be billed at actuals, if applicable. </li>`,
      hr: `<li>Customs inspection Eur300 approx./ 20'. This will be billed at actuals. Shipment cannot be customs cleared without Croatian Personal Identification number (“OIB” number) and EORI number (could be received within 48 hours after receiving OIB number). Customer to check if car import possible. This can be done at a government institute called “Drzavni ured za mjeriteljstvo). The cost for this is app 70 – 100 EUR (not included in the rate). It is also possible to get a certificate from seller that POV is suitable for Croatia (can be registered). This is also app 100 – 200 EUR on clients cost if trying to get it. Client will need to pay special tax on POV. It is possible that we give approximate calculation of tax once we have all car details. We can calculate approximate costs that clients will need to pay to the customs office. </li>`,
      it_north: `<li>Congestion charges at port of entry and EORI procedure (Eur100 approx.). These will be billed at actuals. </li>`,
      it_south: `<li>Congestion charges at port of entry and EORI procedure (Eur100 approx.). These will be billed at actuals. </li>`,
      pt: `<li>Only 1 vehicle can be imported duty free (if that vehicle is eligible for free import including the customer & vehicle status/situation). A secondary vehicle will be severely taxed by Customs and the value is determined based on very certain factors such as: car value, brand, commercial value in Portugal, CO2 Emissions, and horsepower. The taxes on an average vehicle can be from € 25,000.00 up to € 100.000,00 to be paid upfront. </li>`,
      es: `<li>Customs Inspection Eur400 approx and destination port charges or storage Eur 300- Eur600. This will billed at actuals. </li>`,
      hu: `<li>Due to recent changes in the import customs procedure in Hungary we’ve been facing plenty of difficulties during the import customs clearance. All shipments AIR/FCL/LCL/ROAD that are subject to customs clearances needs to be presented for physical checking at final customs office. Customs office determines the date of the import customs clearance after shipments arrival. We have no influence on it and dates cannot be pushed. This is resulting extra charges during the import such as demurrage, detention, customs exam fee, documentation fee, administration fee…etc. These charges are excluded and will be billed at actuals. </li>`,
      pl: `<li>"Additional info about car importation: “ HHG and personal effects can be imported free of duty/tax (only used). This also refers to vehicles proved to have been used by shipper at least 6 months prior to departure. Vehicles must be used and registered in the name of relocating person for at least 6 months. The goods must enter Poland within 12 months of the date of termination of foreign residence as shown in the certificate of employment or alternative documents “ For car less than 6 month old, you can expect taxes around 40 % of CIF Value ( this is an average, included VAT taxes and Excise tax. All these info is subject to change without notice." </li>`,
      sk: `<li>Container return to POE is excluded. Most shipping line accept the return to the nearest inland port. If applicable, it will be billed at actuals. Eur450-950. </li>`,
      bg: `<li>Excludes: Customs Inspection at destination Eur150 Approx, Xray scan Eur 90- These charges will be billed at actuals, if applicable
Vehicle must been possessed by consignee at least 6 months before relocation – purchase invoice copy required + original title
Copy of customer Bulgarian ID card/Certificate for Prolonged residence - both sides, residence address in Plovdiv is a must - this is one of the most important documents customer must provide in order to apply for duty free import customs clearance .</li>`,
      gr: `<li>Note: <ol><li>Certificate of repatriation for vehicle to be arranged by the customer from the embassy. </li>
<li>We will need the documents like COC (Certificate of Conformity) and Title / Registration of Vehicles to check if the vehicle is allowed into Greece. After customs authorities review these documents, they may ask for more supporting documentation (depending on the vehicle). When customs approve of the vehicles, only then we will load the car at origin.</li>
<li>If customers wish to import their vehicles into Greece on a temporary basis (i.e.temporary imports), they are allowed to do so, however, are ONLY allowed to import their vehicles into Greece for 6 months, and then will have to return the vehicles to the country of origin (or have the vehicle locked away for 6 months in Greece, with customs approval).</li>
<li>New Greek import regulations require that vehicles imported to Greece are offloaded at the port or bonded warehouse to get official value assessment from the customs. Port Storage, storage at bonded warehouse or Demurrage- Eur 80 to Eur 200 per day- custom clearance my take 1 month time for cars. This will be billed at actuals- if applicable</li>
<li>Registration of vehicles (additional costs apply / paid by the consignee at time of registration) – Not required if vehicle is imported under Diplomatic Status or as a Temporary import or has Greek number plates</li></ol></li>`,
      ro: `<li>The car has to be taken on a platform from customs to local RAR- Romanian Auto Register (for car authentication, this is the procedure required by the customs as customs formalities requirements). All taxes and costs related to Assistance at RAR (Romanian Auto Register) and car registration is excluded. </li>`,
      rs: `<li><strong>Important Note:</strong> Serbia requires an extremely detailed inventory which lists the exact quantity and type of each item in each package/box (with serial numbers, brand and model for all electrical items). Orbit believes these requirements are designed for failure. Theoretically speaking, any item identified by customs officers as either not listed or listed inaccurately can be interpreted as a misdeclaration, with corresponding charges and consequences (including, but not limited to, disposal/confiscation, fines, penalties, storage charges and delays). It is incumbent upon the client to prepare this specialized inventory in advance of move day, and to work with our packing crew to number that inventory numbering aligns with box label numbering. Orbit can prepare such an inventory on behalf of the client for an additional fee ($2,500). However, under NO circumstances will Orbit guarantee that this inventory will be completely accurate, nor will Orbit bear responsibility or be held liable for issues or expenses (e.g., fines, delays, inspection charges) resulting from omissions or errors with numbering, piece counts and descriptions of content.</li>

<li>All shipments must go to bonded storage in Novi Sad (Must for all non-Diplomatic shipments (EUR 50 to EUR 60 per day / 6 to 8 days on estimate - at cost + 15% disbursement fee), Import duties and taxes (at cost + 15% disbursement fee). This will be billed to client.
IMPORTANT: Regarding import of vehicles, please note that client must personally apply for the Import Permit at Serbian Road Safety Agency and obtain the Import Certificate prior to dispatching the shipment. Vehicles can only be imported if Import Certificates are issued by SRSA. Main condition is that vehicles are built according to EU standards. 
Please note that SRSA may reject to issue import permit. Import duties and taxes will apply on import of vehicles.
http://abs.gov.rs/kontrolisanje-vozila-koja-se-uvoze-kao-upotrebljavana 
Please do not accept to ship vehicles, nor dispatch the shipment, until client receive an answer from the SRSA and you receive "green light" from our office. Import duties and taxes will apply on import of the car and motorbike.
Households and personal effect must not be loaded inside the car. 
cars which are not made for EU market cannot be imported in Serbia(cannot be registered) unless client is a diplomat in Serbia</li>`,
      mt: `<li>Client must lodge a cash deposit of approx. 25 % to customs on the CIF value of goods which will only be repaid, once client proves that s/he has resided in Malta for a period of 365 days from date of deposit. (not for diplomats). Vehicles are subject to import duty and registration taxes (see website of Malta transport authority - www.transport.gov.mt – please note that there are some exemptions on duty free importation of car for Maltese returned migrants, but clients must verify with Malta transport authority whether they would qualify, or no. Client must own the vehicle for more than 2 years and must have more than 7000 kms. Inspection and all inspection related charges. car registration fees / police inspection fees / transport Malta technical officers' inspection / number plates / VRT. The customer will need to pay a deposit to customs which will then be refunded after 1 year. All clients (Maltese and foreign citizens) are allowed to import their used personal effects household goods free of duties / taxes if they establish their primary residence in Malta and if they prove a minimum of one year stay abroad. The customer has to be in Malta at least 2 working days prior to the arrival of the shipment. </li>`,
      cy: `<li>Customs Inspection- LCL Eur70- Eur150 Approx, Eur200/ 20' and Eur250/40'. This will billed at actuals. Any appliances that do not have the CE markings on them should not be shipped to Cyprus as the Customs officials in the Republic of Cyprus may confiscate them, should they be found. Also note that all shipments from NON- EU origin countries are physically inspected by customs. If a container is chosen for physical customs inspection, the customs officers are now attending inspections only after 3 pm, this means an FCL container will be delivered and unloaded after 3 pm where a customs officer will be present to break the seal and inspect the container. As we will only unload the container on the first day, this means a 20’ container may require a second day to complete the normal destination services with an additional cost as 40’ & 40’ HC container prices already include a second day, additional charges will apply only if we return for a third day. We will charge the customers locally for this additional service depending on their unpacking requirements. These additional fees will only apply in the event that a container is inspected and will not include the customs inspection fee which is an additional cost. Please note that cars and motor bikes that are shipped as IMO will attract additional charges and high storages and must be cleared and taken out of port within 10 days from arrival at port. </li>`,

      dub: `<li>Customs inspection related fees – USD $350–$500 approx. per container. Note: Vehicles attract 5% Duty + 5% VAT from the CIF value (Cost of Vehicle + Cost of Transport to Destination). Importing drone is restricted.</li>`,
      abu: `<li>Customs inspection related fees – USD $350–$500 approx. per container. Note: Vehicles attract 5% Duty + 5% VAT from the CIF value (Cost of Vehicle + Cost of Transport to Destination). Importing drone is restricted.</li>`,

      uk: `<li>Nova Registration charges for vehicle.</li>`,

      in: `<li>Taxes and duties, detention and demurrage (approximately USD&nbsp;60&nbsp;–&nbsp;USD&nbsp;200 per day), stamp duty, society security charges, labor union fees, port CFS yard charges, and other demurrage and detention-related costs (approximately USD&nbsp;600&nbsp;–&nbsp;USD&nbsp;3,000) will be billed at actuals.</li>
      <li>As part of the customs clearance process, the client must provide their original passport to our agent in India.</li>`,
    };

    const daCode = (data.da_country || '').toLowerCase().trim();
    data.country_blurb = countryBlurbs[daCode] || '';


    /////////////////////////////////////////////////////////////////
    /* ================== Accessorials -> {{accessorial_var}} ================== */
    try {
      // Load margin accessorial definitions
      const mRes = await fetch("margin_rates.json", { cache: "no-store" });
      const mJson = await mRes.json();
      const defs = Array.isArray(mJson?.accessorials) ? mJson.accessorials : [];

      // Map by display name
      const byName = new Map(
        defs
          .filter(a => (a?.name || "").trim())
          .map(a => [a.name.trim(), {
            rate: parseFloat(a.rate || "0") || 0,
            minimum: parseFloat(a.minimum || "0") || 0,
            type: String(a.type || "flat").toLowerCase() // "variable" | "flat"
          }])
      );

      // same slug logic used by form-handler / calculator to form checkbox IDs
      const slug = (txt) =>
        String(txt || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 48) || "accessorial";

      // Selected checkboxes
      const checked = Array.from(
        document.querySelectorAll('input[id^="accessorial_chx_"]')
      ).filter(ch => ch.checked);

      // Use NET cuft from form for variable accessorials
      const netCuft = parseFloat(data.volume || "0") || 0;

      const lines = [];

      for (const ch of checked) {
        if (ch.id === "accessorial_chx_custom") {
          // Custom line from the two 'acx' inputs
          const descEl = document.querySelector('input#acx[type="text"]');
          const priceEl = document.querySelector('input#acx[type="number"]');
          const desc = (descEl?.value || "").trim();
          const price = parseFloat(priceEl?.value || "0") || 0;
          if (desc && price > 0) {
            lines.push(`<li>${desc} – $${price.toFixed(2)}</li>`);
          }
          continue;
        }

        // Match checkbox id back to a defined accessorial by slug
        let name = null;
        for (const key of byName.keys()) {
          if (`accessorial_chx_${slug(key)}` === ch.id) { name = key; break; }
        }
        if (!name) continue;

        const cfg = byName.get(name);
        let amt = 0;
        if (cfg.type === "variable") {
          amt = netCuft * (cfg.rate || 0);
        } else {
          amt = cfg.rate || 0;
        }
        if (cfg.minimum && amt < cfg.minimum) amt = cfg.minimum;

        if (amt > 0) lines.push(`<li>${name} – $${amt.toFixed(2)}</li>`);
      }

      // Inject into template placeholder (clean.html uses {{accessorial_var}} inside a UL)
      data.accessorial_var = lines.join("");
    } catch (e) {
      console.warn("[QUOTE] Accessorial build failed:", e);
      data.accessorial_var = ""; // fail-safe
    }
    /* ================== /Accessorials ================== */

    // show buttons, print, render
    printBtn.style.display = "block";
    printBtn.onclick = () => window.print();







































    // downloadBtn.style.display = "block";
    printBtn.style.display = "block";

    // downloadBtn.onclick = async () => {
    //   await generateAndDownloadHTML(data);
    // };

    printBtn.onclick = () => {
      window.print();
    };


    renderQuotePreview(data);
  });
});


async function generateAndDownloadHTML(data) {
  try {
    const templateRes = await fetch("clean.html");
    if (!templateRes.ok) throw new Error("Could not load quote template.");
    let template = await templateRes.text();

    for (const key in data) {
      const pattern = new RegExp(`{{${key}}}`, "g");
      template = template.replace(pattern, data[key] || "");
    }

    const blob = new Blob([template], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quote_${data.mfc || "new"}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Failed to generate quote: " + err.message);
  }
}

async function renderQuotePreview(data) {
  try {
    const templateRes = await fetch("clean.html");
    if (!templateRes.ok) throw new Error("Failed to load preview template.");
    let template = await templateRes.text();

    for (const key in data) {
      const pattern = new RegExp(`{{${key}}}`, "g");
      template = template.replace(pattern, data[key] || "");
    }

    // 🔑 Set the document title so "Save as PDF" picks it up
    document.title = `Quote ${data.mfc || "UNKNOWN"} Exp Sea DTD (GRP) - ${data.name || "Customer"}`;


    const quoteBox = document.getElementById("quotePreview");
    quoteBox.innerHTML = template;
  } catch (err) {
    console.error("Preview rendering failed:", err);
  }
}
