import {action, mutation, query} from "./_generated/server"
import {v} from "convex/values"

export const createUser = mutation({
    args:{
        name: v.string(),
        email: v.string(),
        role: v.union(v.literal("hirer"), v.literal("worker"), v.literal("pending")),
        skills: v.optional(v.array(v.string())),
        bio: v.optional(v.string()),
        location: v.optional(
            v.string()
        ),
        profileImageUrl: v.optional(v.string()),
        clerkId: v.string()
    },
    handler: async(ctx, args)=>{
        const existingUser = await ctx.db.query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
        .first();
        if(existingUser) return;

        await ctx.db.insert("users", {
            name:args.name,
            email:args.email,
            role:args.role,
            skills:args.skills,
            bio:args.bio,
            location:args.location,
            profileImageUrl: args.profileImageUrl,
            rating: 0,
            jobsCompleted: 0,
            clerkId: args.clerkId,
        })
    }
})

export const getUserByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    },
  });
  
  // Define a query to get user profile by clerkId
export const getUserProfile = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
      
      return user;
    },
});


  
  // Update user profile
  export const updateUserProfile = mutation({
    args: {
      clerkId: v.string(),
      role: v.union(v.literal("hirer"), v.literal("worker")),
      bio: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      location: v.optional(
        v.string()
      ),
    },
    handler: async (ctx, args) => {
      // Find the user by clerkId
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
      
      if (!existingUser) {
        throw new Error("User not found");
      }
      
      // Update the user with the new information
      await ctx.db.patch(existingUser._id, {
        role: args.role,
        bio: args.bio,
        skills: args.skills,
        location: args.location,
      });
      
      return existingUser._id;
    },
  });

  