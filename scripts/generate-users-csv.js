#!/usr/bin/env node
/*
 Simple CSV generator for bulk user import testing.
 Usage examples:
   node scripts/generate-users-csv.js --count=50 --role=student --out=sample_students.csv
   node scripts/generate-users-csv.js --count=25 --role=teacher --out=sample_teachers.csv
   node scripts/generate-users-csv.js --count=100 --role=mix --out=sample_mix.csv

 CSV headers:
   email, firstName, lastName, role, matricNo, department, course, level, lecturerNo, faculty, office, phone, password
*/

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (const a of args) {
    const [k, v] = a.replace(/^--/, '').split('=');
    opts[k] = v === undefined ? true : v;
  }
  return opts;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

const FIRST_NAMES = ['John', 'Jane', 'Alex', 'Chris', 'Sam', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Lee'];
const LAST_NAMES = ['Doe', 'Smith', 'Johnson', 'Brown', 'Williams', 'Jones', 'Miller', 'Davis', 'Wilson', 'Clark'];
const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'];
const COURSES = ['BSc Computer Science', 'BSc Mathematics', 'BSc Physics', 'BSc Chemistry', 'BSc Biology', 'BSc Economics'];
const LEVELS = ['100', '200', '300', '400'];
const FACULTIES = ['Engineering', 'Science', 'Arts', 'Business'];
const OFFICES = ['Room 101', 'Room 202', 'Room 303', 'Room 404'];

function generateEmail(first, last, domain, idx) {
  const base = `${first}.${last}`.toLowerCase();
  return `${base}${idx ? '.' + idx : ''}@${domain}`;
}

function generatePhone() {
  // Simple E.164-like: +1555XXXXXXX
  const n = Math.floor(1000000 + Math.random() * 8999999);
  return `+1555${n}`;
}

function studentRow(i, domain) {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const email = generateEmail(firstName, lastName, domain, i);
  const department = randomChoice(DEPARTMENTS);
  const course = randomChoice(COURSES);
  const level = randomChoice(LEVELS);
  const matricNo = `STU${pad(i, 4)}`;
  const phone = generatePhone();
  const password = 'Passw0rd!';
  return {
    email,
    firstName,
    lastName,
    role: 'student',
    matricNo,
    department,
    course,
    level,
    lecturerNo: '',
    faculty: '',
    office: '',
    phone,
    password,
  };
}

function teacherRow(i, domain) {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const email = generateEmail(firstName, lastName, domain, i);
  const department = randomChoice(DEPARTMENTS);
  const faculty = randomChoice(FACULTIES);
  const office = randomChoice(OFFICES);
  const lecturerNo = `LEC${pad(i, 4)}`;
  const phone = generatePhone();
  const password = 'Passw0rd!';
  return {
    email,
    firstName,
    lastName,
    role: 'teacher',
    matricNo: '',
    department,
    course: '',
    level: '',
    lecturerNo,
    faculty,
    office,
    phone,
    password,
  };
}

function toCsv(rows) {
  const headers = [
    'email',
    'firstName',
    'lastName',
    'role',
    'matricNo',
    'department',
    'course',
    'level',
    'lecturerNo',
    'faculty',
    'office',
    'phone',
    'password',
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n') + '\n';
}

function main() {
  const { count = '50', role = 'mix', out, domain = 'example.com', start = '1' } = parseArgs();
  const total = Math.max(1, parseInt(count, 10));
  const startIndex = Math.max(1, parseInt(start, 10));
  const rows = [];
  for (let i = 0; i < total; i += 1) {
    const idx = startIndex + i;
    const which = role.toLowerCase();
    if (which === 'student') rows.push(studentRow(idx, domain));
    else if (which === 'teacher') rows.push(teacherRow(idx, domain));
    else rows.push(Math.random() < 0.5 ? studentRow(idx, domain) : teacherRow(idx, domain));
  }
  const csv = toCsv(rows);
  const filename = out || `sample_${role}_${total}.csv`;
  const filepath = path.resolve(process.cwd(), filename);
  fs.writeFileSync(filepath, csv, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${rows.length} rows to ${filepath}`);
}

main();


