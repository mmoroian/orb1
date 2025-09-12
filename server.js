Object.keys(require.cache).forEach(function (key) {
  delete require.cache[key];
});


const express = require("express");
const app = express();

const fs = require("fs");
const path = require("path");



const PORT = 3000;

const DATA_FILE = path.join(__dirname, "oa_rates.json");

const FREIGHT_DATA_FILE = path.join(__dirname, "freight_rates.json");

const USER_DATA_FILE = path.join(__dirname, "formdata.json");

const DA_DATA_FILE = path.join(__dirname, "da_rates.json");

const MARGIN_DATA_FILE = path.join(__dirname, "margin_rates.json");

const EXCHANGE_RATES_FILE = path.join(__dirname, "exchange_rates.json");




app.use(express.json());
app.use(express.static(__dirname));

// Enable CORS (for local dev)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Load all companies
app.get("/oa-rates", (req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]); // File doesn't exist yet
      return res.status(500).json({ error: "Failed to read data" });
    }

    try {
      const json = JSON.parse(data);
      if (!Array.isArray(json)) throw new Error("Data must be an array");
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON format in data file" });
    }
  });
});

// Save or update a company
app.post("/oa-rates", (req, res) => {
  const newEntry = req.body;

  if (!newEntry || !newEntry.company_name) {
    return res.status(400).json({ error: "Missing company_name" });
  }

  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    let entries = [];

    if (!err) {
      try {
        entries = JSON.parse(data);
        if (!Array.isArray(entries)) entries = [];
      } catch {
        entries = [];
      }
    }

    // Update if company already exists
    const existingIndex = entries.findIndex(
      (e) => e.company_name === newEntry.company_name
    );

    if (existingIndex !== -1) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), (err) => {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).json({ error: "Failed to save data" });
      }
      res.json({ success: true });
    });
  });
});





// Load all freight countries
app.get("/freight-rates", (req, res) => {
  fs.readFile(FREIGHT_DATA_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]); // File doesn't exist yet
      return res.status(500).json({ error: "Failed to read data" });
    }

    try {
      const json = JSON.parse(data);
      if (!Array.isArray(json)) throw new Error("Data must be an array");
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON format in freight data file" });
    }
  });
});

// Save or update freight country
app.post("/freight-rates", (req, res) => {
  const newEntry = req.body;

  if (!newEntry || !newEntry.country_name) {
    return res.status(400).json({ error: "Missing country_name" });
  }

  fs.readFile(FREIGHT_DATA_FILE, "utf8", (err, data) => {
    let entries = [];

    if (!err) {
      try {
        entries = JSON.parse(data);
        if (!Array.isArray(entries)) entries = [];
      } catch {
        entries = [];
      }
    }

    const existingIndex = entries.findIndex(
      (e) => e.country_name === newEntry.country_name
    );

    if (existingIndex !== -1) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    fs.writeFile(FREIGHT_DATA_FILE, JSON.stringify(entries, null, 2), (err) => {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).json({ error: "Failed to save freight data" });
      }
      res.json({ success: true });
    });
  });
});


// Load all DA companies
app.get("/da-rates", (req, res) => {
  fs.readFile(DA_DATA_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]); // File doesn't exist yet
      return res.status(500).json({ error: "Failed to read DA data" });
    }

    try {
      const json = JSON.parse(data);
      if (!Array.isArray(json)) throw new Error("Data must be an array");
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON format in DA data file" });
    }
  });
});

// Save or update DA company
app.post("/da-rates", (req, res) => {
  const newEntry = req.body;

  if (!newEntry || !newEntry.company_name) {
    return res.status(400).json({ error: "Missing company_name" });
  }

  fs.readFile(DA_DATA_FILE, "utf8", (err, data) => {
    let entries = [];

    if (!err) {
      try {
        entries = JSON.parse(data);
        if (!Array.isArray(entries)) entries = [];
      } catch {
        entries = [];
      }
    }

    const existingIndex = entries.findIndex(
      (e) => e.company_name === newEntry.company_name
    );

    if (existingIndex !== -1) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    fs.writeFile(DA_DATA_FILE, JSON.stringify(entries, null, 2), (err) => {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).json({ error: "Failed to save DA data" });
      }
      res.json({ success: true });
    });
  });
});


