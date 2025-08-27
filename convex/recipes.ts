import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Tüm tarifleri getir
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recipes").order("asc").collect();
  },
});

// Belirli türdeki tarifleri getir
export const getByType = query({
  args: { type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("asc")
      .collect();
  },
});

// Tarif ekle
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    recipe: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", args);
  },
});

// Tarif güncelle
export const update = mutation({
  args: {
    id: v.id("recipes"),
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    recipe: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

// Tarif sil
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Favori durumunu toggle et
export const toggleFavorite = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) {
      throw new Error("Tarif bulunamadı");
    }
    
    const newFavorite = !recipe.favorite;
    return await ctx.db.patch(args.id, { favorite: newFavorite });
  },
});

// Favori tarifleri getir
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_favorite", (q) => q.eq("favorite", true))
      .order("asc")
      .collect();
  },
});
