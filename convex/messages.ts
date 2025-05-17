import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a message in a chat
export const sendMessage = mutation({
  args: {
    jobId: v.id("jobs"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    senderName: v.optional(v.string()),
    receiverName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate that the job exists and the sender is either the hirer or the worker
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Ensure the worker has accepted the job
    if (job.status !== "in-progress" && job.status !== "completed") {
      throw new Error("Chat is only available for jobs in progress or completed");
    }

    // Verify that both users are part of this job
    if (!((job.postedBy === args.senderId && job.acceptedBy === args.receiverId) || 
         (job.postedBy === args.receiverId && job.acceptedBy === args.senderId))) {
      throw new Error("Unauthorized to send messages for this job");
    }

    // Get user names if not provided
    let senderName = args.senderName;
    let receiverName = args.receiverName;

    if (!senderName) {
      const sender = await ctx.db.get(args.senderId);
      senderName = sender?.name;
    }

    if (!receiverName) {
      const receiver = await ctx.db.get(args.receiverId);
      receiverName = receiver?.name;
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      jobId: args.jobId,
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      createdAt: Date.now(),
      read: false,
      senderName,
      receiverName,
    });

    return messageId;
  },
});

// Get all messages for a specific job
export const getMessagesByJobId = query({
  args: {
    jobId: v.id("jobs"),
    userId: v.id("users"), // Current user ID for authorization
  },
  handler: async (ctx, args) => {
    // Verify that the user is part of this job
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.postedBy !== args.userId && job.acceptedBy !== args.userId) {
      throw new Error("Unauthorized to view messages for this job");
    }

    // Get all messages for this job, sorted by creation time
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
    args: {
      jobId: v.id("jobs"),
      userId: v.id("users"), // The user who is reading the messages
    },
    handler: async (ctx, args) => {
      // Find all unread messages sent to this user for this job
      // Using by_receiver index instead, which is more appropriate for this query
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_receiver", (q) => 
          q.eq("receiverId", args.userId).eq("read", false)
        )
        .filter((q) => q.eq(q.field("jobId"), args.jobId))
        .collect();
  
      // Mark all messages as read
      await Promise.all(
        unreadMessages.map((message) =>
          ctx.db.patch(message._id, { read: true })
        )
      );
  
      return unreadMessages.length;
    },
  });

// Get unread message counts for a user
export const getUnreadMessageCounts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all jobs where the user is either the hirer or worker
    const asHirer = await ctx.db
      .query("jobs")
      .withIndex("by_postedBy", (q) => q.eq("postedBy", args.userId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .collect();

    const asWorker = await ctx.db
      .query("jobs")
      .withIndex("by_acceptedBy", (q) => q.eq("acceptedBy", args.userId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .collect();

    const allJobs = [...asHirer, ...asWorker];

    // Get unread message counts for each job
    const unreadCounts = await Promise.all(
      allJobs.map(async (job) => {
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_receiver", (q) => 
            q.eq("receiverId", args.userId).eq("read", false)
          )
          .filter((q) => q.eq(q.field("read"), false))
          .collect();

        return {
          jobId: job._id,
          jobTitle: job.title,
          hirerName: job.hirerName,
          workerName: job.workerName,
          unreadCount: unreadMessages.length,
          otherPartyName: job.postedBy === args.userId ? job.workerName : job.hirerName,
          otherPartyId: job.postedBy === args.userId ? job.acceptedBy : job.postedBy,
        };
      })
    );

    return unreadCounts.filter(count => count.unreadCount > 0);
  },
});


export const getUserChats = query({
  
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {

    if (!args.userId) {
      return []; 
    }
    
    const userId = args.userId;

    const asHirer = await ctx.db
      .query("jobs")
      .withIndex("by_postedBy", (q) => q.eq("postedBy", userId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .collect();

    const asWorker = await ctx.db
      .query("jobs")
      .withIndex("by_acceptedBy", (q) => q.eq("acceptedBy", userId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .collect();

    const allJobs = [...asHirer, ...asWorker];

    const chats = await Promise.all(
      allJobs.map(async (job) => {
        const latestMessage = await ctx.db
          .query("messages")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .order("desc")
          .first();

        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("receiverId"), userId),
              q.eq(q.field("read"), false)
            )
          )
          .collect();

        return {
          jobId: job._id,
          jobTitle: job.title,
          hirerName: job.hirerName,
          workerName: job.workerName,
          isHirer: job.postedBy === userId,
          otherPartyName: job.postedBy === userId ? job.workerName : job.hirerName,
          otherPartyId: job.postedBy === userId ? job.acceptedBy : job.postedBy,
          latestMessage: latestMessage ? latestMessage.content : null,
          latestMessageTime: latestMessage ? latestMessage.createdAt : job.createdAt,
          unreadCount: unreadMessages.length,
        };
      })
    );

    return chats.sort((a, b) => b.latestMessageTime - a.latestMessageTime);
  },
});