
import React, { useMemo, useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

const montserrat: React.CSSProperties = { fontFamily: '"Montserrat", sans-serif' };

const HERO_IMAGES = ['/images/login/hero-1.jpg', '/images/login/hero-2.jpg', '/images/login/hero-3.jpg', '/images/login/hero-4.jpg'];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pick once per mount so it doesn't shuffle on every re-render/keystroke.
  const heroImage = useMemo(() => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)], []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const errorMessage = await onLogin(email, password);
    setSubmitting(false);
    if (errorMessage) {
      setError(errorMessage);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Branding panel — construction imagery, Deltana-style hero */}
      <div
        className="hidden md:flex md:w-1/2 relative flex-col justify-end p-12 text-white"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0.88)), url('${heroImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mb-8 bg-white/95 rounded-lg px-4 py-3 inline-block w-fit shadow-lg">
          <img src="/images/logo-deltana.png" alt="Deltana Engineering" className="h-9" />
        </div>
        <h2 className="text-3xl font-extrabold leading-tight max-w-md" style={montserrat}>
          Enfoque global y una metodología única para cada proyecto.
        </h2>
        <p className="text-gray-300 mt-4 max-w-sm text-sm">
          Gestión de proyectos, equipos y rentabilidad para nuestro estudio de ingeniería y arquitectura.
        </p>
      </div>

      {/* Login form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm">
          <div className="mb-10 md:hidden text-center">
            <img src="/images/logo-deltana.png" alt="Deltana Engineering" className="h-10 mx-auto mb-2" />
          </div>

          <div className="hidden md:block mb-8">
            <img src="/images/logo-deltana.png" alt="Deltana Engineering" className="h-8 mb-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={montserrat}>
            Acceso al sistema
          </h1>
          <p className="text-gray-500 text-sm mb-8">Ingresá con tu cuenta para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FBA628] focus:border-[#FBA628] outline-none transition-all"
                placeholder="tu@deltana.es"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FBA628] focus:border-[#FBA628] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FBA628] hover:bg-[#e9971f] text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
              style={montserrat}
            >
              {submitting ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-10">
            &copy; {new Date().getFullYear()} Deltana Engineering. Acceso restringido al personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
