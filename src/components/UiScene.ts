import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private levelText!: Phaser.GameObjects.Text;
  private attackCooldownBar!: Phaser.GameObjects.Rectangle;
  private dashCooldownBar!: Phaser.GameObjects.Rectangle;
  private attackCooldownBg!: Phaser.GameObjects.Rectangle;
  private dashCooldownBg!: Phaser.GameObjects.Rectangle;
  private enemyCountText!: Phaser.GameObjects.Text;
  private attackCooldownBorder!: Phaser.GameObjects.Rectangle;
  private dashCooldownBorder!: Phaser.GameObjects.Rectangle;
  private healthText!: Phaser.GameObjects.Text;
  private healthHearts!: Phaser.GameObjects.Image[];
  private timeText!: Phaser.GameObjects.Text;
  

  constructor() {
    super({ key: 'UIScene', active: true });
  }

  preload() {
    // NUEVO: Cargar sprites de corazones (si no están ya en GameScene)
    this.load.image('heart-full', 'assets/sprites/items/ui-heart.png');
    this.load.image('heart-empty', 'assets/sprites/items/ui-empty-heart.png');
    // O si solo tienes un corazón, lo usaremos con transparencia
  }

  create() {
    // Texto de posición del jugador
    this.levelText = this.add.text(16, 16, 'Nivel: 1', {
      fontSize: '20px',
      color: '#fbbf24',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
      fontStyle: 'bold'
    });
    this.levelText.setScrollFactor(0);
    this.levelText.setStroke('#92400e', 2);
    
    // Contador de enemigos
    this.enemyCountText = this.add.text(16, 50, 'Enemigos: 8', {
      fontSize: '16px',
      color: '#ef4444',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.enemyCountText.setScrollFactor(0);

    this.createHealthHearts();
    
    // Indicador de vida del jugador
    this.healthText = this.add.text(16, 84, 'Vida:', {
      fontSize: '16px',
      color: '#ef4444',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },

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
    const barHeight = 12; // Un poco más altas
    const startX = this.cameras.main.width - barWidth - 20;
    const startY = 20;
    const borderWidth = 2;
    
    // Barra de cooldown de ataque
    this.add.text(startX, startY - 20, 'Ataque', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontStyle: 'bold'
    }).setScrollFactor(0);

    this.attackCooldownBorder = this.add.rectangle(
      startX + barWidth / 2, 
      startY, 
      barWidth + borderWidth * 2, 
      barHeight + borderWidth * 2, 
      0xffffff
    );
    this.attackCooldownBorder.setScrollFactor(0);

    this.attackCooldownBg = this.add.rectangle(
      startX + barWidth / 2, 
      startY, 
      barWidth, 
      barHeight, 
      0x1e293b
    );
    this.attackCooldownBg.setScrollFactor(0);

    this.attackCooldownBar = this.add.rectangle(
      startX, 
      startY, 
      0, 
      barHeight, 
      0xff4444
    );
    this.attackCooldownBar.setOrigin(0, 0.5);
    this.attackCooldownBar.setScrollFactor(0);
    
    this.attackCooldownBg = this.add.rectangle(startX + barWidth/2, startY, barWidth, barHeight, 0x334155);
    this.attackCooldownBg.setScrollFactor(0);
    
    this.attackCooldownBar = this.add.rectangle(startX, startY, 0, barHeight, 0xff4444);
    this.attackCooldownBar.setOrigin(0, 0.5);
    this.attackCooldownBar.setScrollFactor(0);
    
    // Barra de cooldown de dash
    this.add.text(startX, startY + 50, 'Salto', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontStyle: 'bold'
    }).setScrollFactor(0);

    this.dashCooldownBorder = this.add.rectangle(
      startX + barWidth / 2, 
      startY + 70, 
      barWidth + borderWidth * 2, 
      barHeight + borderWidth * 2, 
      0xffffff
    );
    this.dashCooldownBorder.setScrollFactor(0);

    this.dashCooldownBg = this.add.rectangle(
      startX + barWidth / 2, 
      startY + 70, 
      barWidth, 
      barHeight, 
      0x1e293b
    );
    this.dashCooldownBg.setScrollFactor(0);

    this.dashCooldownBar = this.add.rectangle(
      startX, 
      startY + 70, 
      0, 
      barHeight, 
      0x00ff88
    );
    this.dashCooldownBar.setOrigin(0, 0.5);
    this.dashCooldownBar.setScrollFactor(0);
    
    this.dashCooldownBg = this.add.rectangle(startX + barWidth/2, startY + 60, barWidth, barHeight, 0x334155);
    this.dashCooldownBg.setScrollFactor(0);
    
    this.dashCooldownBar = this.add.rectangle(startX, startY + 60, 0, barHeight, 0x00ff88);
    this.dashCooldownBar.setOrigin(0, 0.5);
    this.dashCooldownBar.setScrollFactor(0);
  }

  private createHealthHearts() {
    this.healthHearts = [];

    const startX = 16;
    const startY = 94;
    const heartSize = 24; // Tamaño de cada corazón
    const spacing = 30;
    
    // Crear textura de corazón
    for (let i = 0; i < 10; i++) {
      // NUEVO: Usar imagen de corazón en lugar de gráfico generado
      const heart = this.add.image(
        startX + (i * spacing), 
        startY, 
        'heart-full'
      );
      heart.setScrollFactor(0);
      heart.setDisplaySize(heartSize, heartSize);
      heart.setOrigin(0, 0.5);
      heart.setVisible(false); // Ocultar por defecto
      this.healthHearts.push(heart);
    }
  }

  private updateHealthDisplay(currentHealth: number, maxHealth: number) {
    this.healthHearts.forEach((heart, index) => {
      if (index < maxHealth) {
        // Este corazón debe ser visible
        heart.setVisible(true);
        
        if (index < currentHealth) {
          // Corazón lleno
          heart.setTexture('heart-full');
          heart.setAlpha(1);
          heart.setTint(0xffffff);
          
          // Efecto de pulsación en corazones llenos
          const time = this.time.now * 0.002;
          const scale = 1 + Math.sin(time + index * 0.5) * 0.05;
          heart.setScale(scale);
        } else {
          heart.setTexture('heart-empty');
          heart.setAlpha(0.5);
          heart.setScale(1);
          
        }
      } else {
        // Este corazón no debe mostrarse (más allá de la vida máxima)
        heart.setVisible(false);
      }
    });
  }

  update() {
    
    const currentLevel = this.registry.get('currentLevel') || 1;
    this.levelText.setText(`Nivel: ${currentLevel}`);
    
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

    if (attackCooldown === 0) {
      this.attackCooldownBar.setAlpha(1);
      // Efecto de pulso
      const pulse = 0.8 + Math.sin(this.time.now * 0.01) * 0.2;
      this.attackCooldownBorder.setAlpha(pulse);
    } else {
      this.attackCooldownBar.setAlpha(0.8);
      this.attackCooldownBorder.setAlpha(1);
    }
    
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
