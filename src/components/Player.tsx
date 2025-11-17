import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { RangedEnemy } from './RangedEnemy';

export class Player {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private moveSpeed: number = 200;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private attackRange: number = 70;
  private isAttacking: boolean = false;
  private isDashing: boolean = false;
  private attackCooldown: number = 0;
  private dashCooldown: number = 0;
  private attackEffect!: Phaser.GameObjects.Arc;
  private dashEffect!: Phaser.GameObjects.Particles.ParticleEmitter;
  private health: number = 3;
  private maxHealth: number = 3;
  private isInvulnerable: boolean = false;
  private invulnerabilityDuration: number = 1000;
  private lastDamageTime: number = 0;
  private isDead: boolean = false;
  private attackSound!: Phaser.Sound.BaseSound;
  private damageSound!: Phaser.Sound.BaseSound;
  private jumpSound!: Phaser.Sound.BaseSound;
  private attackAnimationFrames: string[] = [
  'player-attack-1',
  'player-attack-2', 
  'player-attack-3'
  ];
  private currentAttackFrame: number = 0;
  private attackAnimationSpeed: number = 50;
  private walkAnimationSpeed: number = 200; // Tiempo entre cambios (200ms)
  private walkAnimationTimer?: Phaser.Time.TimerEvent;
  private isWalking: boolean = false;
  private isWalkFrameAlternate: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite del jugador usando la imagen cargada
    this.sprite = this.scene.physics.add.sprite(x, y, 'player-sprite');

    this.attackSound = this.scene.sound.add('player-attack-sound', { volume: 0.5 });
    this.damageSound = this.scene.sound.add('player-damage-sound', { volume: 0.6 });
    this.jumpSound = this.scene.sound.add('player-jump-sound', { volume: 0.4 });
    this.sprite.setCollideWorldBounds(true);
    
    // Ajustar tamaño de colisión y visual
    this.sprite.setSize(24, 24);
    this.sprite.setDisplaySize(32, 32); // Ajusta según el tamaño que quieras mostrar
    
    // Configurar física
    this.sprite.setDrag(400);
    this.sprite.setMaxVelocity(this.moveSpeed);
    
    // Crear efectos de partículas
    this.createParticleEffect();
    
