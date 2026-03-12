import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { login } from '../../../services/authService';
import { useAuthStore, type Role } from '../../../stores';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Usuario y contraseña son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username, password);
      setAuth(
        {
          id: result.user.id,
          name: result.user.username,
          email: result.user.email,
          role: result.user.role as Role,
        },
        result.access_token,
      );
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 sm:p-10 max-w-md mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-slate-600 text-sm">
          Usuario administrador: <strong>admin</strong> / <strong>Admin123!</strong><br />
          Usuario alumno: <strong>jperez</strong> / <strong>Alumno123!</strong><br />
          Contraseña de nuevos alumnos: <strong>TempStudent1!</strong>
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Usuario
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
