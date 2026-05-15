import Phaser from 'phaser';

export class OgreEnemy {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private moveSpeed: number = 50; // Lento pero implacable
  private health: number = 8;
  private maxHealth: number = 8;
  private isAlive: boolean = true;
  private lastDamageTime: number = 0;
  private damageFlashDuration: number = 200;
  private healthBar!: Phaser.GameObjects.Graphics;
  private damageSound!: Phaser.Sound.BaseSound;
  private attackSound!: Phaser.Sound.BaseSound;
  private detectionRange: number = 400;
  private attackRange: number = 80; // Más del doble del rango normal (35)
  private attackDamage: number = 3; // 3 corazones de golpe
  private attackCooldown: number = 2000; // 2 segundos entre ataques
  private lastAttackTime: number = 0;
  private isAttacking: boolean = false;
  private attackEffect!: Phaser.GameObjects.Arc;
  private knockbackForce: number = 400; // Knockback muy fuerte

  constructor(scene: Phaser.Scene, x: number, y: number, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite del ogro (más grande que otros enemigos)
    this.sprite = this.scene.physics.add.sprite(x, y, 'enemy-ogre-sprite');
    this.sprite.setSize(32, 32);
    this.sprite.setDisplaySize(40, 40); // Visualmente más grande
    this.damageSound = this.scene.sound.add('enemy-damage-sound', { volume: 0.5 });
    this.attackSound = this.scene.sound.add('player-attack-sound', { volume: 0.6 }); // Sonido más grave
    
    // Configurar física - es pesado y difícil de mover
    this.sprite.setDrag(400);
    this.sprite.setMaxVelocity(this.moveSpeed);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0.1); // Casi no rebota
    this.sprite.setMass(3); // Más pesado que otros enemigos
    
    // Crear barra de vida
    this.createHealthBar();
    
    // Crear efecto de ataque
    this.createAttackEffect();
    
