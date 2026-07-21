/**
 * Client-side export utilities — no external dependencies.
 * Generates CSV (Excel-compatible) and printable HTML (PDF via browser print).
 */

import type { Employee, Expedient } from '../types';

/* ---------- Excel (CSV) export ---------- */

export function exportEmployeesToExcel(employees: Employee[], expedients: Expedient[], plantaLabel: string) {
  const rows: string[][] = [];
  rows.push([
    'No. Empleado', 'Nombre', 'Primer Apellido', 'Segundo Apellido',
    'CURP', 'RFC', 'NSS', 'Sexo', 'Fecha Nacimiento',
    'Departamento', 'Puesto', 'Planta', 'Turno', 'Estatus',
    'Fecha Ingreso', 'Teléfono', 'Email',
    'Año Último Expediente', 'Fecha Último Expediente', 'Estado Último Expediente',
  ]);

  for (const emp of employees) {
    const empExps = expedients
      .filter(e => e.employeeId === emp.id)
      .sort((a, b) => (b.year - a.year) || b.date.localeCompare(a.date));
    const latest = empExps[0];
    rows.push([
      emp.employeeNumber, emp.firstName, emp.lastName1, emp.lastName2,
      emp.curp, emp.rfc, emp.nss, emp.gender, emp.birthDate,
      emp.department, emp.position, emp.planta, emp.turno, emp.status,
      emp.hireDate, emp.phone, emp.email,
      latest ? String(latest.year) : '',
      latest ? latest.date : '',
      latest ? latest.status : '',
    ]);
  }

  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `empleados_planta_${plantaLabel}.csv`);
}

function csvEscape(val: string): string {
  if (val == null) return '""';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return `"${s}"`;
}

/* ---------- PDF (printable HTML) export ---------- */

