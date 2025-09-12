// --- Version history state (global-ish) ---
window.__quoteHistory = { list: [], idx: -1, key: "" };

function accountKeyFromForm() {
  const m = document.getElementById("mfc")?.value?.trim();
  const n = (document.getElementById("name")?.value || "").trim().toLowerCase();
  return m || n || "";
}

function parseDateSafe(v) {
  // Accepts "YYYY-MM-DD" or ISO; falls back to NaN
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : NaN;
}

function updateVersionIndicator() {
  const el = document.getElementById("verIndicator");
  const H = window.__quoteHistory;
  if (!el || !H.list.length) {
    if (el) el.value = "#";
    return;
  }
  el.value = `${H.idx + 1}/${H.list.length}`;
}

function fillFormFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;

  // Snapshot is the plain "user data" row (same shape as your JSON today).
  // Generic writer: for each key, if an element with that id exists, set it.
  Object.entries(snapshot).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (!el) return;

    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
      const type = (el.getAttribute("type") || "").toLowerCase();
      if (type === "checkbox" || type === "radio") {
        el.checked = !!val;
      } else {
        el.value = val ?? "";
      }
      // Fire change so any dependent logic (e.g., MASI button toggles) runs
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.textContent = val ?? "";
    }
  });



  if (Array.isArray(snapshot.accessorials)) {
    applyAccessorials(snapshot.accessorials);
  }




  // If you have any existing functions that recompute UI (e.g., MASI button):
  if (typeof window.updateMasiButton === "function") {
    try { window.updateMasiButton(); } catch { }
  }

  const resultEl2 = document.getElementById("result");
  if (resultEl2) resultEl2.innerHTML = "Version loaded.";
}

function showVersion(delta) {
  const H = window.__quoteHistory;
  if (!H.list.length) return;
  H.idx = Math.max(0, Math.min(H.list.length - 1, H.idx + delta));
  fillFormFromSnapshot(H.list[H.idx]);
  updateVersionIndicator();
}

// Wire the buttons once
// document.addEventListener("DOMContentLoaded", () => {
//   const prevBtn = document.getElementById("verPrev");
//   const nextBtn = document.getElementById("verNext");
//   if (prevBtn) prevBtn.addEventListener("click", () => showVersion(-1));
//   if (nextBtn) nextBtn.addEventListener("click", () => showVersion(1));
//   updateVersionIndicator();
// });
// ---- Delete-mode (Alt) UI ----
window.__deleteMode = false;

function setDeleteMode(on) {
  const nextBtn = document.getElementById("verNext");
  if (!nextBtn) return;
  window.__deleteMode = !!on;
  nextBtn.textContent = on ? "Delete version" : "▶";
  nextBtn.classList.toggle("reset", on);   // red style you already have
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") setDeleteMode(true);
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Alt") setDeleteMode(false);
});
window.addEventListener("blur", () => setDeleteMode(false));

// ---- Delete current version helper ----
async function deleteCurrentVersion() {
  const H = window.__quoteHistory;
  const box = document.getElementById("result");
  if (!H || !H.list.length) return;

  if (H.idx === 0) {
    if (box) box.innerHTML = "Cannot delete the original version.";
    return;
  }
  const curr = H.list[H.idx];
  const key = (curr.mfc || (curr.name || "").toLowerCase());
  const version_ts = curr.version_ts || curr.date_created || ""; // server will validate

  try {
    const res = await fetch("http://localhost:3000/data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, version_ts })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      if (box) box.innerHTML = `Delete failed: ${json.error || res.status}`;
      return;
    }

    // remove from local history + refresh UI
    H.list.splice(H.idx, 1);
    H.idx = Math.max(0, Math.min(H.idx, H.list.length - 1));
    updateVersionIndicator();
    fillFormFromSnapshot(H.list[H.idx]);
    if (box) box.innerHTML = "Version deleted.";
  } catch (e) {
    console.error("Delete failed", e);
    if (box) box.innerHTML = "Delete failed.";
  } finally {
    setDeleteMode(false);
  }
}

// ---- Wire the buttons (augment your existing code) ----
document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("verPrev");
  const nextBtn = document.getElementById("verNext");
  if (prevBtn && !prevBtn.dataset.wired) {
    prevBtn.dataset.wired = "1";
    prevBtn.addEventListener("click", () => showVersion(-1));
  }
  if (nextBtn && !nextBtn.dataset.wired) {
    nextBtn.dataset.wired = "1";
    nextBtn.addEventListener("click", (ev) => {
      if (window.__deleteMode || ev.altKey) {
        deleteCurrentVersion();
      } else {
        showVersion(1);
      }
    });
  }
});



