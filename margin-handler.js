document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("freight_rates");

  window.loadOrbit = async () => {
    try {
      const res = await fetch("/margin-rates");
      if (!res.ok) throw new Error("Failed to load margin data");
      const data = await res.json();

      // Set all margin fields
      setVal("oa_v_rate", data.oa_v_rate || "");
      setVal("oa_min_flat_rate", data.oa_min_flat_rate || "");
      setVal("oa_min_add_rate", data.oa_min_add_rate || "");

      setVal("da_v_rate", data.da_v_rate || "");
      setVal("da_min_flat_rate", data.da_min_flat_rate || "");
      setVal("da_min_add_rate", data.da_min_add_rate || "");

      setVal("aqis_v_rate", data.aqis_v_rate || "");
      setVal("aqis_min_flat_rate", data.aqis_min_flat_rate || "");
      setVal("aqis_min_add_rate", data.aqis_min_add_rate || "");

      alert("Orbit margin rates loaded.");
    } catch (err) {
      console.error("Load error:", err);
      alert("Failed to load Orbit margin rates.");
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      oa_v_rate: getVal("oa_v_rate"),
      oa_min_flat_rate: getVal("oa_min_flat_rate"),
      oa_min_add_rate: getVal("oa_min_add_rate"),

      da_v_rate: getVal("da_v_rate"),
      da_min_flat_rate: getVal("da_min_flat_rate"),
      da_min_add_rate: getVal("da_min_add_rate"),

      aqis_v_rate: getVal("aqis_v_rate"),
      aqis_min_flat_rate: getVal("aqis_min_flat_rate"),
      aqis_min_add_rate: getVal("aqis_min_add_rate")
    };

    try {
      const res = await fetch("/margin-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Failed to save");
      alert("Orbit margin rates saved.");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save Orbit margin rates.");
    }
  });
});

// Helper functions
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