function buildExpedienteHTML(employee: Employee, allExpedients: Expedient[], docs: { name: string; type: string; date: string }[]): string {
  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`;
  const empExps = allExpedients
    .filter(e => e.employeeId === employee.id)
    .sort((a, b) => (b.year - a.year) || b.date.localeCompare(a.date));

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Expediente - ${escapeHtml(fullName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; padding: 32px; }
  h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #475569; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .header .meta { font-size: 11px; color: #94a3b8; text-align: right; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 24px; margin-bottom: 8px; }
  .field { font-size: 12px; }
  .field .label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .field .value { font-weight: 600; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; }
  td { font-size: 11px; padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Expediente Médico</h1>
      <p style="font-size:13px;font-weight:600;color:#475569">${escapeHtml(fullName)}</p>
    </div>
    <div class="meta">
      <p>Planta ${employee.planta}</p>
      <p>${new Date().toLocaleDateString('es-MX')}</p>
    </div>
  </div>

  <h2>Datos del Empleado</h2>
  <div class="grid">
    ${field('No. Empleado', employee.employeeNumber)}
    ${field('CURP', employee.curp)}
    ${field('RFC', employee.rfc)}
    ${field('NSS', employee.nss)}
    ${field('Sexo', employee.gender)}
    ${field('Fecha Nacimiento', employee.birthDate)}
    ${field('Departamento', employee.department)}
    ${field('Puesto', employee.position)}
    ${field('Turno', employee.turno)}
    ${field('Estatus', employee.status)}
    ${field('Fecha Ingreso', employee.hireDate)}
    ${field('Planta', employee.planta)}
    ${field('Teléfono', employee.phone)}
    ${field('Email', employee.email)}
  </div>

  ${empExps.length > 0 ? `
  <h2>Registros Médicos (${empExps.length})</h2>
  <table>
    <thead><tr><th>Año</th><th>Tipo</th><th>Fecha</th><th>Doctor</th><th>Estado</th><th>Observaciones</th></tr></thead>
    <tbody>
      ${empExps.map(e => `<tr>
        <td>${e.year}</td>
        <td>${escapeHtml(e.recordType)}</td>
        <td>${e.date}</td>
        <td>${escapeHtml(e.responsibleDoctor || '-')}</td>
        <td>${escapeHtml(e.status)}</td>
        <td>${escapeHtml(e.observations || '-')}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  ${docs.length > 0 ? `
  <h2>Documentos (${docs.length})</h2>
  <table>
    <thead><tr><th>Nombre</th><th>Tipo</th><th>Fecha</th></tr></thead>
    <tbody>
      ${docs.map(d => `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.type)}</td><td>${d.date}</td></tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    Documento generado por MedExpedient — ${new Date().toLocaleString('es-MX')}
  </div>
</body>
</html>`;
}

export function exportExpedienteToPDF(employee: Employee, expedients: Expedient[], docs: { name: string; type: string; date: string }[]) {
  const html = buildExpedienteHTML(employee, expedients, docs);
  printHTML(html, `expediente_${employee.employeeNumber}.pdf`);
}

export function printExpediente(employee: Employee, expedients: Expedient[], docs: { name: string; type: string; date: string }[]) {
  const html = buildExpedienteHTML(employee, expedients, docs);
  printHTML(html, `expediente_${employee.employeeNumber}.pdf`);
}

export function exportRegistroToPDF(employee: Employee, expedient: Expedient) {
  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`;
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Registro - ${escapeHtml(fullName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; padding: 32px; }
  h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #475569; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field .label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .field .value { font-weight: 600; font-size: 12px; margin-top: 2px; }
  .obs { margin-top: 16px; font-size: 12px; line-height: 1.6; color: #334155; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <h1>Registro Médico</h1>
  <p style="font-size:13px;font-weight:600;color:#475569">${escapeHtml(fullName)} — ${employee.employeeNumber}</p>

  <h2>Datos del Registro</h2>
  <div class="grid">
    ${field('Tipo', expedient.recordType)}
    ${field('Año', String(expedient.year))}
    ${field('Fecha', expedient.date)}
    ${field('Estado', expedient.status)}
    ${field('Doctor', expedient.responsibleDoctor || 'Sin asignar')}
    ${field('Planta', employee.planta)}
  </div>

  ${expedient.observations ? `<h2>Observaciones</h2><p class="obs">${escapeHtml(expedient.observations)}</p>` : ''}

  <div class="footer">Documento generado por MedExpedient — ${new Date().toLocaleString('es-MX')}</div>
</body>
</html>`;

  printHTML(html, `registro_${employee.employeeNumber}_${expedient.year}.pdf`);
}

export function printRegistro(employee: Employee, expedient: Expedient) {
  const html = buildRegistroHTML(employee, expedient);
  printHTML(html, `registro_${employee.employeeNumber}_${expedient.year}.pdf`);
}

function buildRegistroHTML(employee: Employee, expedient: Expedient): string {
  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Registro - ${escapeHtml(fullName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; padding: 32px; }
  h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #475569; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field .label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .field .value { font-weight: 600; font-size: 12px; margin-top: 2px; }
  .obs { margin-top: 16px; font-size: 12px; line-height: 1.6; color: #334155; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <h1>Registro Médico</h1>
  <p style="font-size:13px;font-weight:600;color:#475569">${escapeHtml(fullName)} — ${employee.employeeNumber}</p>
  <h2>Datos del Registro</h2>
  <div class="grid">
    ${field('Tipo', expedient.recordType)}
    ${field('Año', String(expedient.year))}
    ${field('Fecha', expedient.date)}
    ${field('Estado', expedient.status)}
    ${field('Doctor', expedient.responsibleDoctor || 'Sin asignar')}
    ${field('Planta', employee.planta)}
  </div>
  ${expedient.observations ? `<h2>Observaciones</h2><p class="obs">${escapeHtml(expedient.observations)}</p>` : ''}
  <div class="footer">Documento generado por MedExpedient — ${new Date().toLocaleString('es-MX')}</div>
</body>
</html>`;
}

export function downloadDocument(doc: { name: string; dataUrl: string; fileType: string }) {
  const link = document.createElement('a');
  link.href = doc.dataUrl;
  link.download = doc.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function field(label: string, value: string): string {
  return `<div class="field"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value || '-')}</div></div>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printHTML(html: string, _filename: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 300);
}
