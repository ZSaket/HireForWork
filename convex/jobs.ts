import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    postedBy: v.id("users"),
    wage: v.string(),
    location: v.string(),
    clerkId: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      title: args.title,
      description: args.description,
      postedBy: args.postedBy,
      wage: args.wage,
      location: args.location,
      clerkId: args.clerkId,
      status: "open", // Set initial status to open
      createdAt: args.createdAt,
      paymentStatus: "", // Initialize empty payment fields
      paymentMethod: "",
      paymentAmount: "",
      paymentDate: 0
    });
    return jobId;
  },
});

export const getAllOpenJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query('jobs')
      .filter((q: any) => q.eq(q.field('status'), 'open'))
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
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    
    if (job.status !== "open") {
      throw new Error("This job is not available");
    }
    
    await ctx.db.patch(jobId, {
      acceptedBy: userId,
      status: 'in-progress',
    });
    
    return true;
  },
});

export const getJobsByHirer = query({
  args: {
    hirerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Only fetch jobs that aren't completed
    return await ctx.db
      .query("jobs")
      .withIndex("by_postedBy", (q: any) => q.eq("postedBy", args.hirerId))
      .filter((q: any) => q.neq(q.field("status"), "completed"))
      .collect();
  },
});

export const getJobsByStatus = query({
  args: {
    hirerId: v.id("users"),
    status: v.union(
      v.literal("open"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_postedBy_status", (q: any) => 
        q.eq("postedBy", args.hirerId).eq("status", args.status)
      )
      .collect();
  },
});

export const completeJob = mutation({
  args: {
    jobId: v.id("jobs"),
    paymentStatus: v.string(),
    paymentMethod: v.string(),
    paymentAmount: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    
    if (!job) {
      throw new Error("Job not found");
    }
    
    if (job.status !== "in-progress") {
      throw new Error("This job cannot be completed");
    }
    
    // Update the job with payment info and status
    await ctx.db.patch(args.jobId, {
      status: "completed",
      paymentStatus: args.paymentStatus,
      paymentMethod: args.paymentMethod,
      paymentAmount: args.paymentAmount,
      paymentDate: Date.now()
    });
    
    // If this job has a worker, create a payment record
    if (job.acceptedBy) {
      await ctx.db.insert("payments", {
        jobId: args.jobId,
        hirerId: job.postedBy,
        workerId: job.acceptedBy,
        amount: parseFloat(args.paymentAmount),
        paymentStatus: args.paymentStatus, // Use the passed in status instead of hardcoded value
        createdAt: Date.now(),
        paymentMethod: args.paymentMethod,
      });
      
      // Optionally, update the worker's jobsCompleted count
      const worker = await ctx.db.get(job.acceptedBy);
      if (worker) {
        const jobsCompleted = worker.jobsCompleted || 0;
        await ctx.db.patch(job.acceptedBy, {
          jobsCompleted: jobsCompleted + 1
        });
      }
    }
    
    return true;
  },
});