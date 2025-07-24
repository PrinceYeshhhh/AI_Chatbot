import { clerkClient } from '@clerk/nextjs/server';
import { verifyToken } from '@clerk/nextjs/server';

export interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
}

export class ClerkAuthService {
  private clerkSecretKey: string;

  constructor() {
    this.clerkSecretKey = process.env.CLERK_SECRET_KEY!;
  }

  async verifyToken(token: string): Promise<ClerkUser | null> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
      });
      
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email || '',
        firstName: payload.firstName,
        lastName: payload.lastName,
        imageUrl: payload.imageUrl,
        createdAt: new Date(payload.iat * 1000)
      };
    } catch (error) {
      console.error('Clerk token verification failed:', error);
      return null;
    }
  }

  async getUser(userId: string): Promise<ClerkUser | null> {
    try {
      const user = await clerkClient.users.getUser(userId);
      
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: new Date(user.createdAt)
      };
    } catch (error) {
      console.error('Failed to get Clerk user:', error);
      return null;
    }
  }

  async createUser(email: string, password: string, firstName?: string, lastName?: string): Promise<ClerkUser | null> {
    try {
      const user = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName,
      });

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: new Date(user.createdAt)
      };
    } catch (error) {
      console.error('Failed to create Clerk user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<ClerkUser>): Promise<ClerkUser | null> {
    try {
      const user = await clerkClient.users.updateUser(userId, {
        firstName: updates.firstName,
        lastName: updates.lastName,
      });

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: new Date(user.createdAt)
      };
    } catch (error) {
      console.error('Failed to update Clerk user:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await clerkClient.users.deleteUser(userId);
      return true;
    } catch (error) {
      console.error('Failed to delete Clerk user:', error);
      return false;
    }
  }
} 