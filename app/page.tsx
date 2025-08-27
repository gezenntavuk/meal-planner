'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Edit, Trash2, Calendar, Utensils, Heart } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import MealModal from '@/components/MealModal';
import RecipeViewModal from '@/components/RecipeViewModal';
import RecipeEditModal from '@/components/RecipeEditModal';

import { Id } from '../convex/_generated/dataModel';

interface Meal {
  _id: Id<"meals">;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  date: string;
  notes?: string;
  order: number; // Sıralama için
  recipe?: string; // Yemek tarifi
}

interface Recipe {
  _id: Id<"recipes">;
  name: string;
  type: 'breakfast' | 'main' | 'snack';
  recipe?: string; // Yemek tarifi
  favorite?: boolean; // Favori işaretleme
}

export default function MealPlanner() {
  // Convex hooks
  const meals = useQuery(api.meals.getAll) || [];
  const recipes = useQuery(api.recipes.getAll) || [];
  


  const createMeal = useMutation(api.meals.create);
  const updateMeal = useMutation(api.meals.update);
  const deleteMeal = useMutation(api.meals.remove);
  const createRecipe = useMutation(api.recipes.create);
  const updateRecipe = useMutation(api.recipes.update);
  const deleteRecipe = useMutation(api.recipes.remove);
  const toggleFavorite = useMutation(api.recipes.toggleFavorite);

  
  // Seed fonksiyonları kaldırıldı

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRecipeViewModal, setShowRecipeViewModal] = useState(false);
  const [showRecipeEditModal, setShowRecipeEditModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [draggedMeal, setDraggedMeal] = useState<any>(null);
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

  // Otomatik örnek veri yükleme kaldırıldı - artık sadece seed butonları kullanılacak

  const handleSaveMeal = async () => {
    if (!formData.name) return;

    if (editingMeal) {
      // Yemek düzenleme modu
      const oldMealName = editingMeal.name;
      const newMealName = formData.name;
      
      // Yemeği güncelle
      await updateMeal({
        id: editingMeal._id,
        name: formData.name,
        type: formData.type,
        date: formData.date,
        notes: formData.recipe,
        order: editingMeal.order,
        recipe: formData.recipe
      });
      
      // Aşağıdaki aynı isimli tarifi de güncelle
      const matchingRecipe = recipes.find(recipe => recipe.name === oldMealName);
      if (matchingRecipe) {
        await updateRecipe({
          id: matchingRecipe._id,
          name: newMealName,
          type: formData.type,
          recipe: formData.recipe
        });
      }
      
      setEditingMeal(null);
    } else if (formData.date) {
      // Yeni yemek ekleme (tarih varsa)
      const dayMeals = meals.filter(meal => meal.date === formData.date);
      const maxOrder = dayMeals.length > 0 ? Math.max(...dayMeals.map(m => m.order)) : -1;
      
      await createMeal({
        name: formData.name,
        type: formData.type,
        date: formData.date,
        order: maxOrder + 1,
        recipe: formData.recipe
      });
    } else {
      // Yeni tarif ekleme (tarih yoksa)
      await createRecipe({
        name: formData.name,
        type: formData.type,
        recipe: formData.recipe
      });
    }

    // Sadece name, date ve recipe'yi sıfırla, type'ı koru
    setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    setShowAddModal(false);
  };

  const handleSaveRecipe = async () => {
    if (!formData.name || !editingRecipe) return;

    // Tarif düzenleme modu
    const oldRecipeName = editingRecipe.name;
    const newRecipeName = formData.name;
    
    // Tarifi güncelle
    await updateRecipe({
      id: editingRecipe._id,
      name: formData.name,
      type: formData.type,
      recipe: formData.recipe
    });
    
    // Yukarıdaki aynı isimli yemekleri de güncelle
    const matchingMeals = meals.filter(meal => meal.name === oldRecipeName);
    for (const meal of matchingMeals) {
              await updateMeal({
          id: meal._id,
          name: newRecipeName,
          type: formData.type,
          date: meal.date,
          notes: meal.notes,
          order: meal.order,
          recipe: formData.recipe
        });
    }
    
    setEditingRecipe(null);
    setFormData({ name: '', type: formData.type, date: '', recipe: '' });
    setShowRecipeEditModal(false);
  };

  const handleToggleFavorite = async (recipeId: Id<"recipes">) => {
    await toggleFavorite({ id: recipeId });
  };

  const handleDeleteMeal = async (id: Id<"meals">) => {
    await deleteMeal({ id });
  };

  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      type: meal.type,
      date: meal.date,
      recipe: meal.recipe || '',
      branches: meal.branches || []
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
      // Convex'te toplu silme işlemi için ayrı bir mutation gerekir
      console.log('Clear all meals - Convex\'te henüz desteklenmiyor');
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

  // Tarifleri sırala - favoriler önce, sonra alfabetik
  const getSortedRecipes = () => {
    return recipes.sort((a, b) => {
      // Önce favori durumuna göre sırala (favoriler önce)
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      
      // Favori durumu aynıysa alfabetik sırala
      return a.name.localeCompare(b.name);
    });
  };

  // Tarif filtreleme fonksiyonu
  const getFilteredRecipes = (type: 'breakfast' | 'main' | 'snack') => {
    return getSortedRecipes().filter(recipe => recipe.type === type);
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
    e.dataTransfer.setData('text/html', meal._id);
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
          createMeal({
            name: draggedMeal.name,
            type: draggedMeal.type,
            date: targetDate,
            order: maxOrder + 1,
            recipe: draggedMeal.recipe
          });
        } else {
          // Normal sürükleme - yemeği taşı
          updateMeal({
            id: draggedMeal._id,
            name: draggedMeal.name,
            type: draggedMeal.type,
            date: targetDate,
            notes: draggedMeal.notes,
            order: maxOrder + 1,
            recipe: draggedMeal.recipe
          });
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Utensils className="text-green-600 w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Haftalık Yemek Planlayıcısı</span>
            <span className="sm:hidden">Yemek Planlayıcısı</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Bu hafta hangi yemekleri yiyeceğinizi planlayın</p>
          

        </div>

        {/* Week Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black cursor-pointer text-sm sm:text-base"
          >
            ← Önceki Hafta
          </button>
          <div className="text-sm sm:text-lg font-semibold text-gray-700 text-center">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: tr })} - {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'd MMMM yyyy', { locale: tr })}
          </div>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-black cursor-pointer text-sm sm:text-base"
          >
            Sonraki Hafta →
          </button>
        </div>



        {/* Weekly Calendar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
          {weekDays.map((day) => {
            const isToday = day.fullDate === format(new Date(), 'yyyy-MM-dd');
            return (
              <div 
                key={day.fullDate} 
                className={`rounded-lg shadow-md p-2 sm:p-4 transition-all duration-200 ${
                  isToday 
                    ? 'bg-gradient-to-br from-green-100 to-blue-100 border-2 border-green-400 shadow-lg' 
                    : 'bg-white'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.fullDate)}
              >
                <div className="text-center mb-2 sm:mb-3">
                  <div className={`text-xs sm:text-sm ${isToday ? 'text-green-700 font-medium' : 'text-black'} relative`}>
                    <div className="text-center">{day.formatted}</div>
                    <button
                      onClick={() => openAddModalForDay(day.fullDate)}
                      className="absolute top-0 right-0 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer hover:scale-110"
                      title={`${day.formatted} gününe yemek ekle`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className={`text-base sm:text-lg font-semibold ${isToday ? 'text-green-800' : 'text-black'}`}>
                    {day.shortDate}
                    {isToday && <span className="ml-1 sm:ml-2 text-xs bg-green-500 text-white px-1 sm:px-2 py-1 rounded-full">Bugün</span>}
                  </div>
                </div>
              
              <div className="space-y-1 sm:space-y-2 min-h-[80px] sm:min-h-[100px]">
                {getMealsForDay(day.fullDate).map((meal) => {
                  const typeInfo = getMealTypeInfo(meal.type);
                  const isDragging = draggedMeal?._id === meal._id;
                  return (
                    <div 
                      key={meal._id} 
                      data-meal-id={meal._id}
                      className={`rounded-lg p-2 sm:p-3 cursor-move transition-all duration-200 ${
                        isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      } ${
                        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, meal)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-base sm:text-lg">{typeInfo?.icon}</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">{typeInfo?.label}</span>
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
                              handleDeleteMeal(meal._id);
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer hover:scale-110 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="font-medium text-xs sm:text-sm text-black flex items-center gap-1 sm:gap-2">
                        {capitalizeWords(meal.name)}
                        {meal.recipe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Yemekten Recipe objesi oluştur - geçici olarak
                              const recipeData = {
                                _id: "temp" as Id<"recipes">,
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
                    className="text-center text-gray-400 text-xs sm:text-sm py-4 sm:py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-colors"
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
        <div className="mt-8 sm:mt-12">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              📚 Tüm Tariflerim
            </h2>
          </div>
          
          <div 
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-200 ${
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
                deleteMeal({ id: draggedMeal._id });
              }
              setDraggedMeal(null);
            }}
          >
            {/* Kahvaltı Kolonu */}
            <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl">🌅</span>
                  <h3 className="text-base sm:text-lg font-semibold text-orange-800">Kahvaltı</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'breakfast', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded-lg shadow-md hover:bg-orange-700 transition-colors flex items-center gap-1 text-xs sm:text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="Kahvaltı tariflerinde ara..."
                  value={breakfastSearch}
                  onChange={(e) => setBreakfastSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && breakfastSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === breakfastSearch.trim().toLowerCase())) {
                      const trimmedSearch = breakfastSearch.trim();
                      createRecipe({
                        name: trimmedSearch,
                        type: 'breakfast',
                        recipe: ''
                      });
                      setBreakfastSearch('');
                    }
                  }}
                  className="w-full px-2 sm:px-3 py-2 border border-orange-300 rounded-lg text-xs sm:text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-orange-500 focus:outline-none"
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
                    className="mt-2 w-full px-2 sm:px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Plus size={14} />
                    "{breakfastSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
                

              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {getFilteredRecipes('breakfast')
                  .filter(recipe => 
                    breakfastSearch === '' || 
                    recipe.name.toLowerCase().includes(breakfastSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe._id}
                        className={`rounded-lg shadow-md p-2 sm:p-3 cursor-move hover:shadow-lg transition-shadow border ${
                          recipe.favorite 
                            ? 'bg-red-50 border-red-300 shadow-lg' 
                            : 'bg-white border-orange-200'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          const newMeal = {
                            _id: recipe._id,
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', recipe._id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe._id);
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
                                  deleteRecipe({ id: recipe._id });
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
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl">🍽️</span>
                  <h3 className="text-base sm:text-lg font-semibold text-green-800">Ana Yemek</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'main', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center gap-1 text-xs sm:text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="Ana yemek tariflerinde ara..."
                  value={mainSearch}
                  onChange={(e) => setMainSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mainSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === mainSearch.trim().toLowerCase())) {
                      const trimmedSearch = mainSearch.trim();
                      createRecipe({
                        name: trimmedSearch,
                        type: 'main',
                        recipe: ''
                      });
                      setMainSearch('');
                    }
                  }}
                  className="w-full px-2 sm:px-3 py-2 border border-green-300 rounded-lg text-xs sm:text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-green-500 focus:outline-none"
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
                    className="mt-2 w-full px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Plus size={14} />
                    "{mainSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
                

              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {getFilteredRecipes('main')
                  .filter(recipe => 
                    mainSearch === '' || 
                    recipe.name.toLowerCase().includes(mainSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe._id}
                        className={`rounded-lg shadow-md p-2 sm:p-3 cursor-move hover:shadow-lg transition-shadow border ${
                          recipe.favorite 
                            ? 'bg-red-50 border-red-300 shadow-lg' 
                            : 'bg-white border-green-200'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          const newMeal = {
                            _id: recipe._id,
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', recipe._id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe._id);
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
                                  deleteRecipe({ id: recipe._id });
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
            <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl">🍎</span>
                  <h3 className="text-base sm:text-lg font-semibold text-purple-800">Ara Öğün</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMeal(null);
                    setEditingRecipe(null);
                    setFormData({ name: '', type: 'snack', date: '', recipe: '' });
                    setShowAddModal(true);
                  }}
                  className="px-2 sm:px-3 py-1 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors flex items-center gap-1 text-xs sm:text-sm cursor-pointer"
                >
                  <Plus size={12} />
                  Ekle
                </button>
              </div>
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="Ara öğün tariflerinde ara..."
                  value={snackSearch}
                  onChange={(e) => setSnackSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && snackSearch.trim().length > 0 && !recipes.some(recipe => recipe.name.toLowerCase() === snackSearch.trim().toLowerCase())) {
                      const trimmedSearch = snackSearch.trim();
                      createRecipe({
                        name: trimmedSearch,
                        type: 'snack',
                        recipe: ''
                      });
                      setSnackSearch('');
                    }
                  }}
                  className="w-full px-2 sm:px-3 py-2 border border-purple-300 rounded-lg text-xs sm:text-sm text-gray-800 placeholder-gray-500 focus:border-2 focus:border-purple-500 focus:outline-none"
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
                    className="mt-2 w-full px-2 sm:px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Plus size={14} />
                    "{snackSearch.trim()}" olarak yeni tarif ekle
                  </button>
                )}
                

              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {getFilteredRecipes('snack')
                  .filter(recipe => 
                    snackSearch === '' || 
                    recipe.name.toLowerCase().includes(snackSearch.toLowerCase())
                  )
                  .map((recipe) => {
                    const typeInfo = getMealTypeInfo(recipe.type);
                    return (
                      <div
                        key={recipe._id}
                        className={`rounded-lg shadow-md p-2 sm:p-3 cursor-move hover:shadow-lg transition-shadow border ${
                          recipe.favorite 
                            ? 'bg-red-50 border-red-300 shadow-lg' 
                            : 'bg-white border-purple-200'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          const newMeal = {
                            _id: recipe._id,
                            name: recipe.name,
                            type: recipe.type,
                            date: '',
                            order: 0,
                            recipe: recipe.recipe
                          };
                          setDraggedMeal(newMeal);
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/html', recipe._id);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-lg text-gray-800 flex-1 mr-2">{capitalizeWords(recipe.name)}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe._id);
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
                                  deleteRecipe({ id: recipe._id });
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
