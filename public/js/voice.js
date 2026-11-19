// LOTTA Voice Message Recorder with Live Audio Waveform

export class VoiceRecorder {
  constructor({ onSendVoice, onError }) {
    this.onSendVoice = onSendVoice;
    this.onError = onError;

    this.bar = document.getElementById('voice-bar');
    this.composerBar = document.getElementById('composer-bar');
    this.timerEl = document.getElementById('voice-timer');
    this.canvas = document.getElementById('voice-wave-canvas');

    this.recorder = null;
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.chunks = [];
    this.startTime = 0;
    this.timerInterval = null;
    this.rafId = null;
    this.cancelled = false;

    document.getElementById('btn-voice-cancel').addEventListener('click', () => this.cancel());
    document.getElementById('btn-voice-send').addEventListener('click', () => this.finishAndSend());
  }

  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  async start() {
    if (!VoiceRecorder.isSupported()) {
      this.onError?.('Voice recording is not supported in this browser.');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this.pickMimeType();
      this.chunks = [];
      this.cancelled = false;

      this.recorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) this.chunks.push(ev.data);
      };

      this.recorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
        const finalMime = this.recorder?.mimeType || mimeType || 'audio/webm';
        const ext = finalMime.includes('mp4') ? 'm4a' : finalMime.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(this.chunks, { type: finalMime });
        this.cleanup();

        if (!this.cancelled && blob.size > 0) {
          const file = new File([blob], `lotta-voice-${Date.now()}.${ext}`, { type: finalMime });
          await this.onSendVoice?.(file, durationSec);
        }
      };

      this.startTime = Date.now();
      this.recorder.start(200);
      this.bar.classList.remove('hidden');
      this.composerBar.classList.add('hidden');
      this.startTimer();
      this.startWaveform();
    } catch (err) {
      this.cleanup();
      this.onError?.('Microphone permission denied or unavailable.');
    }
  }

  pickMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) return c;
    }
    return '';
  }

  startTimer() {
    this.timerEl.textContent = '0:00';
    this.timerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - this.startTime) / 1000);
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, '0');
      this.timerEl.textContent = `${m}:${s}`;
    }, 250);
  }

  startWaveform() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const ctx = this.canvas.getContext('2d');

      const draw = () => {
        if (!this.analyser) return;
        this.rafId = requestAnimationFrame(draw);
        this.analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barCount = 28;
        const gap = 4;
        const barWidth = (this.canvas.width - gap * (barCount - 1)) / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i % dataArray.length] / 255;
          const h = Math.max(4, val * (this.canvas.height - 4));
          const x = i * (barWidth + gap);
          const y = (this.canvas.height - h) / 2;
          ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#a855f7';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, 3);
          ctx.fill();
        }
      };
      draw();
    } catch {
      // Fallback if Web Audio API is unavailable
    }
  }

  cancel() {
    this.cancelled = true;
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    } else {
      this.cleanup();
    }
  }

  finishAndSend() {
    this.cancelled = false;
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  cleanup() {
    clearInterval(this.timerInterval);
    cancelAnimationFrame(this.rafId);
    this.analyser = null;
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.recorder = null;
    this.bar.classList.add('hidden');
    this.composerBar.classList.remove('hidden');
  }
}
