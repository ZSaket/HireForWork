import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    
    if (job.status !== "in-progress" && job.status !== "completed") {
      throw new Error("Chat is only available for jobs in progress or completed");
    }

    if (!((job.postedBy === args.senderId && job.acceptedBy === args.receiverId) || 
         (job.postedBy === args.receiverId && job.acceptedBy === args.senderId))) {
      throw new Error("Unauthorized to send messages for this job");
    }

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


export const getMessagesByJobId = query({
  args: {
    jobId: v.id("jobs"),
    userId: v.id("users"), 
  },
  handler: async (ctx, args) => {
    
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.postedBy !== args.userId && job.acceptedBy !== args.userId) {
      throw new Error("Unauthorized to view messages for this job");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .order("asc")
      .collect();

    return messages;
  },
});


export const markMessagesAsRead = mutation({
    args: {
      jobId: v.id("jobs"),
      userId: v.id("users"), 
    },
    handler: async (ctx, args) => {
      
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_receiver", (q) => 
          q.eq("receiverId", args.userId).eq("read", false)
        )
        .filter((q) => q.eq(q.field("jobId"), args.jobId))
        .collect();
  
      await Promise.all(
        unreadMessages.map((message) =>
          ctx.db.patch(message._id, { read: true })
        )
      );
  
      return unreadMessages.length;
    },
  });

export const getUnreadMessageCounts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {

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