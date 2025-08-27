import { mutation } from "./_generated/server";
import mealsData from "../meals.json";
import recipesData from "../recipes.json";

// Seed fonksiyonu - veritabanını başlangıç verileriyle doldurur
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Veritabanı seed işlemi başlatılıyor...");
    
    // Mevcut verileri kontrol et
    const existingMeals = await ctx.db.query("meals").collect();
    const existingRecipes = await ctx.db.query("recipes").collect();
    
    if (existingMeals.length > 0 || existingRecipes.length > 0) {
      console.log("Veritabanında zaten veri mevcut. Seed işlemi atlanıyor.");
      return {
        mealsAdded: 0,
        recipesAdded: 0,
        message: "Veritabanında zaten veri mevcut"
      };
    }

    let mealsAdded = 0;
    let recipesAdded = 0;

    // Meals verilerini ekle
    for (const meal of mealsData) {
      try {
        await ctx.db.insert("meals", {
          name: meal.name,
          type: meal.type as "breakfast" | "main" | "snack",
          date: meal.date,
          notes: meal.notes || "",
          order: meal.order || 0,
          recipe: meal.recipe || "",
        });
        mealsAdded++;
      } catch (error) {
        console.error(`Meal eklenirken hata: ${meal.name}`, error);
      }
    }

    // Recipes verilerini ekle
    for (const recipe of recipesData) {
      try {
        await ctx.db.insert("recipes", {
          name: recipe.name,
          type: recipe.type as "breakfast" | "main" | "snack",
          recipe: recipe.recipe || "",
          favorite: recipe.favorite || false,
        });
        recipesAdded++;
      } catch (error) {
        console.error(`Recipe eklenirken hata: ${recipe.name}`, error);
      }
    }

    console.log(`Seed işlemi tamamlandı: ${mealsAdded} meal, ${recipesAdded} recipe eklendi`);
    
    return {
      mealsAdded,
      recipesAdded,
      message: `Seed işlemi başarılı: ${mealsAdded} meal, ${recipesAdded} recipe eklendi`
    };
  },
});

// Veritabanını temizleme fonksiyonu (geliştirme için)
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Veritabanı temizleme işlemi başlatılıyor...");
    
    // Tüm meals'leri sil
    const meals = await ctx.db.query("meals").collect();
    for (const meal of meals) {
      await ctx.db.delete(meal._id);
    }
    
    // Tüm recipes'leri sil
    const recipes = await ctx.db.query("recipes").collect();
    for (const recipe of recipes) {
      await ctx.db.delete(recipe._id);
    }
    
    console.log(`Veritabanı temizlendi: ${meals.length} meal, ${recipes.length} recipe silindi`);
    
    return {
      mealsDeleted: meals.length,
      recipesDeleted: recipes.length,
      message: `Veritabanı temizlendi: ${meals.length} meal, ${recipes.length} recipe silindi`
    };
  },
});

// Sadece recipes'leri seed etme fonksiyonu
export const seedRecipesOnly = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Recipes seed işlemi başlatılıyor...");
    
    const existingRecipes = await ctx.db.query("recipes").collect();
    
    if (existingRecipes.length > 0) {
      console.log("Recipes tablosunda zaten veri mevcut. Seed işlemi atlanıyor.");
      return {
        recipesAdded: 0,
        message: "Recipes tablosunda zaten veri mevcut"
      };
    }

    let recipesAdded = 0;

    // Recipes verilerini ekle
    for (const recipe of recipesData) {
      try {
        await ctx.db.insert("recipes", {
          name: recipe.name,
          type: recipe.type as "breakfast" | "main" | "snack",
          recipe: recipe.recipe || "",
          favorite: recipe.favorite || false,
        });
        recipesAdded++;
      } catch (error) {
        console.error(`Recipe eklenirken hata: ${recipe.name}`, error);
      }
    }

    console.log(`Recipes seed işlemi tamamlandı: ${recipesAdded} recipe eklendi`);
    
    return {
      recipesAdded,
      message: `Recipes seed işlemi başarılı: ${recipesAdded} recipe eklendi`
    };
  },
});

// Sadece meals'leri seed etme fonksiyonu
export const seedMealsOnly = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Meals seed işlemi başlatılıyor...");
    
    const existingMeals = await ctx.db.query("meals").collect();
    
    if (existingMeals.length > 0) {
      console.log("Meals tablosunda zaten veri mevcut. Seed işlemi atlanıyor.");
      return {
        mealsAdded: 0,
        message: "Meals tablosunda zaten veri mevcut"
      };
    }

    let mealsAdded = 0;

    // Meals verilerini ekle
    for (const meal of mealsData) {
      try {
        await ctx.db.insert("meals", {
          name: meal.name,
          type: meal.type as "breakfast" | "main" | "snack",
          date: meal.date,
          notes: meal.notes || "",
          order: meal.order || 0,
          recipe: meal.recipe || "",
        });
        mealsAdded++;
      } catch (error) {
        console.error(`Meal eklenirken hata: ${meal.name}`, error);
      }
    }

    console.log(`Meals seed işlemi tamamlandı: ${mealsAdded} meal eklendi`);
    
    return {
      mealsAdded,
      message: `Meals seed işlemi başarılı: ${mealsAdded} meal eklendi`
    };
  },
});