// Load all Orbit Margin rates
app.get("/margin-rates", (req, res) => {
  fs.readFile(MARGIN_DATA_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json({}); // If file not found, return empty
      return res.status(500).json({ error: "Failed to read margin data" });
    }

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON in margin_rates.json" });
    }
  });
});

// Save all Orbit Margin rates
app.post("/margin-rates", (req, res) => {
  const data = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  fs.writeFile(MARGIN_DATA_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Write error:", err);
      return res.status(500).json({ error: "Failed to save margin data" });
    }

    res.json({ success: true });
  });
});








// Auto-refresh exchange rates if outdated
// ==========================
const https = require("https");

function updateExchangeRatesIfOld() {
  fs.readFile(EXCHANGE_RATES_FILE, "utf8", (err, data) => {
    if (err) return console.error("Cannot read exchange_rates.json:", err);

    try {
      const json = JSON.parse(data);
      const lastUpdate = new Date(json.updated);
      const now = new Date();
      const ageMs = now - lastUpdate;

      if (ageMs > 24 * 60 * 60 * 1000) {
        console.log("⚠️ Exchange rates older than 24h. Fetching new rates...");

        https.get("https://api.frankfurter.app/latest?base=EUR&symbols=CAD,USD,GBP,AUD", res => {
          let body = "";
          res.on("data", chunk => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              const rates = parsed.rates;

              const eurToCad = rates.CAD;
              const eurToUsd = rates.USD;
              const eurToGbp = rates.GBP;
              const eurToAud = rates.AUD;

              if (!eurToCad || !eurToUsd || !eurToGbp || !eurToAud) {
                throw new Error("Incomplete rate data");
              }

              const to2 = n => Math.round(n * 100) / 100;

              const updatedRates = {
                updated: new Date().toISOString(),
                USD: to2(eurToCad / eurToUsd),
                EUR: to2(eurToCad),
                GBP: to2(eurToCad / eurToGbp),
                AUD: to2(eurToCad / eurToAud)
              };

              fs.writeFile(
                EXCHANGE_RATES_FILE,
                JSON.stringify(updatedRates, null, 2),
                err => {
                  if (err) {
                    console.error("Failed to save updated exchange rates:", err);
                  } else {
                    console.log("✅ Exchange rates auto-updated.");
                    broadcast("fx_update", { updated: updatedRates.updated }); // keep this
                    recomputeFreightRatesFromFX(updatedRates); // <— add this line
                  }
                }
              );
            } catch (e) {
              console.error("Failed to parse rates:", e);
            }
          });
        }).on("error", e => {
          console.error("Failed to fetch rates:", e);
        });
      } else {
        console.log("✅ Exchange rates are up-to-date.");
      }
    } catch (e) {
      console.error("Invalid JSON in exchange_rates.json:", e);
    }
  });
}

// Call once at startup
updateExchangeRatesIfOld();

// Optionally, repeat every 6 hours
setInterval(updateExchangeRatesIfOld, 6 * 60 * 60 * 1000);






// --- SSE to notify clients when FX updates ---
const clients = new Set();
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // keep connection open
  clients.add(res);
  req.on("close", () => {
    clients.delete(res);
    try { res.end(); } catch { }
  });
});
function broadcast(event, payload) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try { res.write(msg); } catch { clients.delete(res); }
  }
}








