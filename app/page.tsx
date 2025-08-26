'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Edit, Trash2, Calendar, Utensils } from 'lucide-react';
import MealModal from '@/components/MealModal';

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  notes?: string;
  order: number; // Sıralama için
  recipe?: string; // Yemek tarifi
}

export default function MealPlanner() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [draggedMeal, setDraggedMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'lunch' as Meal['type'],
    date: '',
    recipe: ''
  });

  // Haftalık günleri oluştur
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i);
    return {
      date: day,
      formatted: format(day, 'EEEE', { locale: tr }),
      shortDate: format(day, 'd MMM', { locale: tr }),
      fullDate: format(day, 'yyyy-MM-dd')
    };
  });

  // Yemek türleri
  const mealTypes = [
    { value: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
    { value: 'lunch', label: 'Öğle Yemeği', icon: '☀️' },
    { value: 'dinner', label: 'Akşam Yemeği', icon: '🌙' },
    { value: 'snack', label: 'Ara Öğün', icon: '🍎' }
  ];

  // Local storage'dan yemekleri yükle
  useEffect(() => {
    try {
      const savedMeals = localStorage.getItem('meals');
      if (savedMeals) {
        const parsedMeals = JSON.parse(savedMeals);
        setMeals(parsedMeals);
      } else {
        // İlk kez açıldığında örnek veriler ekle
        const sampleMeals: Meal[] = [
          {
            id: '1',
            name: 'Sucuk',
            type: 'breakfast',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: 'Kahvaltıda sucuk yedim',
            order: 0
          },
          {
            id: '2',
            name: 'Mercimek Çorbası',
            type: 'lunch',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: 'Vejetaryen',
            order: 1
          }
        ];
        setMeals(sampleMeals);
        localStorage.setItem('meals', JSON.stringify(sampleMeals));
      }
    } catch (error) {
      console.error('Local storage\'dan veri yüklenirken hata:', error);
      // Hata durumunda boş array ile başla
      setMeals([]);
    }
  }, []);

  // Yemekleri local storage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem('meals', JSON.stringify(meals));
    } catch (error) {
      console.error('Local storage\'a veri kaydedilirken hata:', error);
    }
  }, [meals]);

  const handleSaveMeal = () => {
    if (!formData.name || !formData.date) return;

    if (editingMeal) {
      // Düzenleme modu
      setMeals(meals.map(meal => 
        meal.id === editingMeal.id 
          ? { ...meal, ...formData }
          : meal
      ));
      setEditingMeal(null);
    } else {
      // Yeni yemek ekleme
      const dayMeals = meals.filter(meal => meal.date === formData.date);
      const maxOrder = dayMeals.length > 0 ? Math.max(...dayMeals.map(m => m.order)) : -1;
      
      const newMeal: Meal = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        date: formData.date,
        order: maxOrder + 1,
        recipe: formData.recipe
      };
      setMeals([...meals, newMeal]);
    }

    setFormData({ name: '', type: 'lunch', date: '', recipe: '' });
    setShowAddModal(false);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      type: meal.type,
      date: meal.date,
      recipe: meal.recipe || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMeal(null);
    setFormData({ name: '', type: 'lunch', date: '', recipe: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openAddModalForDay = (date: string) => {
    setFormData({ name: '', type: 'lunch', date: date, recipe: '' });
    setShowAddModal(true);
  };

  const clearAllMeals = () => {
    if (confirm('Tüm yemek verilerini silmek istediğinizden emin misiniz?')) {
      setMeals([]);
      localStorage.removeItem('meals');
    }
  };

  const getMealsForDay = (date: string) => {
    const dayMeals = meals.filter(meal => meal.date === date);
    
    // Yemek türlerine göre otomatik sıralama: kahvaltı, öğle, akşam, ara öğün
    const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    return dayMeals.sort((a, b) => {
      const aIndex = mealTypeOrder.indexOf(a.type);
      const bIndex = mealTypeOrder.indexOf(b.type);
      return aIndex - bIndex;
    });
  };

  const getMealTypeInfo = (type: Meal['type']) => {
    return mealTypes.find(t => t.value === type);
  };

  // Benzersiz yemekleri al (her yemek adından bir tane)
  const getUniqueMeals = () => {
    const uniqueMeals: { [key: string]: Meal } = {};
    
    meals.forEach(meal => {
      if (!uniqueMeals[meal.name]) {
        uniqueMeals[meal.name] = meal;
      }
    });
    
    return Object.values(uniqueMeals).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Sürükle-bırak fonksiyonları
  const handleDragStart = (e: React.DragEvent, meal: Meal) => {
    setDraggedMeal(meal);
    // Alt tuşu basılıysa kopyalama, değilse taşıma
    if (e.altKey) {
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      e.dataTransfer.effectAllowed = 'move';
    }
    e.dataTransfer.setData('text/html', meal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Tariflerden sürükleme veya alt tuşu basılıysa kopyalama efekti, değilse taşıma efekti
    if (e.altKey || (draggedMeal && !draggedMeal.date)) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    
    if (draggedMeal) {
      // Tariflerden sürükleme (date boş) veya farklı güne taşıma
      if (!draggedMeal.date || draggedMeal.date !== targetDate) {
        const dayMeals = meals.filter(meal => meal.date === targetDate);
        const maxOrder = dayMeals.length > 0 ? Math.max(...dayMeals.map(m => m.order)) : -1;
        
        if (e.altKey || !draggedMeal.date) {
          // Alt tuşu basılıysa veya tariflerden sürükleniyorsa yemeği kopyala
          const newMeal: Meal = {
            id: Date.now().toString(),
            name: draggedMeal.name,
            type: draggedMeal.type,
            date: targetDate,
            order: maxOrder + 1,
            recipe: draggedMeal.recipe
          };
          setMeals([...meals, newMeal]);
        } else {
          // Normal sürükleme - yemeği taşı
          setMeals(meals.map(meal => 
            meal.id === draggedMeal.id 
              ? { ...meal, date: targetDate, order: maxOrder + 1 }
              : meal
          ));
        }
      }
    }
    
    setDraggedMeal(null);
  };



  const handleDragEnd = () => {
    setDraggedMeal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Utensils className="text-green-600" />
            Haftalık Yemek Planlayıcısı
          </h1>
          <p className="text-gray-600">Bu hafta hangi yemekleri yiyeceğinizi planlayın</p>
        </div>

        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black"
          >
            ← Önceki Hafta
          </button>
          <div className="text-lg font-semibold text-gray-700">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: tr })} - {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'd MMMM yyyy', { locale: tr })}
          </div>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black"
          >
            Sonraki Hafta →
          </button>
        </div>



        {/* Weekly Calendar */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const isToday = day.fullDate === format(new Date(), 'yyyy-MM-dd');
            return (
              <div 
                key={day.fullDate} 
                className={`rounded-lg shadow-md p-4 transition-all duration-200 ${
                  isToday 
                    ? 'bg-gradient-to-br from-green-100 to-blue-100 border-2 border-green-400 shadow-lg' 
                    : 'bg-white'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.fullDate)}
              >
                <div className="text-center mb-3">
                  <div className={`text-sm ${isToday ? 'text-green-700 font-medium' : 'text-black'} relative`}>
                    <div className="text-center">{day.formatted}</div>
                    <button
                      onClick={() => openAddModalForDay(day.fullDate)}
                      className="absolute top-0 right-0 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                      title={`${day.formatted} gününe yemek ekle`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-green-800' : 'text-black'}`}>
                    {day.shortDate}
                    {isToday && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Bugün</span>}
                  </div>
                </div>
              
              <div className="space-y-2 min-h-[100px]">
                {getMealsForDay(day.fullDate).map((meal) => {
                  const typeInfo = getMealTypeInfo(meal.type);
                  const isDragging = draggedMeal?.id === meal.id;
                  return (
                    <div 
                      key={meal.id} 
                      data-meal-id={meal.id}
                      className={`rounded-lg p-3 cursor-move transition-all duration-200 ${
                        isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      } ${
                        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, meal)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{typeInfo?.icon}</span>
                          <span className="text-xs text-black">{typeInfo?.label}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(meal);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeal(meal.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="font-medium text-sm text-black flex items-center gap-2">
                        {meal.name}
                        {meal.recipe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMeal(meal);
                              setShowRecipeModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            title="Tarifi görüntüle"
                          >
                            📝
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {getMealsForDay(day.fullDate).length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    Yemek yok
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* Tüm Tariflerim Bölümü */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📚 Tüm Tariflerim
            </h2>
            <button
              onClick={() => {
                setFormData({ name: '', type: 'lunch', date: '', recipe: '' });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Yeni Tarif Ekle
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {getUniqueMeals().map((meal) => {
              const typeInfo = getMealTypeInfo(meal.type);
              return (
                <div
                  key={meal.id}
                  className="bg-white rounded-lg shadow-md p-4 cursor-move hover:shadow-lg transition-shadow border border-gray-200"
                  draggable
                  onDragStart={(e) => {
                    // Yeni bir yemek oluştur (kopya)
                    const newMeal: Meal = {
                      id: Date.now().toString(),
                      name: meal.name,
                      type: meal.type,
                      date: '', // Boş bırak, drop edildiğinde doldurulacak
                      order: 0,
                      recipe: meal.recipe
                    };
                    setDraggedMeal(newMeal);
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/html', newMeal.id);
                  }}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo?.icon}</span>
                      <span className="text-sm text-gray-600">{typeInfo?.label}</span>
                    </div>
                    {meal.recipe && (
                      <span className="text-xs text-blue-600">📝</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-800 mb-2">{meal.name}</div>
                  <div className="text-xs text-gray-500">
                    {meal.recipe ? 'Tarif mevcut' : 'Tarif yok'}
                  </div>
                </div>
              );
            })}
          </div>
          
          {getUniqueMeals().length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Henüz yemek eklenmemiş. Yemek ekleyerek tariflerinizi burada görebilirsiniz.
            </div>
          )}
        </div>

        {/* Meal Modal Component */}
        <MealModal
          showModal={showAddModal}
          editingMeal={editingMeal}
          formData={formData}
          onClose={handleCloseModal}
          onSave={handleSaveMeal}
          onFormChange={handleFormChange}
        />

        {/* Recipe Modal */}
        {showRecipeModal && selectedMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">
                  {selectedMeal.name} - Tarif
                </h2>
                <button
                  onClick={() => {
                    setShowRecipeModal(false);
                    setSelectedMeal(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-black leading-relaxed">
                  {selectedMeal.recipe}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
