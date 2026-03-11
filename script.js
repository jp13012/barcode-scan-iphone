let needed = [];
let found = [];

const fileInput = document.getElementById("fileInput");
const input = document.getElementById("input");
const status = document.getElementById("status");
const counter = document.getElementById("counter");
const progress = document.getElementById("progress");
const exportBtn = document.getElementById("exportBtn");

let html5QrScanner;

// =====================
// Excel / CSV upload
// =====================
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if(ext === "csv") {
        const reader = new FileReader();
        reader.onload = (evt)=>{
            const text = evt.target.result;
            const rows = text.split("\n").map(r=>r.trim()).filter(r=>r);
            needed = rows.map(v=>v.toString().trim());
            found = [];
            startAfterFileLoad();
        }
        reader.readAsText(file);
    } else if(["xlsx","xls","ods"].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (evt)=>{
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            needed = json.flat().filter(v => v != null).map(v=>v.toString().trim());
            found = [];
            startAfterFileLoad();
        }
        reader.readAsArrayBuffer(file);
    } else {
        alert("Bestandstype niet ondersteund. Gebruik XLSX, XLS, ODS of CSV.");
    }
});

// =====================
// Alles instellen na file upload
// =====================
function startAfterFileLoad() {
    counter.innerText = `0 / ${needed.length}`;
    progress.value = 0;
    progress.max = needed.length;
    status.innerText = "Scan barcode...";
    input.disabled = false;
    exportBtn.disabled = false;
    input.focus();
    startCameraScanner();
}

// =====================
// Camera scanner starten
// =====================
function startCameraScanner() {
    if(html5QrScanner) {
        html5QrScanner.stop().catch(()=>{});
    }

    html5QrScanner = new Html5Qrcode("reader");

    html5QrScanner.start(
        { facingMode: "environment" },
        { 
            fps: 10,
            qrbox: 250,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13
            ]
        },
        (decodedText, decodedResult) => {
            handleScan(decodedText);
        },
        (errorMessage) => {
            // optioneel loggen
            // console.log(errorMessage);
        }
    ).catch(err => console.error("Camera start fout:", err));
}

// =====================
// Handmatige input fallback
// =====================
input.addEventListener("change", () => {
    handleScan(input.value.trim());
    input.value = "";
});

// =====================
// Scan handler (gedeeld)
// =====================
function handleScan(code) {
    if(needed.includes(code)){
        if(!found.includes(code)){
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

    setTimeout(()=>{
        document.body.className = "";
        if(found.length < needed.length) status.innerText = "Scan barcode...";
    },300);

    if(found.length === needed.length){
        status.innerText = "ALLE TERMINALS GEVONDEN!";
        beep(1500);
    }
}

// =====================
// Export knop
// =====================
exportBtn.addEventListener("click", ()=>{
    const notFound = needed.filter(code => !found.includes(code));
    const data = [["Gevonden","Nog niet gevonden"]];
    const maxLen = Math.max(found.length, notFound.length);

    for(let i=0;i<maxLen;i++){
        data.push([found[i]||"", notFound[i]||""]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Terminals");

    XLSX.writeFile(wb, "terminals_export.xlsx");
});

// =====================
// Geluid functie
// =====================
function beep(freq){
    let ctx = new AudioContext();
    let osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(()=>osc.stop(),150);
}
