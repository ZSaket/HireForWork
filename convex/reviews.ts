import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createReview = mutation({
  args: {
    revieweeId: v.id('users'),
    jobId: v.id('jobs'),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: You must be logged in to submit a review');
    }
    
    const userId = identity.subject;
    
    const reviewer = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', userId))
      .unique();
    
    if (!reviewer) {
      throw new Error('User not found');
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.paymentStatus !== 'completed') {
      throw new Error('Cannot review a job that has not been completed and paid');
    }
    
    
    if (job.postedBy !== reviewer._id) {
      throw new Error('Only the hirer can review this job');
    }
 
    const reviewee = await ctx.db.get(args.revieweeId);
    if (!reviewee) {
      throw new Error('Reviewee not found');
    }

    return ctx.db.insert('reviews', {
      reviewerId: reviewer._id,
      revieweeId: args.revieweeId,
      jobId: args.jobId,
      rating: args.rating,
      comment: args.comment,
      createdAt: args.createdAt,
      reviewerName: reviewer.name, 
      revieweeName: reviewee.name,  
    });
  },
});

export const getReviewsByReviewee = query({
  args: { revieweeId: v.id('users') },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_reviewee', (q) => q.eq('revieweeId', args.revieweeId))
      .collect();
    
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      if (!review.reviewerName && review.reviewerId) {
        const reviewer = await ctx.db.get(review.reviewerId);
        if (reviewer) {
          return { ...review, reviewerName: reviewer.name };
        }
      }
      return review;
    }));
    
    return enrichedReviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getReviewsByReviewer = query({
  args: { reviewerId: v.id('users') },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_reviewer', (q) => q.eq('reviewerId', args.reviewerId))
      .collect();
    
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      if (!review.revieweeName && review.revieweeId) {
        const reviewee = await ctx.db.get(review.revieweeId);
        if (reviewee) {
          return { ...review, revieweeName: reviewee.name };
        }
      }
      return review;
    }));
    
    return enrichedReviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});


export const getReviewsByJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .collect();
    
    
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      let enrichedReview = { ...review };
      
      if (!review.reviewerName && review.reviewerId) {
        const reviewer = await ctx.db.get(review.reviewerId);
        if (reviewer) {
          enrichedReview.reviewerName = reviewer.name;
        }
      }
      
      if (!review.revieweeName && review.revieweeId) {
        const reviewee = await ctx.db.get(review.revieweeId);
        if (reviewee) {
          enrichedReview.revieweeName = reviewee.name;
        }
      }
      
      return enrichedReview;
    }));
    
    return enrichedReviews;
  },
});