import React from 'react';
import { GroupEventsView, getServerSideProps } from './index';

export default function GroupCalendarEventsPage(props: any) {
  return <GroupEventsView {...props} subTab="CALENDAR" />;
}

export { getServerSideProps };