    // Almacenar referencia en el sprite
    this.sprite.setData('ogreEnemy', this);
  }

  private createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private createAttackEffect() {
    this.attackEffect = this.scene.add.circle(0, 0, this.attackRange, 0xff4444, 0);
    this.attackEffect.setStrokeStyle(4, 0xff0000, 0);
    this.attackEffect.setVisible(false);
  }

  private updateHealthBar() {
    this.healthBar.clear();
    
    if (!this.isAlive) return;
    
    const barWidth = 40;
    const barHeight = 5;
    const x = this.sprite.x - barWidth / 2;
    const y = this.sprite.y - 28;
    
    // Fondo de la barra (más grueso)
    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRect(x, y, barWidth, barHeight);
    
    // Barra de vida
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.6 ? 0x10b981 : (healthPercent > 0.3 ? 0xf59e0b : 0xef4444);
    
    this.healthBar.fillStyle(healthColor, 0.9);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Borde más visible
    this.healthBar.lineStyle(2, 0xffffff, 0.5);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
    
    // Indicador de ataque (barra roja debajo cuando está en cooldown)
    if (this.scene.time.now - this.lastAttackTime < this.attackCooldown) {
      const attackBarY = y + 7;
      const attackProgress = (this.scene.time.now - this.lastAttackTime) / this.attackCooldown;
      
      this.healthBar.fillStyle(0xff4444, 0.7);
      this.healthBar.fillRect(x, attackBarY, barWidth * attackProgress, 3);
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
      
      // Si no está atacando, moverse hacia el jugador
      if (!this.isAttacking) {
        if (distanceToPlayer > this.attackRange - 10) {
          // Acercarse al jugador
          this.moveTowardsPlayer();
        } else {
          // Está en rango de ataque, detenerse y atacar
          this.sprite.setVelocity(0, 0);
          this.tryAttack();
        }
      }
      
      // Apuntar hacia el jugador
      this.facePlayer();
    } else {
      // Detenerse si el jugador está lejos
      if (!this.isAttacking) {
        this.sprite.setVelocity(0, 0);
      }
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
    
    // Efecto de pulsación más lento y sutil (es pesado)
    if (!this.isAttacking) {
      const time = this.scene.time.now * 0.002;
      const scale = 1 + Math.sin(time) * 0.05;
      this.sprite.setScale(scale);
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

  private facePlayer() {
    const dx = this.player.x - this.sprite.x;
    
    // Voltear sprite según dirección
    if (dx > 0) {
      this.sprite.setFlipX(false);
    } else if (dx < 0) {
      this.sprite.setFlipX(true);
    }
  }

  private tryAttack() {
    const currentTime = this.scene.time.now;
    
    // Verificar si puede atacar
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    // Verificar si el jugador está en rango
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.player.x, this.player.y
    );
    
    if (distanceToPlayer <= this.attackRange) {
      this.performAttack();
    }
  }

  private performAttack() {
    this.isAttacking = true;
    this.lastAttackTime = this.scene.time.now;
    this.attackSound.play();
    
    // Calcular dirección hacia el jugador
    const dx = this.player.x - this.sprite.x;
    const dy = this.player.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      // Posicionar efecto de ataque
      const attackX = this.sprite.x + normalizedX * (this.attackRange * 0.5);
      const attackY = this.sprite.y + normalizedY * (this.attackRange * 0.5);
      
      this.attackEffect.setPosition(attackX, attackY);
      this.attackEffect.setVisible(true);
      this.attackEffect.setAlpha(0.8);
      
      // Animación de preparación del ataque (sprite se agranda)
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          // Ejecutar el ataque
          this.executeAttack(attackX, attackY, normalizedX, normalizedY);
        }
      });
      
      // Animar el efecto de ataque
      this.scene.tweens.add({
        targets: this.attackEffect,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.attackEffect.setVisible(false);
          this.attackEffect.setScale(1);
        }
      });
    }
  }

  private executeAttack(attackX: number, attackY: number, dirX: number, dirY: number) {
    // Verificar si golpea al jugador
    const distanceToPlayer = Phaser.Math.Distance.Between(
      attackX, attackY,
      this.player.x, this.player.y
    );
    
    if (distanceToPlayer <= this.attackRange) {
      const playerData = this.player.getData('player');
      if (playerData && typeof playerData.takeDamage === 'function') {
        // Aplicar daño
        playerData.takeDamage(this.attackDamage);
        
        // Aplicar knockback MUY fuerte
        this.player.setVelocity(
          dirX * this.knockbackForce,
          dirY * this.knockbackForce
        );
        
        // Efecto visual de impacto
        this.scene.cameras.main.shake(300, 0.03);
        
        // Efecto de partículas de impacto
        const impactEffect = this.scene.add.particles(
          this.player.x,
          this.player.y,
          'enemy-ogre-sprite',
          {
            scale: { start: 0.3, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 400,
            quantity: 8,
            tint: 0xff4444,
            alpha: { start: 1, end: 0 }
          }
        );
        
        this.scene.time.delayedCall(400, () => {
          impactEffect.destroy();
        });
      }
    }
    
    // Pequeño avance del ogro durante el ataque
    this.sprite.setVelocity(dirX * 80, dirY * 80);
    
    // Terminar estado de ataque
    this.scene.time.delayedCall(500, () => {
      this.isAttacking = false;
    });
  }

  public takeDamage(damage: number = 1): boolean {
    if (!this.isAlive) return false;
    this.damageSound.play();
    
    this.health -= damage;
    this.lastDamageTime = this.scene.time.now;
    
    // Efecto de knockback REDUCIDO (es muy pesado)
    const dx = this.sprite.x - this.player.x;
    const dy = this.sprite.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const knockbackForce = 80; // Mucho menos knockback que enemigos normales
      
      this.sprite.setVelocity(
        normalizedX * knockbackForce,
        normalizedY * knockbackForce
      );
    }
    
    // Efecto visual de rabia al ser golpeado
    const rageEffect = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y - 20,
      10,
      0xff0000,
      0.8
    );
    
    this.scene.tweens.add({
      targets: rageEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        rageEffect.destroy();
      }
    });
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }

  private die() {
    this.isAlive = false;
    
    // Efecto de muerte épico
    this.scene.cameras.main.shake(400, 0.02);
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: 360,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Efecto de partículas de muerte (rojo intenso)
    const deathEffect = this.scene.add.particles(
      this.sprite.x, 
      this.sprite.y, 
      'enemy-ogre-sprite',
      {
        scale: { start: 0.5, end: 0 },
        speed: { min: 80, max: 180 },
        lifespan: 800,
        quantity: 15,
        tint: 0xff0000,
        alpha: { start: 1, end: 0 }
      }
    );
    
    // Ondas de choque al morir
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const shockwave = this.scene.add.circle(
          this.sprite.x,
          this.sprite.y,
          20,
          0xff4444,
          0.4
        );
        
        this.scene.tweens.add({
          targets: shockwave,
          scaleX: 4,
          scaleY: 4,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            shockwave.destroy();
          }
        });
      });
    }
    
    this.scene.time.delayedCall(800, () => {
      deathEffect.destroy();
    });
  }

  public destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.attackEffect) {
      this.attackEffect.destroy();
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
