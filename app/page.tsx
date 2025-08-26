'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Edit, Trash2, Calendar, Utensils } from 'lucide-react';
import MealModal from './components/MealModal';

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  notes?: string;
}

export default function MealPlanner() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'lunch' as Meal['type'],
    date: '',
    notes: ''
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
            notes: 'Kahvaltıda sucuk yedim'
          },
          {
            id: '2',
            name: 'Mercimek Çorbası',
            type: 'lunch',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: 'Vejetaryen'
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
      const newMeal: Meal = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        date: formData.date,
        notes: formData.notes
      };
      setMeals([...meals, newMeal]);
    }

    setFormData({ name: '', type: 'lunch', date: '', notes: '' });
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
      notes: meal.notes || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMeal(null);
    setFormData({ name: '', type: 'lunch', date: '', notes: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearAllMeals = () => {
    if (confirm('Tüm yemek verilerini silmek istediğinizden emin misiniz?')) {
      setMeals([]);
      localStorage.removeItem('meals');
    }
  };

  const getMealsForDay = (date: string) => {
    return meals.filter(meal => meal.date === date);
  };

  const getMealTypeInfo = (type: Meal['type']) => {
    return mealTypes.find(t => t.value === type);
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

        {/* Add Meal Button */}
        <div className="text-center mb-6 flex gap-4 justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Yemek Ekle
          </button>
          <button
            onClick={clearAllMeals}
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            Tümünü Temizle
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
              >
                <div className="text-center mb-3">
                  <div className={`text-sm ${isToday ? 'text-green-700 font-medium' : 'text-black'}`}>
                    {day.formatted}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-green-800' : 'text-black'}`}>
                    {day.shortDate}
                    {isToday && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Bugün</span>}
                  </div>
                </div>
              
              <div className="space-y-2">
                {getMealsForDay(day.fullDate).map((meal) => {
                  const typeInfo = getMealTypeInfo(meal.type);
                  return (
                    <div key={meal.id} className={`rounded-lg p-3 ${
                      isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{typeInfo?.icon}</span>
                          <span className="text-xs text-black">{typeInfo?.label}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(meal)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="font-medium text-sm text-black">{meal.name}</div>
                      {meal.notes && (
                        <div className="text-xs text-black mt-1">{meal.notes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
      </div>
    </div>
  );
}
