import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'Admin123!';

function uniqueSuffix(): string {
  return `${randomBytes(4).toString('hex')}`;
}

function randomDate(startYear: number, endYear: number): string {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomStudentData() {
  const suffix = uniqueSuffix();
  return {
    nombre: `Nombre-${suffix}`,
    apellidos: `Apellidos ${suffix}`,
    documento: `DOC-${suffix}`,
    email: `e2e-${suffix}@test.com`,
    fechaNacimiento: randomDate(1990, 2005),
  };
}

test.describe('Creación de estudiante (e2e)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await page.getByLabel(/usuario/i).fill(ADMIN_USER);
    await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('flujo completo: ir a registro, rellenar formulario, enviar y ver estudiante en la lista', async ({
    page,
  }) => {
    const { nombre, apellidos, documento, email, fechaNacimiento } = randomStudentData();

    await page.goto('/estudiantes');
    await expect(page.getByRole('heading', { name: /estudiantes/i })).toBeVisible();
    await page.getByRole('button', { name: /agregar estudiante/i }).click();
    await expect(page).toHaveURL(/\/estudiantes\/registro/);
    await expect(page.getByRole('heading', { name: /agregar estudiante/i })).toBeVisible();

    await page.getByLabel(/^nombre$/i).fill(nombre);
    await page.getByLabel(/apellidos/i).fill(apellidos);
    await page.getByLabel(/documento/i).fill(documento);
    await page.getByLabel(/correo electrónico/i).fill(email);
    await page.getByLabel(/fecha de nacimiento/i).fill(fechaNacimiento);

    await page.getByRole('button', { name: /registrar alumno/i }).click();

    await expect(page).toHaveURL(/\/estudiantes$/);
    await expect(page.getByRole('heading', { name: /estudiantes/i })).toBeVisible();

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('cell', { name: nombre, exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: apellidos, exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: documento, exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: email, exact: true })).toBeVisible();
  });

  test('validación: no permite enviar sin campos obligatorios', async ({ page }) => {
    await page.goto('/estudiantes/registro');
    await expect(page.getByRole('heading', { name: /agregar estudiante/i })).toBeVisible();

    await page.getByRole('button', { name: /registrar alumno/i }).click();
    await expect(page).toHaveURL(/\/estudiantes\/registro/);
    await expect(page.getByLabel(/^nombre$/i)).toHaveAttribute('required', '');
  });

  test('cancelar vuelve a la lista sin crear estudiante', async ({ page }) => {
    await page.goto('/estudiantes/registro');
    await page.getByLabel(/^nombre$/i).fill('No');
    await page.getByLabel(/apellidos/i).fill('Guardar');
    await page.getByLabel(/documento/i).fill('X');
    await page.getByLabel(/fecha de nacimiento/i).fill('1999-01-01');

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page).toHaveURL(/\/estudiantes$/);
    await expect(page.getByRole('heading', { name: /estudiantes/i })).toBeVisible();
  });
});
