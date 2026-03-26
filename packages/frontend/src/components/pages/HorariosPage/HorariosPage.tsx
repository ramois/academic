import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../templates/MainLayout';
import { Button } from '../../atoms/Button';
import { DataTable, type DataTableColumn } from '../../organisms/DataTable';
import { getCourses, type Course } from '../../../services/courseService';
import {
  getClassrooms,
  type Classroom,
} from '../../../services/classroomService';
import {
  getSchedules,
  deleteSchedule,
  type Schedule,
} from '../../../services/scheduleService';
import { trackEvent, trackPageView } from '../../../lib/analytics';

type ScheduleRow = Schedule & {
  courseLabel: string;
  classroomLabel: string;
};

const SCHEDULE_COLUMNS: DataTableColumn<ScheduleRow>[] = [
  { id: 'course', label: 'Curso', value: (row) => row.courseLabel },
  { id: 'slot', label: 'Horario', value: (row) => row.slot },
  { id: 'classroom', label: 'Aula', value: (row) => row.classroomLabel },
];

export function HorariosPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseRows, classroomRows, scheduleRows] = await Promise.all([
        getCourses(),
        getClassrooms(),
        getSchedules(),
      ]);
      setCourses(courseRows);
      setClassrooms(classroomRows);
      setSchedules(scheduleRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackPageView('/horarios', 'Listado de horarios');
    void loadData();
  }, []);

  const rows: ScheduleRow[] = schedules.map((schedule) => {
    const course = courses.find((item) => item.id === schedule.courseId);
    const classroom = classrooms.find((item) => item.id === schedule.classroomId);

    return {
      ...schedule,
      courseLabel: course ? `${course.code} - ${course.name}` : schedule.courseId,
      classroomLabel: classroom
        ? `${classroom.code} - ${classroom.building}`
        : 'Sin aula',
    };
  });

  const handleDelete = async (row: ScheduleRow) => {
    if (!window.confirm(`Eliminar el horario "${row.slot}"?`)) return;

    setDeletingId(row.id);
    setError(null);

    try {
      await deleteSchedule(row.id);
      trackEvent('schedule_delete', {
        schedule_id: row.id,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar horario');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MainLayout>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-600 dark:bg-slate-800/95 dark:ring-slate-600/50 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Horarios
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Administra los horarios y el aula asignada a cada curso.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              trackEvent('schedule_create_click');
              navigate('/horarios/registro');
            }}
          >
            Agregar horario
          </Button>
        </div>

        <div className="mt-6">
          <DataTable<ScheduleRow>
            columns={SCHEDULE_COLUMNS}
            data={rows}
            keyExtractor={(row) => row.id}
            defaultPageSize={50}
            emptyMessage="No hay horarios registrados."
            renderActions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('schedule_edit_click', { schedule_id: row.id });
                    navigate(`/horarios/${row.id}/editar`);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(row)}
                  disabled={deletingId === row.id}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
                >
                  {deletingId === row.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Cargando...
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}
      </section>
    </MainLayout>
  );
}
