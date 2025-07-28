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

  // Auto-capitalize name - simplified to avoid blocking
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
  if (mfcInput) {
    mfcInput.addEventListener("input", updateMasiButton);
  }

  // Handle form reset - ensure inputs remain functional
  if (form) {
    form.addEventListener("reset", (e) => {
      // Use setTimeout to ensure reset completes first
      setTimeout(() => {
        // Reset MASI button
        if (masiBtn) {
          masiBtn.disabled = true;
          masiBtn.style.display = "none";
          masiBtn.onclick = null;
        }
        
        // Reset result display
        const resultEl = document.getElementById("result");
        if (resultEl) {
          resultEl.innerHTML = "RESET";
        }
        
        // Set date to today after reset
        setTodayDate();
        
        // Ensure all inputs are enabled and functional
        const allInputs = form.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
          input.disabled = false;
          input.readOnly = false;
        });
      }, 10);
    });
  }

  // Listen for calculation completion to save user data
  document.addEventListener("quote:calculated", async () => {
    // Don't block UI during save operation
    setTimeout(async () => {
      try {
        const data = {
          date_created: document.getElementById("date_created")?.value?.trim() || "",
          name: document.getElementById("name")?.value?.trim() || "",
          email: document.getElementById("email")?.value?.trim() || "",
          phone: document.getElementById("phone")?.value?.trim() || "",
          mfc: document.getElementById("mfc")?.value?.trim() || "",
          oa_street: document.getElementById("oa_street")?.value?.trim() || "",
          oa_city: document.getElementById("oa_city")?.value?.trim() || "",
          oa_province: document.getElementById("province")?.value || "",
          oa_building_type: document.getElementById("oa_building_type")?.value || "",
          distance: document.getElementById("distance")?.value?.trim() || "",
          da_street: document.getElementById("da_street")?.value?.trim() || "",
          da_city: document.getElementById("da_city")?.value?.trim() || "",
          da_country: document.getElementById("da_country")?.value || "",
          da_building_type: document.getElementById("da_building_type")?.value || "",
          survey: document.getElementById("survey")?.value?.trim() || "",
          volume: document.getElementById("volume")?.value?.trim() || "",
          units: document.getElementById("units")?.value || "",
          pack: document.getElementById("pack")?.value || ""
        };

        const res = await fetch("http://localhost:3000/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          console.log("User data saved successfully");
        } else {
          console.warn("Failed to save user data:", res.status);
        }
      } catch (err) {
        console.error("Save failed:", err);
      }
    }, 50);
  });

  // Load user by name or MFC - improved to prevent blocking
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
      // Show loading state but don't disable inputs
      const resultEl = document.getElementById("result");
      if (resultEl) {
        resultEl.innerHTML = "Loading user...";
      }

      const res = await fetch("http://localhost:3000/data");
      if (!res.ok) throw new Error("Failed to fetch user data");
      
      const users = await res.json();
      
      const found = Array.isArray(users) 
        ? users.find(u =>
            (u.name && u.name.toLowerCase() === inputName) ||
            (u.mfc && u.mfc === inputMfc)
          )
        : Object.values(users).find(u =>
            (u.name && u.name.toLowerCase() === inputName) ||
            (u.mfc && u.mfc === inputMfc)
          );

      if (found) {
        // Load user data into form
        for (const [key, value] of Object.entries(found)) {
          if (value === null || value === undefined) continue;
          
          let el = document.getElementById(key);
          
          // Handle special cases for element IDs
          if (!el && key === 'oa_province') el = document.getElementById('province');
          if (!el && key === 'da_country') el = document.getElementById('da_country');

          if (el && el.tagName) {
            el.value = value;
          }
        }

        // Update MASI button after loading user data
        updateMasiButton();

        if (resultEl) {
          resultEl.innerHTML = "User loaded successfully!";
        }
        
        // Don't show alert to avoid blocking UI
        console.log("User loaded:", found.name || found.mfc);
      } else {
        if (resultEl) {
          resultEl.innerHTML = "User not found.";
        }
        console.log("User not found for:", inputName || inputMfc);
      }
    } catch (err) {
      console.error("Load failed:", err);
      const resultEl = document.getElementById("result");
      if (resultEl) {
        resultEl.innerHTML = "Failed to load user.";
      }
    }
  };

  // Initialize MASI button state
  updateMasiButton();

  // Ensure inputs remain functional - periodic check
  setInterval(() => {
    if (form) {
      const allInputs = form.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        // Only re-enable if they were accidentally disabled
        if (input.disabled && !input.id.includes('masi_url')) {
          input.disabled = false;
        }
        if (input.readOnly && input.type !== 'submit' && input.type !== 'reset') {
          input.readOnly = false;
        }
      });
    }
  }, 1000);
});