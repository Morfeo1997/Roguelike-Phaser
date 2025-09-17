import Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };
  private worldObjects!: Phaser.GameObjects.Group;
  private background!: Phaser.GameObjects.TileSprite;
  private currentMovementVector: { x: number; y: number } = { x: 0, y: 0 };
  private gameOverScreen!: Phaser.GameObjects.Container;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Crear el mundo expandido
    this.createWorld();
    
    // Crear elementos decorativos
    this.createWorldObjects();
    
    // Crear el jugador
    this.player = new Player(this, 400, 300);
    
    // Crear grupo de enemigos
    this.enemyGroup = this.physics.add.group();
    
    // Crear enemigos iniciales
    this.createEnemies();
    
    // Configurar controles
    this.setupControls();
    
    // Configurar controles de mouse
    this.setupMouseControls();
    
    // Configurar cámara
    this.setupCamera();
    
    // Configurar colisiones
    this.setupCollisions();
    
    // Crear pantalla de Game Over (inicialmente oculta)
    this.createGameOverScreen();
  }

  private createEnemies() {
    // Crear varios enemigos en posiciones aleatorias
    const enemyCount = 8;
    
    for (let i = 0; i < enemyCount; i++) {
      let x, y;
      let validPosition = false;
      let attempts = 0;
      
      // Buscar una posición válida (no muy cerca del jugador)
      while (!validPosition && attempts < 20) {
        x = Phaser.Math.Between(100, 1900);
        y = Phaser.Math.Between(100, 1400);
        
        const distanceToPlayer = Phaser.Math.Distance.Between(x, y, 400, 300);
        if (distanceToPlayer > 150) {
          validPosition = true;
        }
        attempts++;
      }
      
      if (validPosition) {
        const enemy = new Enemy(this, x!, y!, this.player.sprite);
        this.enemies.push(enemy);
        this.enemyGroup.add(enemy.getSprite());
      }
    }
  }
  private createWorld() {
    const worldWidth = 2000;
    const worldHeight = 1500;
    
    // Establecer límites del mundo
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    
    // Crear fondo con patrón
    this.background = this.add.tileSprite(
      0, 0, worldWidth, worldHeight, ''
    );
    this.background.setOrigin(0, 0);
    this.background.setTint(0x0f172a);
    
    // Crear grid sutil
    this.createGrid(worldWidth, worldHeight);
  }

  private createGrid(width: number, height: number) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x334155, 0.3);
    
    const gridSize = 50;
    
    // Líneas verticales
    for (let x = 0; x <= width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    
    // Líneas horizontales
    for (let y = 0; y <= height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    
    graphics.strokePath();
  }

  private createWorldObjects() {
    this.worldObjects = this.add.group();
    
    // Crear árboles aleatorios
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(100, 1900);
      const y = Phaser.Math.Between(100, 1400);
      this.createTree(x, y);
    }
    
    // Crear rocas aleatorias
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(150, 1850);
      const y = Phaser.Math.Between(150, 1350);
      this.createRock(x, y);
    }
  }

  private createTree(x: number, y: number) {
    const tree = this.add.circle(x, y, 30, 0x059669);
    tree.setStrokeStyle(4, 0x047857);
    
    const trunk = this.add.rectangle(x, y + 25, 8, 15, 0x92400e);
    
    this.worldObjects.add(tree);
    this.worldObjects.add(trunk);
    
    // Hacer que los árboles sean sólidos
    this.physics.add.existing(tree, true);
  }

  private createRock(x: number, y: number) {
    const size = Phaser.Math.Between(15, 25);
    const rock = this.add.circle(x, y, size, 0x64748b);
    rock.setStrokeStyle(2, 0x475569);
    
    this.worldObjects.add(rock);
    
    // Hacer que las rocas sean sólidas
    this.physics.add.existing(rock, true);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    this.wasdKeys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  private setupMouseControls() {
    // Click izquierdo para atacar
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Convertir coordenadas de pantalla a coordenadas del mundo
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        this.player.attack(worldX, worldY, this.enemies);
      } else if (pointer.rightButtonDown()) {
        // Click derecho para dash
        this.player.dash(this.currentMovementVector);
      }
    });

    // Prevenir menú contextual del click derecho
    this.input.mouse!.disableContextMenu();
  }
  private setupCamera() {
    // Configurar cámara para seguir al jugador
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    
    // Establecer límites de cámara
    this.cameras.main.setBounds(0, 0, 2000, 1500);
    
    // Efecto de suavizado
    this.cameras.main.setLerp(0.1, 0.1);
  }

  private setupCollisions() {
    // Colisión con bordes del mundo
    this.player.sprite.setCollideWorldBounds(true);
    
    // Colisión con objetos del mundo
    this.physics.add.collider(this.player.sprite, this.worldObjects);
    
    // Colisión entre jugador y enemigos
    this.physics.add.collider(this.player.sprite, this.enemyGroup);
    
    // Colisión entre enemigos
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    
    // Colisión de enemigos con objetos del mundo
    this.physics.add.collider(this.enemyGroup, this.worldObjects);
    
    // Almacenar referencia del jugador en su sprite para acceso desde enemigos
    this.player.sprite.setData('player', this.player);
  }

  private createGameOverScreen() {
    this.gameOverScreen = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
    this.gameOverScreen.setScrollFactor(0);
    this.gameOverScreen.setDepth(1000);
    
    // Fondo semi-transparente
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
    this.gameOverScreen.add(overlay);
    
    // Panel principal
    const panel = this.add.rectangle(0, 0, 400, 300, 0x1e293b, 0.95);
    panel.setStrokeStyle(4, 0x475569);
    this.gameOverScreen.add(panel);
    
    // Título "Game Over"
    const gameOverText = this.add.text(0, -80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ef4444',
      fontStyle: 'bold'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setStroke('#7f1d1d', 4);
    gameOverText.setShadow(0, 4, '#000000', 8, false, true);
    this.gameOverScreen.add(gameOverText);
    
    // Mensaje adicional
    const messageText = this.add.text(0, -20, 'Los enemigos te han derrotado', {
      fontSize: '18px',
      color: '#cbd5e1'
    });
    messageText.setOrigin(0.5);
    this.gameOverScreen.add(messageText);
    
    // Botón "Jugar de nuevo"
    const buttonBg = this.add.rectangle(0, 60, 200, 50, 0x3b82f6);
    buttonBg.setStrokeStyle(2, 0x60a5fa);
    buttonBg.setInteractive({ useHandCursor: true });
    this.gameOverScreen.add(buttonBg);
    
    const buttonText = this.add.text(0, 60, 'Jugar de nuevo', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);
    this.gameOverScreen.add(buttonText);
    
    // Efectos hover del botón
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x2563eb);
      this.tweens.add({
        targets: buttonBg,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x3b82f6);
      this.tweens.add({
        targets: buttonBg,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });
    
    // Funcionalidad del botón
    buttonBg.on('pointerdown', () => {
      this.restartGame();
    });
    
    // Ocultar inicialmente
    this.gameOverScreen.setVisible(false);
  }

  private showGameOver() {
    this.isGameOver = true;
    this.gameOverScreen.setVisible(true);
    
    // Animar entrada
    this.gameOverScreen.setAlpha(0);
    this.gameOverScreen.setScale(0.8);
    
    this.tweens.add({
      targets: this.gameOverScreen,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Pausar el juego
    this.physics.pause();
  }

  private restartGame() {
    this.isGameOver = false;
    this.gameOverScreen.setVisible(false);
    
    // Reiniciar jugador
    this.player.reset(400, 300);
    
    // Limpiar enemigos existentes
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    this.enemyGroup.clear(true, true);
    
    // Crear nuevos enemigos
    this.createEnemies();
    
    // Reanudar física
    this.physics.resume();
    
    // Resetear cámara
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    
    // Resetear registros de la UI
    this.registry.set('playerHealth', this.player.getHealth());
    this.registry.set('playerMaxHealth', this.player.getMaxHealth());
    this.registry.set('enemyCount', this.enemies.length);
    this.registry.set('attackCooldown', 0);
    this.registry.set('dashCooldown', 0);
  }

  update() {
    if (this.isGameOver) return;
    
    this.currentMovementVector = this.getInputVector();
    this.player.update(this.currentMovementVector);
    
    // Verificar si el jugador murió
    if (this.player.getIsDead() && !this.isGameOver) {
      this.showGameOver();
      return;
    }
    
    // Actualizar enemigos
    this.enemies.forEach((enemy, index) => {
      if (enemy.isEnemyAlive()) {
        enemy.update();
      } else {
        // Remover enemigos muertos del array
        this.enemies.splice(index, 1);
      }
    });
    
    // Actualizar información en la UI
    this.registry.set('playerPosition', {
      x: Math.round(this.player.sprite.x),
      y: Math.round(this.player.sprite.y)
    });
    
    // Actualizar información de cooldowns
    this.registry.set('attackCooldown', this.player.getAttackCooldownPercent());
    this.registry.set('dashCooldown', this.player.getDashCooldownPercent());
    
    // Actualizar contador de enemigos
    this.registry.set('enemyCount', this.enemies.length);
    
    // Actualizar información de salud del jugador
    this.registry.set('playerHealth', this.player.getHealth());
    this.registry.set('playerMaxHealth', this.player.getMaxHealth());
  }

  private getInputVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    
    // Detectar input horizontal
    if (this.cursors.left.isDown || this.wasdKeys.a.isDown) {
      x = -1;
    } else if (this.cursors.right.isDown || this.wasdKeys.d.isDown) {
      x = 1;
    }
    
    // Detectar input vertical
    if (this.cursors.up.isDown || this.wasdKeys.w.isDown) {
      y = -1;
    } else if (this.cursors.down.isDown || this.wasdKeys.s.isDown) {
      y = 1;
    }
    
    // Normalizar vector diagonal
    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }
    
    return { x, y };
  }
}
