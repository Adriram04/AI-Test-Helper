chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "getAnswer",
        title: "Obtener respuesta correcta",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "getAnswer") {
        let pregunta = info.selectionText.trim();
        if (pregunta.length > 0) {
            chrome.storage.local.get(["apiKey", "prompt", "temarios"], async (data) => {
                let apiKey = data.apiKey;
                let prompt = data.prompt || "Responde solo con la respuesta correcta basándote en el temario proporcionado.";
                let temario = data.temarios ? data.temarios.join("\n") : "";

                if (!apiKey) {
                    enviarMensajeAContenido(tab.id, "❌ ERROR: No se encontró una API Key. Ve a la configuración y agrégala.");
                    return;
                }

                console.log("📩 Enviando solicitud a OpenAI...");
                console.log("Pregunta:", pregunta);
                console.log("Prompt:", prompt);
                console.log("Temario:", temario);

                try {
                    let response = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "gpt-4o",
                            messages: [
                                { "role": "system", "content": prompt },
                                { "role": "user", "content": `Pregunta: ${pregunta}\n\nTemario:\n${temario}` }
                            ]
                        })
                    });

                    let jsonResponse = await response.json();
                    console.log("📩 Respuesta de OpenAI:", jsonResponse);

                    if (jsonResponse.error) {
                        console.error("❌ Error en OpenAI:", jsonResponse.error);
                        enviarMensajeAContenido(tab.id, `❌ Error de OpenAI: ${JSON.stringify(jsonResponse.error)}`);
                        return;
                    }

                    if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
                        console.error("⚠️ OpenAI no devolvió respuestas.");
                        enviarMensajeAContenido(tab.id, "⚠️ OpenAI no devolvió respuestas. Verifica el prompt o el temario.");
                        return;
                    }

                    let respuestaCorrecta = jsonResponse.choices[0].message.content;
                    console.log("✅ Respuesta Correcta:", respuestaCorrecta);
                    mostrarRespuesta(tab.id, respuestaCorrecta);

                } catch (error) {
                    console.error("❌ Error de conexión:", error);
                    enviarMensajeAContenido(tab.id, "❌ Error al conectar con OpenAI. Revisa tu API Key y tu conexión a Internet.");
                }
            });
        }
    }
});

// Función para mostrar respuestas y errores en la pestaña activa
function enviarMensajeAContenido(tabId, mensaje) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: (mensaje) => {
            let div = document.createElement("div");
            div.textContent = mensaje;
            div.style.position = "fixed";
            div.style.bottom = "20px";
            div.style.right = "20px";
            div.style.padding = "10px";
            div.style.backgroundColor = "red";
            div.style.color = "white";
            div.style.borderRadius = "5px";
            div.style.zIndex = "9999";
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 5000);
        },
        args: [mensaje]
    });
}

// Función para mostrar respuestas correctas
function mostrarRespuesta(tabId, respuesta) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: (respuesta) => {
            let div = document.createElement("div");
            div.textContent = "✅ Respuesta: " + respuesta;
            div.style.position = "fixed";
            div.style.bottom = "20px";
            div.style.right = "20px";
            div.style.padding = "10px";
            div.style.backgroundColor = "black";
            div.style.color = "white";
            div.style.borderRadius = "5px";
            div.style.zIndex = "9999";
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 5000);
        },
        args: [respuesta]
    });
}

