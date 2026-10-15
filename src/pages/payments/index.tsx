import type { GetServerSideProps } from 'next';

export default function PaymentsIndexRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/payments/payments_made', permanent: false },
});
