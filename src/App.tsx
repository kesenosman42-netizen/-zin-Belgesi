import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Search, Calendar as CalendarIcon, FileDown, User, X, Info, Settings, FileSpreadsheet, Clock } from 'lucide-react';
import { parseStudentPdf, Student } from './utils/pdfParser';
import { parseStudentExcel } from './utils/excelParser';
import { generateLeaveDocument } from './utils/docGenerator';
import StudentManager from './components/StudentManager';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type LeaveType = 'full' | 'half';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Date state
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [leaveTypes, setLeaveTypes] = useState<Record<string, LeaveType>>({});
  
  const [leaveReason, setLeaveReason] = useState('');
  const [parentName, setParentName] = useState('');
  const [petitionDate, setPetitionDate] = useState<Date>(new Date());
  
  const [isUploading, setIsUploading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  // Sync leaveTypes with selectedDates
  useEffect(() => {
    if (!selectedDates) {
      setLeaveTypes({});
      return;
    }

    setLeaveTypes(prev => {
      const newTypes = { ...prev };
      // Remove types for deselected dates
      Object.keys(newTypes).forEach(dateStr => {
        if (!selectedDates.find(d => d.toISOString() === dateStr)) {
          delete newTypes[dateStr];
        }
      });
      // Add default 'full' for new dates
      selectedDates.forEach(d => {
        const key = d.toISOString();
        if (!newTypes[key]) {
          newTypes[key] = 'full';
        }
      });
      return newTypes;
    });
  }, [selectedDates]);

  const toggleLeaveType = (date: Date) => {
    const key = date.toISOString();
    setLeaveTypes(prev => ({
      ...prev,
      [key]: prev[key] === 'full' ? 'half' : 'full'
    }));
  };

  const totalDays = useMemo(() => {
    if (!selectedDates) return 0;
    return selectedDates.reduce((acc, date) => {
      const type = leaveTypes[date.toISOString()] || 'full';
      return acc + (type === 'full' ? 1 : 0.5);
    }, 0);
  }, [selectedDates, leaveTypes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let parsedStudents: Student[] = [];
      
      if (file.name.endsWith('.pdf')) {
        parsedStudents = await parseStudentPdf(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedStudents = await parseStudentExcel(file);
      } else {
        alert("Desteklenmeyen dosya formatı. Lütfen PDF veya Excel dosyası yükleyin.");
        setIsUploading(false);
        return;
      }

      if (parsedStudents.length === 0) {
        alert("Dosyadan öğrenci bilgisi okunamadı. Lütfen dosya formatını kontrol edin.");
        return;
      }

      // Save to database
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedStudents),
      });

      if (res.ok) {
        await fetchStudents(); // Refresh list
        alert(`${parsedStudents.length} öğrenci başarıyla eklendi.`);
      } else {
        alert("Öğrenciler veritabanına kaydedilirken bir hata oluştu.");
      }

    } catch (error) {
      console.error("File parsing error:", error);
      alert("Dosya okunurken bir hata oluştu.");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerTerm) ||
        s.schoolNumber.includes(lowerTerm)
    );
  }, [students, searchTerm]);

  const handleGenerateDocument = async () => {
    if (!selectedStudent || !selectedDates || selectedDates.length === 0) {
      alert("Lütfen öğrenci ve tarih seçiniz.");
      return;
    }

    // Sort dates chronologically
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

    // Format details string: "12.05.2023 (Tam), 13.05.2023 (Yarım)"
    const leaveDetails = sortedDates.map(d => {
      const type = leaveTypes[d.toISOString()] === 'half' ? 'Yarım' : 'Tam';
      return `${format(d, 'dd.MM.yyyy')} (${type})`;
    }).join(', ');

    await generateLeaveDocument({
      studentName: selectedStudent.name,
      studentClass: selectedStudent.className,
      studentNumber: selectedStudent.schoolNumber,
      leaveDetails: leaveDetails,
      leaveReason: leaveReason || "Mazeret",
      totalDays: totalDays.toString(),
      parentName: parentName,
      petitionDate: format(petitionDate, 'dd.MM.yyyy')
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Öğrenci İzin Sistemi</h1>
            <p className="text-slate-500 mt-1">E-Okul verileri ile hızlı izin belgesi oluşturun</p>
          </div>
          <div className="flex gap-3">
             <button
               onClick={() => setIsManaging(true)}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
             >
               <Settings className="w-4 h-4" />
               Listeyi Düzenle
             </button>
             <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center">
               <span className="text-sm font-medium text-slate-600 px-2">
                  {students.length > 0 ? `${students.length} Öğrenci` : 'Veri Yok'}
               </span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Search */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Veri Yükle
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="flex gap-2 mb-3">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-green-600 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    <span className="font-semibold">PDF veya Excel yükleyin</span>
                    <br /> veya sürükleyip bırakın
                  </p>
                  <p className="text-xs text-slate-400 mt-1">E-Okul Listeleri (.pdf, .xlsx, .xls)</p>
                </div>
                <input type="file" className="hidden" accept=".pdf, .xlsx, .xls" onChange={handleFileUpload} />
              </label>
              {isUploading && <p className="text-sm text-indigo-600 mt-2 text-center">Yükleniyor...</p>}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex gap-2 text-xs text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Dosyanızın "Okul No - Ad Soyad - Sınıf" bilgilerini içerdiğinden emin olun.</p>
              </div>
            </div>

            {/* Search Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Öğrenci Ara
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ad, Soyad veya Okul No..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        selectedStudent?.id === student.id
                          ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500"
                          : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-sm text-slate-500 flex justify-between mt-1">
                        <span>No: {student.schoolNumber}</span>
                        <span>{student.className}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    {searchTerm ? "Öğrenci bulunamadı" : "Arama yapın veya listeden seçin"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Leave Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-[600px]">
              
              {!selectedStudent ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <User className="w-16 h-16 opacity-20" />
                  <p>İşlem yapmak için lütfen soldaki listeden bir öğrenci seçin.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Selected Student Header - Fixed Layout */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-6 gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-slate-900 truncate">{selectedStudent.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2 text-slate-500">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-sm whitespace-nowrap">No: {selectedStudent.schoolNumber}</span>
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-sm whitespace-nowrap">Sınıf: {selectedStudent.className}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Date Selection */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-slate-700">
                        <CalendarIcon className="w-4 h-4" />
                        Tarih Seçimi
                      </h3>
                      <div className="border border-slate-200 rounded-lg p-4 inline-block bg-white">
                        <DayPicker
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={setSelectedDates}
                          locale={tr}
                          className="rdp-custom"
                        />
                      </div>
                      
                      {/* Date List & Type Toggles */}
                      {selectedDates && selectedDates.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2">
                          <h4 className="text-sm font-medium text-slate-500 mb-2">Seçili Günler ({totalDays} Gün)</h4>
                          {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map(date => (
                            <div key={date.toISOString()} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-sm font-medium text-slate-700">
                                {format(date, 'd MMMM', { locale: tr })}
                              </span>
                              <button
                                onClick={() => toggleLeaveType(date)}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                  leaveTypes[date.toISOString()] === 'half'
                                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                )}
                              >
                                <Clock className="w-3 h-3" />
                                {leaveTypes[date.toISOString()] === 'half' ? 'Yarım Gün' : 'Tam Gün'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reason & Action */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="font-semibold text-slate-700 block">İzin Sebebi</label>
                        <textarea
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                          placeholder="Örn: Hastalık, Ailevi nedenler..."
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-semibold text-slate-700 block text-sm">Veli Adı Soyadı</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ad Soyad"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-semibold text-slate-700 block text-sm">Dilekçe Tarihi</label>
                          <input
                            type="date"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={format(petitionDate, 'yyyy-MM-dd')}
                            onChange={(e) => setPetitionDate(e.target.valueAsDate || new Date())}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleGenerateDocument}
                          disabled={!selectedDates || selectedDates.length === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                          <FileDown className="w-5 h-5" />
                          İzin Belgesi Oluştur
                        </button>
                        <p className="text-xs text-slate-400 text-center mt-3">
                          Word (.docx) formatında indirilecektir.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Student Manager Modal */}
      {isManaging && (
        <StudentManager
          students={students}
          onClose={() => setIsManaging(false)}
          onRefresh={fetchStudents}
        />
      )}
    </div>
  );
}