// Recompute all freight rates in freight_rates.json using fresh FX
function recomputeFreightRatesFromFX(xr) {
  // 1) Read margin settings to get da_v_rate
  fs.readFile(MARGIN_DATA_FILE, "utf8", (mErr, mRaw) => {
    let da_v = 0;
    if (!mErr) {
      try { da_v = parseFloat(JSON.parse(mRaw).da_v_rate) || 0; } catch { }
    }
    if (!da_v) {
      console.warn("recomputeFreightRatesFromFX: missing da_v_rate; leaving rates blank.");
    }

    // 2) Read current freight data
    fs.readFile(FREIGHT_DATA_FILE, "utf8", (fErr, fRaw) => {
      if (fErr) return console.error("Cannot read freight_rates.json:", fErr);

      let countries;
      try { countries = JSON.parse(fRaw); } catch (e) {
        return console.error("Invalid JSON in freight_rates.json:", e);
      }
      if (!Array.isArray(countries)) countries = [];

      // FX map (to CAD). XR JSON is already CAD-per-unit of each currency.
      const rate = {
        CAD: 1,
        USD: Number(xr.USD || 0),
        EUR: Number(xr.EUR || 0),
        GBP: Number(xr.GBP || 0),
        AUD: Number(xr.AUD || 0),
      };
      const toCAD = (amt, cur) => {
        const v = Number(amt || 0);
        const r = rate[(cur || "CAD").toUpperCase()] || 0;
        return !v ? 0 : ((cur || "CAD").toUpperCase() === "CAD" ? v : v * r);
      };
      const UPLIFT = 1.036;

      const updated = countries.map(entry => {
        const f20 = Number(entry.freight_fcl20 || 0);
        const f20Cur = String(entry.freight_fcl20_currency || "CAD").toUpperCase();
        const f20D = Number(entry.freight_fcl20_dthc || 0);
        const f20DC = String(entry.freight_fcl20_dthc_currency || "CAD").toUpperCase();

        const f40 = Number(entry.freight_fcl40 || 0);
        const f40Cur = String(entry.freight_fcl40_currency || "CAD").toUpperCase();
        const f40D = Number(entry.freight_fcl40_dthc || 0);
        const f40DC = String(entry.freight_fcl40_dthc_currency || "CAD").toUpperCase();

        const dray = Number(entry.freight_drayage || 0);
        const drayC = String(entry.freight_drayage_currency || "CAD").toUpperCase();

        const totalFor = (markupType /* "variable"|"flat" */) => {
          const use20 = markupType === "variable"; // "variable" => FCL20, "flat" => FCL40
          const base = use20 ? f20 : f40;
          const baseC = use20 ? f20Cur : f40Cur;
          const dthc = use20 ? f20D : f40D;
          const dthcC = use20 ? f20DC : f40DC;
          return toCAD(base, baseC) + toCAD(dthc, dthcC) + toCAD(dray, drayC);
        };

        const newRates = (entry.rates || []).map(row => {
          const divisor = Number(row.markup || 0);
          const type = row.markup_type || "flat";
          if (!divisor || !da_v) return { ...row, freight_rate: "" };
          const totalCAD = totalFor(type);
          const calc = ((totalCAD / da_v) / divisor) * UPLIFT;
          return { ...row, freight_rate: calc.toFixed(2) };
        });

        return { ...entry, rates: newRates };
      });

      // 3) Write back to freight_rates.json
      fs.writeFile(FREIGHT_DATA_FILE, JSON.stringify(updated, null, 2), wErr => {
        if (wErr) return console.error("Failed to update freight_rates.json:", wErr);
        console.log("✅ Exchange rates auto-updated for Freight rates.");
      });
    });
  });
}

















// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



// Save user data
// Save user data (append-only for version history)
app.post("/data", (req, res) => {
  const newUser = req.body;

  if (!newUser || !newUser.name) {
    return res.status(400).json({ error: "Missing user name" });
  }

  fs.readFile(USER_DATA_FILE, "utf8", (err, data) => {
    let users = [];
    if (!err) {
      try {
        users = JSON.parse(data);
        if (!Array.isArray(users)) users = [];
      } catch {
        users = [];
      }
    }

    // 👉 Always push a new version, do NOT replace
    users.push({
      ...newUser,
      version_ts: new Date().toISOString() // optional: helps sort reliably
    });

    fs.writeFile(USER_DATA_FILE, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).json({ error: "Failed to save user data" });
      }
      res.json({ success: true });
    });
  });
});




