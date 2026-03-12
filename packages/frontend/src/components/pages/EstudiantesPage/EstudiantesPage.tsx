import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../atoms/Button';
import { DataTable, type DataTableColumn } from '../../organisms/DataTable';
import { getStudentsPaginated, deleteStudent, type Student } from '../../../services/studentService';
import { formatDate } from '../../../lib';

const STUDENT_COLUMNS: DataTableColumn<Student>[] = [
  { id: 'code', label: 'Código', sortable: true, value: (r) => r.code, render: (r) => <span className="font-medium text-slate-900">{r.code}</span> },
  { id: 'firstName', label: 'Nombre', sortable: true, value: (r) => r.firstName },
  { id: 'lastName', label: 'Apellidos', sortable: true, value: (r) => r.lastName },
  { id: 'username', label: 'Usuario', sortable: true, value: (r) => r.username ?? '' },
  { id: 'email', label: 'Email', sortable: true, value: (r) => r.email ?? '' },
  { id: 'document', label: 'Documento', sortable: true, value: (r) => r.document },
  { id: 'birthDate', label: 'Fecha de nacimiento', sortable: true, value: (r) => r.birthDate, render: (r) => formatDate(r.birthDate) },
];

export function EstudiantesPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentsPaginated({
        page,
        pageSize,
        sortBy: sortKey ?? undefined,
        sortOrder: sortDir,
      });
      setStudents(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alumnos');
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`¿Eliminar a ${student.firstName} ${student.lastName}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    setDeletingId(student.id);
    try {
      await deleteStudent(student.id);
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (student: Student) => (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => navigate(`/estudiantes/${student.id}/editar`)}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => handleDelete(student)}
        disabled={deletingId === student.id}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
      >
        {deletingId === student.id ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );

  return (
    <MainLayout>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Estudiantes
          </h2>
          <Button type="button" onClick={() => navigate('/estudiantes/registro')}>
            Agregar estudiante
          </Button>
        </div>
        <div className="mt-6">
          <DataTable<Student>
            columns={STUDENT_COLUMNS}
            data={students}
            total={total}
            page={page}
            pageSize={pageSize}
            sortKey={sortKey}
            sortDir={sortDir}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
            loading={loading}
            keyExtractor={(row) => row.id}
            renderActions={renderActions}
            defaultPageSize={10}
            emptyMessage="No hay estudiantes registrados."
          />
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </MainLayout>
  );
}
