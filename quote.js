document.addEventListener("DOMContentLoaded", () => {
  const quoteBox = document.getElementById("quotePreview");
  const buttonBox = document.getElementById("quoteButtons");

  const downloadBtn = document.createElement("button");
  // downloadBtn.textContent = "Download DOCX";
  downloadBtn.id = "downloadDocxBtn";
  downloadBtn.style.display = "none";
  buttonBox.appendChild(downloadBtn);

  const printBtn = document.createElement("button");
  printBtn.textContent = "Print PDF";
  printBtn.id = "printPdfBtn";
  printBtn.style.display = "none";
  buttonBox.appendChild(printBtn);

  document.addEventListener("quote:calculated", (event) => {
    const { grandTotal, additionalRate, transitTime } = event.detail;

    const form = document.getElementById("dataForm");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.grandTotal = grandTotal;
    data.additionalRate = additionalRate;
    data.transitTime = transitTime;

    downloadBtn.style.display = "block";
    printBtn.style.display = "block";

    downloadBtn.onclick = async () => {
      await generateAndDownloadHTML(data);
    };

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

    const quoteBox = document.getElementById("quotePreview");
    quoteBox.innerHTML = template;
  } catch (err) {
    console.error("Preview rendering failed:", err);
  }
}
