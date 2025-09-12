document.addEventListener("DOMContentLoaded", () => {
    const backendBtn = document.getElementById("openBackend");
    const gifModal = document.getElementById("gifModal");
    const closeGif = document.getElementById("closeGif");

    if (backendBtn) {
        backendBtn.addEventListener("click", (e) => {
            if (!e.ctrlKey) {
                e.preventDefault(); // block navigation
                gifModal.style.display = "flex"; // show the gif popup
            }
        });
    }

    if (closeGif) {
        closeGif.addEventListener("click", () => {
            gifModal.style.display = "none"; // hide popup
        });
    }
});


// ===== Confirm modal helpers =====
function showDeleteConfirm() {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirmModal");
        const btnCancel = document.getElementById("confirmCancel");
        const btnDelete = document.getElementById("confirmDelete");
        if (!modal || !btnCancel || !btnDelete) return resolve(false);

        // Guard: never allow deleting the original (v1)
        const H = window.__quoteHistory;
        if (H && H.idx === 0) {
            const box = document.getElementById("verIndicator");
            if (box) box.value = "Cannot delete v1";
            return resolve(false);
        }

        let done = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            modal.style.display = "none";
            btnCancel.removeEventListener("click", onCancel);
            btnDelete.removeEventListener("click", onDelete);
            document.removeEventListener("keydown", onKey);
        };
        const onCancel = () => { cleanup(); resolve(false); };
        const onDelete = () => { cleanup(); resolve(true); };
        const onKey = (e) => {
            if (e.key === "Escape") { cleanup(); resolve(false); }
            if (e.key === "Enter") { cleanup(); resolve(true); }
        };

        btnCancel.addEventListener("click", onCancel);
        btnDelete.addEventListener("click", onDelete);
        document.addEventListener("keydown", onKey);
        modal.style.display = "flex";
    });
}

// (keep your existing deleteCurrentVersion() as-is, we’ll just call it after confirm)


document.addEventListener("DOMContentLoaded", () => {
    const prevBtn = document.getElementById("verPrev");
    const nextBtn = document.getElementById("verNext");

    if (prevBtn && !prevBtn.dataset.wired) {
        prevBtn.dataset.wired = "1";
        prevBtn.addEventListener("click", () => showVersion(-1));   // existing
    }

    if (nextBtn) {
        nextBtn.addEventListener(
            "click",
            async (ev) => {
                if (ev.altKey || window.__deleteMode) {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    ev.stopPropagation();

                    const ok = await showDeleteConfirm();
                    if (ok) await deleteCurrentVersion();
                    return;
                }
                showVersion(1);
            },
            true // capture so this runs BEFORE the old handler
        );

    }
});