document.addEventListener("DOMContentLoaded", () => {
  // Get form elements
  const form = document.getElementById("dataForm");
  const dateInput = document.getElementById("date_created");
  const nameInput = document.getElementById("name");
  const mfcInput = document.getElementById("mfc");
  const masiBtn = document.getElementById("masi_url");

  // Set initial date if empty
  function setTodayDate() {
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.value = today;
    }
  }
  setTodayDate();

  // Auto-capitalize name
  if (nameInput) {
    nameInput.addEventListener("blur", (e) => {
      const value = e.target.value.trim();
      if (value) {
        e.target.value = value
          .toLowerCase()
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    });
  }

  // Handle MASI URL button functionality
  function updateMasiButton() {
    if (!masiBtn || !mfcInput) return;
    const mfc = mfcInput.value.trim();
    if (mfc) {
      masiBtn.disabled = false;
      masiBtn.style.display = "inline-block";
      masiBtn.onclick = () => window.open(`https://orbit.masi-leap.com/job/${mfc}`, "_blank");
    } else {
      masiBtn.disabled = true;
      masiBtn.style.display = "none";
      masiBtn.onclick = null;
    }
  }

  // Add MFC input listener
  if (mfcInput) mfcInput.addEventListener("input", updateMasiButton);

  // Handle form reset
  // if (form) {
  //   form.addEventListener("reset", () => {
  //     setTimeout(() => {
  //       if (masiBtn) {
  //         masiBtn.disabled = true;
  //         masiBtn.style.display = "none";
  //         masiBtn.onclick = null;
  //       }
  //       const resultEl = document.getElementById("result");
  //       if (resultEl) result.innerHTML = "RESET";
  //       setTodayDate();
  //       const allInputs = form.querySelectorAll("input, select, textarea");
  //       allInputs.forEach(input => {
  //         input.disabled = false;
  //         input.readOnly = false;
  //       });
  //     }, 10);
  //   });
  // }

  if (form) {
    form.addEventListener("reset", () => {
      setTimeout(() => {
        // Hide/disable MASI button
        if (masiBtn) {
          masiBtn.disabled = true;
          masiBtn.style.display = "none";
          masiBtn.onclick = null;
        }

        // Reset message
        const resultEl = document.getElementById("result");
        if (resultEl) resultEl.innerHTML = "RESET";

        // Clear distance value and tooltip (if any)
        const distanceEl = document.getElementById("distance");
        if (distanceEl) {
          distanceEl.value = "";
          distanceEl.removeAttribute("title");
        }

        // Remove dynamic UK postal field if present
        const row = document.getElementById("da_postal_row");
        const p = document.getElementById("da_postal");
        const l = document.getElementById("da_postal_label");
        const b = document.getElementById("da_postal_get");
        if (b) b.remove();
        if (p) p.remove();
        if (l) l.remove();
        if (row) row.remove();

        // ALSO remove India city row if present  ← add this block
        const indiaRow = document.getElementById("da_india_city_row");
        if (indiaRow) indiaRow.remove();




        // (Optional) force selects back to first option
        ["oa_province", "da_country", "oa_building_type", "da_building_type", "units", "pack"]
          .forEach(id => {
            const el = document.getElementById(id);
            if (el && typeof el.selectedIndex === "number") el.selectedIndex = 0;
          });

        // Restore today’s date
        setTodayDate();

        // Re-enable inputs (in case anything was left disabled/readOnly)
        const allInputs = form.querySelectorAll("input, select, textarea");
        allInputs.forEach(input => {
          input.disabled = false;
          input.readOnly = false;
        });
      }, 0);
    });
  }





  // ----- NO-OP SAVE GUARD HELPERS -----

  function snapshotKey(s) {
    return (String(s.mfc || "").trim()) || (String(s.name || "").trim().toLowerCase());
  }

  function normalizeAccessorials(list) {
    if (!Array.isArray(list)) return [];
    return list.map(a => ({
      id: String(a.id || ""),
      checked: !!a.checked,
      desc: (a.desc || "").trim(),
      // store price as string because your JSON sometimes has "" vs number
      price: (a.price ?? "").toString().trim()
    })).sort((a, b) => a.id.localeCompare(b.id));
  }

  function normalizeSnapshot(raw) {
    // Only keep the fields you actually save (ignore server version_ts etc.)
    const keep = [
      "date_created", "name", "email", "phone", "mfc",
      "oa_street", "oa_city", "oa_zip", "oa_province", "oa_building_type", "distance",
      "da_street", "da_city", "da_country", "da_building_type",
      "survey", "volume", "units", "pack", "da_postal", "da_india_city"
    ];
    const o = {};
    for (const k of keep) o[k] = (raw[k] ?? "");
    o.name = String(o.name).trim().toLowerCase();        // normalize casing
    o.mfc = String(o.mfc).trim();
    o.distance = String(o.distance ?? "").trim();        // stored as string today
    o.volume = String(o.volume ?? "").trim();
    o.units = String(o.units || "");
    o.pack = String(o.pack || "");
    o.oa_province = String(o.oa_province || "");
    o.da_country = String(o.da_country || "");
    o.da_postal = String(o.da_postal || "").trim().toUpperCase();
    o.accessorials = normalizeAccessorials(raw.accessorials);
    return o;
  }

  function stableHash(obj) {
    // JSON.stringify is fine if we normalized + sorted arrays
    return JSON.stringify(obj);
  }

  // Keep a session-level last-saved snapshot (handles case where history wasn't loaded)
  window.__lastSavedSnapshot = { key: "", hash: "" };





  // Save on calculation completion
  document.addEventListener("quote:calculated", async () => {
    setTimeout(async () => {
      // If user Alt-clicked, calculate-only (do not save)
      if (window.__calcNoSave) {
        window.__calcNoSave = false; // reset for next time
        console.log("[Save] Skipped (Alt/Option calculate-only).");
        return;
      }




      try {
        const data = {
          date_created: document.getElementById("date_created")?.value?.trim() || "",
          name: document.getElementById("name")?.value?.trim() || "",
          email: document.getElementById("email")?.value?.trim() || "",
          phone: document.getElementById("phone")?.value?.trim() || "",
          mfc: document.getElementById("mfc")?.value?.trim() || "",
          oa_street: document.getElementById("oa_street")?.value?.trim() || "",
          oa_city: document.getElementById("oa_city")?.value?.trim() || "",
          oa_zip: document.getElementById("oa_zip")?.value?.trim() || "",   // ← add this
          oa_province: document.getElementById("oa_province")?.value || "",
          oa_building_type: document.getElementById("oa_building_type")?.value || "",
          distance: document.getElementById("distance")?.value?.trim() || "",
          da_street: document.getElementById("da_street")?.value?.trim() || "",
          da_city: document.getElementById("da_city")?.value?.trim() || "",
          da_country: document.getElementById("da_country")?.value || "",
          da_building_type: document.getElementById("da_building_type")?.value || "",
          survey: document.getElementById("survey")?.value?.trim() || "",
          volume: document.getElementById("volume")?.value?.trim() || "",
          units: document.getElementById("units")?.value || "",
          pack: document.getElementById("pack")?.value || "",
          da_postal: document.getElementById("da_postal")?.value?.trim() || "",
          da_india_city: document.getElementById("da_india_city")?.value?.trim() || "", // ← add this

        };

        // NEW: save accessorial checkboxes
        const accessorials = [];
        document.querySelectorAll('input[id^="accessorial_chx_"]').forEach(ch => {
          if (ch.id === "accessorial_chx_custom") {
            accessorials.push({
              id: ch.id,
              checked: ch.checked,
              desc: document.querySelector('input#acx[type="text"]')?.value.trim() || "",
              price: document.querySelector('input#acx[type="number"]')?.value || ""
            });
          } else {
            accessorials.push({
              id: ch.id,
              checked: ch.checked,
              label: ch.nextSibling?.textContent?.trim() || ""
            });
          }


        });
        data.accessorials = accessorials;









        // ----- NO-OP SAVE CHECK -----
        const key = snapshotKey(data);
        const currHash = stableHash(normalizeSnapshot(data));

        // Prefer comparing to the latest loaded version in history (if any)
        let latestHash = null;
        const H = window.__quoteHistory;
        if (H && H.key === key && H.list.length) {
          const latest = H.list[H.list.length - 1];
          latestHash = stableHash(normalizeSnapshot(latest));
        } else if (window.__lastSavedSnapshot.key === key) {
          // fallback to session last-saved
          latestHash = window.__lastSavedSnapshot.hash;
        }


        /// No save if no changes
        // if (latestHash && latestHash === currHash) {
        //   const box = document.getElementById("result");
        //   if (box) box.innerHTML = "No changes — not saved.";
        //   console.info("[SAVE] Skipped: no changes.");
        //   return; // <<< DO NOT SAVE
        // }
        // ----- / NO-OP SAVE CHECK -----



        data.version_ts = new Date().toISOString();  // fixing "last saved"



        const res = await fetch("http://localhost:3000/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          // remember what we just saved (session-level)
          window.__lastSavedSnapshot = { key, hash: currHash };
        } else {
          console.warn("Failed to save user data:", res.status);
        }
      } catch (err) {
        console.error("Save failed:", err);
      }
    }, 50);
  });

  // Load user by name or MFC
  window.loadUserByName = async () => {
    const nameEl = document.getElementById("name");
    const mfcEl = document.getElementById("mfc");
    if (!nameEl || !mfcEl) return;

    const inputName = nameEl.value.trim().toLowerCase();
    const inputMfc = mfcEl.value.trim();
    if (!inputName && !inputMfc) {
      alert("Please enter a name or MFC number to load.");
      return;
    }

    try {
      const resultEl = document.getElementById("result");
      if (resultEl) resultEl.innerHTML = "Loading user...";

      const res = await fetch("http://localhost:3000/data");
      if (!res.ok) throw new Error("Failed to fetch user data");
      const users = await res.json();

      const found = Array.isArray(users)
        ? users.find(u =>
          (u.name && u.name.toLowerCase() === inputName) ||
          (u.mfc && u.mfc === inputMfc))
        : Object.values(users).find(u =>
          (u.name && u.name.toLowerCase() === inputName) ||
          (u.mfc && u.mfc === inputMfc));






















      const key = accountKeyFromForm();

      // collect all snapshots that match by MFC or by lowercased name
      const versions = (Array.isArray(users) ? users : Object.values(users)).filter(u => {
        const nm = (u.name || "").toLowerCase();
        return (u.mfc && u.mfc === key) || (nm && nm === key);
      });

      // sort by date_created (if present); otherwise keep as-is
      versions.sort((a, b) => {
        const ta = parseDateSafe(a.date_created);
        const tb = parseDateSafe(b.date_created);
        if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
        return 0; // leave original order when dates are missing
      });

      // prime history state and fill with the latest
      window.__quoteHistory = { list: versions, idx: Math.max(0, versions.length - 1), key };
      updateVersionIndicator();

      if (versions.length) {
        fillFormFromSnapshot(versions[versions.length - 1]); // latest
      } else {
        // your existing "not found" path can remain as-is
      }












      if (!versions.length) {

        if (found) {
          // If the loaded record is UK, make sure the field exists before setting values
          const loadedCountry = found.da_country;
          if (loadedCountry === "uk") ensureUKPostalField();
          if (loadedCountry === "in") ensureIndiaCityField(); // ← add this


          for (const [key, value] of Object.entries(found)) {
            if (value == null) continue;
            let el = document.getElementById(key);
            if (!el && key === "oa_province") el = document.getElementById("oa_province");
            if (!el && key === "da_country") el = document.getElementById("da_country");
            // In case postal was not in DOM yet (edge), try to create it and reselect
            if (!el && key === "da_postal") {
              ensureUKPostalField();
              el = document.getElementById("da_postal");
            }
            if (el && el.tagName) el.value = value;
          }
          ///////// find accessorial check box statuses
          // if (found.accessorials) {
          //   found.accessorials.forEach(item => {
          //     const el = document.getElementById(item.id);
          //     if (el) el.checked = !!item.checked;
          //   });
          // }
          applyAccessorials(found.accessorials || []);




          const resultEl2 = document.getElementById("result");
          if (resultEl2) resultEl2.innerHTML = "Version loaded.";

          updateMasiButton();




        } else {
          if (resultEl) resultEl.innerHTML = "User not found.";
          console.log("User not found for:", inputName || inputMfc);
        }
      }

    } catch (err) {
      console.error("Load failed:", err);
      const resultEl = document.getElementById("result");
      if (resultEl) resultEl.innerHTML = "Failed to load user.";
    }
  };

  // Initialize MASI button state
  // const resultEl = document.getElementById("result");
  //   if (resultEl) resultEl.innerHTML = "User loaded successfully!";
  updateMasiButton();


  // Periodic safety re-enable
  setInterval(() => {
    if (!form) return;
    const allInputs = form.querySelectorAll("input, select, textarea");
    allInputs.forEach(input => {
      if (input.disabled && input.id !== "masi_url") input.disabled = false;
      if (input.readOnly && input.type !== "submit" && input.type !== "reset") input.readOnly = false;
    });
  }, 1000);

  // Trigger load on Enter for Full Name or MFC
  [nameInput, mfcInput].forEach(input => {
    if (!input) return;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loadUserByName();
      }
    });
  });

  /** ================= ORS Distance (click "Get") ================ */

  // --- Config ---
  window.ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQyZGQ5Nzc1YWY5NjRjMWM5ODNkYjM1MWM2MjVkODA5IiwiaCI6Im11cm11cjY0In0=";
  window.ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search";
  window.ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";
  window.ORS_REVERSE_URL = "https://api.openrouteservice.org/geocode/reverse"; // add this here


  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);
  const originStreetEl = $("oa_street");
  const originCityEl = $("oa_city");
  const provEl = $("oa_province");
  const distanceEl = $("distance");
  const distanceGetBtn = $("distance_get");

  // --- fetch with timeout (prevents stuck "Getting...") ---
  window.fetchWithTimeout = async function (resource, options = {}) {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(resource, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  }

  // --- Load provider addresses from oa_rates.json (by assigned_province) ---
  let providerAddressByProv = null;
  async function loadProviderAddresses() {
    if (providerAddressByProv) return providerAddressByProv;
    try {
      const res = await fetchWithTimeout("oa_rates.json", { cache: "no-store" });
      if (!res.ok) throw new Error("oa_rates.json fetch failed: " + res.status);
      const companies = await res.json();
      providerAddressByProv = {};
      for (const c of companies) {
        if (c?.assigned_province && c?.company_address && !providerAddressByProv[c.assigned_province]) {
          providerAddressByProv[c.assigned_province] = c.company_address;
        }
      }
      console.debug("[DIST] provider map:", providerAddressByProv);
    } catch (e) {
      console.warn("[DIST] Failed to load provider addresses:", e);
      providerAddressByProv = {};
    }
    return providerAddressByProv;
  }

  function buildAddress(street, city, prov) {
    return [street || "", city || "", (prov || "").toUpperCase(), "Canada"]
      .filter(Boolean)
      .join(", ");
  }

  // --- REVISED GEOCODING FUNCTION (more robust) ---
  async function geocodeOne(addressText, { focus = null } = {}) {
    try {
      const url = new URL(ORS_GEOCODE_URL);
      url.searchParams.set("api_key", ORS_API_KEY);
      url.searchParams.set("text", addressText.trim());
      url.searchParams.set("size", "1");
      url.searchParams.set("boundary.country", "CA");
      // Use address layers to force a street-level search
      url.searchParams.set("layers", "address,street,locality");
      url.searchParams.set("sources", "osm,oa,wof");
      if (focus && Number.isFinite(focus.lon) && Number.isFinite(focus.lat)) {
        url.searchParams.set("focus.point.lon", String(focus.lon));
        url.searchParams.set("focus.point.lat", String(focus.lat));
      }

      const res = await fetchWithTimeout(url.toString());
      if (!res.ok) throw new Error("Geocode HTTP " + res.status);
      const json = await res.json();
      const feat = json?.features?.[0];
      const coords = feat?.geometry?.coordinates; // [lon, lat]
      if (Array.isArray(coords) && coords.length >= 2) {
        console.debug("[DIST] geocode picked:", feat?.properties?.label || addressText, coords);
        return coords;
      }
    } catch (e) {
      console.warn("[DIST] Geocode failed for:", addressText, e);
    }
    return null;
  }

  // Directions distance in km with robust fallbacks
  async function drivingDistanceKm(startLngLat, endLngLat) {
    // Helpers kept INSIDE the function to avoid scope/syntax issues
    function toRad(x) { return (x * Math.PI) / 180; }
    function haversineMeters(a, b) {
      const R = 6371000;
      const φ1 = toRad(a[1]), φ2 = toRad(b[1]);
      const Δφ = toRad(b[1] - a[1]);
      const Δλ = toRad(b[0] - a[0]);
      const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    }

    // 1) Primary: Directions (POST /v2/directions/driving-car)
    try {
      const res = await fetchWithTimeout(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Authorization": ORS_API_KEY
          },
          body: JSON.stringify({
            coordinates: [startLngLat, endLngLat],
            preference: "fastest",
            instructions: false
          })
        }
      );

      if (res.ok) {
        const json = await res.json();
        let meters = json?.routes?.[0]?.summary?.distance;
        if (typeof meters === "number" && isFinite(meters)) return meters / 1000;
        console.warn("[DIST] Directions JSON missing distance (trying Matrix).", json);
      } else {
        console.debug("[DIST] Directions POST HTTP", res.status, "- trying Matrix fallback.");
      }
    } catch (e) {
      console.debug("[DIST] Directions POST failed, trying Matrix:", e);
    }

    // 2) Fallback: Matrix (POST /v2/matrix/driving-car)
    try {
      const res = await fetchWithTimeout(
        "https://api.openrouteservice.org/v2/matrix/driving-car",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Authorization": ORS_API_KEY
          },
          body: JSON.stringify({
            locations: [startLngLat, endLngLat],
            metrics: ["distance"],
            sources: [0],
            destinations: [1]
          })
        }
      );
      if (!res.ok) throw new Error("Matrix HTTP " + res.status);
      const json = await res.json();
      let meters = json?.distances?.[0]?.[0];
      if (typeof meters === "number" && isFinite(meters) && meters > 0) {
        return meters / 1000;
      }
      console.warn("[DIST] Matrix response invalid/zero distance:", json);
    } catch (e) {
      console.warn("[DIST] Matrix failed:", e);
    }

    // 3) Last resort: straight-line estimate scaled to approximate roads
    try {
      const straight = haversineMeters(startLngLat, endLngLat);
      if (isFinite(straight) && straight > 0) return (straight * 1.35) / 1000;
    } catch (_) { }

    return null;
  }

  // --- REVISED MAIN FUNCTION ---
  async function computeAndFillDistance() {
    const street = originStreetEl?.value?.trim() || "";
    const city = originCityEl?.value?.trim() || "";
    const prov = (provEl?.value || "").toLowerCase();
    console.debug("[DIST] inputs:", { street, city, prov });

    if (!city || !prov) {
      distanceEl?.setAttribute("title", "Need City and Province to auto-calc.");
      console.warn("[DIST] missing required fields (City + Province).");
      return;
    }

    const map = await loadProviderAddresses();
    const providerAddr = map?.[prov];
    if (!providerAddr) {
      distanceEl?.setAttribute("title", `No provider address for province "${prov}".`);
      console.warn("[DIST] no provider for province:", prov);
      return;
    }

    // Geocode provider first to get a focus point
    const to = await geocodeOne(providerAddr);
    if (!to) {
      distanceEl?.setAttribute("title", "Provider address could not be geocoded.");
      console.warn("[DIST] provider geocode failed.");
      return;
    }

    // Geocode origin address using the destination as a focus point
    const originAddr = buildAddress(street, city, prov);
    const focusPoint = { lon: to[0], lat: to[1] };
    const from = await geocodeOne(originAddr, { focus: focusPoint });

    if (!from) {
      distanceEl?.setAttribute("title", "Origin address could not be geocoded.");
      console.warn("[DIST] origin geocode failed.");
      return;
    }

    // Explicit check for identical coordinates before making API calls
    const nearlySame = (a, b) => {
      if (!a || !b) return false;
      const eps = 1e-4; // ~10 meters
      return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
    };
    if (nearlySame(from, to)) {
      distanceEl?.setAttribute("title", "Origin and destination are the same location.");
      distanceEl.value = "0"; // Set to 0 since they are effectively the same location
      console.warn("[DIST] Origin and destination are the same location. Setting distance to 0.");
      return;
    }

    // Log the coordinates for debugging
    console.log("[DIST] Origin Coordinates:", from);
    console.log("[DIST] Destination Coordinates:", to);

    // Route and set km
    const km = await drivingDistanceKm(from, to);
    console.debug("[DIST] km (raw):", km);
    if (km == null || km < 1) {
      distanceEl?.setAttribute("title", "Directions failed. Fill distance manually.");
      return;
    }

    const adjusted = Math.ceil(km);
    if (distanceEl) {
      distanceEl.value = String(adjusted);
      distanceEl.dispatchEvent(new Event("input", { bubbles: true }));
      distanceEl.removeAttribute("title");
      console.info("[DIST] filled:", adjusted, "km (rounded up)");
    }
  }

  // Bind click ONCE
  if (distanceGetBtn && !distanceGetBtn.dataset.wired) {
    distanceGetBtn.dataset.wired = "1";
    distanceGetBtn.addEventListener("click", async () => {
      const prev = distanceGetBtn.textContent;
      distanceGetBtn.disabled = true;
      distanceGetBtn.textContent = "Getting...";
      try {
        await computeAndFillDistance();
      } finally {
        distanceGetBtn.disabled = false;
        distanceGetBtn.textContent = prev;
      }
    });
  } else if (!distanceGetBtn) {
    console.warn('[DIST] Button "#distance_get" not found in DOM.');
  }








  // ===== UK Postal code dynamic field (Destination) =====

  const ORS_REVERSE_URL = "https://api.openrouteservice.org/geocode/reverse";

  const daCountryEl = document.getElementById("da_country");
  const daCityEl = document.getElementById("da_city");





  // -------- Guess UK Postcode via ORS --------
  async function guessUKPostcode() {
    const daCountry = document.getElementById("da_country")?.value;
    if (daCountry !== "uk") {
      alert("Postcode lookup works only when Country = UK.");
      return;
    }

    const street = document.getElementById("da_street")?.value?.trim() || "";
    const city = document.getElementById("da_city")?.value?.trim() || "";
    if (!city && !street) {
      alert("Enter at least City or Street to guess the UK postcode.");
      return;
    }

    try {
      // 1) Forward: address -> coords (GB)
      const fwd = new URL(ORS_GEOCODE_URL);
      fwd.searchParams.set("api_key", ORS_API_KEY);
      fwd.searchParams.set("text", [street, city, "United Kingdom"].filter(Boolean).join(", "));
      fwd.searchParams.set("size", "1");
      fwd.searchParams.set("boundary.country", "GB");
      fwd.searchParams.set("layers", "address,street,locality");
      fwd.searchParams.set("sources", "osm,oa,wof");

      const resF = await fetchWithTimeout(fwd.toString());
      if (!resF.ok) throw new Error("Geocode HTTP " + resF.status);
      const jsonF = await resF.json();
      const featF = jsonF?.features?.[0];
      const coords = featF?.geometry?.coordinates; // [lon, lat]
      if (!Array.isArray(coords) || coords.length < 2) throw new Error("No coords from forward geocode.");

      // 2) Reverse: coords -> postcode
      const rev = new URL(ORS_REVERSE_URL);
      rev.searchParams.set("api_key", ORS_API_KEY);
      rev.searchParams.set("point.lon", String(coords[0]));
      rev.searchParams.set("point.lat", String(coords[1]));
      rev.searchParams.set("size", "1");
      rev.searchParams.set("layers", "postalcode");       // <-- target postalcode layer
      rev.searchParams.set("boundary.circle.radius", "1"); // 1km search ring
      rev.searchParams.set("layers", "postalcode,address");
      rev.searchParams.set("boundary.circle.radius", "5"); // 5 km search ring




      const resR = await fetchWithTimeout(rev.toString());
      if (!resR.ok) throw new Error("Reverse HTTP " + resR.status);
      const jsonR = await resR.json();
      console.log("[POSTCODE] reverse JSON:", jsonR);
      const props = jsonR?.features?.[0]?.properties || {};

      let pc = props.postalcode || props.postcode || "";

      // final fallback: try label
      if (!pc && props.label) {
        const m = props.label.toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/);
        if (m) pc = m[0];
      }

      // normalize spacing, e.g., SW1A1AA -> SW1A 1AA
      if (pc) {
        pc = pc.toUpperCase().replace(/\s+/g, "");
        if (pc.length > 3) pc = pc.slice(0, -3) + " " + pc.slice(-3);
      }


      const LONDON_FALLBACK_PC = "WC2H 7LT";


      const postalEl = document.getElementById("da_postal");
      if (postalEl && pc) {
        postalEl.value = pc;
        postalEl.dispatchEvent(new Event("input", { bubbles: true }));
        postalEl.setAttribute("title", props.label || "");
      } else {
        // Fallback ONLY for London; otherwise keep manual-entry alert
        const city = (document.getElementById("da_city")?.value || "").trim().toLowerCase();
        if (postalEl && city === "london") {
          postalEl.value = LONDON_FALLBACK_PC;
          postalEl.dispatchEvent(new Event("input", { bubbles: true }));
          postalEl.setAttribute("title", "Fallback: London (WC2H 7LT)");
        } else {
          alert("Sorry, couldn’t determine a UK postcode for that address.");
        }
      }

    } catch (e) {
      console.warn("[POSTCODE] lookup failed:", e);
      // Fallback ONLY for London; otherwise keep manual-entry alert
      const postalEl = document.getElementById("da_postal");
      const city = (document.getElementById("da_city")?.value || "").trim().toLowerCase();
      if (postalEl && city === "london") {
        postalEl.value = LONDON_FALLBACK_PC;
        postalEl.dispatchEvent(new Event("input", { bubbles: true }));
        postalEl.setAttribute("title", "Fallback: London (WC2H 7LT)");
      } else {
        alert("Postcode lookup failed. Please type it manually.");
      }
    }
  }







  function ensureUKPostalField() {
    const existingInput = document.getElementById("da_postal");
    const existingLabel = document.getElementById("da_postal_label");
    const existingBtn = document.getElementById("da_postal_get");

    const isUK = daCountryEl && daCountryEl.value === "uk";

    // Remove if not UK
    if (!isUK) {
      if (existingBtn) existingBtn.remove();
      if (existingInput) existingInput.remove();
      if (existingLabel) existingLabel.remove();
      return;
    }

    // Already there
    if (existingInput && existingLabel && existingBtn) return;

    // Create label + input + "Get" button; insert just below Country
    const label = existingLabel || document.createElement("div");
    label.className = "sap-line";
    label.id = "da_postal_label";
    label.textContent = "Postal code*";

    // Create row container like Distance row
    let row = document.getElementById("da_postal_row");
    if (!row) {
      row = document.createElement("div");
      row.id = "da_postal_row";
      row.className = "input-row";
    }

    // Create / reuse input
    const input = existingInput || document.createElement("input");
    input.type = "text";
    input.id = "da_postal";
    input.name = "da_postal";
    input.required = true;
    // match distance input look
    input.className = "txt_input flat mono hundred";
    input.placeholder = "e.g., SW1A 1AA";

    // Create / reuse button with same class as km
    const btn = existingBtn || document.createElement("button");
    btn.type = "button";
    btn.id = "da_postal_get";
    btn.textContent = "Get";
    btn.className = "btn load";

    // Insert under Country, with row wrapping input + button
    if (daCountryEl) {
      daCountryEl.insertAdjacentElement("afterend", label);
      label.insertAdjacentElement("afterend", row);

      // clear & append in correct order once
      if (!existingInput) row.appendChild(input);
      if (!existingBtn) row.appendChild(btn);
    }


    // Bind click once
    if (!btn.dataset.wired) {
      btn.dataset.wired = "1";
      btn.addEventListener("click", async () => {
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Getting...";
        try {
          await guessUKPostcode();
        } finally {
          btn.disabled = false;
          btn.textContent = prev;
        }
      });
    }
  }


  // React when country changes and on first load
  if (daCountryEl) {
    daCountryEl.addEventListener("change", ensureUKPostalField);
    daCountryEl.addEventListener("change", ensureIndiaCityField); // ← add this

    ensureUKPostalField(); // initialize once
    ensureIndiaCityField();   // ← add this
  }




  // India and Cities
  async function ensureIndiaCityField() {
    const countryEl = document.getElementById("da_country");
    if (!countryEl) return;

    const rowId = "da_india_city_row";
    const labelId = "da_india_city_label";
    const isIndia = (countryEl.value || "").toLowerCase() === "in";

    // Remove if not India
    if (!isIndia) {
      document.getElementById(rowId)?.remove();
      document.getElementById(labelId)?.remove();  // remove label too
      return;
    }

    // If already present, don't rebuild
    if (document.getElementById(rowId) && document.getElementById(labelId)) return;

    // --- create label like UK postal ---
    const label = document.createElement("div");
    label.className = "sap-line";
    label.id = labelId;
    label.textContent = "Indian City (for DA zone)";

    // --- create input row like UK postal ---
    const row = document.createElement("div");
    row.id = rowId;
    row.className = "input-row";

    const select = document.createElement("select");
    select.id = "da_india_city";
    select.name = "da_india_city";
    select.required = true;
    select.className = "drop";

    // placeholder
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select city…";
    select.appendChild(ph);

    // populate from da_rates.json (company IGL)
    try {
      const res = await fetch("da_rates.json", { cache: "no-store" });
      const json = await res.json();
      const igl = json.find(x => (x.company_name || "").toLowerCase() === "igl");
      const cities = new Set();
      (igl?.rates || []).forEach(r => {
        const c = String(r.country || "").trim().toLowerCase();
        if (c) cities.add(c);
      });

      // NOTE: fix the typo here: [...cities], not [.cities]
      [...cities].sort().forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c.replace(/\b\w/g, ch => ch.toUpperCase());
        select.appendChild(opt);
      });
    } catch (e) {
      console.warn("[India] Failed to load IGL cities:", e);
    }


    // 2nd try??
    try {
      const H = window.__quoteHistory;
      const saved =
        (H && H.list && H.list.length)
          ? (H.list[H.idx]?.da_india_city || H.list[H.list.length - 1]?.da_india_city || "")
          : "";
      if (saved) {
        const want = String(saved).trim().toLowerCase();
        // pick it if that option exists
        if ([...select.options].some(o => o.value === want)) {
          select.value = want;
          // fire events so any dependent logic updates
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } catch { }


    row.appendChild(select);

    // Insert directly after the Country select, exactly like UK does
    countryEl.insertAdjacentElement("afterend", label);                      // UK inserts label after country… :contentReference[oaicite:0]{index=0}
    label.insertAdjacentElement("afterend", row);                            // …then the input row. :contentReference[oaicite:1]{index=1}
  }







  /** ================= Accessorial checkboxes (dynamic from margin_rates.json) ================ */
  async function buildAccessorialCheckboxes() {
    try {
      const res = await fetch("margin_rates.json", { cache: "no-store" });
      if (!res.ok) throw new Error("margin_rates.json fetch failed: " + res.status);
      const data = await res.json();

      // Collect unique, non-empty accessorial names (in order)
      const seen = new Set();
      const names = [];
      for (const item of Array.isArray(data?.accessorials) ? data.accessorials : []) {
        const n = String(item?.name || "").trim();
        if (!n || seen.has(n)) continue;
        seen.add(n);
        names.push(n);
      }

      // Find the container holding the first 3 static checkboxes (Accessorial 1–3)
      // We'll append our dynamic list here.
      const firstBlockInput = document.querySelector('#accessorial_chx_1');
      const target = firstBlockInput ? firstBlockInput.closest('div') : null;

      // Remove ONLY the static placeholders (Accessorial 1..5), NOT the custom checkbox & inputs
      const toRemoveInputs = document.querySelectorAll(
        'label.custom-checkbox > input[id^="accessorial_chx_"]:not(#accessorial_chx_custom)'
      );
      const labelsToRemove = new Set();
      toRemoveInputs.forEach(inp => {
        const lbl = inp.closest('label.custom-checkbox');
        if (lbl) labelsToRemove.add(lbl);
      });
      labelsToRemove.forEach(lbl => lbl.remove());

      if (!target) return; // nothing to render into

      // Helper to slugify a display name into an id/name
      const slug = (txt) =>
        txt.toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 48) || "accessorial";

      // Render one label per saved accessorial
      names.forEach(displayName => {
        const id = `accessorial_chx_${slug(displayName)}`;

        const label = document.createElement("label");
        label.className = "custom-checkbox";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.name = id;

        const check = document.createElement("span");
        check.className = "checkmark";

        const text = document.createElement("span");
        text.textContent = displayName;

        label.appendChild(input);
        label.appendChild(check);
        label.appendChild(text);

        target.appendChild(label);
      });
    } catch (e) {
      console.warn("[ACCESSORIALS] Failed to build accessorial list:", e);
    }
  }

  // Build once on load
  buildAccessorialCheckboxes();



});





