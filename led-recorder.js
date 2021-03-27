/**
 * LED Pattern Recorder
 *
 * Copyright (c) 2021 Uri Shaked
 *
 * Released under the MIT license.
 */

const statusEl = document.getElementById('status');
const fileTypeEl = document.getElementById('file-type');
const fpsEl = document.getElementById('fps');

function updateStatus(status) {
  statusEl.textContent = status;
}

function getFPS() {
  return parseInt(fpsEl.value, 10);
}

class Recorder {
  constructor() {
    this.reset();
  }

  recordEvent(nanos, pixels) {
    this.recording.push({ nanos, pixels });
  }

  get frameSize() {
    return this.recording[0].pixels.length;
  }

  frameCount(fps) {
    const { recording } = this;
    if (!recording.length) {
      return 0;
    }
    const startNanos = recording[0].nanos;
    const lastNanos = recording[recording.length - 1].nanos;
    const frameNanos = Math.round(1e9 / fps);
    return Math.ceil((lastNanos - startNanos + 1) / frameNanos);
  }

  *getFrames(fps) {
    const numFrames = this.frameCount(fps);
    const frameNanos = Math.round(1e9 / fps);
    const { recording } = this;
    let recordingIndex = 0;
    let timestamp = recording[0].nanos;
    for (let frame = 0; frame < numFrames; frame++) {
      yield { frame, pixels: recording[recordingIndex].pixels };
      timestamp += frameNanos;
      while (
        recordingIndex + 1 < recording.length &&
        recording[recordingIndex + 1].nanos <= timestamp
      ) {
        recordingIndex++;
      }
    }
  }

  reset() {
    this.recording = [];
  }
}

const recorder = new Recorder();

function downloadBlob(fileName, blob) {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function exportNDJSON() {
  const fps = getFPS();
  const header = JSON.stringify({
    magic: 'WokwiLED',
    version: 1,
    pixels: recorder.frameSize,
    frameRate: fps,
  });
  const lines = [header];
  for (const { frame, pixels } of recorder.getFrames(fps)) {
    const leds = Array.from(pixels).map((item) => ({
      g: (item >> 16) & 0xff,
      r: (item >> 8) & 0xff,
      b: item & 0xff,
    }));
    lines.push(JSON.stringify({ frame, leds }));
  }
  const blob = new Blob([lines.join('\n')], { type: 'application/x-ndjson' });
  downloadBlob('animation.ndjson', blob);
}

function exportBinary() {
  const fps = getFPS();
  const frameCount = recorder.frameCount(fps);
  const frameSize = recorder.frameSize;
  const data = new Uint32Array(frameCount * frameSize + 8);
  data[0] = 0x776b6f57; // magic 1
  data[1] = 0x44454c69; // magic 2
  data[2] = 1; // version
  data[3] = frameCount;
  data[4] = frameSize;
  data[5] = fps;
  for (const { frame, pixels } of recorder.getFrames(fps)) {
    data.set(pixels, 8 + frame * frameSize);
  }
  const blob = new Blob([data], { type: 'octet/stream' });
  downloadBlob('animation.led', blob);
}

function download() {
  if (!recorder.frameCount(getFPS())) {
    alert('Error: no data captured!');
    return;
  }

  switch (fileTypeEl.value) {
    case 'ndjson':
      return exportNDJSON();
    case 'binary':
      return exportBinary();
    default:
      alert(`Unsupported file type: ${fileTypeEl.value}`);
  }
}

function reset() {
  recorder.reset();
  updateStatus('Ready to capture');
}

// Workaround for a Wokwi sometimes missing the first message
let listener = setInterval(() => {
  parent.postMessage({ app: 'wokwi', command: 'listen', version: 1 }, 'https://wokwi.com');
}, 200);

window.addEventListener('message', ({ data }) => {
  const { $nanos, neopixels } = data;
  if (neopixels) {
    const pixels = neopixels.pixels instanceof Uint32Array ? neopixels.pixels : neopixels;
    recorder.recordEvent($nanos, pixels);
    updateStatus(`Captured ${recorder.frameCount(getFPS())} frames`);
    if (listener) {
      clearInterval(listener);
      listener = null;
    }
  }
});

updateStatus('Ready to capture');
