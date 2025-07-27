document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date_created");
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }



  const form = document.getElementById("dataForm");
  const nameInput = document.getElementById("name");

  // Auto-capitalize name on blur
  nameInput.addEventListener("blur", () => {
    if (!nameInput.value.trim()) return;

    const corrected = nameInput.value
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    nameInput.value = corrected; // ✅ Update DOM
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      date_created: document.getElementById("date_created").value.trim(),

      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      mfc: document.getElementById("mfc").value.trim(),
      oa_street: document.getElementById("oa_street").value.trim(),
      oa_city: document.getElementById("oa_city").value.trim(),
      oa_province: document.getElementById("province").value,
      oa_building_type: document.getElementById("oa_building_type").value,
      distance: document.getElementById("distance").value.trim(),
      da_street: document.getElementById("da_street").value.trim(),
      da_city: document.getElementById("da_city").value.trim(),
      da_country: document.getElementById("da_country").value,
      da_building_type: document.getElementById("da_building_type").value,
      survey: document.getElementById("survey").value.trim(),
      volume: document.getElementById("volume").value.trim(),
      units: document.getElementById("units").value,
      pack: document.getElementById("pack").value
    };

    try {
      const res = await fetch("http://localhost:3000/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Server error");
      alert("Saved successfully!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save.");
    }
  });


  const el = document.getElementById("province");
  console.log(el); // check it exists
  console.log(el.value); // what’s its current value
  console.log(el.options.length); // make sure it has options
  el.value = "on"; // try setting it manually
  console.log(el.value); // confirm it's now "on"

  // Load user by name or MFC
  window.loadUserByName = async () => {
    const inputName = document.getElementById("name").value.trim().toLowerCase();
    const inputMfc = document.getElementById("mfc").value.trim();

    try {
      const res = await fetch(`http://localhost:3000/data`);
      const users = await res.json();

      const found = Object.values(users).find(u =>
        (u.name && u.name.toLowerCase() === inputName) ||
        (u.mfc && u.mfc === inputMfc)
      );

      if (found) {
        for (const [key, value] of Object.entries(found)) {
          // This makes sure province/country work exactly like 'pack'
          let el = document.getElementById(key);

          // fallback: if key is 'oa_province', try id='province'
          if (!el && key === 'oa_province') el = document.getElementById('province');
          if (!el && key === 'da_country') el = document.getElementById('da_country');

          if (el) {
            el.value = value;
          } else if (key === "date_created") {
            const dateEl = document.getElementById("date_created");
            if (dateEl) dateEl.value = value;
          }

        }



        // Update MASI URL button to act as a dynamic link


        const masiBtn = document.getElementById("masi_url");
        const mfcInput = document.getElementById("mfc");
        const mfc = mfcInput?.value?.trim();

        if (mfc) {
          masiBtn.disabled = false;
          masiBtn.style.display = "inline-block";
          masiBtn.onclick = () =>
            window.open(`https://orbit.masi-leap.com/job/${mfc}`, "_blank");
        } else {
          masiBtn.disabled = true;
          masiBtn.style.display = "none";
          masiBtn.onclick = null;
        }

        mfcInput.addEventListener("input", () => {
          const mfc = mfcInput.value.trim();
          if (mfc) {
            masiBtn.disabled = false;
            masiBtn.style.display = "inline-block";
            masiBtn.onclick = () =>
              window.open(`https://orbit.masi-leap.com/job/${mfc}`, "_blank");
          } else {
            masiBtn.disabled = true;
            masiBtn.style.display = "none";
            masiBtn.onclick = null;
          }
        });


        // Hide MASI URL button on form reset
        form.addEventListener("reset", () => {
          const masiBtn = document.getElementById("masi_url");
          masiBtn.disabled = true;
          masiBtn.style.display = "none";
          masiBtn.onclick = null;


          // const resultBox = document.getElementById("resultBox");
          // if (resultBox) resultBox.innerHTML = "";
          document.getElementById("result").innerHTML = "RESET";


        });






        alert("User loaded!");
      } else {
        alert("User not found.");
      }
    } catch (err) {
      console.error("Load failed:", err);
      alert("Failed to load user.");
    }
  };
});