function applyAccessorials(list) {
  if (!Array.isArray(list)) return;

  // clear first
  document.querySelectorAll('input[id^="accessorial_chx_"]').forEach(ch => {
    if (ch.id !== 'accessorial_chx_custom') ch.checked = false;
  });
  const descInp = document.querySelector('input#acx[type="text"]');
  const priceInp = document.querySelector('input#acx[type="number"]');
  if (descInp) descInp.value = "";
  if (priceInp) priceInp.value = "";

  // set from snapshot
  list.forEach(item => {
    if (item.id === 'accessorial_chx_custom') {
      const c = document.getElementById('accessorial_chx_custom');
      if (c) c.checked = !!item.checked;
      if (descInp) descInp.value = item.desc || "";
      if (priceInp) priceInp.value = item.price || "";
    } else {
      const el = document.getElementById(item.id);
      if (el) el.checked = !!item.checked;
    }
  });
}








// --- Alt/Option = calculate without saving ---
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) return;

  let altMode = false;
  const updateSaveLabel = () => {
    saveBtn.textContent = altMode ? "Calculate without Saving" : "Save User & Calculate";
  };

  // Show alternate label while Alt/Option is held
  window.addEventListener("keydown", (e) => {
    if (e.altKey && !altMode) {
      altMode = true;
      updateSaveLabel();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (!e.altKey && altMode) {
      altMode = false;
      updateSaveLabel();
    }
  });

  // If the user Alt-clicks, mark this submission as "no save"
  saveBtn.addEventListener("click", (e) => {
    window.__calcNoSave = !!e.altKey; // used by the quote:calculated handler
  });
});

