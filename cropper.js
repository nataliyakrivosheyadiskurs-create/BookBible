// =============================================
// Character Bible — Image Cropper
// Встроенный кропер без внешних зависимостей
// =============================================

let cropState = {
  canvas: null, ctx: null, img: null,
  startX: 0, startY: 0, endX: 0, endY: 0,
  isDragging: false, isDrawing: false,
  scale: 1, imgX: 0, imgY: 0,
  cropX: 0, cropY: 0, cropW: 0, cropH: 0,
  hasCrop: false, mode: 'draw' // draw | move
};

function initCropper(imageDataUrl) {
  const overlay = document.getElementById('cropperOverlay');
  overlay.style.display = 'flex';

  const canvas = document.getElementById('cropCanvas');
  const ctx = canvas.getContext('2d');
  cropState.canvas = canvas;
  cropState.ctx = ctx;
  cropState.hasCrop = false;

  const img = new Image();
  img.onload = () => {
    cropState.img = img;

    const maxW = Math.min(window.innerWidth * 0.85, 900);
    const maxH = window.innerHeight * 0.7;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    cropState.scale = scale;
    cropState.imgX = 0;
    cropState.imgY = 0;

    drawCropper();
  };
  img.src = imageDataUrl;
}

function drawCropper() {
  const { canvas, ctx, img, scale, cropX, cropY, cropW, cropH, hasCrop } = cropState;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (hasCrop && cropW > 5 && cropH > 5) {
    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, cropY);
    ctx.fillRect(0, cropY + cropH, canvas.width, canvas.height - cropY - cropH);
    ctx.fillRect(0, cropY, cropX, cropH);
    ctx.fillRect(cropX + cropW, cropY, canvas.width - cropX - cropW, cropH);

    // Crop border
    ctx.strokeStyle = '#faf6f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Rule of thirds
    ctx.strokeStyle = 'rgba(250,246,240,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cropX + cropW * i/3, cropY); ctx.lineTo(cropX + cropW * i/3, cropY + cropH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cropX, cropY + cropH * i/3); ctx.lineTo(cropX + cropW, cropY + cropH * i/3); ctx.stroke();
    }

    // Corner handles
    const hs = 8;
    ctx.fillStyle = '#faf6f0';
    [[cropX, cropY],[cropX+cropW-hs, cropY],[cropX, cropY+cropH-hs],[cropX+cropW-hs, cropY+cropH-hs]].forEach(([x,y]) => {
      ctx.fillRect(x, y, hs, hs);
    });
  }
}

// Mouse events
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', e => {
    if (!cropState.img) return;
    const rect = canvas.getBoundingClientRect();
    cropState.startX = e.clientX - rect.left;
    cropState.startY = e.clientY - rect.top;
    cropState.isDrawing = true;
    cropState.hasCrop = false;
  });

  canvas.addEventListener('mousemove', e => {
    if (!cropState.isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cropState.cropX = Math.min(cropState.startX, x);
    cropState.cropY = Math.min(cropState.startY, y);
    cropState.cropW = Math.abs(x - cropState.startX);
    cropState.cropH = Math.abs(y - cropState.startY);
    cropState.hasCrop = true;
    drawCropper();
  });

  canvas.addEventListener('mouseup', () => {
    cropState.isDrawing = false;
    if (cropState.cropW < 10 || cropState.cropH < 10) cropState.hasCrop = false;
  });

  // Touch support
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    cropState.startX = touch.clientX - rect.left;
    cropState.startY = touch.clientY - rect.top;
    cropState.isDrawing = true;
    cropState.hasCrop = false;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!cropState.isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    cropState.cropX = Math.min(cropState.startX, x);
    cropState.cropY = Math.min(cropState.startY, y);
    cropState.cropW = Math.abs(x - cropState.startX);
    cropState.cropH = Math.abs(y - cropState.startY);
    cropState.hasCrop = true;
    drawCropper();
  });
  canvas.addEventListener('touchend', () => { cropState.isDrawing = false; });
});

function applyCrop() {
  const { img, canvas, scale, cropX, cropY, cropW, cropH, hasCrop } = cropState;
  if (!img) return;

  const out = document.createElement('canvas');
  if (hasCrop && cropW > 10 && cropH > 10) {
    out.width = cropW / scale;
    out.height = cropH / scale;
    out.getContext('2d').drawImage(img, cropX/scale, cropY/scale, cropW/scale, cropH/scale, 0, 0, out.width, out.height);
  } else {
    // No crop — use full image
    out.width = img.width;
    out.height = img.height;
    out.getContext('2d').drawImage(img, 0, 0);
  }

  out.toBlob(blob => {
    imgFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    const prev = document.getElementById('imgPreview');
    prev.src = URL.createObjectURL(blob);
    prev.style.display = 'block';
    closeCropper();
    showToast('Кадрирование применено');
  }, 'image/jpeg', 0.92);
}

function resetCrop() {
  cropState.hasCrop = false;
  drawCropper();
}

function closeCropper() {
  document.getElementById('cropperOverlay').style.display = 'none';
}
