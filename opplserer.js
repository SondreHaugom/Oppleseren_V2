
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
        { name: "Alloy", value: "alloy" },
        { name: "Echo", value: "echo" },
        { name: "Fable", value: "fable" },
        { name: "Onyx", value: "onyx" },
        { name: "Nova", value: "nova" },
        { name: "Shimmer", value: "shimmer" }
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

function addPlaceholder() {
    const placeHolder = textBox.getAttribute('data-placeholder'); 

    // Vis placeholder tekst hvis tekstboksen er tom
    if (textBox.innerText.trim() === '') {
        textBox.innerText = placeHolder;
        textBox.classList.add('placeholder');
    }
}
// Fjern placeholder når brukeren klikker eller fokuserer
textBox.addEventListener('focus', function() {
    if (textBox.classList.contains('placeholder')) {
        textBox.innerText = '';
        textBox.classList.remove('placeholder');
    }
});

// Vis placeholder igjen hvis tekstboksen blir tom
textBox.addEventListener('blur', function() {
    if (textBox.innerText.trim() === '') {
        const placeholder = textBox.getAttribute('data-placeholder');
        textBox.innerText = placeholder;
        textBox.classList.add('placeholder');
    }
});

// Fjern placeholder når brukeren begynner å skrive
textBox.addEventListener('input', function() {
    if (textBox.classList.contains('placeholder')) {
        textBox.innerText = '';
        textBox.classList.remove('placeholder');
    }
});



async function fetchAudioFromServer(text, voice) {
    const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error("Feil fra serveren: " + errorText);
    }

    const audioBlob = await response.blob();
    console.log("Mottatt audio blob:", audioBlob.size, "bytes", audioBlob.type);
    
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log("Audio URL opprettet:", audioUrl);

    const audio = new Audio(audioUrl);
    audio.play();
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
    if (textBox.classList.contains('placeholder')) {
        alert('Vennligst legg til tekst før opplesning');
        return;
    }
    if (textBox.innerText) {
        const selectedVoice = voiceSelect.value || "alloy";
        const text = textBox.innerText.trim();
        textBox.classList.add("loading");
        try {
            await fetchAudioFromServer(text, selectedVoice);
            isPlaying = true;
        } catch (error) {
            console.error("Feil ved opplesning:", error);
            alert("Kunne ikke generere tale. Se konsollen for detaljer.");
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
        audioElement.cancel();
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