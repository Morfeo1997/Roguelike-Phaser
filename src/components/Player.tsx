import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Player {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private moveSpeed: number = 200;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private attackRange: number = 80;
  private isAttacking: boolean = false;
  private isDashing: boolean = false;
  private attackCooldown: number = 0;
  private dashCooldown: number = 0;
  private attackEffect!: Phaser.GameObjects.Arc;
  private dashEffect!: Phaser.GameObjects.Particles.ParticleEmitter;
  private health: number = 3;
  private maxHealth: number = 3;
  private isInvulnerable: boolean = false;
  private invulnerabilityDuration: number = 1000; // 1 segundo de invulnerabilidad
  private lastDamageTime: number = 0;
  private isDead: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite del jugador
    this.sprite = this.scene.physics.add.sprite(x, y, '');
    this.sprite.setSize(24, 24);
    this.sprite.setDisplaySize(24, 24);
    
    // Crear apariencia visual
    this.createVisuals();
    
    // Configurar física
    this.sprite.setDrag(400);
    this.sprite.setMaxVelocity(this.moveSpeed);
    
    // Crear efectos de partículas
    this.createParticleEffect();
    
    // Crear efectos de ataque y dash
    this.createAttackEffect();
    this.createDashEffect();
  }

  private createVisuals() {
    const graphics = this.scene.add.graphics();
    
    // Círculo principal con gradiente
    graphics.fillGradientStyle(0x3b82f6, 0x1e40af, 0x1e40af, 0x3b82f6, 1);
    graphics.fillCircle(0, 0, 12);
    
    // Borde brillante
    graphics.lineStyle(2, 0x60a5fa, 0.8);
    graphics.strokeCircle(0, 0, 12);
    
    // Punto central
    graphics.fillStyle(0xfbbf24, 1);
    graphics.fillCircle(0, 0, 3);
    
    // Convertir a textura
    graphics.generateTexture('player', 24, 24);
    graphics.destroy();
    
    this.sprite.setTexture('player');
  }

  private createParticleEffect() {
    // Crear sistema de partículas para efecto de movimiento
    const particles = this.scene.add.particles(0, 0, 'player', {
      scale: { start: 0.1, end: 0 },
      speed: { min: 20, max: 50 },
      lifespan: 200,
      quantity: 1,
      tint: 0x60a5fa,
      alpha: { start: 0.5, end: 0 }
    });
    
    particles.startFollow(this.sprite);
    this.particles = particles;
  }

  private createAttackEffect() {
    // Crear efecto visual de ataque
    this.attackEffect = this.scene.add.circle(0, 0, this.attackRange, 0xff4444, 0);
    this.attackEffect.setStrokeStyle(3, 0xff6666, 0);
    this.attackEffect.setVisible(false);
  }

  private createDashEffect() {
    // Crear efecto de partículas para el dash
    this.dashEffect = this.scene.add.particles(0, 0, 'player', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 100, max: 200 },
      lifespan: 300,
      quantity: 3,
      tint: 0x00ff88,
      alpha: { start: 0.8, end: 0 },
      emitting: false
    });
  }
  public update(inputVector: { x: number; y: number }) {
    // Actualizar cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= this.scene.game.loop.delta;
    }
    if (this.dashCooldown > 0) {
      this.dashCooldown -= this.scene.game.loop.delta;
    }

    // Aplicar movimiento
    if ((inputVector.x !== 0 || inputVector.y !== 0) && !this.isAttacking && !this.isDashing) {
      this.sprite.setVelocity(
        inputVector.x * this.moveSpeed,
        inputVector.y * this.moveSpeed
      );
      
      // Activar partículas cuando se mueve
      this.particles.setVisible(true);
      
      // Rotación sutil basada en dirección
      const angle = Math.atan2(inputVector.y, inputVector.x);
      this.sprite.setRotation(angle + Math.PI / 2);
    } else if (!this.isAttacking && !this.isDashing) {
      // Desactivar partículas cuando está quieto
      this.particles.setVisible(false);
    }
    
    // Efecto de pulsación sutil
    const time = this.scene.time.now * 0.003;
    const baseScale = this.isAttacking ? 1.2 : (this.isDashing ? 0.8 : 1);
    const scale = baseScale + Math.sin(time) * 0.05;
    this.sprite.setScale(scale);
    
    // Actualizar invulnerabilidad
    if (this.isInvulnerable && this.scene.time.now - this.lastDamageTime > this.invulnerabilityDuration) {
      this.isInvulnerable = false;
    }
    
    // Efecto de parpadeo durante invulnerabilidad
    if (this.isInvulnerable) {
      const flash = Math.floor((this.scene.time.now - this.lastDamageTime) / 100) % 2;
      this.sprite.setAlpha(flash === 0 ? 0.5 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  public attack(targetX: number, targetY: number, enemies: Enemy[]) {
    if (this.attackCooldown > 0 || this.isAttacking) return;

    this.isAttacking = true;
    this.attackCooldown = 500; // 500ms cooldown

    // Calcular dirección del ataque
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      // Posicionar efecto de ataque
      const attackX = this.sprite.x + normalizedX * (this.attackRange * 0.6);
      const attackY = this.sprite.y + normalizedY * (this.attackRange * 0.6);
      
      this.attackEffect.setPosition(attackX, attackY);
      this.attackEffect.setVisible(true);
      this.attackEffect.setAlpha(0.7);
      
      // Animar el efecto de ataque
      this.scene.tweens.add({
        targets: this.attackEffect,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          this.attackEffect.setVisible(false);
          this.attackEffect.setScale(1);
          this.isAttacking = false;
        }
      });
      
      // Pequeño impulso hacia adelante durante el ataque
      this.sprite.setVelocity(normalizedX * 100, normalizedY * 100);
      
      // Rotar hacia la dirección del ataque
      const angle = Math.atan2(dy, dx);
      this.sprite.setRotation(angle + Math.PI / 2);
      
      // Verificar si golpeamos algún enemigo
      this.checkEnemyHit(attackX, attackY, enemies);
    }
  }

  private checkEnemyHit(attackX: number, attackY: number, enemies: Enemy[]) {
    enemies.forEach(enemy => {
      if (!enemy.isEnemyAlive()) return;
      
      const distance = Phaser.Math.Distance.Between(
        attackX, attackY,
        enemy.getSprite().x, enemy.getSprite().y
      );
      
      if (distance <= this.attackRange) {
        enemy.takeDamage(1);
      }
    });
  }
  public dash(movementVector: { x: number; y: number }) {
    if (this.dashCooldown > 0 || this.isDashing || (movementVector.x === 0 && movementVector.y === 0)) return;

    this.isDashing = true;
    this.dashCooldown = 1000; // 1 segundo de cooldown

    // Activar efecto de partículas
    this.dashEffect.setPosition(this.sprite.x, this.sprite.y);
    this.dashEffect.start();

    // Aplicar impulso de dash
    const dashForce = 400;
    this.sprite.setVelocity(
      movementVector.x * dashForce,
      movementVector.y * dashForce
    );

    // Efecto visual de dash
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.isDashing = false;
        this.dashEffect.stop();
      }
    });
  }

  public getAttackCooldownPercent(): number {
    return Math.max(0, this.attackCooldown / 500);
  }

  public getDashCooldownPercent(): number {
    return Math.max(0, this.dashCooldown / 1000);
  }

  public takeDamage(damage: number = 1): boolean {
    if (this.isInvulnerable || this.isDead) return false;
    
    this.health -= damage;
    this.lastDamageTime = this.scene.time.now;
    this.isInvulnerable = true;
    
    // Efecto visual de daño
    this.scene.cameras.main.shake(200, 0.02);
    
    // Efecto de knockback
    const knockbackForce = 200;
    const angle = Math.random() * Math.PI * 2;
    this.sprite.setVelocity(
      Math.cos(angle) * knockbackForce,
      Math.sin(angle) * knockbackForce
    );
    
    if (this.health <= 0) {
      this.die();
      return true; // Jugador murió
    }
    
    return false; // Jugador sigue vivo
  }

  private die() {
    this.isDead = true;
    
    // Efecto de muerte
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 500,
      ease: 'Power2'
    });
    
    // Efecto de partículas de muerte
    const deathEffect = this.scene.add.particles(this.sprite.x, this.sprite.y, 'player', {
      scale: { start: 0.5, end: 0 },
      speed: { min: 100, max: 200 },
      lifespan: 1000,
      quantity: 15,
      tint: 0xff4444,
      alpha: { start: 1, end: 0 }
    });
    
    this.scene.time.delayedCall(1000, () => {
      deathEffect.destroy();
    });
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }

  public reset(x: number, y: number) {
    this.health = this.maxHealth;
    this.isDead = false;
    this.isInvulnerable = false;
    this.attackCooldown = 0;
    this.dashCooldown = 0;
    this.isAttacking = false;
    this.isDashing = false;
    this.lastDamageTime = 0;
    
    this.sprite.setPosition(x, y);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    this.sprite.setVelocity(0, 0);
    this.sprite.setRotation(0);
    
    // Reactivar partículas si estaban desactivadas
    if (this.particles) {
      this.particles.setVisible(false);
    }
    
    // Asegurar que los efectos estén ocultos
    if (this.attackEffect) {
      this.attackEffect.setVisible(false);
    }
  }
}
