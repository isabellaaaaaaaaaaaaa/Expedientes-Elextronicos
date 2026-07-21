#!/usr/bin/env node
// Generates 3,584 mock employees with realistic Mexican names and all required fields.
import { writeFileSync } from 'fs';

const PLANTAS = ['61', '63', '65', '66', '68'];
const DEPARTAMENTOS = [
  'Manufactura', 'Recursos Humanos', 'Tecnologías de Información',
  'Calidad', 'Logística', 'Ingeniería', 'Mantenimiento',
  'Producción', 'Seguridad e Higiene', 'Finanzas', 'Compras', 'Almacén'
];
const PUESTOS = [
  'Técnico de Línea', 'Coordinadora de Nómina', 'Analista de Sistemas',
  'Inspectora de Calidad', 'Supervisor de Almacén', 'Ingeniera de Procesos',
  'Operador de Máquina', 'Auxiliar Administrativo', 'Supervisor de Turno',
  'Técnico de Mantenimiento', 'Operario de Producción', 'Analista de Calidad',
  'Jefe de Departamento', 'Asistente Ejecutiva', 'Técnico Electrónico'
];
const POSICIONES_STATUS = [
  { status: 'Activo', weight: 0.85 },
  { status: 'Baja', weight: 0.10 },
  { status: 'Incapacidad', weight: 0.05 }
];
const TURNOS = ['Matutino', 'Vespertino', 'Nocturno', 'Mixto'];
const GENEROS = ['Masculino', 'Femenino'];