// Check if user already exists by name or MFC





// Load user data
app.get("/data", (req, res) => {
  fs.readFile(USER_DATA_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]); // File doesn't exist yet
      return res.status(500).json({ error: "Failed to read user data" });
    }

    try {
      const json = JSON.parse(data);
      if (!Array.isArray(json)) throw new Error("Data must be an array");
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON format in user data file" });
    }
  });
});



// Currency exchange rates

app.get("/exchange-rates", (req, res) => {
  fs.readFile(EXCHANGE_RATES_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json({});
      return res.status(500).json({ error: "Failed to read exchange rates" });
    }

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON format" });
    }
  });
});

// POST exchange rates to save
app.post("/exchange-rates", (req, res) => {
  const data = req.body;

  if (
    typeof data !== "object" ||
    isNaN(data.USD) ||
    isNaN(data.EUR) ||
    isNaN(data.GBP) ||
    isNaN(data.AUD)
  ) {
    return res.status(400).json({ error: "Invalid exchange rate data" });
  }

  fs.writeFile(EXCHANGE_RATES_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Write error:", err);
      return res.status(500).json({ error: "Failed to save exchange rates" });
    }
    res.json({ success: true });
  });
});







const HTML_TEMPLATE_PATH = path.join(__dirname, "html", "clean.html");

app.post("/generate-html", (req, res) => {
  const data = req.body;

  fs.readFile(HTML_TEMPLATE_PATH, "utf8", (err, template) => {
    if (err) {
      console.error("Error reading clean.html:", err);
      return res.status(500).send("Template read error");
    }

    // Replace all {{placeholder}} with actual values
    const filled = template.replace(/{{(\w+)}}/g, (_, key) => {
      return data[key] || "";
    });

    const filename = `quote_${data.mfc || "new"}.html`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(filled);
  });
});





// Delete a specific version (never the original)
app.delete("/data", (req, res) => {
  const { key, version_ts } = req.body || {};
  if (!key || !version_ts) {
    return res.status(400).json({ error: "Missing key or version_ts" });
  }

  fs.readFile(USER_DATA_FILE, "utf8", (err, data) => {
    let users = [];
    if (!err) {
      try { users = JSON.parse(data); if (!Array.isArray(users)) users = []; }
      catch { users = []; }
    }

    // collect all rows for this account
    const sameKey = (u) => (u.mfc && u.mfc === key) ||
      ((u.name || "").toLowerCase() === String(key).toLowerCase());
    const bucket = users.filter(sameKey);
    if (bucket.length <= 1) {
      return res.status(400).json({ error: "Cannot delete the only/original version" });
    }

    const toNum = (u) => {
      const t = Date.parse(u.version_ts || u.date_created || "");
      return Number.isFinite(t) ? t : 0;
    };
    bucket.sort((a, b) => toNum(a) - toNum(b));
    const originalTs = bucket[0].version_ts || bucket[0].date_created || "";

    if (version_ts === originalTs) {
      return res.status(400).json({ error: "Cannot delete the original version" });
    }

    // find the exact row to delete in the main array
    const delIdx = users.findIndex(u => sameKey(u) &&
      (String(u.version_ts || u.date_created || "") === String(version_ts)));

    if (delIdx === -1) {
      return res.status(404).json({ error: "Version not found" });
    }

    users.splice(delIdx, 1);
    fs.writeFile(USER_DATA_FILE, JSON.stringify(users, null, 2), (werr) => {
      if (werr) return res.status(500).json({ error: "Failed to write data file" });
      res.json({ success: true });
    });
  });
});