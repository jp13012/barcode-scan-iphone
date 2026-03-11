let needed = [];
let found = [];

const fileInput = document.getElementById("fileInput");
const input = document.getElementById("input");
const status = document.getElementById("status");
const counter = document.getElementById("counter");
const progress = document.getElementById("progress");

// Excel upload
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Alles omzetten naar string + trim
        needed = json.flat()
                     .filter(v => v != null)
                     .map(v => v.toString().trim());
        found = [];

        counter.innerText = `0 / ${needed.length}`;
        progress.value = 0;
        progress.max = needed.length;

        status.innerText = "Scan barcode...";
        input.disabled = false;
        input.focus();

        console.log("Barcodes geladen:", needed);
    }
    reader.readAsArrayBuffer(file);
});

// Barcode scan
input.addEventListener("change", () => {
    const code = input.value.trim();
    if (needed.includes(code)) {
        if (!found.includes(code)) {
            found.push(code);
            document.body.className = "good";
            beep(800);
            status.innerText = "GEVONDEN!";
        } else {
            beep(400);
            status.innerText = "Al gevonden";
        }
    } else {
        document.body.className = "bad";
        beep(200);
        status.innerText = "Niet nodig";
    }

    counter.innerText = `${found.length} / ${needed.length}`;
    progress.value = found.length;

    input.value = "";
    setTimeout(() => {
        document.body.className = "";
        if(found.length < needed.length) status.innerText = "Scan barcode...";
    }, 300);

    if (found.length === needed.length) {
        status.innerText = "ALLE TERMINALS GEVONDEN!";
        beep(1500);
    }
});
// Export functie
const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", () => {
    if (needed.length === 0) return;

    const notFound = needed.filter(code => !found.includes(code));

    const data = [
        ["Gevonden", "Nog niet gevonden"]
    ];

    // Bepaal maximale lengte van beide kolommen
    const maxLen = Math.max(found.length, notFound.length);

    for (let i = 0; i < maxLen; i++) {
        data.push([
            found[i] || "",       // lege cel als geen waarde
            notFound[i] || ""
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Terminals");

    XLSX.writeFile(wb, "terminals_export.xlsx");
});

// Activeer knop zodra je Excel geladen hebt
fileInput.addEventListener("change", () => {
    exportBtn.disabled = false;
});

// Geluid functie
function beep(freq) {
    let ctx = new AudioContext();
    let osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 150);
}
