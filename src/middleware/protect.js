import { requireAuth } from "@clerk/express";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY missing in backend env');
}


// Protect routes → only logged-in Clerk users can access
export const protect = requireAuth();
