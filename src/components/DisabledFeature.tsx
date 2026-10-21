import type { GetServerSideProps } from 'next';

export default function DisabledFeature() { return null; }
export const getServerSideProps: GetServerSideProps = async () => ({ notFound: true });
