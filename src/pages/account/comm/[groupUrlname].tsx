import type { GetServerSideProps } from 'next';
export default function CommunityNotificationSettings() { return null; }
export const getServerSideProps: GetServerSideProps = async () => ({ redirect: { destination: '/notifications', permanent: false } });