const NOMBRES_M = [
  'Carlos','Miguel','Andrés','José','Juan','Luis','Pedro','Jorge','Raúl','Fernando',
  'Ricardo','Alberto','Manuel','Sergio','Héctor','Gabriel','Daniel','Alejandro','Francisco','Antonio',
  'César','Oscar','Emmanuel','Diego','Iván','Roberto','Jesús','Martín','Pablo','Víctor'
];
const NOMBRES_F = [
  'Laura','Sofía','Valeria','María','Ana','Patricia','Claudia','Gabriela','Mónica','Rosa',
  'Carmen','Lucía','Isabel','Silvia','Elena','Adriana','Karla','Daniela','Fernanda','Andrea',
  'Verónica','Paulina','Beatriz','Alejandra','Guadalupe','Rosa María','Lourdes','Teresa','Martha','Angélica'
];
const APELLIDOS1 = [
  'Mendoza','Jiménez','Torres','Herrera','López','Ramírez','Vázquez','González','Rodríguez','Pérez',
  'García','Martínez','Hernández','Sánchez','Cruz','Flores','Rivera','Aguilar','Castillo','Moreno',
  'Ortiz','Romero','Rubio','Gómez','Reyes','Navarro','Díaz','Gutiérrez','Rojas','Suárez',
  'Castro','Vega','Ramos','Morales','Ortega','Ibarra','Santos','Delgado','Campos','Peña',
  'Cisneros','Arellano','Cabrera','Lara','Pacheco','Nieto','Beltrán','Solís','Acosta','Mejía'
];
const APELLIDOS2 = [
  'Reyes','Castillo','Vázquez','Morales','Fuentes','Soto','Pérez','García','López','Martínez',
  'Hernández','Sánchez','Rodríguez','González','Cruz','Flores','Rivera','Aguilar','Domínguez','Guzmán',
  'Ortiz','Romero','Gómez','Navarro','Díaz','Ramos','Castro','Vega','Delgado','Campos',
  'Ruiz','Santos','Ibarra','Cisneros','Beltrán','Solís','Acosta','Mejía','Rosales','Galván'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickWeighted(arr) {
  const r = Math.random();
  let acc = 0;
  for (const item of arr) {
    acc += item.weight;
    if (r < acc) return item.status;
  }
  return arr[arr.length - 1].status;
}

function pad(n, w) { return String(n).padStart(w, '0'); }

function generateCURP(nombre, apellido1, apellido2, genero, birthDate) {
  const v = 'AEIOUX';
  const firstVowel = (s) => {
    for (const c of s) if ('AEIOU'.includes(c.toUpperCase())) return c.toUpperCase();
    return 'X';
  };
  const firstConsonant = (s) => {
    for (const c of s) if (!'AEIOU'.includes(c.toUpperCase()) && /[A-ZÑ]/i.test(c)) return c.toUpperCase();
    return 'X';
  };
  const ap1 = apellido1.toUpperCase();
  const ap2 = (apellido2 || '').toUpperCase();
  const nom = nombre.toUpperCase();
  const [yy, mm, dd] = birthDate.split('-');
  const sexChar = genero === 'Femenino' ? 'M' : 'H';
  const curp = [
    ap1[0] || 'X',
    firstVowel(ap1),
    ap2[0] || 'X',
    nom[0] || 'X',
    yy.slice(2),
    mm,
    dd,
    sexChar,
    pick(['J','N','S','D','F','G','B','M','L','Q']),
    firstConsonant(ap1),
    firstConsonant(ap2),
    firstConsonant(nom),
    pick(v),
    pick(['0','1','2','3','4','5','6','7','8','9']),
    pick(['0','1','2','3','4','5','6','7','8','9'])
  ].join('');
  return curp;
}

function generateRFC(curp, homoclave) {
  return curp.slice(0, 10) + homoclave;
}

const TOTAL = 3584;
const employees = [];
const usedCurps = new Set();

for (let i = 0; i < TOTAL; i++) {
  const genero = pick(GENEROS);
  const nombre = genero === 'Masculino' ? pick(NOMBRES_M) : pick(NOMBRES_F);
  const apellido1 = pick(APELLIDOS1);
  const apellido2 = pick(APELLIDOS2);
  const birthYear = 1960 + Math.floor(Math.random() * 45);
  const birthMonth = pad(Math.floor(Math.random() * 12) + 1, 2);
  const birthDay = pad(Math.floor(Math.random() * 28) + 1, 2);
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
  let curp = generateCURP(nombre, apellido1, apellido2, genero, birthDate);
  while (usedCurps.has(curp)) {
    curp = curp.slice(0, -1) + pick(['0','1','2','3','4','5','6','7','8','9']);
  }
  usedCurps.add(curp);
  const homoclave = pick(['A','B','C','D','E','F']) + pick(['0','1','2','3','4','5','6','7','8','9']);
  const rfc = generateRFC(curp, homoclave);
  const nss = pad(birthYear, 4) + pad(Math.floor(Math.random() * 9999), 4) + pad(Math.floor(Math.random() * 9999), 4);
  const hireYear = 2005 + Math.floor(Math.random() * 21);
  const hireMonth = pad(Math.floor(Math.random() * 12) + 1, 2);
  const hireDay = pad(Math.floor(Math.random() * 28) + 1, 2);
  const hireDate = `${hireYear}-${hireMonth}-${hireDay}`;
  const phone = `(55) ${pad(Math.floor(Math.random() * 9999), 4)}-${pad(Math.floor(Math.random() * 9999), 4)}`;
  const emailDomain = pick(['empresa.mx','corporativo.mx','grupo.mx']);
  const email = `${nombre.toLowerCase()}.${apellido1.toLowerCase()}@${emailDomain}`;
  const planta = pick(PLANTAS);
  const status = pickWeighted(POSICIONES_STATUS);
  const turno = pick(TURNOS);
  const department = pick(DEPARTAMENTOS);
  const position = pick(PUESTOS);
  const employeeNumber = `EMP-${pad(i + 1, 4)}`;
  const id = `emp-${pad(i + 1, 4)}`;
  const emergencyContactName = `${pick(['Ana','Juan','María','José','Laura','Pedro','Carmen','Luis'])} ${apellido1} ${pick(APELLIDOS2)}`;
  const emergencyContactRelationship = pick(['Esposa','Esposo','Madre','Padre','Hermano','Hija','Hijo']);
  const emergencyContactPhone = `(55) ${pad(Math.floor(Math.random() * 9999), 4)}-${pad(Math.floor(Math.random() * 9999), 4)}`;

  employees.push({
    id, employeeNumber, firstName: nombre, lastName1: apellido1, lastName2: apellido2,
    curp, rfc, nss, gender: genero, birthDate, phone, email,
    department, position, hireDate,
    emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    planta, status, turno,
  });
}

// Generate expedients (1-3 per employee)
const RECORD_TYPES = ['Examen médico de ingreso','Examen médico periódico','Hoja de consulta','Monitoreo de salud','Prueba de antidoping'];
const STATUSES = ['Finalizado','En revisión','Sin revisar'];
const DOCTORS = ['Dra. López','Dr. Ramírez','Dra. García','Dr. Torres','Dra. Hernández'];

const expedients = [];
let expIdx = 1;
for (const emp of employees) {
  const numExps = 1 + Math.floor(Math.random() * 3);
  for (let j = 0; j < numExps; j++) {
    const year = 2024 + Math.floor(Math.random() * 3);
    const month = pad(Math.floor(Math.random() * 12) + 1, 2);
    const day = pad(Math.floor(Math.random() * 28) + 1, 2);
    const date = `${year}-${month}-${day}`;
    const status = pick(STATUSES);
    const recordType = pick(RECORD_TYPES);
    const doctor = status === 'Sin revisar' ? '' : pick(DOCTORS);
    expedients.push({
      id: `gen-exp-${pad(expIdx++, 5)}`,
      employeeId: emp.id,
      year,
      recordType,
      date,
      responsibleDoctor: doctor,
      status,
      observations: status === 'Sin revisar' ? '' : 'Consulta de rutina completada.',
      createdAt: date,
      updatedAt: date,
    });
  }
}

const tsEmp = `import type { Employee } from '../types';\n\nexport const employees: Employee[] = ${JSON.stringify(employees, null, 0)};\n`;
writeFileSync('/tmp/cc-agent/68747459/project/src/data/generatedEmployees.ts', tsEmp);

const tsExp = `import type { Expedient } from '../types';\n\nexport const expedients: Expedient[] = ${JSON.stringify(expedients, null, 0)};\n`;
writeFileSync('/tmp/cc-agent/68747459/project/src/data/generatedExpedients.ts', tsExp);

console.log(`Generated ${employees.length} employees, ${expedients.length} expedients`);
