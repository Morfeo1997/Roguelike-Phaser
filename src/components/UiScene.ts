import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private positionText!: Phaser.GameObjects.Text;
  private attackCooldownBar!: Phaser.GameObjects.Rectangle;
  private dashCooldownBar!: Phaser.GameObjects.Rectangle;
  private attackCooldownBg!: Phaser.GameObjects.Rectangle;
  private dashCooldownBg!: Phaser.GameObjects.Rectangle;
  private enemyCountText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private healthHearts!: Phaser.GameObjects.Image[];
  private timeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene', active: true });
  }

  create() {
    // Texto de posición del jugador
    this.positionText = this.add.text(16, 16, 'Posición: (400, 300)', {
      fontSize: '16px',
      color: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.positionText.setScrollFactor(0);
    
    // Contador de enemigos
    this.enemyCountText = this.add.text(16, 50, 'Enemigos: 8', {
      fontSize: '16px',
      color: '#ef4444',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.enemyCountText.setScrollFactor(0);
    
    // Indicador de vida del jugador
    this.healthText = this.add.text(16, 84, 'Vida:', {
      fontSize: '16px',
      color: '#ef4444',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.healthText.setScrollFactor(0);
    
    // Crear corazones para mostrar la vida
    this.createHealthHearts();
    
    
    
    // Título del juego
    this.timeText = this.add.text(this.cameras.main.width / 2, 30, 'Tiempo: 60', {
      fontSize: '32px',
      color: '#10b981',
      fontStyle: 'bold'
    });
    this.timeText.setOrigin(0.5, 0);
    this.timeText.setScrollFactor(0);
    this.timeText.setStroke('#065f46', 3);
    this.timeText.setShadow(0, 2, '#000000', 6, false, true);
    
    
    
    // Crear barras de cooldown
    this.createCooldownBars();
  }

  private createCooldownBars() {
    const barWidth = 120;
    const barHeight = 8;
    const startX = this.cameras.main.width - barWidth - 20;
    const startY = 20;
    
    // Barra de cooldown de ataque
    this.add.text(startX, startY - 20, 'Ataque', {
      fontSize: '12px',
      color: '#e2e8f0'
    }).setScrollFactor(0);
    
    this.attackCooldownBg = this.add.rectangle(startX + barWidth/2, startY, barWidth, barHeight, 0x334155);
    this.attackCooldownBg.setScrollFactor(0);
    
    this.attackCooldownBar = this.add.rectangle(startX, startY, 0, barHeight, 0xff4444);
    this.attackCooldownBar.setOrigin(0, 0.5);
    this.attackCooldownBar.setScrollFactor(0);
    
    // Barra de cooldown de dash
    this.add.text(startX, startY + 40, 'Salto', {
      fontSize: '12px',
      color: '#e2e8f0'
    }).setScrollFactor(0);
    
    this.dashCooldownBg = this.add.rectangle(startX + barWidth/2, startY + 60, barWidth, barHeight, 0x334155);
    this.dashCooldownBg.setScrollFactor(0);
    
    this.dashCooldownBar = this.add.rectangle(startX, startY + 60, 0, barHeight, 0x00ff88);
    this.dashCooldownBar.setOrigin(0, 0.5);
    this.dashCooldownBar.setScrollFactor(0);
  }

  private createHealthHearts() {
    this.healthHearts = [];
    
    // Crear textura de corazón
    const graphics = this.add.graphics();
    graphics.fillStyle(0xef4444);
    graphics.fillCircle(6, 8, 4);
    graphics.fillCircle(14, 8, 4);
    graphics.fillTriangle(2, 12, 18, 12, 10, 20);
    graphics.generateTexture('heart', 20, 24);
    graphics.destroy();
    
    // Crear corazones individuales
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(90 + (i * 25), 94, 'heart');
      heart.setScrollFactor(0);
      heart.setScale(0.8);
      this.healthHearts.push(heart);
    }
  }

  private updateHealthDisplay(currentHealth: number, maxHealth: number) {
    this.healthHearts.forEach((heart, index) => {
      if (index < currentHealth) {
        heart.setAlpha(1);
        heart.setTint(0xef4444);
      } else {
        heart.setAlpha(0.3);
        heart.setTint(0x64748b);
      }
    });
  }

  update() {
    // Actualizar posición del jugador
    const playerPos = this.registry.get('playerPosition');
    if (playerPos) {
      this.positionText.setText(`Posición: (${playerPos.x}, ${playerPos.y})`);
    }
    
    // Actualizar contador de enemigos
    const enemyCount = this.registry.get('enemyCount') || 0;
    if (enemyCount === 0) {
      this.enemyCountText.setText('¡Victoria! Todos los enemigos derrotados');
      this.enemyCountText.setColor('#10b981');
    } else {
      this.enemyCountText.setText(`Enemigos: ${enemyCount}`);
      this.enemyCountText.setColor('#ef4444');
    }
    
    // Actualizar barras de cooldown
    const attackCooldown = this.registry.get('attackCooldown') || 0;
    const dashCooldown = this.registry.get('dashCooldown') || 0;
    
    this.attackCooldownBar.width = (1 - attackCooldown) * 120;
    this.dashCooldownBar.width = (1 - dashCooldown) * 120;
    
    // Actualizar display de vida
    const playerHealth = this.registry.get('playerHealth') || 3;
    const playerMaxHealth = this.registry.get('playerMaxHealth') || 3;
    this.updateHealthDisplay(playerHealth, playerMaxHealth);

    const timeRemaining = this.registry.get('timeRemaining') || 60;
    this.timeText.setText(`Tiempo: ${timeRemaining}`);

  // Cambiar color según tiempo restante
  if (timeRemaining <= 10) {
      this.timeText.setColor('#ef4444'); // Rojo
      this.timeText.setStroke('#7f1d1d', 3);
    } else if (timeRemaining <= 30) {
      this.timeText.setColor('#f59e0b'); // Naranja
      this.timeText.setStroke('#92400e', 3);
    } else {
      this.timeText.setColor('#0f7facff'); // Verde
      this.timeText.setStroke('#2a5996', 3);
    }
  }
}
