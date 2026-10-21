import type { GetServerSideProps } from 'next';
import { getActiveUser } from '@/lib/auth-helper';
export default function Welcome() { return null; }
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return { redirect: { destination: user ? '/account/interests' : '/signup', permanent: false } };
};
