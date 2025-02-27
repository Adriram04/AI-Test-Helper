document.getElementById("guardar").addEventListener("click", async () => {
    let apiKey = document.getElementById("apiKey").value;
    let prompt = document.getElementById("prompt").value;
    let files = document.getElementById("uploadTemario").files;

    let temarios = [];

    for (let file of files) {
        let text = await file.text();
        temarios.push(text);
    }

    chrome.storage.local.set({ apiKey, prompt, temarios }, () => {
        alert("Configuración guardada.");
    });
});

// Al abrir el popup, cargar la configuración guardada
chrome.storage.local.get(["apiKey", "prompt", "temarios"], (data) => {
    if (data.apiKey) document.getElementById("apiKey").value = data.apiKey;
    if (data.prompt) document.getElementById("prompt").value = data.prompt;
});
