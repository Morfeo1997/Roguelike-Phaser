import Phaser from 'phaser';

export class Projectile {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private speed: number = 150;
  private damage: number = 1;
  private lifetime: number = 3000; // 3 segundos antes de destruirse
  private creationTime: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    damage: number = 1
  ) {
    this.scene = scene;
    this.damage = damage;
    this.creationTime = scene.time.now;
    this.create(x, y, targetX, targetY);
  }

  private create(x: number, y: number, targetX: number, targetY: number) {
    // Crear sprite del proyectil (usamos un círculo si no tienes sprite)
    this.sprite = this.scene.physics.add.sprite(x, y, 'projectile-sprite');
    this.sprite.setDisplaySize(12, 12);
    this.sprite.setSize(12, 12);
    
    // Calcular dirección hacia el objetivo
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      // Establecer velocidad en dirección al objetivo
      this.sprite.setVelocity(
        normalizedX * this.speed,
        normalizedY * this.speed
      );
      
      // Rotar el sprite para que apunte en la dirección del movimiento
      const angle = Math.atan2(dy, dx);
      this.sprite.setRotation(angle);
    }
    
    // Agregar efecto visual de trail
    this.createTrailEffect();
    
    // Guardar referencia en el sprite
    this.sprite.setData('projectile', this);
  }

  private createTrailEffect() {
    // Efecto de partículas que sigue al proyectil
    const trail = this.scene.add.particles(0, 0, 'projectile-sprite', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: 10,
      lifespan: 200,
      quantity: 1,
      tint: 0xff6666
    });
    
    trail.startFollow(this.sprite);
    this.sprite.setData('trail', trail);
  }

  public update(): boolean {
    // Verificar si el proyectil debe ser destruido por tiempo
    if (this.scene.time.now - this.creationTime > this.lifetime) {
      this.destroy();
      return true; // Indica que debe ser removido
    }
    
    // Efecto de pulsación
    const time = this.scene.time.now * 0.01;
    const scale = 1 + Math.sin(time) * 0.2;
    this.sprite.setScale(scale);
    
    return false;
  }

  public getDamage(): number {
    return this.damage;
  }

  public hitTarget() {
    // Efecto visual al impactar
    const hitEffect = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      20,
      0xff4444,
      0.6
    );
    
    this.scene.tweens.add({
      targets: hitEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        hitEffect.destroy();
      }
    });
    
    this.destroy();
  }

  public destroy() {
    // Destruir trail si existe
    const trail = this.sprite.getData('trail');
    if (trail) {
      trail.destroy();
    }
    
    if (this.sprite) {
      this.sprite.destroy();
    }
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
}
