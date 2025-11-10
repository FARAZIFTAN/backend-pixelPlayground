export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">🎨 PixelPlayground API</h1>
        <p className="text-xl mb-8">Backend is running successfully!</p>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-4">
          <h2 className="text-2xl font-semibold mb-4">Available Endpoints:</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <code className="bg-black/30 px-2 py-1 rounded">POST /api/auth/register</code>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <code className="bg-black/30 px-2 py-1 rounded">POST /api/auth/login</code>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <code className="bg-black/30 px-2 py-1 rounded">GET /api/auth/verify</code>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">🔍</span>
              <code className="bg-black/30 px-2 py-1 rounded">GET /api/health</code>
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Server Information:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 rounded p-3">
              <p className="opacity-70">Backend Port</p>
              <p className="font-mono font-bold">3001</p>
            </div>
            <div className="bg-black/20 rounded p-3">
              <p className="opacity-70">Frontend URL</p>
              <p className="font-mono font-bold text-xs">localhost:5173</p>
            </div>
            <div className="bg-black/20 rounded p-3">
              <p className="opacity-70">Database</p>
              <p className="font-mono font-bold">MongoDB Atlas</p>
            </div>
            <div className="bg-black/20 rounded p-3">
              <p className="opacity-70">Authentication</p>
              <p className="font-mono font-bold">JWT</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/20">
            <a 
              href="/api/health" 
              target="_blank"
              className="inline-block bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-semibold transition"
            >
              🔍 Check Health Status
            </a>
          </div>
        </div>

        <p className="mt-6 text-sm opacity-70">
          Database: <strong>karyaklik</strong> | Collection: <strong>users</strong>
        </p>
      </div>
    </div>
  );
}
