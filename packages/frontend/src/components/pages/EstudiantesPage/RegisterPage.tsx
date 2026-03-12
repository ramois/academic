import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { createStudent } from '../../../services/studentService';

export function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        document: document.trim(),
        birthDate,
      });
      navigate('/estudiantes', { state: { registered: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 sm:p-10 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Agregar estudiante
        </h2>
        <p className="mt-2 text-slate-600 text-sm">
          Completa el formulario. Se asignará rol de estudiante y usuario. Número de registro automático.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 w-full xl:max-w-[70%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre
              </label>
              <Input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. María"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Apellidos
              </label>
              <Input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. García López"
              />
            </div>
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-slate-700 mb-1.5">
                Documento
              </label>
              <Input
                id="document"
                type="text"
                required
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Ej. C.I., pasaporte..."
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. maria.garcia@correo.com"
              />
            </div>
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                Fecha de nacimiento
              </label>
              <Input
                id="birthDate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="mt-5 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrar alumno'}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/estudiantes')}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
