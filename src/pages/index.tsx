import type { GetServerSideProps } from 'next';

export default function IndexRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/home',
      permanent: false,
    },
  };
};
