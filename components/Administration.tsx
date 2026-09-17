import React, { useEffect, useState } from 'react';
import Card from './ui/Card';
import { PlusIcon } from './ui/Icons';
import type { UserProfile } from '../lib/api/admin';
import { fetchAllProfiles, updateProfileRole, updateProfileActive, createUser } from '../lib/api/admin';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

const Administration: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [name, setName] = useState('');
  const [role, setRole] = useState('colaborador');
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadProfiles = () => {
    setLoading(true);
    fetchAllProfiles()
      .then(setProfiles)
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email y contraseña son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createUser(email.trim(), password, role, name.trim() || undefined);
      setCreatedInfo({ email: email.trim(), password });
      setCopied(false);
      setEmail('');
      setName('');
      setPassword(generatePassword());
      setRole('colaborador');
      loadProfiles();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
    updateProfileRole(userId, newRole).catch((err) => {
      setError(err.message || String(err));
      loadProfiles();
    });
  };

  const handleToggleActive = (userId: string, active: boolean) => {
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, active } : p)));
    updateProfileActive(userId, active).catch((err) => {
      setError(err.message || String(err));
      loadProfiles();
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Administración</h1>
        <p className="text-gray-400 mt-2 max-w-3xl text-sm">
          Alta de usuarios y gestión de roles. Solo Dirección puede ver y usar esta pantalla.
        </p>
      </div>

      {error && (
        <div className="mb-6 text-red-400 text-sm bg-red-900/20 py-2 px-4 rounded border border-red-900/50">
          {error}
        </div>
      )}

      <Card className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Crear Usuario</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="persona@deltana.es"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña temporal</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-xs font-medium whitespace-nowrap"
              >
                Generar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="colaborador">Colaborador</option>
              <option value="gestor">Gestor</option>
              <option value="direccion">Dirección</option>
              <option value="administracion">Administración</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              <PlusIcon className="w-4 h-4" />
              {submitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>

        {createdInfo && (
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
            <p className="font-bold mb-1">Usuario creado — compartile estos datos para su primer ingreso:</p>
            <p>
              Email: <span className="font-mono text-white">{createdInfo.email}</span>
            </p>
            <p>
              Contraseña: <span className="font-mono text-white">{createdInfo.password}</span>
            </p>
            <p className="text-xs text-emerald-400/80 mt-2 italic">
              Esta contraseña no se guarda en ningún lado ni se puede volver a ver: copiala ahora.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdInfo.email}\nContraseña: ${createdInfo.password}`);
                  setCopied(true);
                }}
                className="text-xs font-bold px-3 py-1.5 rounded bg-emerald-700/50 hover:bg-emerald-700 text-white transition-colors"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={() => setCreatedInfo(null)}
                className="text-xs font-medium px-3 py-1.5 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white mb-4">Usuarios existentes</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-700">
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 px-2">Nombre</th>
                  <th className="py-2 px-2">Rol</th>
                  <th className="py-2 pl-2">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-2 text-white font-mono text-xs">{p.email}</td>
                    <td className="py-2 px-2 text-gray-300">{p.name || '—'}</td>
                    <td className="py-2 px-2">
                      <select
                        value={p.role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="colaborador">Colaborador</option>
                        <option value="gestor">Gestor</option>
                        <option value="direccion">Dirección</option>
                        <option value="administracion">Administración</option>
                      </select>
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => handleToggleActive(p.id, !p.active)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          p.active ? 'bg-green-900/50 text-green-400 hover:bg-green-900' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Administration;
