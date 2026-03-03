import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, Search, Edit2 } from 'lucide-react';
import { Student } from '../utils/pdfParser';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface StudentManagerProps {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  onClose: () => void;
}

export default function StudentManager({ students, onUpdate, onClose }: StudentManagerProps) {
  const [localStudents, setLocalStudents] = useState<Student[]>(students);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state for adding/editing
  const [formData, setFormData] = useState<Partial<Student>>({});

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return localStudents;
    const lowerTerm = searchTerm.toLowerCase();
    return localStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerTerm) ||
        s.schoolNumber.includes(lowerTerm) ||
        s.className.toLowerCase().includes(lowerTerm)
    );
  }, [localStudents, searchTerm]);

  const handleDelete = (id: string) => {
    if (confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      setLocalStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData({ ...student });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = () => {
    if (!formData.name || !formData.schoolNumber || !formData.className) {
      alert('Lütfen tüm alanları doldurunuz.');
      return;
    }

    setLocalStudents(prev => prev.map(s => 
      s.id === editingId ? { ...s, ...formData } as Student : s
    ));
    setEditingId(null);
    setFormData({});
  };

  const handleAddNew = () => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: '',
      schoolNumber: '',
      className: ''
    };
    setLocalStudents(prev => [newStudent, ...prev]);
    setEditingId(newStudent.id);
    setFormData(newStudent);
  };

  const handleSaveAll = () => {
    onUpdate(localStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Öğrenci Listesini Düzenle</h2>
            <p className="text-sm text-slate-500">Öğrenci ekle, çıkar veya bilgilerini güncelle</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={handleSaveAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Kaydet ve Çık
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex gap-4 items-center bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Listede ara..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Yeni Öğrenci
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="space-y-2">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={cn(
                    "bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 transition-all",
                    editingId === student.id ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-200"
                  )}
                >
                  {editingId === student.id ? (
                    // Edit Mode
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Okul No"
                        className="border border-slate-300 rounded px-3 py-2 text-sm"
                        value={formData.schoolNumber || ''}
                        onChange={e => setFormData({...formData, schoolNumber: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Ad Soyad"
                        className="border border-slate-300 rounded px-3 py-2 text-sm"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Sınıf"
                        className="border border-slate-300 rounded px-3 py-2 text-sm"
                        value={formData.className || ''}
                        onChange={e => setFormData({...formData, className: e.target.value})}
                      />
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit text-sm">
                        {student.schoolNumber}
                      </div>
                      <div className="font-medium text-slate-900">
                        {student.name}
                      </div>
                      <div className="text-slate-500 text-sm">
                        {student.className}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {editingId === student.id ? (
                      <>
                        <button 
                          onClick={saveEdit}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          title="Kaydet"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
                          title="İptal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(student)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                Kayıt bulunamadı.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-white text-sm text-slate-500 flex justify-between rounded-b-xl">
           <span>Toplam {localStudents.length} öğrenci</span>
        </div>
      </div>
    </div>
  );
}
