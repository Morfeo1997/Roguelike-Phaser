import Phaser from 'phaser';

export class Enemy {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private moveSpeed: number = 80;
  private health: number = 2;
  private maxHealth: number = 2;
  private isAlive: boolean = true;
  private lastDamageTime: number = 0;
  private damageFlashDuration: number = 200;
  private healthBar!: Phaser.GameObjects.Graphics;
  private detectionRange: number = 200;
  private attackRange: number = 30;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 1500;
  private contactDamage: number = 1;
  private lastContactDamageTime: number = 0;
  private contactDamageCooldown: number = 1000;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite del enemigo usando la imagen cargada
    this.sprite = this.scene.physics.add.sprite(x, y, 'enemy-melee-sprite');
    this.sprite.setSize(20, 20);
    this.sprite.setDisplaySize(24, 24); // Ajusta el tamaño visual
    
    // Configurar física
    this.sprite.setDrag(200);
    this.sprite.setMaxVelocity(this.moveSpeed);
    this.sprite.setCollideWorldBounds(true);
    
    // Crear barra de vida
    this.createHealthBar();
    
    // Almacenar referencia en el sprite para acceso fácil
    this.sprite.setData('enemy', this);
  }

  private createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private updateHealthBar() {
    this.healthBar.clear();
    
    if (!this.isAlive) return;
    
    const barWidth = 24;
    const barHeight = 4;
    const x = this.sprite.x - barWidth / 2;
    const y = this.sprite.y - 18;
    
    // Fondo de la barra
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(x, y, barWidth, barHeight);
    
    // Barra de vida
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? 0x10b981 : (healthPercent > 0.25 ? 0xf59e0b : 0xef4444);
    
    this.healthBar.fillStyle(healthColor, 0.8);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Borde
    this.healthBar.lineStyle(1, 0xffffff, 0.3);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
  }

  public update() {
    if (!this.isAlive) return;
    
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.player.x, this.player.y
    );
    
    // Solo perseguir si el jugador está dentro del rango de detección
    if (distanceToPlayer <= this.detectionRange) {
      this.chasePlayer();
      
      // Daño por contacto
      if (distanceToPlayer <= 25 && this.scene.time.now - this.lastContactDamageTime > this.contactDamageCooldown) {
        this.dealContactDamage();
      }
      
      // Atacar si está lo suficientemente cerca
      if (distanceToPlayer <= this.attackRange && this.scene.time.now - this.lastAttackTime > this.attackCooldown) {
        this.attackPlayer();
      }
    } else {
      // Detenerse si el jugador está lejos
      this.sprite.setVelocity(0, 0);
    }
    
    // Actualizar barra de vida
    this.updateHealthBar();
    
    // Efecto de parpadeo después del daño
    if (this.scene.time.now - this.lastDamageTime < this.damageFlashDuration) {
      const flash = Math.floor((this.scene.time.now - this.lastDamageTime) / 50) % 2;
      this.sprite.setAlpha(flash === 0 ? 0.5 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    // Efecto de pulsación sutil
    const time = this.scene.time.now * 0.004;
    const scale = 1 + Math.sin(time) * 0.1;
    this.sprite.setScale(scale);
  }

  private chasePlayer() {
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
      
      // Voltear sprite según dirección
      if (dx > 0) {
        this.sprite.setFlipX(false);
      } else if (dx < 0) {
        this.sprite.setFlipX(true);
      }
    }
  }

  private attackPlayer() {
    this.lastAttackTime = this.scene.time.now;
    
    // Efecto visual de ataque
    const attackEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, this.attackRange, 0xff6666, 0.3);
    
    this.scene.tweens.add({
      targets: attackEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        attackEffect.destroy();
      }
    });
  }

  public takeDamage(damage: number = 1): boolean {
    if (!this.isAlive) return false;
    
    this.health -= damage;
    this.lastDamageTime = this.scene.time.now;
    
    // Efecto de knockback
    const dx = this.sprite.x - this.player.x;
    const dy = this.sprite.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const knockbackForce = 150;
      
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
    
    // Efecto de muerte
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Efecto de partículas de muerte usando el sprite del enemigo
    const deathEffect = this.scene.add.particles(this.sprite.x, this.sprite.y, 'enemy-sprite', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 500,
      quantity: 8,
      tint: 0xff4444,
      alpha: { start: 0.8, end: 0 }
    });
    
    this.scene.time.delayedCall(500, () => {
      deathEffect.destroy();
    });
  }

  private dealContactDamage() {
    this.lastContactDamageTime = this.scene.time.now;
    
    // Obtener referencia al jugador desde el sprite
    const playerData = this.player.getData('player');
    if (playerData && typeof playerData.takeDamage === 'function') {
      playerData.takeDamage(this.contactDamage);
    }
    
    // Efecto visual de daño por contacto
    const damageEffect = this.scene.add.circle(
      (this.sprite.x + this.player.x) / 2,
      (this.sprite.y + this.player.y) / 2,
      15, 0xff4444, 0.6
    );
    
    this.scene.tweens.add({
      targets: damageEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        damageEffect.destroy();
      }
    });
  }

  public destroy() {
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
}
