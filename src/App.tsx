import { GameContainer } from './components/GameContainer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Game Container */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <GameContainer width={800} height={600} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/30 border-t border-slate-700/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400">
          <p className='text-lg'>Juego desarrollado por <a href='https://gaston-gomez1997.netlify.app/' target='_blank'  className='text-xl font-bold text-blue-700 hover:text-blue-500 transition-colors duration-300 '>Gastón Gómez</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
