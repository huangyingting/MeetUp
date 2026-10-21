import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & { id: string; memberId: string };
  }
  interface User {
    memberId: string;
    authVersion?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    memberId?: string;
    authVersion?: string;
  }
}
