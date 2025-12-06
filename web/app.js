const baseUrlInput = document.getElementById("base-url");
const apiKeyInput = document.getElementById("api-key");
const textInput = document.getElementById("text-input");
const voiceSelect = document.getElementById("voice-select");
const speedRange = document.getElementById("speed-range");
const speedValue = document.getElementById("speed-value");
const toneSelect = document.getElementById("tone-select");
const formatSelect = document.getElementById("format-select");
const synthBtn = document.getElementById("synthesize-btn");
const audioPlayer = document.getElementById("audio-player");
const historyList = document.getElementById("history-list");

speedRange.addEventListener("input", () => {
  speedValue.textContent = Number(speedRange.value).toFixed(1);
});

async function fetchVoices() {
  const base = baseUrlInput.value.trim();
  if (!base) return;

  try {
    const resp = await fetch(new URL("/api/voices", base), {
      headers: buildHeaders()
    });
    if (!resp.ok) throw new Error("failed: " + resp.status);
    const data = await resp.json();
    voiceSelect.innerHTML = "";
    (data.voices || []).forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `${v.name} (${v.language})`;
      voiceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("load voices error", err);
  }
}

function buildHeaders() {
  const headers = {};
  const key = apiKeyInput.value.trim();
  if (key) headers["X-Api-Key"] = key;
  return headers;
}

async function doSynthesize() {
  const base = baseUrlInput.value.trim();
  if (!base) {
    alert("请先填写 Worker 地址");
    return;
  }
  const text = textInput.value.trim();
  if (!text) {
    alert("请输入要朗读的文本");
    return;
  }

  synthBtn.disabled = true;
  synthBtn.textContent = "合成中...";

  try {
    const payload = {
      text,
      voice_id: voiceSelect.value || undefined,
      speed: Number(speedRange.value),
      tone: toneSelect.value,
      audio_format: formatSelect.value
    };

    const resp = await fetch(new URL("/api/tts/synthesize", base), {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    audioPlayer.src = url;
    audioPlayer.play().catch(() => {});

    prependHistory({
      text,
      voice: payload.voice_id,
      time: new Date().toLocaleTimeString()
    });
  } catch (err) {
    console.error("synthesize error", err);
    alert("合成失败：" + err.message);
  } finally {
    synthBtn.disabled = false;
    synthBtn.textContent = "开始合成";
  }
}

function prependHistory(entry) {
  const li = document.createElement("li");
  const left = document.createElement("div");
  left.textContent = entry.text.slice(0, 24) + (entry.text.length > 24 ? "..." : "");
  const right = document.createElement("span");
  right.textContent = `${entry.voice || "默认"} · ${entry.time}`;
  li.appendChild(left);
  li.appendChild(right);
  historyList.prepend(li);
}

synthBtn.addEventListener("click", doSynthesize);
baseUrlInput.addEventListener("change", fetchVoices);
