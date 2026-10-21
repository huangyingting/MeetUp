import type { GetServerSideProps } from 'next';
export default function NotificationSettings() { return null; }
export const getServerSideProps: GetServerSideProps = async () => ({ redirect: { destination: '/notifications', permanent: false } });
