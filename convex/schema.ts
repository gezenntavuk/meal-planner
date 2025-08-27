import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meals: defineTable({
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    date: v.string(), // ISO date string
    notes: v.optional(v.string()),
    order: v.number(), // Sıralama için
    recipe: v.optional(v.string()), // Yemek tarifi
    userId: v.optional(v.string()), // Gelecekte kullanıcı sistemi için
  }).index("by_date", ["date"]).index("by_type", ["type"]),

  recipes: defineTable({
    name: v.string(),
    type: v.union(v.literal("breakfast"), v.literal("main"), v.literal("snack")),
    recipe: v.optional(v.string()), // Yemek tarifi
    favorite: v.optional(v.boolean()), // Favori işaretleme
    userId: v.optional(v.string()), // Gelecekte kullanıcı sistemi için
  }).index("by_type", ["type"]).index("by_favorite", ["favorite"]),
});
