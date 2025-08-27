'use client';

import { Edit } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  recipe?: string;
}

interface RecipeViewModalProps {
  showModal: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
}

export default function RecipeViewModal({
  showModal,
  recipe,
  onClose,
  onEdit
}: RecipeViewModalProps) {
  const mealTypes = [
    { value: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
    { value: 'main', label: 'Ana Yemek', icon: '🍽️' },
    { value: 'snack', label: 'Ara Öğün', icon: '🍎' }
  ];

  if (!showModal || !recipe) return null;

  const typeInfo = mealTypes.find(t => t.value === recipe.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo?.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-black">
                {recipe.name}
              </h2>
              <p className="text-sm text-gray-600">{typeInfo?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(recipe)}
              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
              title="Tarifi düzenle"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer hover:scale-110"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {recipe.recipe ? (
            <div className="whitespace-pre-wrap text-black leading-relaxed bg-gray-50 p-4 rounded-lg">
              {recipe.recipe}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Bu yemek için henüz tarif eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
