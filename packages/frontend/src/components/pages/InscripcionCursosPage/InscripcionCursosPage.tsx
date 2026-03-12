import { MainLayout } from '../../templates/MainLayout';

export function InscripcionCursosPage() {
  return (
    <MainLayout>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 sm:p-10 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Inscripción
        </h2>
        <p className="mt-3 text-slate-600">Inscríbete a los cursos disponibles.</p>
      </div>
    </MainLayout>
  );
}
