import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    
  }

  create() {
    // Fondo con efecto similar al juego
    this.cameras.main.setBackgroundColor('#1a202c');
    
    // Título del juego
    const title = this.add.text(
      this.cameras.main.width / 2,
      150,
      'Roguelike en Phaser',
      {
        fontSize: '48px',
        color: '#fbbf24',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    title.setOrigin(0.5);
    title.setStroke('#92400e', 6);
    
    // Botón de jugar
    const playButton = this.add.rectangle(
      this.cameras.main.width / 2,
      300,
      200,
      60,
      0x3b82f6
    );
    playButton.setInteractive({ useHandCursor: true });
    
    const playText = this.add.text(
      this.cameras.main.width / 2,
      300,
      'JUGAR',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    playText.setOrigin(0.5);
    
    // Efectos hover
    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x2563eb);
    });
    
    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x3b82f6);
    });
    
    // Iniciar juego al hacer clic
    playButton.on('pointerdown', () => {
      this.scene.stop('MenuScene');
      // CAMBIADO: Usar restart para reiniciar completamente
      if (this.scene.get('GameScene')) {
        this.scene.start('GameScene'); // Esto reinicia la escena desde cero
      }
    });
    
    // Instrucciones
    const instructions = this.add.text(
      this.cameras.main.width / 2,
      450,
      'WASD - Mover\nClick Izq - Atacar\nClick Der - Saltar',
      {
        fontSize: '16px',
        color: '#cbd5e1',
        align: 'center'
      }
    );
    instructions.setOrigin(0.5);
  }
}
