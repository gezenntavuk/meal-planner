'use client';

import { Edit, Plus } from 'lucide-react';

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  notes?: string;
}

interface MealModalProps {
  showModal: boolean;
  editingMeal: Meal | null;
  formData: {
    name: string;
    type: Meal['type'];
    date: string;
    notes: string;
  };
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
}

export default function MealModal({
  showModal,
  editingMeal,
  formData,
  onClose,
  onSave,
  onFormChange
}: MealModalProps) {
  const mealTypes = [
    { value: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
    { value: 'lunch', label: 'Öğle Yemeği', icon: '☀️' },
    { value: 'dinner', label: 'Akşam Yemeği', icon: '🌙' },
    { value: 'snack', label: 'Ara Öğün', icon: '🍎' }
  ];

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-black">
          {editingMeal ? 'Yemek Düzenle' : 'Yeni Yemek Ekle'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Yemek Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="Örn: Mercimek Çorbası"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Yemek Türü
            </label>
            <select
              value={formData.type}
              onChange={(e) => onFormChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
            >
              {mealTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Notlar (İsteğe bağlı)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              rows={3}
              placeholder="Örn: Vejetaryen, gluten içermez..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            {editingMeal ? (
              <>
                <Edit size={16} />
                Güncelle
              </>
            ) : (
              <>
                <Plus size={16} />
                Ekle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
