// LOTTA Live Camera Capture Controller (Front/Rear Support + Preview + Retake)

export class LiveCamera {
  constructor({ onSendPhoto }) {
    this.onSendPhoto = onSendPhoto;
    this.stream = null;
    this.facingMode = 'user';
    this.mirrored = true;
    this.capturedBlob = null;
    this.capturedPreviewUrl = null;

    this.modal = document.getElementById('camera-modal');
    this.video = document.getElementById('camera-video');
    this.canvas = document.getElementById('camera-canvas');
    this.previewImg = document.getElementById('camera-preview-img');
    this.flashEl = document.getElementById('camera-flash');
    this.errorEl = document.getElementById('camera-error');
    this.errorTitle = document.getElementById('camera-error-title');
    this.errorMsg = document.getElementById('camera-error-msg');
    this.liveControls = document.getElementById('camera-live-controls');
    this.previewControls = document.getElementById('camera-preview-controls');
    this.captionInput = document.getElementById('camera-caption-input');
    this.sendBtn = document.getElementById('btn-camera-send');

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-camera-close').addEventListener('click', () => this.close());
    document.getElementById('btn-camera-retry').addEventListener('click', () => this.startStream());
    document.getElementById('btn-camera-mirror').addEventListener('click', () => {
      this.mirrored = !this.mirrored;
      this.video.classList.toggle('mirrored', this.mirrored);
    });
    document.getElementById('btn-camera-switch').addEventListener('click', () => {
      this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
      this.mirrored = this.facingMode === 'user';
      this.startStream();
    });
    document.getElementById('btn-camera-shutter').addEventListener('click', () => this.capture());
    document.getElementById('btn-camera-retake').addEventListener('click', () => this.retake());
    this.sendBtn.addEventListener('click', () => this.send());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  async open() {
    this.modal.classList.remove('hidden');
    this.captionInput.value = '';
    this.showLiveUI();
    await this.startStream();
  }

  close() {
    this.stopStream();
    this.clearCapture();
    this.modal.classList.add('hidden');
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
  }

  clearCapture() {
    this.capturedBlob = null;
    if (this.capturedPreviewUrl) {
      URL.revokeObjectURL(this.capturedPreviewUrl);
      this.capturedPreviewUrl = null;
    }
    this.previewImg.src = '';
  }

  showLiveUI() {
    this.errorEl.classList.add('hidden');
    this.previewImg.classList.add('hidden');
    this.previewControls.classList.add('hidden');
    this.video.classList.remove('hidden');
    this.liveControls.classList.remove('hidden');
    this.video.classList.toggle('mirrored', this.mirrored);
  }

  async startStream() {
    this.stopStream();
    this.errorEl.classList.add('hidden');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showError(
        'Camera API unavailable',
        'Your browser requires HTTPS or localhost to access the device camera.'
      );
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      this.video.classList.toggle('mirrored', this.mirrored);
    } catch (err) {
      // Fallback without facingMode if device has single camera
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.video.srcObject = this.stream;
        await this.video.play();
      } catch (err2) {
        const denied = err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError';
        this.showError(
          denied ? 'Camera permission denied' : 'Unable to open camera',
          denied
            ? 'Please grant camera permission in your browser address bar, then click Try Again.'
            : (err2.message || 'No camera device was detected on this machine.')
        );
      }
    }
  }

  showError(title, message) {
    this.errorTitle.textContent = title;
    this.errorMsg.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  capture() {
    if (!this.stream || !this.video.videoWidth) return;

    // Shutter flash animation
    this.flashEl.classList.add('active');
    setTimeout(() => this.flashEl.classList.remove('active'), 140);

    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext('2d');

    ctx.save();
    if (this.mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.video, 0, 0, w, h);
    ctx.restore();

    this.canvas.toBlob(
      (blob) => {
        if (!blob) return;
        this.clearCapture();
        this.capturedBlob = blob;
        this.capturedPreviewUrl = URL.createObjectURL(blob);
        this.previewImg.src = this.capturedPreviewUrl;

        this.video.classList.add('hidden');
        this.liveControls.classList.add('hidden');
        this.previewImg.classList.remove('hidden');
        this.previewControls.classList.remove('hidden');
        this.captionInput.focus();
      },
      'image/jpeg',
      0.92
    );
  }

  retake() {
    this.clearCapture();
    this.showLiveUI();
    if (!this.stream) this.startStream();
  }

  async send() {
    if (!this.capturedBlob) return;
    this.sendBtn.disabled = true;
    this.sendBtn.textContent = 'Sending...';
    try {
      const file = new File([this.capturedBlob], `lotta-camera-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      const caption = this.captionInput.value.trim();
      await this.onSendPhoto(file, caption);
      this.close();
    } finally {
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = 'Send Photo →';
    }
  }
}