    // Crear efectos de ataque y dash
    this.createAttackEffect();
    this.createDashEffect();
  }

  

  private createParticleEffect() {
    // Para las partículas, usamos la misma textura del jugador
    const particles = this.scene.add.particles(0, 0, 'player-sprite', {
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
    this.attackEffect = this.scene.add.circle(0, 0, this.attackRange, 0xff4444, 0);
    this.attackEffect.setStrokeStyle(3, 0xff6666, 0);
    this.attackEffect.setVisible(false);
  }

  private createDashEffect() {
    this.dashEffect = this.scene.add.particles(0, 0, 'player-sprite', {
      scale: { start: 0.1, end: 0 },
      speed: { min: 300, max: 400 },
      lifespan: 300,
      quantity: 3,
      tint: 0x00ff88,
      alpha: { start: 0.5, end: 0 },
      emitting: false
    });
  }

  public increaseMaxHealth(amount: number) {
  this.maxHealth += amount;
  this.health += amount; // También aumentar la vida actual
  
  // Efecto visual
  this.scene.cameras.main.flash(200, 255, 100, 100, false);
  }

  public healToMax() {
    this.health = this.maxHealth;
    
    // Efecto visual de curación
    this.scene.cameras.main.flash(300, 255, 215, 0, false);
    
    // Efecto de partículas curativas
    const healEffect = this.scene.add.particles(
      this.sprite.x,
      this.sprite.y,
      'player-sprite',
      {
        scale: { start: 0.3, end: 0 },
        speed: { min: 50, max: 100 },
        lifespan: 800,
        quantity: 15,
        tint: 0xffd700,
        alpha: { start: 1, end: 0 }
      }
    );
    
    this.scene.time.delayedCall(800, () => {
      healEffect.destroy();
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

    const isMoving = (inputVector.x !== 0 || inputVector.y !== 0);
    // Aplicar movimiento
    if (isMoving && !this.isAttacking && !this.isDashing) {
    this.sprite.setVelocity(
      inputVector.x * this.moveSpeed,
      inputVector.y * this.moveSpeed
    );
      
      // Activar partículas cuando se mueve
      this.particles.setVisible(true);
      
      // Voltear el sprite según la dirección horizontal
      if (inputVector.x > 0) {
        this.sprite.setFlipX(false);
      } else if (inputVector.x < 0) {
        this.sprite.setFlipX(true);
      }

    if (!this.isWalking) {
      this.startWalkAnimation();
    }
      
    } else if (!this.isAttacking && !this.isDashing) {
      // Desactivar partículas cuando está quieto
      this.particles.setVisible(false);
      if (this.isWalking) {
      this.stopWalkAnimation();
      }
    }
    
    // Efecto de escala durante estados especiales
    if (this.isAttacking) {
      this.sprite.setScale(1.1);
    } else if (this.isDashing) {
      this.sprite.setScale(0.9);
    } else {
      // Efecto de pulsación sutil solo cuando no está en acción
      const time = this.scene.time.now * 0.003;
      const scale = 1 + Math.sin(time) * 0.03;
      this.sprite.setScale(scale);
    }
    
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

  private startWalkAnimation() {
  this.isWalking = true;
  this.isWalkFrameAlternate = false;
  
  // Detener cualquier animación previa
  if (this.walkAnimationTimer) {
    this.walkAnimationTimer.remove();
  }
  
  // Crear timer que alterna entre los dos sprites
  this.walkAnimationTimer = this.scene.time.addEvent({
    delay: this.walkAnimationSpeed,
    callback: this.toggleWalkFrame,
    callbackScope: this,
    loop: true
  });
  
  // Mostrar sprite base inicialmente
  this.sprite.setTexture('player-sprite');
}

private toggleWalkFrame() {
  if (!this.isWalking) return;
  
  // Alternar entre sprite base y sprite de movimiento
  if (this.isWalkFrameAlternate) {
    this.sprite.setTexture('player-sprite');
  } else {
    this.sprite.setTexture('player-walk');
  }
  
  // Cambiar el estado
  this.isWalkFrameAlternate = !this.isWalkFrameAlternate;
}

private stopWalkAnimation() {
  this.isWalking = false;
  
  // Detener el timer
  if (this.walkAnimationTimer) {
    this.walkAnimationTimer.remove();
    this.walkAnimationTimer = undefined;
  }
  
  // Volver al sprite base
  this.sprite.setTexture('player-sprite');
  this.isWalkFrameAlternate = false;
}

  public attack(targetX: number, targetY: number, enemies: Enemy[], rangedEnemies: RangedEnemy[] = []) {
    if (this.attackCooldown > 0 || this.isAttacking) return;

    this.isAttacking = true;
    this.attackCooldown = 500;
    if (this.isWalking) {
    this.stopWalkAnimation();
    }
    this.attackSound.play();

    // Calcular dirección del ataque
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      // Voltear sprite según dirección del ataque
      if (dx > 0) {
        this.sprite.setFlipX(false);
      } else if (dx < 0) {
        this.sprite.setFlipX(true);
      }

      this.playAttackAnimation();
      
      // Posicionar efecto de ataque
      const attackX = this.sprite.x + normalizedX * (this.attackRange * 0.1);
      const attackY = this.sprite.y + normalizedY * (this.attackRange * 0.1);
      
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
          this.sprite.setTexture('player-sprite');
        }
      });
      
      // Pequeño impulso hacia adelante durante el ataque
      this.sprite.setVelocity(normalizedX * 100, normalizedY * 100);
      
      // Verificar si golpeamos algún enemigo
      this.checkEnemyHit(attackX, attackY, enemies, rangedEnemies);
    }
  }

  private playAttackAnimation() {
  this.currentAttackFrame = 0;
  
  // Crear intervalo para cambiar frames
  const animateAttack = () => {
    if (this.currentAttackFrame < this.attackAnimationFrames.length) {
      // Cambiar al siguiente frame
      this.sprite.setTexture(this.attackAnimationFrames[this.currentAttackFrame]);
      this.currentAttackFrame++;
      
      // Programar siguiente frame
      this.scene.time.delayedCall(this.attackAnimationSpeed, animateAttack);
    } else {
      // Animación completada, volver al sprite original
      this.sprite.setTexture('player-sprite');
    }
  };
  
  // Iniciar animación
  animateAttack();
}




  private checkEnemyHit(attackX: number, attackY: number, enemies: Enemy[], rangedEnemies: RangedEnemy[] = []) {
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
    rangedEnemies.forEach(rangedEnemy => {
      if (!rangedEnemy.isEnemyAlive()) return;
      
      const distance = Phaser.Math.Distance.Between(
        attackX, attackY,
        rangedEnemy.getSprite().x, rangedEnemy.getSprite().y
      );
      
      if (distance <= this.attackRange) {
        rangedEnemy.takeDamage(1);
      }
    });
  }

  public dash(movementVector: { x: number; y: number }) {
    if (this.dashCooldown > 0 || this.isDashing || (movementVector.x === 0 && movementVector.y === 0)) return;

    this.isDashing = true;
    this.dashCooldown = 1000;

    if (this.isWalking) {
    this.stopWalkAnimation();
    }
    this.jumpSound.play();



    // Activar efecto de partículas
    this.dashEffect.setPosition(this.sprite.x, this.sprite.y);
    this.dashEffect.start();

    // Aplicar impulso de dash
    const dashForce = 800;
    this.sprite.setVelocity(
      movementVector.x * dashForce,
      movementVector.y * dashForce
    );

    // Voltear sprite según dirección del dash
    if (movementVector.x > 0) {
      this.sprite.setFlipX(false);
    } else if (movementVector.x < 0) {
      this.sprite.setFlipX(true);
    }

    // Efecto visual de dash
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.6,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.isDashing = false;
        this.dashEffect.stop();
      }
    });
  }

  // ... resto de métodos sin cambios
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
    this.damageSound.play();
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
      return true;
    }
    
    return false;
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
    const deathEffect = this.scene.add.particles(this.sprite.x, this.sprite.y, 'player-sprite', {
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

    if (this.isWalking) {
    this.stopWalkAnimation();
    }
    
    this.sprite.setPosition(x, y);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    this.sprite.setVelocity(0, 0);
    this.sprite.setFlipX(false);
    
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