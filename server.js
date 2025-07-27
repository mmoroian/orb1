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
                  if (err) console.error("Failed to save updated exchange rates:", err);
                  else console.log("✅ Exchange rates auto-updated.");
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








// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



// Save user data
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

    // Check if user already exists by name or MFC
    const existingIndex = users.findIndex(
      (u) => u.name === newUser.name || u.mfc === newUser.mfc
    );

    if (existingIndex !== -1) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }

    fs.writeFile(USER_DATA_FILE, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).json({ error: "Failed to save user data" });
      }
      res.json({ success: true });
    });
  });
});

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
