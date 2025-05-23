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
    hirerName: v.string(), 
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      title: args.title,
      description: args.description,
      postedBy: args.postedBy,
      wage: args.wage,
      location: args.location,
      clerkId: args.clerkId,
      status: "open", 
      createdAt: args.createdAt,
      paymentStatus: "", 
      paymentMethod: "",
      paymentAmount: "",
      paymentDate: 0,
      hirerName: args.hirerName, 
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

    
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      if (!job.hirerName && job.postedBy) {
        const hirer = await ctx.db.get(job.postedBy);
        if (hirer) {
          return { ...job, hirerName: hirer.name };
        }
      }
      return job;
    }));

    return enrichedJobs;
  }
});

export const acceptJob = mutation({
  args: {
    jobId: v.id('jobs'),
    userId: v.id('users'),
    workerName: v.string(), 
  },
  handler: async (ctx, { jobId, userId, workerName }) => {
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
      workerName: workerName, 
    });
    
    return true;
  },
});

export const getJobsByHirer = query({
  args: {
    hirerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_postedBy", (q: any) => q.eq("postedBy", args.hirerId))
      .filter((q: any) => q.neq(q.field("status"), "completed"))
      .collect();
    
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      if (!job.workerName && job.acceptedBy) {
        const worker = await ctx.db.get(job.acceptedBy);
        if (worker) {
          return { ...job, workerName: worker.name };
        }
      }
      return job;
    }));
    
    return enrichedJobs;
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
    workerName: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    
    if (!job) {
      throw new Error("Job not found");
    }
    
    if (job.status !== "in-progress") {
      throw new Error("This job cannot be completed");
    }
    
    await ctx.db.patch(args.jobId, {
      status: "completed",
      paymentStatus: args.paymentStatus,
      paymentMethod: args.paymentMethod,
      paymentAmount: args.paymentAmount,
      paymentDate: Date.now(),
      workerName: args.workerName, 
    });
    
  },
});

export const getJobById = query({
  args: { jobId: v.optional(v.id('jobs')) },
  handler: async (ctx, args) => {
    if (!args.jobId) return null;
    
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    
    if (!job.hirerName && job.postedBy) {
      const hirer = await ctx.db.get(job.postedBy);
      if (hirer) {
        job.hirerName = hirer.name;
      }
    }
    
    if (!job.workerName && job.acceptedBy) {
      const worker = await ctx.db.get(job.acceptedBy);
      if (worker) {
        job.workerName = worker.name;
      }
    }
    
    return job;
  },
});

export const getJobsByWorker = query({
  args: {
    workerId: v.id("users"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("pending")
    )),
  },
  handler: async (ctx, args) => {
    let jobsQuery = ctx.db
      .query("jobs")
      .withIndex("by_acceptedBy", (q) => q.eq("acceptedBy", args.workerId));
    
    if (args.status) {
      jobsQuery = jobsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const jobs = await jobsQuery.collect();
    
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      if (!job.hirerName && job.postedBy) {
        const hirer = await ctx.db.get(job.postedBy);
        if (hirer) {
          return { ...job, hirerName: hirer.name };
        }
      }
      return job;
    }));
    
    return enrichedJobs;
  },
});

export const getActiveJobsByWorker = query({
  args: {
    workerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_acceptedBy", (q) => q.eq("acceptedBy", args.workerId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .collect();
    
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      if (!job.hirerName && job.postedBy) {
        const hirer = await ctx.db.get(job.postedBy);
        if (hirer) {
          return { ...job, hirerName: hirer.name };
        }
      }
      return job;
    }));
    
    return enrichedJobs;
  },
});

export const getCompletedJobsByWorker = query({
  args: {
    workerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_acceptedBy", (q) => q.eq("acceptedBy", args.workerId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    
    
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      if (!job.hirerName && job.postedBy) {
        const hirer = await ctx.db.get(job.postedBy);
        if (hirer) {
          return { ...job, hirerName: hirer.name };
        }
      }
      return job;
    }));
    
    return enrichedJobs;
  },
});


export const getAcceptedJobsByWorker = query({
  args: { workerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.eq(q.field("acceptedBy"), args.workerId),
          q.eq(q.field("status"), "in-progress")
        )
      )
      .collect();
  },
});

export const getAcceptedJobsByHirer = query({
  args: { hirerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.eq(q.field("postedBy"), args.hirerId),
          q.eq(q.field("status"), "in-progress")
        )
      )
      .collect();
  },
});