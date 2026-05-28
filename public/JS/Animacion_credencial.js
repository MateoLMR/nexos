class NexosLanyards {
  constructor(canvasId, creators) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.creators = creators;
    this.cards = [];
    this.mouse = { x: 0, y: 0, active: false };
    this.images = {};

    this.init();
  }

  init() {
    this.resize();
    if (this.canvas.width === 0) {
      setTimeout(() => this.init(), 100);
      return;
    }

    window.addEventListener('resize', () => {
      this.resize();
      this.recalculateSpacing();
    });

    this.creators.forEach(data => {
      if (data.avatar) {
        const img = new Image();
        img.src = data.avatar;
        img.onload = () => this.images[data.name] = img;
      }
    });

    this.recalculateSpacing(true);

    this.canvas.addEventListener('mousedown', (e) => this.handleDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    window.addEventListener('mouseup', () => this.handleUp());

    this.animate();
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = 700;
  }

  drawGlobalGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    // Líneas verticales
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    // Líneas horizontales
    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  recalculateSpacing(isFirstLoad = false) {
    const spacing = this.canvas.width / (this.creators.length + 1);
    this.creators.forEach((data, i) => {
      const newX = spacing * (i + 1);
      if (isFirstLoad) {
        this.cards.push({
          x: newX,
          y: 0,
          targetX: newX,
          targetY: 350,
          vx: 0,
          vy: 0,
          data: data,
          isDragged: false
        });
      } else {
        if (this.cards[i]) this.cards[i].x = newX;
      }
    });
  }

  // --- DIBUJO DE CÓDIGO DE BARRAS ---
  drawBarcode(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    let currentX = 0;
    while (currentX < width) {
      const w = Math.random() * 3 + 1;
      if (currentX + w < width) {
        ctx.fillRect(currentX, 0, w, height);
      }
      currentX += w + (Math.random() * 4);
    }
    ctx.restore();
  }

  drawCard(card) {
    const { data, targetX, targetY } = card;
    const ctx = this.ctx;
    const img = this.images[data.name];
    const w = 300; // Ancho
    const h = 400; // Alto

    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.rotate(card.vx * 0.006);

    // Sombra proyectada
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Cuerpo de la tarjeta
    ctx.fillStyle = '#1e1e2e';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 20);
    ctx.fill();

    // Reset sombras para detalles internos
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Borde de color (Glow)
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Banda superior estética
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, 60, { tl: 20, tr: 20, bl: 0, br: 0 });
    ctx.fill();

    // Foto de perfil
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -40, 50, 0, Math.PI * 2);
    ctx.clip();
    if (img) {
      ctx.drawImage(img, -50, -90, 100, 100);
    } else {
      ctx.fillStyle = '#45475a';
      ctx.fill();
    }
    ctx.restore();

    // Texto: Nombre
    ctx.fillStyle = '#ffffff';
    ctx.font = ctx.font = '900 20px "Outfit", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.name.toUpperCase(), 0, 50);

    // Texto: Rol
    ctx.fillStyle = data.accent;
    ctx.font = '400 18px "Space Mono", "Consolas", monospace';
    ctx.fillText(data.role, 0, 75);

    // Código de barras decorativo
    this.drawBarcode(ctx, -w / 2 + 30, 110, w - 60, 25);

    // Badge inferior rediseñado
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 20, 145, w - 40, 25, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(data.badge.toUpperCase(), 0, 162);

    ctx.restore();
  }

  drawCuerda(card) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#52215c'; // Color de cuerda más neutro
    ctx.moveTo(card.x, 0);
    ctx.bezierCurveTo(card.x, 100, card.targetX, 100, card.targetX, card.targetY - 160);
    ctx.stroke();

    // El gancho que une la cuerda con la tarjeta
    ctx.beginPath();
    ctx.arc(card.targetX, card.targetY - 160, 5, 0, Math.PI * 2);
    ctx.fillStyle = card.data.color;
    ctx.fill();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Dibujar fondo primero
    this.drawGlobalGrid();

    // 2. Dibujar cuerdas y tarjetas
    this.cards.forEach(card => {
      if (card.isDragged) {
        card.vx = (this.mouse.x - card.targetX) * 0.2;
        card.vy = (this.mouse.y - card.targetY) * 0.2;
      } else {
        const dx = card.x - card.targetX;
        const dy = 350 - card.targetY;
        card.vx += dx * 0.01;
        card.vy += dy * 0.01;
        card.vx *= 0.92;
        card.vy *= 0.92;
      }

      card.targetX += card.vx;
      card.targetY += card.vy;

      this.drawCuerda(card);
      this.drawCard(card);
    });

    requestAnimationFrame(() => this.animate());
  }

  handleDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.cards.forEach(card => {
      const dx = mx - card.targetX;
      const dy = my - card.targetY;
      if (Math.abs(dx) < 110 && Math.abs(dy) < 160) {
        card.isDragged = true;
      }
    });
  }

  handleMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  handleUp() {
    this.cards.forEach(card => card.isDragged = false);
  }
}

window.NexosLanyards = NexosLanyards;
