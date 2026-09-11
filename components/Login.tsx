
import React, { useState } from 'react';
import { LogoIcon } from './ui/Icons';
import Card from './ui/Card';

interface LoginProps {
  onLogin: (password: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-800 mb-4 border border-gray-700 shadow-xl shadow-sky-900/20">
                <LogoIcon className="h-10 w-10 text-sky-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Deltana PM</h1>
            <p className="text-gray-500 mt-2 text-sm">Acceso restringido al sistema de gestión</p>
        </div>

        <Card className="bg-gray-800/50 border border-gray-700 shadow-2xl backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña de acceso</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError(false);
                        }}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-center tracking-widest"
                        placeholder="••••••••"
                        autoFocus
                    />
                </div>
                
                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded border border-red-900/50 animate-pulse">
                        Contraseña incorrecta
                    </div>
                )}

                <button 
                    type="submit" 
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-sky-900/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Entrar
                </button>
            </form>
        </Card>
        
        <p className="text-center text-gray-600 text-xs mt-8">
            &copy; {new Date().getFullYear()} Deltana PM System. Solo personal autorizado.
        </p>
      </div>
    </div>
  );
};

export default Login;
