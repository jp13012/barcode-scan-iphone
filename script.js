function startCameraScanner() {
    codeReader.reset();

    // Zoek beschikbare camera's
    ZXing.BrowserBarcodeReader.listVideoInputDevices()
        .then(videoInputDevices => {
            if(videoInputDevices.length === 0){
                alert("Geen camera gevonden!");
                return;
            }
            const firstDeviceId = videoInputDevices[0].deviceId;

            // Live preview in video element
            codeReader.decodeFromVideoDevice(firstDeviceId, "videoPreview", (result, err) => {
                if(result){
                    handleScan(result.text);
                }
                // errors negeren
            });
        })
        .catch(err => console.error("Camera fout:", err));
}
