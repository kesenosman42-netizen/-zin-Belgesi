import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface LeaveData {
  studentName: string;
  studentClass: string;
  studentNumber: string;
  leaveDetails: string; // Formatted string of dates and types
  leaveReason: string;
  totalDays: string;
  parentName: string;
  petitionDate: string;
}

export const generateLeaveDocument = async (data: LeaveData) => {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: "Calibri",
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { line: 276 }, // 1.15 spacing
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "LOKMAN HEKİM MESLEKİ VE TEKNİK ANADOLU LİSESİ",
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "MÜDÜRLÜĞÜNE",
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "ÖĞRENCİ İZİN BELGESİ",
                bold: true,
                size: 28,
                underline: {
                  type: "single",
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Student Info Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
              insideHorizontal: { style: BorderStyle.DOTTED, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Öğrenci Adı Soyadı", bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F3F4F6" },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph(data.studentName)],
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Sınıfı / Okul No", bold: true })],
                    shading: { fill: "F3F4F6" },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph(`${data.studentClass} / ${data.studentNumber}`)],
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "İzin Tarihleri", bold: true })],
                    shading: { fill: "F3F4F6" },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph(data.leaveDetails)],
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Toplam Süre", bold: true })],
                    shading: { fill: "F3F4F6" },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph(`${data.totalDays} Gün`)],
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "İzin Sebebi", bold: true })],
                    shading: { fill: "F3F4F6" },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph(data.leaveReason)],
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
            ],
          }),

          // Body Text
          new Paragraph({
            children: [
              new TextRun({
                text: `Velisi bulunduğum yukarıda açık kimliği yazılı öğrencimin, belirtilen tarihlerde toplam ${data.totalDays} gün izinli sayılmasını arz ederim.`,
              }),
            ],
            spacing: { before: 600, after: 800 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // Parent Signature Only
          new Paragraph({
            children: [
              new TextRun({
                text: "Gereğini bilgilerinize arz ederim.",
              }),
            ],
            spacing: { after: 400 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [], // Empty left side
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: data.petitionDate,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100 },
                      }),
                      new Paragraph({
                        text: "Velinin Adı Soyadı",
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200 },
                      }),
                      new Paragraph({
                        text: data.parentName || "..........................................",
                        bold: true,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100 },
                      }),
                      new Paragraph({
                        text: "İmza",
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                      }),
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.studentName}_Izin_Belgesi.docx`);
};
