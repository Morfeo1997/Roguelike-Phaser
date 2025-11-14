import Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { RangedEnemy } from './RangedEnemy';
import { HealthItem } from './HealthItem';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private rangedEnemies: RangedEnemy[] = [];
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
  private gameTimer!: Phaser.Time.TimerEvent;
  private timeRemaining: number = 60;
  private currentLevel: number = 1;
  private baseEnemyCount: number = 5; 
  private baseRangedCount: number = 3;
  private healthItems: HealthItem[] = [];
  constructor() {
    super({ key: 'GameScene' });
  }

  // ¡NUEVO! Método preload para cargar la imagen del jugador
  preload() {
    this.load.image('bg-tile', 'assets/backgrounds/grass-tile.png');
    // Cargar la imagen del jugador desde assets/sprites/player.png
    this.load.image('player-sprite', 'assets/sprites/player/player.png');
    this.load.image('player-attack-1', 'assets/sprites/player/player-attack-1.png');
    this.load.image('player-attack-2', 'assets/sprites/player/player-attack-2.png');
    this.load.image('player-attack-3', 'assets/sprites/player/player-attack-3.png');

    this.load.image('projectile-sprite', 'assets/sprites/enemies/projectile.png');

    this.load.image('heart-red', 'assets/sprites/items/heart.png');
    this.load.image('heart-golden', 'assets/sprites/items/gold-heart.png');
    
    // Si más adelante quieres agregar otros sprites, puedes hacerlo aquí:

    this.load.image('enemy-melee-sprite', 'assets/sprites/enemies/enemy-melee.png');
    this.load.image('enemy-ranged-sprite', 'assets/sprites/enemies/enemy-ranged.png');

    this.load.image('tree-sprite', 'assets/sprites/tree.png');
    this.load.image('rock-sprite', 'assets/sprites/rock.png');
    this.load.audio('enemy-damage-sound', 'assets/sounds/effects/enemy-damage.wav');
    this.load.audio('player-damage-sound', 'assets/sounds/effects/player-damage.wav');
    this.load.audio('enemy-shoot-sound', 'assets/sounds/effects/enemy-shoot.wav');
    this.load.audio('player-attack-sound', 'assets/sounds/effects/player-attack.wav');
    this.load.audio('player-jump-sound', 'assets/sounds/effects/player-jump.wav');

  }

  create() {
    // Crear el mundo expandido
    this.createWorld();

    this.background = this.add.tileSprite(0, 0, 2000, 1500, 'bg-tile');
    this.background.setOrigin(0, 0);

    this.sound.volume = 0.7;
    
    // Crear elementos decorativos
    this.createWorldObjects();
    
    // Crear el jugador (ahora ya está cargada la imagen 'player-sprite')
    this.player = new Player(this, 400, 300);
    
    // Crear grupo de enemigos
    this.enemyGroup = this.physics.add.group();

    this.currentLevel = 1;
    this.registry.set('currentLevel', this.currentLevel);
    
    // Crear enemigos iniciales
    this.createEnemies();
    
    // Configurar controles
    this.setupControls();
    
    // Configurar controles de mouse
    this.setupMouseControls();
    
    // Configurar cámara
    this.setupCamera();

    this.startGameTimer();
    
    // Configurar colisiones
    this.setupCollisions();
    
    // Crear pantalla de Game Over (inicialmente oculta)
    this.createGameOverScreen();
  }

  private createEnemies() {
  // Calcular cantidad de enemigos según el nivel
  const meleeEnemyCount = this.baseEnemyCount + (this.currentLevel - 1);
  const rangedEnemyCount = this.baseRangedCount + (this.currentLevel - 1);
  
  // Crear enemigos cuerpo a cuerpo
  for (let i = 0; i < meleeEnemyCount; i++) {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 20) {
      x = Phaser.Math.Between(150, 1850);
      y = Phaser.Math.Between(150, 1350);
      
      const distanceToPlayer = Phaser.Math.Distance.Between(x, y, 400, 300);
      const minDistanceFromEdge = 100;
      const tooCloseToEdge = 
        x < minDistanceFromEdge || 
        x > 2000 - minDistanceFromEdge ||
        y < minDistanceFromEdge || 
        y > 1500 - minDistanceFromEdge;
      
      if (distanceToPlayer > 150 && !tooCloseToEdge) {
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
  
  // Crear enemigos a distancia
  for (let i = 0; i < rangedEnemyCount; i++) {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 20) {
      x = Phaser.Math.Between(150, 1850);
      y = Phaser.Math.Between(150, 1350);
      
      const distanceToPlayer = Phaser.Math.Distance.Between(x, y, 400, 300);
      const minDistanceFromEdge = 100;
      const tooCloseToEdge = 
        x < minDistanceFromEdge || 
        x > 2000 - minDistanceFromEdge ||
        y < minDistanceFromEdge || 
        y > 1500 - minDistanceFromEdge;
      
      if (distanceToPlayer > 200 && !tooCloseToEdge) {
        validPosition = true;
      }
      attempts++;
    }
    
    if (validPosition) {
      const rangedEnemy = new RangedEnemy(this, x!, y!, this.player.sprite);
      this.rangedEnemies.push(rangedEnemy);
      this.enemyGroup.add(rangedEnemy.getSprite());
    }
  }
}

private showLevelUpNotification() {
  const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
  const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;
  
  // Texto de nivel completado
  const levelUpText = this.add.text(centerX, centerY, `¡NIVEL ${this.currentLevel}!`, {
    fontSize: '64px',
    color: '#fbbf24',
    fontStyle: 'bold'
  });
  levelUpText.setOrigin(0.5);
  levelUpText.setStroke('#92400e', 6);
  levelUpText.setShadow(0, 4, '#000000', 10, false, true);
  levelUpText.setScrollFactor(0);
  levelUpText.setDepth(999);
  
  // Animación de aparición
  levelUpText.setScale(0);
  levelUpText.setAlpha(0);
  
  this.tweens.add({
    targets: levelUpText,
    scale: 1.2,
    alpha: 1,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Esperar un momento y luego desaparecer
      this.time.delayedCall(1500, () => {
        this.tweens.add({
          targets: levelUpText,
          scale: 0,
          alpha: 0,
          duration: 300,
          ease: 'Back.easeIn',
          onComplete: () => {
            levelUpText.destroy();
          }
        });
      });
    }
  });
  const bonusText = this.add.text(centerX, centerY + 60, '+30 segundos', {
    fontSize: '24px',
    color: '#10b981',
    fontStyle: 'bold'
  });
  bonusText.setOrigin(0.5);
  bonusText.setStroke('#065f46', 3);
  bonusText.setScrollFactor(0);
  bonusText.setDepth(999);
  bonusText.setAlpha(0);
  
  this.tweens.add({
    targets: bonusText,
    alpha: 1,
    y: centerY + 80,
    duration: 300,
    delay: 200,
    ease: 'Power2',
    onComplete: () => {
      this.time.delayedCall(1500, () => {
        this.tweens.add({
          targets: bonusText,
          alpha: 0,
          y: centerY + 100,
          duration: 300,
          onComplete: () => {
            bonusText.destroy();
          }
        });
      });
    }
  });
};

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
    this.createWorldBorder(worldWidth, worldHeight);
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

  private createWorldBorder(width: number, height: number) {
  const graphics = this.add.graphics();
  graphics.lineStyle(4, 0xff4444, 0.8);
  graphics.strokeRect(2, 2, width - 4, height - 4);
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
    const tree = this.add.sprite(x, y, 'tree-sprite');
    
    
    this.worldObjects.add(tree);

    tree.setDisplaySize(80, 80);

    this.worldObjects.add(tree);
    
    // Hacer que los árboles sean sólidos
    this.physics.add.existing(tree, true);

    const treeBody = tree.body as Phaser.Physics.Arcade.StaticBody;
    treeBody.setSize(40, 50); // Ajusta el área de colisión
    treeBody.setOffset(10, 15);
  }

  private createRock(x: number, y: number) {
    const rock = this.add.sprite(x, y, 'rock-sprite');

    const scale = Phaser.Math.FloatBetween(0.8, 1.2);
    rock.setScale(scale);
    
    this.worldObjects.add(rock);
    
    // Hacer que las rocas sean sólidas
    this.physics.add.existing(rock, true);

    const rockBody = rock.body as Phaser.Physics.Arcade.StaticBody;
    rockBody.setCircle(15);


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
        this.player.attack(worldX, worldY, this.enemies, this.rangedEnemies);
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

  private startGameTimer() {
    // Inicializar tiempo restante
    this.timeRemaining = 60;
    this.registry.set('timeRemaining', this.timeRemaining);
    
    // Crear evento de temporizador que se ejecuta cada segundo
    this.gameTimer = this.time.addEvent({
      delay: 1000, // 1 segundo
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  private updateTimer() {
    if (this.isGameOver) return;
    
    this.timeRemaining--;
    this.registry.set('timeRemaining', this.timeRemaining);
    
    // Verificar si se acabó el tiempo
    if (this.timeRemaining <= 0) {
      this.showGameOver('¡Se acabó el tiempo!');
    }
  }

  private levelUp() {
  this.currentLevel++;
  this.registry.set('currentLevel', this.currentLevel);
  
  // Agregar 30 segundos al tiempo
  this.timeRemaining += 30;
  this.registry.set('timeRemaining', this.timeRemaining);

  this.spawnRedHeart();

  if (this.currentLevel % 3 === 0) {
    this.spawnGoldenHeart();
  }
  
  // Crear nuevos enemigos
  this.createEnemies();
  
  // Efecto visual de subida de nivel
  this.showLevelUpNotification();
  
  // Efecto de cámara
  this.cameras.main.shake(200, 0.005);
  this.cameras.main.flash(300, 255, 215, 0, false); // Flash dorado
}

private spawnRedHeart() {
  // Posición aleatoria cerca del jugador pero no muy cerca
  let x, y;
  let validPosition = false;
  let attempts = 0;
  
  while (!validPosition && attempts < 20) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(100, 200);
    
    x = this.player.sprite.x + Math.cos(angle) * distance;
    y = this.player.sprite.y + Math.sin(angle) * distance;
    
    // Verificar que esté dentro de los límites del mundo
    if (x > 50 && x < 1950 && y > 50 && y < 1450) {
      validPosition = true;
    }
    attempts++;
  }
  
  if (validPosition) {
    const heartItem = new HealthItem(this, x!, y!, 'red');
    this.healthItems.push(heartItem);
  }
}

private spawnGoldenHeart() {
  // Posición aleatoria en el centro de la pantalla visible
  const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
  const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;
  
  const offsetX = Phaser.Math.Between(-100, 100);
  const offsetY = Phaser.Math.Between(-100, 100);
  
  const heartItem = new HealthItem(this, centerX + offsetX, centerY + offsetY, 'golden');
  this.healthItems.push(heartItem);
  
  // Efecto especial para corazón dorado
  this.cameras.main.flash(500, 255, 215, 0, false);
}

private checkHealthItemCollisions() {
  this.healthItems.forEach((item, index) => {
    if (item.isItemCollected()) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      item.getSprite().x,
      item.getSprite().y
    );
    
    if (distance < 30) {
      const type = item.collect();
      
      if (type === 'red') {
        // Aumentar vida máxima en 1
        this.player.increaseMaxHealth(1);
        this.showHealthNotification('+1 Vida Máxima', 0xef4444);
      } else if (type === 'golden') {
        // Restaurar vida completa
        this.player.healToMax();
        this.showHealthNotification('¡Vida Restaurada!', 0xffd700);
      }
      
      // Remover del array después de un delay
      this.time.delayedCall(500, () => {
        this.healthItems.splice(index, 1);
      });
    }
  });
}

private showHealthNotification(message: string, color: number) {
  const notifText = this.add.text(
    this.player.sprite.x,
    this.player.sprite.y - 40,
    message,
    {
      fontSize: '20px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }
  );
  notifText.setOrigin(0.5);
  notifText.setStroke('#000000', 4);
  
  // Animación de flotación y desvanecimiento
  this.tweens.add({
    targets: notifText,
    y: notifText.y - 50,
    alpha: 0,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => {
      notifText.destroy();
    }
  });
}


  private createGameOverScreen() {
    this.gameOverScreen = this.add.container(0, 0);
    this.gameOverScreen.setDepth(1000);
    this.gameOverScreen.setVisible(false);

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Fondo semi-transparente
    const overlay = this.add.rectangle(
      centerX, 
      centerY, 
      this.cameras.main.width, 
      this.cameras.main.height, 
      0x000000, 
      0.8
    );
    this.gameOverScreen.add(overlay);
    
    // Panel principal
    const panel = this.add.rectangle(centerX, centerY, 400, 300, 0x1e293b, 0.95);
    panel.setStrokeStyle(4, 0x475569);
    this.gameOverScreen.add(panel);
    
    // Título "Game Over"
    const gameOverText = this.add.text(centerX, centerY - 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ef4444',
      fontStyle: 'bold'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setStroke('#7f1d1d', 4);
    gameOverText.setShadow(0, 4, '#000000', 8, false, true);
    this.gameOverScreen.add(gameOverText);
    
    // Mensaje adicional
    const messageText = this.add.text(centerX, centerY -20, 'Los enemigos te han derrotado', {
      fontSize: '18px',
      color: '#cbd5e1'
    });
    messageText.setOrigin(0.5);
    this.gameOverScreen.add(messageText);
    
    // Botón "Jugar de nuevo"
    const buttonBg = this.add.rectangle(centerX, centerY + 60, 200, 50, 0x3b82f6);
    buttonBg.setStrokeStyle(2, 0x60a5fa);
    buttonBg.setInteractive({ useHandCursor: true });
    this.gameOverScreen.add(buttonBg);
    
    const buttonText = this.add.text(centerX, centerY + 60, 'Jugar de nuevo', {
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
      console.log('Restart button clicked');
      this.restartGame();
    });

    buttonBg.on('pointerup', () => {
    console.log('Restart button released'); // Debug
    });
    
    // Ocultar inicialmente
    this.gameOverScreen.setVisible(false);
  }

  private buildGameOverUI() {
  // Limpiar cualquier elemento previo del container
  this.gameOverScreen.removeAll(true);
  
  // Obtener la posición actual del jugador
  const playerX = this.player.sprite.x;
  const playerY = this.player.sprite.y;
  
  // Fondo semi-transparente que cubre toda la pantalla visible
  const overlay = this.add.rectangle(
    playerX, 
    playerY, 
    this.cameras.main.width * 2, 
    this.cameras.main.height * 2, 
    0x000000, 
    0.8
  );
  this.gameOverScreen.add(overlay);
  
  // Panel principal centrado en la posición del jugador
  const panel = this.add.rectangle(playerX, playerY, 400, 300, 0x1e293b, 0.95);
  panel.setStrokeStyle(4, 0x475569);
  this.gameOverScreen.add(panel);
  
  // Título "Game Over"
  const gameOverText = this.add.text(playerX, playerY - 80, 'GAME OVER', {
    fontSize: '48px',
    color: '#ef4444',
    fontStyle: 'bold'
  });
  gameOverText.setOrigin(0.5);
  gameOverText.setStroke('#7f1d1d', 4);
  gameOverText.setShadow(0, 4, '#000000', 8, false, true);
  this.gameOverScreen.add(gameOverText);
  
  // Mensaje adicional
  const messageText = this.add.text(playerX, playerY - 20, 'Los enemigos te han derrotado', {
    fontSize: '18px',
    color: '#cbd5e1'
  });
  messageText.setOrigin(0.5);
  this.gameOverScreen.add(messageText);
  
  // Botón "Jugar de nuevo"
  const buttonBg = this.add.rectangle(playerX, playerY + 60, 200, 50, 0x3b82f6);
  buttonBg.setStrokeStyle(2, 0x60a5fa);
  buttonBg.setInteractive({ useHandCursor: true });
  this.gameOverScreen.add(buttonBg);
  
  const buttonText = this.add.text(playerX, playerY + 60, 'Jugar de nuevo', {
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
}

  private showGameOver(message: string = 'Los enemigos te han derrotado') {
    this.isGameOver = true;
    
    // Detener el temporizador
    if (this.gameTimer) {
      this.gameTimer.remove();
    }
    
    // Guardar el mensaje en el registro
    this.registry.set('gameOverMessage', message);
  
    this.buildGameOverUI();
    
    this.gameOverScreen.setVisible(true);
    
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
    
    this.physics.pause();
  }

  private restartGame() {
    this.isGameOver = false;
    this.gameOverScreen.setVisible(false);

    this.currentLevel = 1;
    this.registry.set('currentLevel', this.currentLevel);
    
    // Reiniciar temporizador
    this.timeRemaining = 60;
    this.registry.set('timeRemaining', this.timeRemaining);
    if (this.gameTimer) {
      this.gameTimer.remove();
    }
    this.startGameTimer();
    
    this.player.reset(400, 300);
    
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    
    this.rangedEnemies.forEach(enemy => enemy.destroy());
    this.rangedEnemies = [];
    
    this.enemyGroup.clear(true, true);
    
    this.createEnemies();
    
    this.physics.resume();
    
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    
    this.registry.set('playerHealth', this.player.getHealth());
    this.registry.set('playerMaxHealth', this.player.getMaxHealth());
    this.registry.set('enemyCount', this.enemies.length + this.rangedEnemies.length);
    this.registry.set('attackCooldown', 0);
    this.registry.set('dashCooldown', 0);

    this.healthItems.forEach(item => item.destroy());
    this.healthItems = [];
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

    this.rangedEnemies.forEach((enemy, index) => {
    if (enemy.isEnemyAlive()) {
      enemy.update();
      enemy.checkProjectileHits(this.player.sprite);
    } else {
      this.rangedEnemies.splice(index, 1);
    }
  });

  const totalEnemies = this.enemies.length + this.rangedEnemies.length;
  if (totalEnemies === 0 && !this.isGameOver) {
    this.levelUp();
  }
    
    // Actualizar información en la UI
    this.registry.set('playerPosition', {
      x: Math.round(this.player.sprite.x),
      y: Math.round(this.player.sprite.y)
    });
    
    // Actualizar información de cooldowns
    this.registry.set('attackCooldown', this.player.getAttackCooldownPercent());
    this.registry.set('dashCooldown', this.player.getDashCooldownPercent());
    
    // Actualizar contador de enemigos
    this.registry.set('enemyCount', this.enemies.length + this.rangedEnemies.length);
    
    // Actualizar información de salud del jugador
    this.registry.set('playerHealth', this.player.getHealth());
    this.registry.set('playerMaxHealth', this.player.getMaxHealth());

    this.checkHealthItemCollisions();
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
