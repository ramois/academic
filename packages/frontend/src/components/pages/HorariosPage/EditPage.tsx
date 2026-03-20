import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../../templates/MainLayout";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { getSchedule, updateSchedule } from "../../../services/scheduleService";
import { getCourses, type Course } from "../../../services/courseService";

export function EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los cursos",
        );
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const schedule = await getSchedule(id);
        setCourseId(schedule.courseId);

        const slotParts = schedule.slot.split(" ");
        const day = slotParts[0];
        const timeParts = slotParts[1]?.split("-") ?? [];

        setDayOfWeek(day);
        setStartTime(timeParts[0] ?? "");
        setEndTime(timeParts[1] ?? "");
      } catch {
        setError("No se pudo cargar el horario");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const validateForm = (): string | null => {
    if (!courseId) return "Selecciona un curso";
    if (!dayOfWeek) return "Selecciona un día de la semana";
    if (!startTime) return "Ingresa la hora de inicio";
    if (!endTime) return "Ingresa la hora de fin";
    if (startTime >= endTime)
      return "La hora de fin debe ser mayor que la hora de inicio";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await updateSchedule(id, {
        courseId: courseId.trim(),
        slot: dayOfWeek.trim() + " " + startTime.trim() + "-" + endTime.trim(),
      });
      navigate("/horarios", { state: { updated: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <MainLayout>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-600 dark:bg-slate-800/95 dark:ring-slate-600/50 sm:p-10 w-full">
          <p className="text-slate-600 dark:text-slate-300">Cargando…</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-600 dark:bg-slate-800/95 dark:ring-slate-600/50 sm:p-10 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Editar horario
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
          Modifica los datos del horario.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 w-full xl:max-w-[70%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label
                htmlFor="course"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Curso
              </label>
              <select
                id="course"
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={coursesLoading}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:hover:border-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              >
                <option value="">
                  {coursesLoading ? "Cargando…" : "Selecciona un curso"}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="dayOfWeek"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Día de la semana
              </label>
              <select
                id="dayOfWeek"
                required
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:hover:border-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
              >
                <option value="">Selecciona un día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hora de inicio
              </label>
              <Input
                id="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hora de fin
              </label>
              <Input
                id="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="mt-5 text-sm text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={loading || coursesLoading}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/horarios")}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
