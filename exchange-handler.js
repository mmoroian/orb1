document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("exchange_rates");
    const [loadBtn, saveBtn, getBtn] = form.querySelectorAll("button");

    const usdInput = document.getElementById("usd_rate");
    const eurInput = document.getElementById("eur_rate");
    const gbpInput = document.getElementById("gbp_rate");
    const audInput = document.getElementById("aud_rate");

    // Load saved exchange rates from server
    async function loadExchangeRates() {
        try {
            const res = await fetch("/exchange-rates");
            if (!res.ok) throw new Error("Fetch failed");
            const data = await res.json();

            usdInput.value = data.USD || "";
            eurInput.value = data.EUR || "";
            gbpInput.value = data.GBP || "";
            audInput.value = data.AUD || "";

            // alert("Saved exchange rates loaded.");
        } catch (err) {
            console.error("Error loading saved exchange rates:", err);
            alert("Failed to load saved exchange rates.");
        }
    }



    loadBtn.addEventListener("click", loadExchangeRates);

    loadExchangeRates(); // Auto-load on page load



    // Get latest exchange rates from Frankfurter   https://frankfurter.dev/
    getBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("https://api.frankfurter.app/latest?base=EUR&symbols=CAD,USD,GBP,AUD");
            const data = await res.json();
            const rates = data.rates;

            const eurToCad = rates.CAD;
            const eurToUsd = rates.USD;
            const eurToGbp = rates.GBP;
            const eurToAud = rates.AUD;

            if (!eurToCad || !eurToUsd || !eurToGbp || !eurToAud) {
                throw new Error("Missing one or more rates from API");
            }

            const usdToCad = eurToCad / eurToUsd;
            const gbpToCad = eurToCad / eurToGbp;
            const audToCad = eurToCad / eurToAud;

            // usdInput.value = usdToCad.toFixed(4);
            // eurInput.value = eurToCad.toFixed(4); // 1 EUR = ? CAD
            // gbpInput.value = gbpToCad.toFixed(4);
            // audInput.value = audToCad.toFixed(4);


            function roundUp2(num) {
                return (Math.round(num * 100) / 100).toFixed(2);
            }

            usdInput.value = roundUp2(usdToCad);
            eurInput.value = roundUp2(eurToCad);
            gbpInput.value = roundUp2(gbpToCad);
            audInput.value = roundUp2(audToCad);


            alert("Latest exchange rates fetched.");
        } catch (err) {
            console.error("Error fetching exchange rates:", err);
            alert("Failed to fetch latest exchange rates.");
        }
    });


    // Save exchange rates to server
    saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const exchangeData = {
            updated: new Date().toISOString(),
            USD: parseFloat(usdInput.value || 0),
            EUR: parseFloat(eurInput.value || 0),
            GBP: parseFloat(gbpInput.value || 0),
            AUD: parseFloat(audInput.value || 0),
        };

        try {
            const res = await fetch("/exchange-rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exchangeData),
            });

            if (!res.ok) throw new Error("Server error");
            alert("Exchange rates saved.");
        } catch (err) {
            console.error("Error saving exchange rates:", err);
            alert("Failed to save exchange rates.");
        }
    });
});
