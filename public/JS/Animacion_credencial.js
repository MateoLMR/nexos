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
    // Escala para que entre una tarjeta (300px) y su separación en cada espacio
    const espacio = this.canvas.width / (this.creators.length + 1);
    this.escala = Math.min(1, (espacio - 24) / 300);
    // Reposo: la tarjeta cuelga con una cuerda corta y el canvas mide lo justo
    this.restY = 70 + 200 * this.escala;
    this.canvas.height = Math.ceil(this.restY + 200 * this.escala + 50);
  }

  drawGlobalGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(232, 238, 255, 0.04)';
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
          targetY: this.restY,
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
  drawBarcode(ctx, x, y, width, height, card) {
    // El patrón se calcula una sola vez por tarjeta para que no parpadee
    if (!card.barras) {
      card.barras = [];
      let cx = 0;
      while (cx < width) {
        const w = Math.random() * 3 + 1;
        if (cx + w < width) card.barras.push([cx, w]);
        cx += w + Math.random() * 4;
      }
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(232, 238, 255, 0.3)';
    card.barras.forEach(([bx, bw]) => ctx.fillRect(bx, 0, bw, height));
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
    // En pantallas angostas las credenciales se achican para no montarse
    ctx.scale(this.escala, this.escala);

    // Sombra proyectada
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Cuerpo de la tarjeta
    ctx.fillStyle = '#2A1F45';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();

    // Reset sombras para detalles internos
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Borde de color (Glow)
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Banda superior estética
    ctx.fillStyle = 'rgba(232,238,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, 60, [6, 6, 0, 0]);
    ctx.fill();

    // Foto de perfil
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -40, 50, 0, Math.PI * 2);
    ctx.clip();
    if (img) {
      ctx.drawImage(img, -50, -90, 100, 100);
    } else {
      ctx.fillStyle = '#3A2C5E';
      ctx.fill();
    }
    ctx.restore();

    // Texto: Nombre
    ctx.fillStyle = '#E8EEFF';
    ctx.font = '800 22px "Bricolage Grotesque Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.name, 0, 50);

    // Texto: Rol
    ctx.fillStyle = data.accent;
    ctx.font = '500 16px "Onest Variable", sans-serif';
    ctx.fillText(data.role, 0, 75);

    // Código de barras decorativo
    this.drawBarcode(ctx, -w / 2 + 30, 110, w - 60, 25, card);

    // Badge inferior rediseñado
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 20, 145, w - 40, 25, 3);
    ctx.fill();

    ctx.fillStyle = data.color === '#6D3BD2' ? '#FFFFFF' : '#1C1300';
    ctx.font = '600 13px "JetBrains Mono Variable", monospace';
    ctx.fillText(data.badge.toUpperCase(), 0, 162);

    ctx.restore();
  }

  drawCuerda(card) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3A2C5E'; // Color de cuerda más neutro
    ctx.moveTo(card.x, 0);
    ctx.bezierCurveTo(card.x, 100, card.targetX, 100, card.targetX, card.targetY - 160 * this.escala);
    ctx.stroke();

    // El gancho que une la cuerda con la tarjeta
    ctx.beginPath();
    ctx.arc(card.targetX, card.targetY - 160 * this.escala, 5, 0, Math.PI * 2);
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
        const dy = this.restY - card.targetY;
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

    // Si el canvas ya no está en la página (se cambió de ruta), se detiene el ciclo
    if (!this.canvas.isConnected) return;
    requestAnimationFrame(() => this.animate());
  }

  handleDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.cards.forEach(card => {
      const dx = mx - card.targetX;
      const dy = my - card.targetY;
      if (Math.abs(dx) < 150 * this.escala && Math.abs(dy) < 200 * this.escala) {
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
