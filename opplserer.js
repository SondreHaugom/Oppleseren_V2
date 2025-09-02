
// Funksjonalitet for opplesning av tekst
let textBox = document.querySelector(".text_box");
let voiceSelect = document.querySelector(".voice_select select");

// Opprett et Audio-element for avspilling
let audioElement = new Audio();
let isPlaying = false;
let currentAudioUrl = null;
let currentChunkIndex = 0;
let textChunks = [];

// Funksjon for å initialisere stemmevalg i nedtrekkslisten
function initializeVoiceOptions() {
    // OpenAI sine tilgjengelige stemmer
    const openaiVoices = [
        { name: "Alloy - Nøytral", value: "alloy" },
        { name: "Echo - Dyp", value: "echo" },
        { name: "Fable - Britisk", value: "fable" },
        { name: "Onyx - Kraftig", value: "onyx" },
        { name: "Nova - Feminin", value: "nova" },
        { name: "Shimmer - Lys", value: "shimmer" }
    ];
    
    // Tøm eksisterende alternativer
    voiceSelect.innerHTML = "";
    
    // Legg til stemmevalgene i nedtrekkslisten
    openaiVoices.forEach(voice => {
        const option = document.createElement("option");
        option.textContent = voice.name;
        option.value = voice.value;
        voiceSelect.appendChild(option);
    });
    
    // Sett standardvalg til "alloy"
    voiceSelect.value = "alloy";
}

// Kjør initialisering når dokumentet er lastet
document.addEventListener('DOMContentLoaded', function() {
    initializeVoiceOptions();
});

// Håndter audio-hendelser
audioElement.addEventListener('ended', function() {
    // Når en lyd-bit er ferdig, spill av neste bit hvis det finnes flere
    isPlaying = false;
    currentChunkIndex++;
    
    if (currentChunkIndex < textChunks.length) {
        playNextChunk();
    } else {
        console.log("Opplesning ferdig");
        // Reset for neste opplesning
        currentChunkIndex = 0;
        textChunks = [];
    }
});

// Håndter feil i avspilling
audioElement.addEventListener('error', function(e) {
    console.error("Avspillingsfeil:", e);
    alert("Det oppsto en feil under avspilling av lyden.");
    isPlaying = false;
});



// Funksjon for å bruke OpenAI sin TTS-API til å lese opp tekst
async function fetchOpenAITTS(text, voice = "nova ", model = "tts-1") {
    const apiKey = ""; // Erstatt med din faktiske API-nøkkel eller last inn sikkert
    const url = "https://api.openai.com/v1/audio/speech";
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                input: text,
                voice: voice,
                response_format: "mp3"
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`TTS-feil: ${response.status} ${errorData.error?.message || 'Ukjent feil'}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;
    } catch (error) {
        console.error("TTS-feil:", error);
        alert(`Feil ved opplesning: ${error.message}`);
        throw error;
    }
}

// En enkel funksjon for å spille av lyd fra en URL
function playAudio(audioUrl) {
    // Hvis vi har en tidligere URL, frigjør minnet
    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
    }
    
    // Sett den nye URL-en som kilde for lydelementet
    currentAudioUrl = audioUrl;
    audioElement.src = audioUrl;
    
    // Spill av lyden
    audioElement.play();
    isPlaying = true;
}

document.querySelector(".lese_knapp").addEventListener("click", async () => {
    if (textBox.innerText) {
        // Hent valgt stemme eller bruk "alloy" som standard hvis ingen er valgt
        const selectedVoice = voiceSelect.value || "alloy";
        const text = textBox.innerText.trim();

        textBox.classList.add("loading");
        try {
            const audioUrl = await fetchOpenAITTS(text, selectedVoice);
            playAudio(audioUrl);
        } catch (error) {
            console.error("Feil ved opplesning:", error);
        }
        textBox.classList.remove("loading");
    } else {
        alert('Vennligst legg til tekst før opplesning');
    }
});


document.querySelector(".pause_knapp").addEventListener("click", () => {
    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
    }
})

document.querySelector(".fortsett_knapp").addEventListener("click", () => {
    if (!isPlaying) {
        audioElement.play();
        isPlaying = true;
    }
})
document.querySelector(".stopp_knapp").addEventListener("click", () => {
    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
    }
})

document.querySelector(".volume_control").addEventListener("input", (event) => {
    const volume = event.target.value;
    audioElement.volume = volume;
})

document.querySelector(".speed_control").addEventListener("input", (event) => {
    const speed = event.target.value;
    audioElement.playbackRate = speed;
})