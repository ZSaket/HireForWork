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
    // Get the current user (reviewer)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: You must be logged in to submit a review');
    }
    
    const userId = identity.subject;
    
    // Get the reviewer user from the database
    const reviewer = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', userId))
      .unique();
    
    if (!reviewer) {
      throw new Error('User not found');
    }
    
    // Check if the job exists
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Check if the job is completed (payment status should be 'completed')
    if (job.paymentStatus !== 'completed') {
      throw new Error('Cannot review a job that has not been completed and paid');
    }
    
    // Check if the reviewer is the hirer for this job
    if (job.postedBy !== reviewer._id) {
      throw new Error('Only the hirer can review this job');
    }
    
    // Get the reviewee (worker) name
    const reviewee = await ctx.db.get(args.revieweeId);
    if (!reviewee) {
      throw new Error('Reviewee not found');
    }

    // Create the review with names included
    return ctx.db.insert('reviews', {
      reviewerId: reviewer._id,
      revieweeId: args.revieweeId,
      jobId: args.jobId,
      rating: args.rating,
      comment: args.comment,
      createdAt: args.createdAt,
      reviewerName: reviewer.name, // Add reviewer name
      revieweeName: reviewee.name,  // Add reviewee name
    });
  },
});

// Add a query to get reviews with names
export const getReviewsByReviewee = query({
  args: {
    revieweeId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_reviewee', (q) => q.eq('revieweeId', args.revieweeId))
      .collect();
    
    // If you're using the approach where names are already stored in the reviews
    return reviews;
    
    // Alternative approach if you want to ensure names are always up to date
    /*
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      // Get job details
      const job = await ctx.db.get(review.jobId);
      
      // Get reviewer details if needed
      if (!review.reviewerName) {
        const reviewer = await ctx.db.get(review.reviewerId);
        if (reviewer) {
          review.reviewerName = reviewer.name;
        }
      }
      
      // Get reviewee details if needed
      if (!review.revieweeName) {
        const reviewee = await ctx.db.get(review.revieweeId);
        if (reviewee) {
          review.revieweeName = reviewee.name;
        }
      }
      
      return { ...review, jobTitle: job?.title };
    }));
    
    return enrichedReviews;
    */
  },
});

// Get reviews for a specific job
export const getReviewsByJob = query({
  args: {
    jobId: v.id('jobs'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('reviews')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .collect();
  },
});