import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("hirer"), v.literal("worker"), v.literal("pending")),
    skills: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    rating: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
    jobsCompleted: v.optional(v.number()),
    clerkId: v.string()
  }).index("by_clerk_id", ["clerkId"]),

  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    postedBy: v.id("users"),
    acceptedBy: v.optional(v.id("users")),
    hirerName: v.optional(v.string()),
    workerName: v.optional(v.string()),
    wage: v.string(),
    location: v.string(),
    clerkId: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("pending")
    ),
    createdAt: v.number(),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.string()
    )),
    paymentMethod: v.optional(v.string()),
    paymentAmount: v.optional(v.string()),
    paymentDate: v.optional(v.number())
  })
  .index("by_postedBy", ["postedBy"])
  .index("by_postedBy_status", ["postedBy", "status"]),

  payments: defineTable({
    jobId: v.id("jobs"),
    hirerId: v.id("users"),
    workerId: v.id("users"),
    amount: v.number(),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"), v.string()),
    createdAt: v.number(),
    paymentMethod: v.string(),
    transactionId: v.optional(v.string())
  }),

  reviews: defineTable({
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    reviewerName: v.optional(v.string()),
    revieweeName: v.optional(v.string()),
    jobId: v.id("jobs"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_reviewer", ["reviewerId"])
    .index("by_reviewee", ["revieweeId"])
    .index("by_job", ["jobId"])
    .index("by_job_reviewer", ["jobId", "reviewerId"]),
});