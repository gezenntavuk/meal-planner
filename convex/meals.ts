import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Tüm yemekleri getir
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("meals").order("desc").collect();
  },
});

// Belirli bir tarihteki yemekleri getir
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meals")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("asc")
      .collect();
  },
});

// Yemek ekle
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    date: v.string(),
    notes: v.optional(v.string()),
    order: v.number(),
    recipe: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("meals", args);
  },
});

// Yemek güncelle
export const update = mutation({
  args: {
    id: v.id("meals"),
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    date: v.string(),
    notes: v.optional(v.string()),
    order: v.number(),
    recipe: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

// Yemek sil
export const remove = mutation({
  args: { id: v.id("meals") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