// --- Alt/Option mode for Save button: red + no-save ---
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) return;

  // If you previously added label-toggling, you can remove it; we just flip classes now.
  function setAltMode(on) {
    if (on) {
      saveBtn.classList.remove("save");
      saveBtn.classList.add("reset");   // red style
    } else {
      saveBtn.classList.add("save");
      saveBtn.classList.remove("reset");
    }
  }

  // Show red button while Alt is held
  const onKeyDown = (e) => { if (e.altKey) setAltMode(true); };
  const onKeyUp = (e) => { if (!e.altKey) setAltMode(false); };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => setAltMode(false));

  // Mark this submission as "calculate-only" when Alt-clicking
  saveBtn.addEventListener("click", (e) => {
    window.__calcNoSave = !!e.altKey; // read in the quote:calculated handler
  });







  // ===== Canada Postal Code (Origin) — button-only, same pattern as UK =====

  // -------- Guess Canadian Postal Code via ORS --------
  async function guessCAPostcode() {
    // No country selector for origin, so just build an address for Canada
    const street = document.getElementById("oa_street")?.value?.trim() || "";
    const city = document.getElementById("oa_city")?.value?.trim() || "";
    const prov = (document.getElementById("oa_province")?.value || "").toUpperCase();

    if (!city && !street) {
      alert("Enter at least City or Street to guess the Canadian postal code.");
      return;
    }

    try {
      // 1) Forward: address -> coords (CA)
      const fwd = new URL(ORS_GEOCODE_URL);
      fwd.searchParams.set("api_key", ORS_API_KEY);
      fwd.searchParams.set("text", [street, city, prov, "Canada"].filter(Boolean).join(", "));
      fwd.searchParams.set("size", "1");
      fwd.searchParams.set("boundary.country", "CA");
      fwd.searchParams.set("layers", "address,street,locality");
      fwd.searchParams.set("sources", "osm,oa,wof");

      const resF = await fetchWithTimeout(fwd.toString());
      if (!resF.ok) throw new Error("Geocode HTTP " + resF.status);
      const jsonF = await resF.json();
      const featF = jsonF?.features?.[0];
      const coords = featF?.geometry?.coordinates; // [lon, lat]
      if (!Array.isArray(coords) || coords.length < 2) {
        throw new Error("No coords from forward geocode.");
      }

      // 2) Reverse: coords -> postalcode (CA)
      const rev = new URL(ORS_REVERSE_URL);
      rev.searchParams.set("api_key", ORS_API_KEY);
      rev.searchParams.set("point.lon", String(coords[0]));
      rev.searchParams.set("point.lat", String(coords[1]));
      rev.searchParams.set("size", "1");
      rev.searchParams.set("layers", "postalcode");         // focus postal code
      rev.searchParams.set("boundary.circle.radius", "1");  // 1 km
      // widen and include address as fallback (mirrors your UK code style)
      rev.searchParams.set("layers", "postalcode,address");
      rev.searchParams.set("boundary.circle.radius", "5");  // 5 km

      const resR = await fetchWithTimeout(rev.toString());
      if (!resR.ok) throw new Error("Reverse HTTP " + resR.status);
      const jsonR = await resR.json();
      const props = jsonR?.features?.[0]?.properties || {};

      let pc = props.postalcode || props.postcode || "";

      // final fallback: try label (A1A 1A1)
      if (!pc && props.label) {
        const m = props.label.toUpperCase()
          .match(/\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d\b/);
        if (m) pc = m[0];
      }

      // normalize spacing, e.g., A1A1A1 -> A1A 1A1
      if (pc) {
        pc = pc.toUpperCase().replace(/\s+/g, "");
        if (pc.length > 3) pc = pc.slice(0, 3) + " " + pc.slice(3);
      }

      const postalEl = document.getElementById("oa_zip");
      if (postalEl && pc) {
        postalEl.value = pc;
        postalEl.dispatchEvent(new Event("input", { bubbles: true }));
        postalEl.setAttribute("title", props.label || "");
      } else {
        alert("Couldn't fetch the Canadian postal code. Please enter it manually.");
      }
    } catch (e) {
      console.warn("[CA POSTCODE] lookup failed:", e);
      alert("Couldn't fetch the Canadian postal code. Please enter it manually.");
    }
  }

  // Wire the Origin ZIP "Get" button — BUTTON ONLY (no automatic triggers)
  (function wireCAPostcodeButton() {
    const btn = document.getElementById("btn_get_oa_zip");
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async () => {
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Getting...";
      try {
        await guessCAPostcode();
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  })();














});
