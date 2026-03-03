import * as XLSX from 'xlsx';
import { Student } from './pdfParser';

export async function parseStudentExcel(file: File): Promise<Student[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON array of arrays to handle various layouts
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const students: Student[] = [];
  
  // Heuristic: Find the header row
  // We look for keywords like "No", "Numara", "Ad", "Soyad", "Sınıf"
  let headerRowIndex = -1;
  let noColIdx = -1;
  let nameColIdx = -1;
  let classColIdx = -1;

  for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
    const row = jsonData[i];
    if (!row) continue;
    
    // Convert row to string for easier searching
    const rowStr = row.map(c => String(c).toLowerCase());
    
    // Find indices
    const noIdx = rowStr.findIndex(c => c.includes('no') || c.includes('numara'));
    const nameIdx = rowStr.findIndex(c => c.includes('ad') && c.includes('soyad'));
    const classIdx = rowStr.findIndex(c => c.includes('sınıf') || c.includes('şube'));
    
    if (noIdx !== -1 && nameIdx !== -1) {
      headerRowIndex = i;
      noColIdx = noIdx;
      nameColIdx = nameIdx;
      classColIdx = classIdx; // Might be -1 if not found
      break;
    }
  }

  // If we found headers, use them. Otherwise, assume standard columns (0: No, 1: Name, 2: Class)
  if (headerRowIndex === -1) {
    // Fallback: Try to detect data shape in the first few rows
    // Assume: Col 0 = Number, Col 1 = Name, Col 2 = Class
    noColIdx = 0;
    nameColIdx = 1;
    classColIdx = 2;
    headerRowIndex = -1; // Start from row 0
  }

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rawNo = row[noColIdx];
    const rawName = row[nameColIdx];
    const rawClass = classColIdx !== -1 ? row[classColIdx] : '';

    if (!rawNo || !rawName) continue;

    // Validate data
    const number = String(rawNo).trim();
    const name = String(rawName).trim();
    const className = rawClass ? String(rawClass).trim() : 'Belirsiz';

    // Basic validation: Number should be digits, Name should be text
    if (number.match(/^\d+$/) && name.length > 2) {
       students.push({
        id: crypto.randomUUID(),
        schoolNumber: number,
        name: name,
        className: className
      });
    }
  }

  return students;
}
