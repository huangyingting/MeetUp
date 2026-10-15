import React from 'react';
import { GroupEventsView, getServerSideProps } from './index';

export default function GroupPastEventsPage(props: any) {
  return <GroupEventsView {...props} subTab="PAST" />;
}

export { getServerSideProps };
