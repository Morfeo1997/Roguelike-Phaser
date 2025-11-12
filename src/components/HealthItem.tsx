import Phaser from 'phaser';

export class HealthItem {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private type: 'red' | 'golden';
  private isCollected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'red' | 'golden') {
    this.scene = scene;
    this.type = type;
    this.create(x, y);
  }

  private create(x: number, y: number) {
    // Crear sprite según el tipo
    const texture = this.type === 'red' ? 'heart-red' : 'heart-golden';
    this.sprite = this.scene.physics.add.sprite(x, y, texture);
    this.sprite.setDisplaySize(24, 24);
    this.sprite.setSize(20, 20);
    
    // Guardar referencia
    this.sprite.setData('healthItem', this);
    
    // Efecto de flotación
    this.createFloatingEffect();
    
    // Efecto de brillo/pulsación
    this.createGlowEffect();
    
    // Partículas
    this.createParticleEffect();
  }

  private createFloatingEffect() {
    // Movimiento de flotación arriba y abajo
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createGlowEffect() {
    // Efecto de pulsación de escala
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1, to: 1.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Efecto de brillo (alpha)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.8, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createParticleEffect() {
    // Partículas brillantes alrededor del corazón
    const color = this.type === 'red' ? 0xff4444 : 0xffd700;
    const texture = this.type === 'red' ? 'heart-red' : 'heart-golden';
    
    const particles = this.scene.add.particles(0, 0, texture, {
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: 20,
      lifespan: 800,
      frequency: 200,
      quantity: 1,
      tint: color
    });
    
    particles.startFollow(this.sprite);
    this.sprite.setData('particles', particles);
  }

  public collect(): 'red' | 'golden' {
    if (this.isCollected) return this.type;
    
    this.isCollected = true;
    
    // Efecto de recolección
    const particles = this.sprite.getData('particles');
    if (particles) {
      particles.stop();
    }
    
    // Animación de recolección
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.5,
      alpha: 0,
      y: this.sprite.y - 50,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Efecto de partículas de recolección
    const collectEffect = this.scene.add.particles(
      this.sprite.x,
      this.sprite.y,
      this.type === 'red' ? 'heart-red' : 'heart-golden',
      {
        scale: { start: 0.4, end: 0 },
        speed: { min: 50, max: 100 },
        lifespan: 600,
        quantity: 10,
        tint: this.type === 'red' ? 0xff4444 : 0xffd700,
        alpha: { start: 1, end: 0 }
      }
    );
    
    this.scene.time.delayedCall(600, () => {
      collectEffect.destroy();
    });
    
    return this.type;
  }

  public destroy() {
    const particles = this.sprite.getData('particles');
    if (particles) {
      particles.destroy();
    }
    
    if (this.sprite) {
      this.sprite.destroy();
    }
  }

  public isItemCollected(): boolean {
    return this.isCollected;
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
}