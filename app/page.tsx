'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Edit, Trash2, Calendar, Utensils, Heart } from 'lucide-react';
import MealModal from '@/components/MealModal';
import RecipeViewModal from '@/components/RecipeViewModal';
import RecipeEditModal from '@/components/RecipeEditModal';

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  date: string;
  notes?: string;
  order: number; // Sıralama için
  recipe?: string; // Yemek tarifi
}

interface Recipe {
  id: string;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  recipe?: string; // Yemek tarifi
  favorite?: boolean;
}

export default function MealPlanner() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRecipeViewModal, setShowRecipeViewModal] = useState(false);
  const [showRecipeEditModal, setShowRecipeEditModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [draggedMeal, setDraggedMeal] = useState<Meal | null>(null);
  const [isDraggingToRecipes, setIsDraggingToRecipes] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'main' as Meal['type'],
    date: '',
    recipe: ''
  });

  // Arama state'leri
  const [breakfastSearch, setBreakfastSearch] = useState('');
  const [mainSearch, setMainSearch] = useState('');
  const [snackSearch, setSnackSearch] = useState('');

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
    { value: 'main', label: 'Ana Yemek', icon: '🍽️' },
    { value: 'snack', label: 'Ara Öğün', icon: '🍎' }
  ];

  // Her kelimenin ilk harfini büyük yapan yardımcı fonksiyon
  const capitalizeWords = (text: string) => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Local storage'dan yemekleri ve tarifleri yükle
  useEffect(() => {
    try {
      const savedMeals = localStorage.getItem('meals');
      const savedRecipes = localStorage.getItem('recipes');
      
      if (savedMeals) {
        const parsedMeals = JSON.parse(savedMeals);
        // Eski lunch ve dinner türlerini main'e çevir
        const migratedMeals = parsedMeals.map((meal: any) => ({
          ...meal,
          type: meal.type === 'lunch' || meal.type === 'dinner' ? 'main' : meal.type
        }));
        setMeals(migratedMeals);
        // Güncellenmiş veriyi localStorage'a kaydet
        localStorage.setItem('meals', JSON.stringify(migratedMeals));
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
            type: 'main',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: 'Vejetaryen',
            order: 1
          }
        ];
        setMeals(sampleMeals);
        localStorage.setItem('meals', JSON.stringify(sampleMeals));
      }

      if (savedRecipes) {
        const parsedRecipes = JSON.parse(savedRecipes);
        // Eski lunch ve dinner türlerini main'e çevir
        const migratedRecipes = parsedRecipes.map((recipe: any) => ({
          ...recipe,
          type: recipe.type === 'lunch' || recipe.type === 'dinner' ? 'main' : recipe.type
        }));
        setRecipes(migratedRecipes);
        // Güncellenmiş veriyi localStorage'a kaydet
        localStorage.setItem('recipes', JSON.stringify(migratedRecipes));
      } else {
        // İlk kez açıldığında örnek tarifler ekle
        const sampleRecipes: Recipe[] = [
          {
            id: 'r1',
            name: 'Sucuk',
            type: 'breakfast',
            recipe: 'Sucuk kızartma tarifi...'
          },
          {
            id: 'r2',
            name: 'Mercimek Çorbası',
            type: 'main',
            recipe: 'Mercimek çorbası tarifi...'
          },
          {
            id: 'r3',
            name: 'Tavuk Sote',
            type: 'main',
            recipe: 'Tavuk sote tarifi...'
          },
          {
            id: 'r4',
            name: 'Meyve Salatası',
            type: 'snack',
            recipe: 'Meyve salatası tarifi...'
          }
        ];
        setRecipes(sampleRecipes);
        localStorage.setItem('recipes', JSON.stringify(sampleRecipes));
      }
    } catch (error) {
      console.error('Local storage\'dan veri yüklenirken hata:', error);
      // Hata durumunda boş array ile başla
      setMeals([]);
      setRecipes([]);
    }
  }, []);

  // Yemekleri ve tarifleri local storage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem('meals', JSON.stringify(meals));
    } catch (error) {
      console.error('Local storage\'a veri kaydedilirken hata:', error);
    }
  }, [meals]);

  useEffect(() => {
    try {
      localStorage.setItem('recipes', JSON.stringify(recipes));
    } catch (error) {
      console.error('Local storage\'a tarif verisi kaydedilirken hata:', error);
    }
  }, [recipes]);

  // Yemekler değiştiğinde otomatik senkronizasyon
  useEffect(() => {
    if (meals.length > 0) {
      const uniqueMeals: { [key: string]: Meal } = {};
      
      meals.forEach(meal => {
        if (!uniqueMeals[meal.name]) {
          uniqueMeals[meal.name] = meal;
        }
      });

      const existingRecipeNames = recipes.map(r => r.name);
      const newRecipes: Recipe[] = [];

      Object.values(uniqueMeals).forEach(meal => {
        if (!existingRecipeNames.includes(meal.name)) {
          newRecipes.push({
            id: `recipe_${Date.now()}_${Math.random()}`,
            name: meal.name,
            type: meal.type,
            recipe: meal.recipe || ''
          });
        }
      });

      if (newRecipes.length > 0) {
        setRecipes(prev => [...prev, ...newRecipes]);
      }
    }
  }, [meals]);

  const handleSaveMeal = () => {
    if (!formData.name) return;

    if (editingMeal) {
      // Yemek düzenleme modu
      const oldMealName = editingMeal.name;
      const newMealName = formData.name;
      
      // Yemeği güncelle
      setMeals(meals.map(meal => 
        meal.id === editingMeal.id 
          ? { ...meal, ...formData }
          : meal
      ));
      
      // Aşağıdaki aynı isimli tarifi de güncelle
      setRecipes(recipes.map(recipe => 
        recipe.name === oldMealName 
          ? { ...recipe, name: newMealName, type: formData.type, recipe: formData.recipe }
          : recipe
      ));
      
      setEditingMeal(null);
    } else if (formData.date) {
      // Yeni yemek ekleme (tarih varsa)
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
    } else {
      // Yeni tarif ekleme (tarih yoksa)
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        recipe: formData.recipe
      };
      setRecipes([...recipes, newRecipe]);
    }

    // Sadece name, date ve recipe'yi sıfırla, type'ı koru
    setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    setShowAddModal(false);
  };

  const handleSaveRecipe = () => {
    if (!formData.name || !editingRecipe) return;

    // Tarif düzenleme modu
    const oldRecipeName = editingRecipe.name;
    const newRecipeName = formData.name;
    
    // Tarifi güncelle
    setRecipes(recipes.map(recipe => 
      recipe.id === editingRecipe.id 
        ? { ...recipe, name: formData.name, type: formData.type, recipe: formData.recipe }
        : recipe
    ));
    
    // Yukarıdaki aynı isimli yemekleri de güncelle
    setMeals(meals.map(meal => 
      meal.name === oldRecipeName 
        ? { ...meal, name: newRecipeName, type: formData.type, recipe: formData.recipe }
        : meal
    ));
    
    setEditingRecipe(null);
    setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    setShowRecipeEditModal(false);
  };

  const toggleFavorite = (recipeId: string) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === recipeId 
        ? { ...recipe, favorite: !recipe.favorite }
        : recipe
    ));
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

  // Yemek kartlarından düzenleme için özel fonksiyon
  const openEditModalFromMealCard = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      type: meal.type,
      date: meal.date,
      recipe: meal.recipe || ''
    });
    setShowAddModal(true);
  };

  // Tarif düzenleme fonksiyonu
  const openEditRecipeModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      type: recipe.type,
      date: '',
      recipe: recipe.recipe || ''
    });
    setShowRecipeEditModal(true);
  };

       const handleCloseModal = () => {
      setShowAddModal(false);
      setEditingMeal(null);
      setEditingRecipe(null);
      // Modal kapatılırken type'ı koru
      setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    };

    const handleCloseRecipeEditModal = () => {
      setShowRecipeEditModal(false);
      setEditingRecipe(null);
      // Modal kapatılırken type'ı koru
      setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openAddModalForDay = (date: string) => {
    setFormData({ name: '', type: 'main', date: date, recipe: '' });
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
    
    // Yemek türlerine göre otomatik sıralama: kahvaltı, ana yemek, ara öğün
    const mealTypeOrder = ['breakfast', 'main', 'snack'];
    
    return dayMeals.sort((a, b) => {
      const aIndex = mealTypeOrder.indexOf(a.type);
      const bIndex = mealTypeOrder.indexOf(b.type);
      return aIndex - bIndex;
    });
  };

  const getMealTypeInfo = (type: Meal['type']) => {
    return mealTypes.find(t => t.value === type);
  };

  // Tarifleri favori ve alfabetik sırala
  const getSortedRecipes = () => {
    return recipes.sort((a, b) => {
      // Önce favori durumuna göre sırala (favoriler üstte)
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      // Sonra alfabetik sırala
      return a.name.localeCompare(b.name);
    });
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
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black cursor-pointer"
          >
            ← Önceki Hafta
          </button>
          <div className="text-lg font-semibold text-gray-700">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: tr })} - {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'd MMMM yyyy', { locale: tr })}
          </div>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black cursor-pointer"
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
                      className="absolute top-0 right-0 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer hover:scale-110"
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeInfo?.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{typeInfo?.label}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModalFromMealCard(meal);
                            }}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer hover:scale-110 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeal(meal.id);
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer hover:scale-110 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="font-medium text-sm text-black flex items-center gap-2">
                        {capitalizeWords(meal.name)}
                        {meal.recipe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Yemekten Recipe objesi oluştur
                              const recipeData: Recipe = {
                                id: meal.id,
                                name: meal.name,
                                type: meal.type,
                                recipe: meal.recipe
                              };
                              setSelectedRecipe(recipeData);
                              setShowRecipeViewModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
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
                  <div 
                    className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-colors"
                    onClick={() => openAddModalForDay(day.fullDate)}
                    title={`${day.formatted} gününe yemek ekle`}
                  >
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
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📚 Tüm Tariflerim
            </h2>
          </div>
          
          <div 
            className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-200 ${
              isDraggingToRecipes ? 'bg-red-50 border-2 border-red-200 rounded-lg p-2' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedMeal && draggedMeal.date) {
                e.dataTransfer.dropEffect = 'move';
                setIsDraggingToRecipes(true);
              }
            }}
            onDragLeave={() => setIsDraggingToRecipes(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingToRecipes(false);
              if (draggedMeal && draggedMeal.date) {
                // Gün kartından sürüklenen yemeği sil
                setMeals(meals.filter(meal => meal.id !== draggedMeal.id));
              }
              setDraggedMeal(null);
            }}
          >
            {/* Kahvaltı Kolonu */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌅</span>
                  <h3 className="text-lg font-semibold text-orange-800">Kahvaltı</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'breakfast', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg shadow-md hover:bg-orange-700 transition-colors flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Kahvaltı tariflerinde ara..."
                  value={breakfastSearch}
                  onChange={(e) => setBreakfastSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && breakfastSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === breakfastSearch.trim().toLowerCase())) {
                      const trimmedSearch = breakfastSearch.trim();
                      const newRecipe: Recipe = {
                        id: Date.now().toString(),
                        name: trimmedSearch,
                        type: 'breakfast',
                        recipe: ''
                      };
                      setRecipes([...recipes, newRecipe]);
                      setBreakfastSearch('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-orange-500 focus:outline-none"
                />
                {breakfastSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === breakfastSearch.trim().toLowerCase()) && (
                  <button
                    onClick={() => {
                      const trimmedSearch = breakfastSearch.trim();
                      setEditingMeal(null);
                      setEditingRecipe(null);
                      setFormData({ name: trimmedSearch, type: 'breakfast', date: '', recipe: '' });
                      setShowAddModal(true);
                      setBreakfastSearch('');
                    }}
                    className="mt-2 w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    "{breakfastSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
              </div>
                              <div className="grid grid-cols-2 gap-3">
                {getSortedRecipes()
                  .filter(recipe => recipe.type === 'breakfast')
                  .filter(recipe => 
                    breakfastSearch === '' || 
                    recipe.name.toLowerCase().includes(breakfastSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition-shadow border border-orange-200"
                        draggable
                        onDragStart={(e) => {
                          const newMeal: Meal = {
                            id: Date.now().toString(),
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', newMeal.id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.id);
                              }}
                              className={`transition-colors cursor-pointer hover:scale-110 ${recipe.favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              title={recipe.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                            >
                              <Heart size={12} fill={recipe.favorite ? 'currentColor' : 'none'} />
                            </button>
                            {recipe.recipe && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecipe(recipe);
                                  setShowRecipeViewModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                                title="Tarifi görüntüle"
                              >
                                📝
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRecipeModal(recipe);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi düzenle"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Bu tarifi silmek istediğinizden emin misiniz?')) {
                                  setRecipes(recipes.filter(r => r.id !== recipe.id));
                                }
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi sil"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {recipe.recipe ? 'Tarif mevcut' : 'Tarif yok'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Ana Yemek Kolonu */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  <h3 className="text-lg font-semibold text-green-800">Ana Yemek</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'main', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Ana yemek tariflerinde ara..."
                  value={mainSearch}
                  onChange={(e) => setMainSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mainSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === mainSearch.trim().toLowerCase())) {
                      const trimmedSearch = mainSearch.trim();
                      const newRecipe: Recipe = {
                        id: Date.now().toString(),
                        name: trimmedSearch,
                        type: 'main',
                        recipe: ''
                      };
                      setRecipes([...recipes, newRecipe]);
                      setMainSearch('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-green-500 focus:outline-none"
                />
                {mainSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === mainSearch.trim().toLowerCase()) && (
                  <button
                    onClick={() => {
                      const trimmedSearch = mainSearch.trim();
                      setEditingMeal(null);
                      setEditingRecipe(null);
                      setFormData({ name: trimmedSearch, type: 'main', date: '', recipe: '' });
                      setShowAddModal(true);
                      setMainSearch('');
                    }}
                    className="mt-2 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    "{mainSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
              </div>
                              <div className="grid grid-cols-2 gap-3">
                {getSortedRecipes()
                  .filter(recipe => recipe.type === 'main')
                  .filter(recipe => 
                    mainSearch === '' || 
                    recipe.name.toLowerCase().includes(mainSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition-shadow border border-green-200"
                        draggable
                        onDragStart={(e) => {
                          const newMeal: Meal = {
                            id: Date.now().toString(),
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', newMeal.id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.id);
                              }}
                              className={`transition-colors cursor-pointer hover:scale-110 ${recipe.favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              title={recipe.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                            >
                              <Heart size={12} fill={recipe.favorite ? 'currentColor' : 'none'} />
                            </button>
                            {recipe.recipe && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecipe(recipe);
                                  setShowRecipeViewModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                                title="Tarifi görüntüle"
                              >
                                📝
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRecipeModal(recipe);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi düzenle"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Bu tarifi silmek istediğinizden emin misiniz?')) {
                                  setRecipes(recipes.filter(r => r.id !== recipe.id));
                                }
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi sil"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {recipe.recipe ? 'Tarif mevcut' : 'Tarif yok'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Ara Öğün Kolonu */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍎</span>
                  <h3 className="text-lg font-semibold text-purple-800">Ara Öğün</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'snack', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Ara öğün tariflerinde ara..."
                  value={snackSearch}
                  onChange={(e) => setSnackSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && snackSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === snackSearch.trim().toLowerCase())) {
                      const trimmedSearch = snackSearch.trim();
                      const newRecipe: Recipe = {
                        id: Date.now().toString(),
                        name: trimmedSearch,
                        type: 'snack',
                        recipe: ''
                      };
                      setRecipes([...recipes, newRecipe]);
                      setSnackSearch('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-purple-500 focus:outline-none"
                />
                {snackSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === snackSearch.trim().toLowerCase()) && (
                  <button
                    onClick={() => {
                      const trimmedSearch = snackSearch.trim();
                      setEditingMeal(null);
                      setEditingRecipe(null);
                      setFormData({ name: trimmedSearch, type: 'snack', date: '', recipe: '' });
                      setShowAddModal(true);
                      setSnackSearch('');
                    }}
                    className="mt-2 w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    "{snackSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
              </div>
                              <div className="grid grid-cols-2 gap-3">
                {getSortedRecipes()
                  .filter(recipe => recipe.type === 'snack')
                  .filter(recipe => 
                    snackSearch === '' || 
                    recipe.name.toLowerCase().includes(snackSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition-shadow border border-purple-200"
                        draggable
                        onDragStart={(e) => {
                          const newMeal: Meal = {
                            id: Date.now().toString(),
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', newMeal.id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.id);
                              }}
                              className={`transition-colors cursor-pointer hover:scale-110 ${recipe.favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              title={recipe.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                            >
                              <Heart size={12} fill={recipe.favorite ? 'currentColor' : 'none'} />
                            </button>
                            {recipe.recipe && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecipe(recipe);
                                  setShowRecipeViewModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                                title="Tarifi görüntüle"
                              >
                                📝
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRecipeModal(recipe);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi düzenle"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Bu tarifi silmek istediğinizden emin misiniz?')) {
                                  setRecipes(recipes.filter(r => r.id !== recipe.id));
                                }
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer hover:scale-110"
                              title="Tarifi sil"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {recipe.recipe ? 'Tarif mevcut' : 'Tarif yok'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          
          {getSortedRecipes().length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Henüz tarif eklenmemiş. Tarif ekleyerek burada görebilirsiniz.
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

        {/* Recipe View Modal */}
        <RecipeViewModal
          showModal={showRecipeViewModal}
          recipe={selectedRecipe}
          onClose={() => {
            setShowRecipeViewModal(false);
            setSelectedRecipe(null);
          }}
          onEdit={(recipe) => {
            setShowRecipeViewModal(false);
            setSelectedRecipe(null);
            openEditRecipeModal(recipe);
          }}
        />

        {/* Recipe Edit Modal */}
        <RecipeEditModal
          showModal={showRecipeEditModal}
          editingRecipe={editingRecipe}
          formData={formData}
          onClose={handleCloseRecipeEditModal}
          onSave={handleSaveRecipe}
          onFormChange={handleFormChange}
        />
      </div>
    </div>
  );
}
