'use client';

import { Edit, Plus } from 'lucide-react';
import { useRef, useEffect, useCallback, useState } from 'react';

import { Id } from '../convex/_generated/dataModel';

interface Meal {
  _id: Id<"meals">;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  date: string;
  notes?: string;
  order: number;
  recipe?: string;
}

interface MealModalProps {
  showModal: boolean;
  editingMeal: Meal | null;
  formData: {
    name: string;
    type: Meal['type'];
    date: string;
    recipe: string;
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  
  const mealTypes = [
    { value: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
    { value: 'main', label: 'Ana Yemek', icon: '🍽️' },
    { value: 'snack', label: 'Ara Öğün', icon: '🍎' }
  ];

  // Yemek türüne göre renk belirleme
  const getFocusColor = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'focus:border-2 focus:border-orange-500 focus:ring-0';
      case 'main':
        return 'focus:border-2 focus:border-green-500 focus:ring-0';
      case 'snack':
        return 'focus:border-2 focus:border-purple-500 focus:ring-0';
    }
  };

  // Modal açıldığında yemek ismi alanına odaklan
  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  // ESC tuşu ile çıkış
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        onClose();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal, onClose]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">
          {editingMeal ? 'Yemek Düzenle' : 'Yeni Yemek Ekle'}
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Yemek Adı
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !formData.recipe) {
                  onSave();
                }
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-0 ${getFocusColor(formData.type)}`}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !formData.recipe) {
                  onSave();
                }
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-0 ${getFocusColor(formData.type)}`}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !formData.recipe) {
                  onSave();
                }
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-0 ${getFocusColor(formData.type)}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Tarif (İsteğe bağlı)
            </label>
            <textarea
              value={formData.recipe}
              onChange={(e) => onFormChange('recipe', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-0 ${getFocusColor(formData.type)}`}
              rows={4}
              placeholder="Yemeğin tarifini buraya yazabilirsiniz..."
            />
          </div>



        </div>

        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black cursor-pointer transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
