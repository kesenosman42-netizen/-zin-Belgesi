import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source using the local file via Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface Student {
  id: string;
  schoolNumber: string;
  name: string;
  className: string;
}

export async function parseStudentPdf(file: File): Promise<Student[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const students: Student[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group items by Y position (lines)
    const lines: { y: number; text: string }[] = [];
    
    textContent.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]); // Y coordinate
      const existingLine = lines.find(l => Math.abs(l.y - y) < 5); // Tolerance for same line
      if (existingLine) {
        existingLine.text += ' ' + item.str;
      } else {
        lines.push({ y, text: item.str });
      }
    });

    // Sort lines by Y (top to bottom)
    lines.sort((a, b) => b.y - a.y);

    // 1. Extract Class Name from Header
    // We look at the top lines for a pattern like "9/A", "9-A", "9 / A"
    let pageClassName = '';
    
    // Scan top 10 lines for class name
    for (let j = 0; j < Math.min(lines.length, 10); j++) {
      const text = lines[j].text.trim();
      
      // Regex for Class Name: e.g., "9/A", "12-B", "11 / C"
      // Looking for: Number + separator + Single Letter
      // We also handle "9. Sınıf / A Şubesi" loosely by looking for the core "9/A" pattern
      const classMatch = text.match(/\b(\d{1,2})\s*[\/\-]\s*([A-Z])\b/);
      
      if (classMatch) {
        pageClassName = `${classMatch[1]}/${classMatch[2]}`;
        break;
      }
    }

    // 2. Extract Students from Table/List
    for (const line of lines) {
      const text = line.text.trim();
      
      // Skip header lines or lines that are likely not student data
      if (text.includes('T.C.') || text.includes('MÜDÜRLÜĞÜ') || text.includes('LİSTESİ') || text.includes('Sınıf')) {
        continue;
      }

      // Regex to find: Number + Name
      // We assume the line starts with the student number
      // Pattern: Start -> Digits -> Whitespace -> Name (Letters and spaces) -> End or other data
      const match = text.match(/^(\d+)\s+([A-Za-zĞÜŞİÖÇğüşıöç\s]+)/);
      
      if (match) {
        const number = match[1];
        const name = match[2].trim();
        
        // Filter out false positives (e.g. page numbers, dates)
        // Name should be at least 3 chars and not look like a date
        if (name.length > 2 && !name.match(/^\d/)) {
          students.push({
            id: crypto.randomUUID(),
            schoolNumber: number,
            name: name,
            className: pageClassName || 'Belirsiz', // Use found class name or default
          });
        }
      }
    }
  }

  return students;
}
