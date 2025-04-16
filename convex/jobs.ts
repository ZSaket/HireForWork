// convex/jobs.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    postedBy: v.id("users"),
    acceptedBy: v.optional(v.id("users")),
    wage: v.string(),
    location: v.string(),
    clerkId: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("jobs", args);
  },
});

export const getAllOpenJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query('jobs')
      .filter((q) => q.eq(q.field('status'), 'open'))
      .collect();

    return jobs;
  }
});

export const acceptJob = mutation({
  args: {
    jobId: v.id('jobs'),
    userId: v.id('users'),
  },
  handler: async (ctx, { jobId, userId }) => {
    await ctx.db.patch(jobId, {
      acceptedBy: userId,
      status: 'in-progress',
    });
  },
});

export const getJobsByHirer = query({
    args: {
      hirerId: v.id("users"),
    },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("jobs")
        .withIndex("by_postedBy", (q) => q.eq("postedBy", args.hirerId))
        .order("desc")
        .collect();
    },
  });