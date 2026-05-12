import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class LizardEnemy {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private moveSpeed: number = 40; // Muy lento
  private health: number = 5;
  private maxHealth: number = 5;
  private isAlive: boolean = true;
  private lastDamageTime: number = 0;
  private damageFlashDuration: number = 200;
  private healthBar!: Phaser.GameObjects.Graphics;
  private damageSound!: Phaser.Sound.BaseSound;
  private shootSound!: Phaser.Sound.BaseSound;
  private detectionRange: number = 600;
  private shootingRange: number = 350;
  private optimalDistance: number = 280; // Prefiere mantener distancia
  
  // Sistema de ráfaga
  private lastBurstStartTime: number = 0;
  private burstCooldown: number = 3000; // 3 segundos entre ráfagas
  private shotsInBurst: number = 5; // 5 disparos por ráfaga
  private currentBurstShot: number = 0;
  private timeBetweenShots: number = 200; // 0.2 segundos entre disparos
  private lastShotTime: number = 0;
  private isBursting: boolean = false;
  
  private projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite del enemigo lagarto
    this.sprite = this.scene.physics.add.sprite(x, y, 'enemy-lizard-sprite');
    this.sprite.setSize(22, 22);
    this.sprite.setDisplaySize(28, 28);
    this.damageSound = this.scene.sound.add('enemy-damage-sound', { volume: 0.4 });
    this.shootSound = this.scene.sound.add('enemy-shoot-sound', { volume: 0.5 });
    
    // Configurar física
    this.sprite.setDrag(200);
    this.sprite.setMaxVelocity(this.moveSpeed);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0.2);
    
    // Crear barra de vida
    this.createHealthBar();
    
    // Almacenar referencia en el sprite
    this.sprite.setData('lizardEnemy', this);
  }

  private createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private updateHealthBar() {
    this.healthBar.clear();
    
    if (!this.isAlive) return;
    
    const barWidth = 28;
    const barHeight = 4;
    const x = this.sprite.x - barWidth / 2;
    const y = this.sprite.y - 20;
    
    // Fondo de la barra
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(x, y, barWidth, barHeight);
    
    // Barra de vida
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.6 ? 0x10b981 : (healthPercent > 0.3 ? 0xf59e0b : 0xef4444);
    
    this.healthBar.fillStyle(healthColor, 0.8);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Borde
    this.healthBar.lineStyle(1, 0xffffff, 0.3);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
    
    // Indicador de ráfaga (pequeña barra debajo)
    if (this.isBursting) {
      const burstBarY = y + 6;
      const burstProgress = this.currentBurstShot / this.shotsInBurst;
      
      this.healthBar.fillStyle(0xfbbf24, 0.6);
      this.healthBar.fillRect(x, burstBarY, barWidth * burstProgress, 2);
    }
  }

  public update() {
    if (!this.isAlive) return;
    
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.player.x, this.player.y
    );
    
    // Solo actuar si el jugador está dentro del rango de detección
    if (distanceToPlayer <= this.detectionRange) {
      
      // Si está muy cerca, alejarse lentamente (kiting)
      if (distanceToPlayer < this.optimalDistance - 40) {
        this.moveAwayFromPlayer();
      }
      // Si está muy lejos, acercarse lentamente
      else if (distanceToPlayer > this.optimalDistance + 40) {
        this.moveTowardsPlayer();
      }
      // Si está a distancia óptima, quedarse quieto
      else {
        this.sprite.setVelocity(0, 0);
      }
      
      // Manejar sistema de ráfaga
      if (distanceToPlayer <= this.shootingRange) {
        this.handleBurstFire();
      }
      
      // Apuntar hacia el jugador
      this.facePlayer();
    } else {
      // Detenerse si el jugador está lejos
      this.sprite.setVelocity(0, 0);
      this.isBursting = false;
      this.currentBurstShot = 0;
    }
    
    // Actualizar proyectiles
    this.updateProjectiles();
    
    // Actualizar barra de vida
    this.updateHealthBar();
    
    // Efecto de parpadeo después del daño
    if (this.scene.time.now - this.lastDamageTime < this.damageFlashDuration) {
      const flash = Math.floor((this.scene.time.now - this.lastDamageTime) / 50) % 2;
      this.sprite.setAlpha(flash === 0 ? 0.5 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    // Efecto de pulsación sutil (más lento que otros enemigos)
    const time = this.scene.time.now * 0.003;
    const scale = 1 + Math.sin(time) * 0.08;
    this.sprite.setScale(scale);
  }

  private handleBurstFire() {
    const currentTime = this.scene.time.now;
    
    // Si no está en ráfaga, verificar si puede empezar una nueva
    if (!this.isBursting) {
      // Verificar si pasó el cooldown entre ráfagas
      if (currentTime - this.lastBurstStartTime >= this.burstCooldown) {
        // Iniciar nueva ráfaga
        this.isBursting = true;
        this.currentBurstShot = 0;
        this.lastBurstStartTime = currentTime;
        this.lastShotTime = currentTime;
        
        // Disparar primer proyectil
        this.shootAtPlayer();
        this.currentBurstShot++;
      }
    } else {
      // Ya está en ráfaga, continuar disparando
      if (this.currentBurstShot < this.shotsInBurst) {
        // Verificar si es momento de disparar el siguiente
        if (currentTime - this.lastShotTime >= this.timeBetweenShots) {
          this.shootAtPlayer();
          this.currentBurstShot++;
          this.lastShotTime = currentTime;
        }
      } else {
        // Ráfaga completa, terminar
        this.isBursting = false;
        this.currentBurstShot = 0;
      }
    }
  }

  private moveTowardsPlayer() {
    const dx = this.player.x - this.sprite.x;
    const dy = this.player.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      this.sprite.setVelocity(
        normalizedX * this.moveSpeed,
        normalizedY * this.moveSpeed
      );
    }
  }

  private moveAwayFromPlayer() {
    const dx = this.player.x - this.sprite.x;
    const dy = this.player.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      // Moverse en dirección opuesta (más lento)
      this.sprite.setVelocity(
        -normalizedX * this.moveSpeed,
        -normalizedY * this.moveSpeed
      );
    }
  }

  private facePlayer() {
    const dx = this.player.x - this.sprite.x;
    
    // Voltear sprite según dirección
    if (dx > 0) {
      this.sprite.setFlipX(false);
    } else if (dx < 0) {
      this.sprite.setFlipX(true);
    }
  }

  private shootAtPlayer() {
    this.shootSound.play();
    
    // Crear proyectil apuntando al jugador
    const projectile = new Projectile(
      this.scene,
      this.sprite.x,
      this.sprite.y,
      this.player.x,
      this.player.y,
      1, // daño
      'projectile-sprite', // sprite del proyectil
      180, // velocidad (un poco más rápido que el enemigo ranged normal)
      14 // tamaño ligeramente más grande
    );
    
    this.projectiles.push(projectile);
    
    // Efecto visual de disparo (color verde para diferenciarlo)
    const muzzleFlash = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      16,
      0x10b981, // Verde
      0.7
    );
    
    this.scene.tweens.add({
      targets: muzzleFlash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        muzzleFlash.destroy();
      }
    });
    
    // Pequeño retroceso al disparar
    const dx = this.sprite.x - this.player.x;
    const dy = this.sprite.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const recoilForce = 30;
      
      this.sprite.setVelocity(
        normalizedX * recoilForce,
        normalizedY * recoilForce
      );
    }
  }

  private updateProjectiles() {
    this.projectiles = this.projectiles.filter(projectile => {
      const shouldRemove = projectile.update();
      return !shouldRemove;
    });
  }

  public checkProjectileHits(playerSprite: Phaser.Physics.Arcade.Sprite) {
    this.projectiles.forEach((projectile, index) => {
      const distance = Phaser.Math.Distance.Between(
        projectile.getSprite().x,
        projectile.getSprite().y,
        playerSprite.x,
        playerSprite.y
      );
      
      if (distance <= 20) {
        // Aplicar daño al jugador
        const playerData = playerSprite.getData('player');
        if (playerData && typeof playerData.takeDamage === 'function') {
          playerData.takeDamage(projectile.getDamage());
        }
        
        // Destruir proyectil
        projectile.hitTarget();
        this.projectiles.splice(index, 1);
      }
    });
  }

  public takeDamage(damage: number = 1): boolean {
    if (!this.isAlive) return false;
    this.damageSound.play();
    
    this.health -= damage;
    this.lastDamageTime = this.scene.time.now;
    
    // Efecto de knockback
    const dx = this.sprite.x - this.player.x;
    const dy = this.sprite.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const knockbackForce = 120; // Menos knockback que otros enemigos (es pesado)
      
      this.sprite.setVelocity(
        normalizedX * knockbackForce,
        normalizedY * knockbackForce
      );
    }
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }

  private die() {
    this.isAlive = false;
    
    // Destruir todos los proyectiles
    this.projectiles.forEach(projectile => projectile.destroy());
    this.projectiles = [];
    
    // Efecto de muerte
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Efecto de partículas de muerte (verde para lagarto)
    const deathEffect = this.scene.add.particles(this.sprite.x, this.sprite.y, 'enemy-sprite', {
      scale: { start: 0.4, end: 0 },
      speed: { min: 50, max: 120 },
      lifespan: 600,
      quantity: 10,
      tint: 0x10b981, // Verde
      alpha: { start: 0.9, end: 0 }
    });
    
    this.scene.time.delayedCall(600, () => {
      deathEffect.destroy();
    });
  }

  public destroy() {
    // Destruir proyectiles
    this.projectiles.forEach(projectile => projectile.destroy());
    this.projectiles = [];
    
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }

  public isEnemyAlive(): boolean {
    return this.isAlive;
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  public getProjectiles(): Projectile[] {
    return this.projectiles;
  }
}
