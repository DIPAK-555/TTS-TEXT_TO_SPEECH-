async function convertTextToSpeech() {
  const text = document.getElementById("inputText").value.trim();
  const voice = document.getElementById("voiceSelect").value;
  const audioContainer = document.getElementById("audioContainer");

  if (!text) {
    alert("Please enter some text!");
    return;
  }

  console.log("📤 Sending TTS request with:");
  console.log("Text:", text);
  console.log("Voice:", voice);

  audioContainer.innerHTML = "<p>⏳ Generating audio...</p>";

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    const data = await response.json();
    console.log("✅ TTS API response:", data);

    if (data.status === "done" && data.audio_url) {
      audioContainer.innerHTML = `
            <p>✅ Audio is ready:</p>
            <audio controls autoplay>
              <source src="${data.audio_url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>`;
    } else if (data.status === "success" && data.result?.audio_url) {
      audioContainer.innerHTML = `
            <p>✅ Audio is ready:</p>
            <audio controls autoplay>
              <source src="${data.result.audio_url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>`;
    } else if (data.status === "processing" && data.url) {
      const finalAudioUrl = await waitForAudioReady(data.url);
      if (finalAudioUrl) {
        audioContainer.innerHTML = `
              <p>✅ Audio ready after processing:</p>
              <audio controls autoplay>
                <source src="${finalAudioUrl}" type="audio/mpeg">
                Your browser does not support the audio element.
              </audio>`;
      } else {
        audioContainer.innerHTML = `<p style="color:red;">❌ Audio processing timeout. Try again later.</p>`;
      }
    } else {
      audioContainer.innerHTML = `<p style="color:red;">❌ TTS failed. Invalid response.</p>`;
    }
  } catch (err) {
    console.error("❌ Error during TTS request:", err);
    audioContainer.innerHTML = `<p style="color:red;">❌ Error occurred. See console for details.</p>`;
  }
}

async function waitForAudioReady(pollUrl, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(pollUrl);
      const data = await res.json();

      if (data.audio_url) {
        return data.audio_url;
      }
    } catch (e) {
      console.warn("⚠️ Poll attempt failed:", e);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return null;
}
