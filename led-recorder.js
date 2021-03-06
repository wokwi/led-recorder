/**
 * LED Pattern Recorder
 *
 * Copyright (c) 2021 Uri Shaked
 *
 * Released under the MIT license.
 */

const recording = [];
const statusEl = document.getElementById('status');
statusEl.text = 'Ready to capture';

function recordEvent(pixels) {
  statusEl.textContent = `Captured ${recording.length} frames`;
  recording.push(pixels);
}

function download() {
  if (!recording.length) {
    alert('no data recorded!');
    return;
  }

  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  const frameCount = recording.length;
  const frameSize = recording[0].length;
  const data = new Uint32Array(frameCount * frameSize + 8);
  data[0] = 0x776b6f57; // magic 1
  data[1] = 0x44454c69; // magic 2
  data[2] = 1; // version
  data[3] = frameCount;
  data[4] = frameSize;
  for (let i = 0; i < frameCount; i++) {
    data.set(recording[i], 8 + i * frameSize);
  }
  const blob = new Blob([data], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = 'animation.led';
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.remove(a);
}

// Workaround for a Wokwi sometimes missing the first message
let listener = setInterval(() => {
  parent.postMessage({ app: 'wokwi', command: 'listen', version: 1 }, 'https://wokwi.com');
}, 200);

window.addEventListener('message', ({ data }) => {
  if (data.neopixels) {
    recordEvent(data.neopixels);
    if (listener) {
      clearInterval(listener);
      listener = null;
    }
  }
});
