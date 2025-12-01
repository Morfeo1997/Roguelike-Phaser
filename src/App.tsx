import React from 'react';
import { GameContainer } from './components/GameContainer';
import { Info } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Chrono-Blade Ascent
          </h1>
        </div>
      </header>

      {/* Game Container */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className='border-4 border-gray-500 rounded-sm w-full'>
            <GameContainer width={800} height={600} />
          </div>
          {/* Game Info */}
          <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Características del Juego
                </h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• Movimiento omnidireccional (8 direcciones) con WASD o flechas</li>
                  <li>• Cámara que sigue suavemente al jugador</li>
                  <li>• Sistema de combate: Click izquierdo para atacar hacia el cursor</li>
                  <li>• Sistema de salto: Click derecho para saltar en dirección de movimiento</li>
                  <li>• Enemigos con IA que persiguen al jugador</li>
                  <li>• Sistema de vida: Los enemigos requieren 2 golpes, el jugador tiene 3 vidas</li>
                  <li>• Daño por contacto: Los enemigos dañan al jugador al tocarlo</li>
                  <li>• Efectos visuales de combate y barras de vida</li>
                  <li>• Mundo expandido con elementos interactivos</li>
                  <li>• Sistema de colisiones con objetos del entorno</li>
                  <li>• Interfaz con indicadores de cooldown</li>
                  <li>• Sistema de Game Over con opción de reinicio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/30 border-t border-slate-700/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400">
          <p>Juego desarrollado con tecnologías modernas web</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
