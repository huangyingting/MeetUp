import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Meetup Clone database...');

  // Clean existing records in reverse dependency order
  await prisma.reportSubmission.deleteMany();
  await prisma.oAuthClientApp.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.groupReview.deleteMany();
  await prisma.discussionComment.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.photoAlbum.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.groupTopic.deleteMany();
  await prisma.group.deleteMany();
  await prisma.userTopic.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.topicCategory.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const mainUser = await prisma.user.create({
    data: {
      memberId: '484670701',
      name: 'wlfjck',
      email: 'wlfjck@gmail.com',
      passwordHash: 'meetup2026',
      bio: 'Full-stack engineer, AI builder, and outdoor enthusiast living in San Francisco.',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      lat: 37.7749,
      lon: -122.4194,
      birthDate: '1993-05-15',
      gender: 'Man',
      phone: '+1 415-555-0192',
      whatsappPhone: '+1 415-555-0192',
      isNew: false,
      onboardingCompletedAt: new Date('2026-10-15T01:30:00Z'),
      lookingFor: JSON.stringify(['Make new friends', 'Practice a hobby', 'Build a professional network']),
      peopleToMeet: JSON.stringify(['People my age', 'Locals', 'Young professionals']),
      hangoutStyles: JSON.stringify(['Coffee or tea', 'Outdoor walks & hikes', 'Workshops & classes']),
      relationshipStatus: 'Single',
      industry: 'Technology & Software',
      lifeStages: JSON.stringify(['Working professional', 'Moved to a new city']),
      emailUpdatesConfig: JSON.stringify({
        messages: true,
        replies: true,
        suggestedEvents: true,
        newGroups: true,
        meetupHq: false,
        surveys: false,
        ical: true,
        proNetworks: true,
        connections: true,
      }),
      socialLinks: JSON.stringify({
        FACEBOOK: 'https://facebook.com/wlfjck',
        INSTAGRAM: '@wlfjck.sf',
        TWITTER: '@wlfjck',
        LINKEDIN: 'https://linkedin.com/in/wlfjck',
      }),
    },
  });

  const adeline = await prisma.user.create({
    data: {
      memberId: '18294011',
      name: 'Adeline',
      email: 'adeline@meetup-example.com',
      bio: 'Community builder & event host bringing Bay Area singles together since 2018! Over 1,100 events hosted.',
      city: 'Livermore',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      memberId: '29104482',
      name: 'Dr. Marcus Vance',
      email: 'marcus@stackle-example.com',
      bio: 'Executive Career Coach, Tech Recruiter & Founder at Stackle Career Lab.',
      city: 'San Francisco',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    },
  });

  const elena = await prisma.user.create({
    data: {
      memberId: '34019283',
      name: 'Elena Rostova',
      email: 'elena@aibuilders-example.com',
      bio: 'Staff ML Research Engineer working on multi-modal foundation models and open-source AI agents.',
      city: 'San Francisco',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
    },
  });

  const sandeep = await prisma.user.create({
    data: {
      memberId: '41029384',
      name: 'Sandeep Patel',
      email: 'sandeep@example.com',
      bio: 'Product Manager in SF. Love hiking, specialty coffee, and strategy board games.',
      city: 'San Francisco',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    },
  });

  const rebecca = await prisma.user.create({
    data: {
      memberId: '52019384',
      name: 'Rebecca Lin',
      email: 'rebecca@example.com',
      bio: 'UX Designer & ceramicist exploring the Bay Area.',
      city: 'Oakland',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      memberId: '63019283',
      name: 'Sarah Jenkins',
      email: 'sarah@example.com',
      bio: 'Trail runner, bookworm, and community organizer.',
      city: 'San Francisco',
      state: 'CA',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
    },
  });

  // 2. Topic Categories & Topics
  const categoriesData = [
    { categoryId: 652, name: 'Social Activities', urlkey: 'social-activities', icon: 'Users', color: '#E51937' },
    { categoryId: 612, name: 'Hobbies & Passions', urlkey: 'hobbies-and-passions', icon: 'Palette', color: '#D97706' },
    { categoryId: 774, name: 'Support & Coaching', urlkey: 'support-and-coaching', icon: 'HeartHandshake', color: '#7C3AED' },
    { categoryId: 773, name: 'Travel & Outdoor', urlkey: 'travel-and-outdoor', icon: 'Mountain', color: '#059669' },
    { categoryId: 546, name: 'Technology', urlkey: 'technology', icon: 'Cpu', color: '#00798A' },
    { categoryId: 405, name: 'Career & Business', urlkey: 'career-and-business', icon: 'Briefcase', color: '#2563EB' },
    { categoryId: 511, name: 'Health & Wellbeing', urlkey: 'health-and-wellbeing', icon: 'HeartPulse', color: '#10B981' },
    { categoryId: 684, name: 'Sports & Fitness', urlkey: 'sports-and-fitness', icon: 'Dumbbell', color: '#EA580C' },
    { categoryId: 521, name: 'Art & Culture', urlkey: 'art-and-culture', icon: 'Theater', color: '#DB2777' },
    { categoryId: 535, name: 'Games', urlkey: 'games', icon: 'Gamepad2', color: '#4F46E5' },
    { categoryId: 701, name: 'Pets & Animals', urlkey: 'pets-and-animals', icon: 'Dog', color: '#CA8A04' },
    { categoryId: 412, name: 'Dancing', urlkey: 'dancing', icon: 'Music2', color: '#E11D48' },
    { categoryId: 436, name: 'Science & Education', urlkey: 'science-and-education', icon: 'GraduationCap', color: '#0284C7' },
    { categoryId: 467, name: 'Writing', urlkey: 'writing', icon: 'PenTool', color: '#9333EA' },
    { categoryId: 395, name: 'Music', urlkey: 'music', icon: 'Music', color: '#DC2626' },
    { categoryId: 673, name: 'Parents & Family', urlkey: 'parents-and-family', icon: 'Baby', color: '#0D9488' },
    { categoryId: 622, name: 'Identity & Language', urlkey: 'identity-and-language', icon: 'Globe', color: '#6366F1' },
    { categoryId: 604, name: 'Community & Environment', urlkey: 'community-and-environment', icon: 'Sprout', color: '#16A34A' },
    { categoryId: 642, name: 'Movements & Politics', urlkey: 'movements-and-politics', icon: 'Megaphone', color: '#B91C1C' },
    { categoryId: 692, name: 'Religion & Spirituality', urlkey: 'religion-and-spirituality', icon: 'Sparkles', color: '#7E22CE' },
  ];

  const categoryMap = {};
  for (const c of categoriesData) {
    const created = await prisma.topicCategory.create({ data: c });
    categoryMap[c.urlkey] = created;
  }

  const topicsData = [
    { topicId: '15892', name: 'Artificial Intelligence', urlkey: 'artificial-intelligence', description: 'Meetup groups and events for AI engineers, researchers, and enthusiasts exploring LLMs, deep learning, and generative AI.', followersCount: 482900, cat: 'technology' },
    { topicId: '54601', name: 'New Technology', urlkey: 'new-technology', description: 'Explore emerging software, hardware, cloud infrastructure, and frontier tech.', followersCount: 891200, cat: 'technology' },
    { topicId: '1064', name: 'Python', urlkey: 'python', description: 'Python programming for web development, data science, automation, and machine learning.', followersCount: 620400, cat: 'technology' },
    { topicId: '1502', name: 'Web Development', urlkey: 'web-development', description: 'Full-stack web engineering with React, Next.js, TypeScript, Node.js, and modern cloud stacks.', followersCount: 540100, cat: 'technology' },
    { topicId: '77301', name: 'Outdoors', urlkey: 'outdoors', description: 'Get outside with local hiking, camping, kayaking, and nature exploration groups.', followersCount: 745000, cat: 'travel-and-outdoor' },
    { topicId: '77302', name: 'Hiking', urlkey: 'hiking', description: 'Scenic day hikes, coastal trails, and mountain treks for all skill levels.', followersCount: 688000, cat: 'travel-and-outdoor' },
    { topicId: '65201', name: 'Make New Friends', urlkey: 'make-new-friends', description: 'Casual social mixers, coffee meetups, and welcoming events to meet new people in your city.', followersCount: 1120000, cat: 'social-activities' },
    { topicId: '65202', name: 'Social Networking', urlkey: 'social-networking', description: 'Connect over drinks, dining out, happy hours, and lively neighborhood gatherings.', followersCount: 950000, cat: 'social-activities' },
    { topicId: '65203', name: 'Single Professionals', urlkey: 'single-professionals', description: 'Events and mixers designed for single professionals to mingle in a relaxed setting.', followersCount: 410000, cat: 'social-activities' },
    { topicId: '65204', name: 'New In Town', urlkey: 'new-in-town', description: 'Just moved? Meet fellow newcomers and locals who love showing off the city.', followersCount: 530000, cat: 'social-activities' },
    { topicId: '40501', name: 'Career Coaching', urlkey: 'career-coaching', description: 'Resume strategy, interview prep, leadership development, and executive networking.', followersCount: 315000, cat: 'career-and-business' },
    { topicId: '40502', name: 'Startup Businesses', urlkey: 'startup-businesses', description: 'Founders, operators, and investors building high-growth startups.', followersCount: 490000, cat: 'career-and-business' },
    { topicId: '53501', name: 'Board Games', urlkey: 'board-games', description: 'Tabletop strategy games, Catan, Eurogames, party games, and pub trivia nights.', followersCount: 380000, cat: 'games' },
    { topicId: '51101', name: 'Mindfulness Meditation', urlkey: 'mindfulness-meditation', description: 'Guided meditation, breathwork, yoga, and stress-reduction communities.', followersCount: 295000, cat: 'health-and-wellbeing' },
    { topicId: '46701', name: 'Writing Workshops', urlkey: 'writing-workshops', description: 'Creative writing critiques, fiction, non-fiction, and screenwriting sessions.', followersCount: 185000, cat: 'writing' },
    { topicId: '62201', name: 'LGBTQ+', urlkey: 'lgbtq', description: 'Queer-friendly social clubs, outdoor adventures, and community spaces.', followersCount: 420000, cat: 'identity-and-language' },
  ];

  const topicMap = {};
  for (const t of topicsData) {
    const created = await prisma.topic.create({
      data: {
        topicId: t.topicId,
        name: t.name,
        urlkey: t.urlkey,
        description: t.description,
        followersCount: t.followersCount,
        categoryId: categoryMap[t.cat]?.id,
      },
    });
    topicMap[t.urlkey] = created;
  }

  // Subscribe mainUser to 4 initial topics (matching our screenshots!)
  for (const key of ['new-technology', 'outdoors', 'make-new-friends', 'social-networking', 'artificial-intelligence', 'python']) {
    if (topicMap[key]) {
      await prisma.userTopic.create({
        data: { userId: mainUser.id, topicId: topicMap[key].id },
      });
    }
  }

  // 3. Create Groups
  const singlesGroup = await prisma.group.create({
    data: {
      groupId: '37485736',
      name: 'Singles Mingle - Getting Singles Together - Bay Area',
      urlname: 'singles-mingle-getting-people-together',
      description:
        'Welcome to Singles Mingle! We are one of the largest and most active social groups in the San Francisco Bay Area with over 14,300 members. Our mission is simple: get off the dating apps and meet real, friendly single professionals face-to-face at curated cocktail lounges, rooftop bars, coffee shops, picnic socials, and weekend adventures across San Francisco, Oakland, San Jose, and Livermore.',
      city: 'Livermore',
      state: 'CA',
      country: 'US',
      lat: 37.6819,
      lon: -121.768,
      isPrivate: false,
      isPro: false,
      rating: 4.5,
      ratingsCount: 5039,
      membersCount: 14315,
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
      welcomeMessage: 'Welcome to Singles Mingle! Introduce yourself and RSVP to your first mixer!',
      fundraisingGoal: 1000,
      fundraisingRaised: 425,
      organizerId: adeline.id,
    },
  });

  const stackleGroup = await prisma.group.create({
    data: {
      groupId: '38368760',
      name: 'Stackle - Your Career Lab',
      urlname: 'stackle-your-career-lab',
      description:
        'Stackle - Your Career Lab is an international Meetup Pro community helping software engineers, product managers, designers, and ambitious professionals land top-tier roles. Join our weekly live online workshops on executive job search strategy, AI-proof career positioning, salary negotiation, and hiring manager panels.',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      lat: 37.7749,
      lon: -122.4194,
      isPrivate: false,
      isPro: true,
      proNetworkName: 'Stackle Global Career Network',
      rating: 4.8,
      ratingsCount: 942,
      membersCount: 4820,
      coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
      organizerId: marcus.id,
    },
  });

  const aiGroup = await prisma.group.create({
    data: {
      groupId: '38500112',
      name: 'San Francisco AI, Agents & LLM Builders',
      urlname: 'sf-ai-llm-builders',
      description:
        'A hands-on technical community in San Francisco for engineers, founders, and researchers building with Large Language Models, multi-agent systems, RAG pipelines, and open-weight models. We host weekly coding nights, paper reading groups, and demo days in SoMa and Mission Bay.',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      lat: 37.781,
      lon: -122.401,
      isPrivate: false,
      isPro: true,
      proNetworkName: 'Bay Area Developer Network',
      rating: 4.9,
      ratingsCount: 1620,
      membersCount: 8940,
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      organizerId: elena.id,
    },
  });

  const hikersGroup = await prisma.group.create({
    data: {
      groupId: '38120944',
      name: 'Bay Area Trail Hikers & Outdoor Explorers',
      urlname: 'bay-area-trail-hikers',
      description:
        'Explore the redwoods of Muir Woods, coastal bluffs of Marin Headlands, Lands End, and Mount Tamalpais with friendly fellow outdoor lovers every weekend!',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      lat: 37.8024,
      lon: -122.4058,
      isPrivate: false,
      isPro: false,
      rating: 4.7,
      ratingsCount: 2310,
      membersCount: 11250,
      coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=80',
      organizerId: sarah.id,
    },
  });

  const gamesGroup = await prisma.group.create({
    data: {
      groupId: '38291005',
      name: 'SF Board Games, Trivia & Craft Beer',
      urlname: 'sf-board-games-trivia',
      description:
        'Weekly tabletop board game nights, strategy Eurogames, Catan tournaments, and pub trivia across San Francisco cafés and breweries.',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      lat: 37.7694,
      lon: -122.4862,
      isPrivate: false,
      isPro: false,
      rating: 4.6,
      ratingsCount: 890,
      membersCount: 6410,
      coverImage: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
      organizerId: sandeep.id,
    },
  });

  const lesbianClub = await prisma.group.create({
    data: {
      groupId: '38686069',
      name: 'Our Little Lesbian Club (POC Lesbians & Ages 25-35 only)',
      urlname: 'lesbians-touching-grass',
      description:
        'A welcoming community space for POC lesbians ages 25-35 in the Bay Area to connect over park picnics, art walks, coffee hangs, and outdoor adventures.',
      city: 'Oakland',
      state: 'CA',
      country: 'US',
      lat: 37.8044,
      lon: -122.2712,
      isPrivate: true,
      isPro: false,
      rating: 4.9,
      ratingsCount: 312,
      membersCount: 1890,
      coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
      organizerId: rebecca.id,
    },
  });

  // Link Groups to Topics
  const groupTopicPairs = [
    [singlesGroup.id, 'make-new-friends'],
    [singlesGroup.id, 'social-networking'],
    [singlesGroup.id, 'single-professionals'],
    [singlesGroup.id, 'new-in-town'],
    [stackleGroup.id, 'career-coaching'],
    [stackleGroup.id, 'startup-businesses'],
    [aiGroup.id, 'artificial-intelligence'],
    [aiGroup.id, 'new-technology'],
    [aiGroup.id, 'python'],
    [aiGroup.id, 'web-development'],
    [hikersGroup.id, 'outdoors'],
    [hikersGroup.id, 'hiking'],
    [gamesGroup.id, 'board-games'],
    [gamesGroup.id, 'make-new-friends'],
    [lesbianClub.id, 'lgbtq'],
    [lesbianClub.id, 'outdoors'],
  ];

  for (const [groupId, topicSlug] of groupTopicPairs) {
    if (topicMap[topicSlug]) {
      await prisma.groupTopic.create({
        data: { groupId, topicId: topicMap[topicSlug].id },
      });
    }
  }

  // 4. Group Memberships
  await prisma.groupMembership.createMany({
    data: [
      { userId: adeline.id, groupId: singlesGroup.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'Founder & Lead Host of Singles Mingle!' },
      { userId: mainUser.id, groupId: singlesGroup.id, role: 'MEMBER', status: 'ACTIVE', groupBio: 'Excited to meet new folks in SF!' },
      { userId: sandeep.id, groupId: singlesGroup.id, role: 'MEMBER', status: 'ACTIVE', groupBio: 'Coffee & conversation!' },
      { userId: rebecca.id, groupId: singlesGroup.id, role: 'MEMBER', status: 'ACTIVE', groupBio: 'Designer in the Bay' },
      { userId: sarah.id, groupId: singlesGroup.id, role: 'COORGANIZER', status: 'ACTIVE', groupBio: 'Co-hosting SF events!' },

      { userId: marcus.id, groupId: stackleGroup.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'Founder at Stackle' },
      { userId: mainUser.id, groupId: stackleGroup.id, role: 'MEMBER', status: 'ACTIVE', groupBio: 'Software Engineer in SF' },

      { userId: elena.id, groupId: aiGroup.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'AI Researcher & Host' },
      { userId: mainUser.id, groupId: aiGroup.id, role: 'MEMBER', status: 'ACTIVE', groupBio: 'Building multi-agent workflows' },

      { userId: sarah.id, groupId: hikersGroup.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'Trail Leader' },
      { userId: sandeep.id, groupId: gamesGroup.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'Board game geek' },
      { userId: rebecca.id, groupId: lesbianClub.id, role: 'ORGANIZER', status: 'ACTIVE', groupBio: 'Organizer' },
      { userId: mainUser.id, groupId: lesbianClub.id, role: 'MEMBER', status: 'PENDING', groupBio: '' },
    ],
  });

  // 5. Create Events (Upcoming + Past)
  const ev1 = await prisma.event.create({
    data: {
      eventId: '316287001',
      title: 'Singles Mingle @ Bar and Bean in SF FREE ENTRY 30&UP',
      description:
        'Join us this Sunday evening at Bar and Bean on Divisadero Street in San Francisco for our flagship 30 & Up Singles Mingle!\n\nWhy attend?\n• Dedicated private patio and lounge area reserved exclusively for our Meetup members\n• Fun icebreaker name tags & conversation cards to make mingling effortless\n• Craft cocktails, espresso martinis, mocktails, and artisan small bites available for purchase\n• Balanced ratio and warm, welcoming hosts (Adeline & Sarah) who introduce everyone at the door.\n\nDress code: Smart casual. Bring a smile and get ready to make genuine connections in person!',
      dateTime: new Date('2026-10-18T18:00:00Z'),
      endTime: new Date('2026-10-18T21:00:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'Bar and Bean',
      venueAddress: '1834 Divisadero St',
      venueCity: 'San Francisco',
      venueState: 'CA',
      lat: 37.7867,
      lon: -122.4398,
      feeAmount: 0,
      allowGuests: true,
      maxGuests: 2,
      status: 'UPCOMING',
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Singles', 'Single Professionals', 'New In Town', 'Dining Out', 'Social']),
      groupId: singlesGroup.id,
      hostId: adeline.id,
    },
  });

  const ev2 = await prisma.event.create({
    data: {
      eventId: '316515278',
      title: 'Why Everything You Know About Finding a Job Is Wrong',
      description:
        'In 2026, applying cold through job boards has a <1.2% callback rate. Join Dr. Marcus Vance and the Stackle Career Lab coaching team for an interactive 90-minute live online masterclass.\n\nWhat we will cover:\n1. How ATS + AI screening actually ranks engineering & product candidates\n2. The Backchannel Referral Framework for landing hiring manager conversations in 7 days\n3. Live resume & LinkedIn teardowns from volunteer attendees\n4. Q&A and breakout networking rooms.',
      dateTime: new Date('2026-10-17T17:00:00Z'),
      endTime: new Date('2026-10-17T18:30:00Z'),
      timezone: 'PDT',
      eventType: 'ONLINE',
      venueName: 'Online event',
      venueAddress: 'Zoom Live Webinar',
      venueCity: 'San Francisco',
      venueState: 'CA',
      onlineUrl: 'https://zoom.us/j/99887766554',
      feeAmount: 0,
      allowGuests: false,
      maxGuests: 0,
      status: 'UPCOMING',
      coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Career Coaching', 'Startup Businesses', 'New Technology', 'Social Networking']),
      groupId: stackleGroup.id,
      hostId: marcus.id,
    },
  });

  const ev3 = await prisma.event.create({
    data: {
      eventId: '316800102',
      title: 'Hands-On Agentic AI, MCP Servers & Multi-Modal LLM Hack Night',
      description:
        'Bring your laptop to Mission Bay for an evening of live coding, lightning talks, and pizza with 120+ SF AI engineers!\n\nAgenda:\n• 6:00 PM — Doors open, dinner, & founder/engineer networking\n• 6:30 PM — Talk 1: Productionizing Tool-Using Coding Agents at Scale\n• 7:00 PM — Talk 2: Sub-100ms Voice & Vision Agents on Edge GPUs\n• 7:30 PM — Open Hack Tables & Community Demos.',
      dateTime: new Date('2026-10-16T18:00:00Z'),
      endTime: new Date('2026-10-16T21:00:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'Mission Bay AI Commons',
      venueAddress: '455 Mission Bay Blvd South',
      venueCity: 'San Francisco',
      venueState: 'CA',
      lat: 37.7706,
      lon: -122.3893,
      feeAmount: 0,
      allowGuests: true,
      maxGuests: 1,
      status: 'UPCOMING',
      seriesText: 'Every Thursday',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Artificial Intelligence', 'Python', 'Web Development', 'New Technology']),
      groupId: aiGroup.id,
      hostId: elena.id,
    },
  });

  const ev4 = await prisma.event.create({
    data: {
      eventId: '316800205',
      title: 'Golden Gate Bridge to Lands End Coastal Trail Hike + Coffee',
      description:
        'Enjoy sweeping views of the Golden Gate Strait, Sutro Baths ruins, and cypress groves on this scenic 6.2-mile Saturday morning hike! After the trail, we grab pastries and coffee together in the Outer Richmond.',
      dateTime: new Date('2026-10-19T09:30:00Z'),
      endTime: new Date('2026-10-19T13:00:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'Lands End Lookout Visitor Center',
      venueAddress: '680 Point Lobos Ave',
      venueCity: 'San Francisco',
      venueState: 'CA',
      lat: 37.7796,
      lon: -122.5116,
      feeAmount: 0,
      allowGuests: true,
      maxGuests: 2,
      status: 'UPCOMING',
      seriesText: 'Every Saturday',
      coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Outdoors', 'Hiking', 'Make New Friends']),
      groupId: hikersGroup.id,
      hostId: sarah.id,
    },
  });

  const ev5 = await prisma.event.create({
    data: {
      eventId: '316800309',
      title: 'Friday Night Catan, Terraforming Mars & Craft Beer Social',
      description:
        'Over 45 board games provided! Whether you are new to tabletop games or a seasoned strategy veteran, our table hosts teach the rules for every game.',
      dateTime: new Date('2026-10-20T18:30:00Z'),
      endTime: new Date('2026-10-20T22:00:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'The Game Parlour SF',
      venueAddress: '1342 Irving St',
      venueCity: 'San Francisco',
      venueState: 'CA',
      lat: 37.7638,
      lon: -122.4724,
      feeAmount: 5,
      allowGuests: true,
      maxGuests: 2,
      status: 'UPCOMING',
      seriesText: 'Every Friday',
      coverImage: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Board Games', 'Make New Friends', 'Social Networking']),
      groupId: gamesGroup.id,
      hostId: sandeep.id,
    },
  });

  const ev6 = await prisma.event.create({
    data: {
      eventId: '316800412',
      title: 'Online Python & FastAPI Async Microservices Deep Dive',
      description:
        'Live interactive coding workshop building high-throughput async Python services with FastAPI, SQLAlchemy 2.0, and OpenTelemetry tracing.',
      dateTime: new Date('2026-10-21T17:30:00Z'),
      endTime: new Date('2026-10-21T19:30:00Z'),
      timezone: 'PDT',
      eventType: 'ONLINE',
      venueName: 'Online event',
      venueAddress: 'Meetup Online Video Room',
      venueCity: 'San Francisco',
      venueState: 'CA',
      onlineUrl: 'https://zoom.us/j/8822114455',
      feeAmount: 0,
      allowGuests: false,
      maxGuests: 0,
      status: 'UPCOMING',
      coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Python', 'Web Development', 'Artificial Intelligence']),
      groupId: aiGroup.id,
      hostId: elena.id,
    },
  });

  const pastEv1 = await prisma.event.create({
    data: {
      eventId: '315900111',
      title: 'Rooftop Sunset Singles Mixer @ Charmaine’s San Francisco',
      description: 'Over 85 singles joined us for firepits, skyline views, and great conversations!',
      dateTime: new Date('2026-09-28T18:00:00Z'),
      endTime: new Date('2026-09-28T21:30:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'Charmaine’s Rooftop Bar & Lounge',
      venueAddress: '1100 Market St',
      venueCity: 'San Francisco',
      venueState: 'CA',
      status: 'PAST',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Singles', 'Social Networking']),
      groupId: singlesGroup.id,
      hostId: adeline.id,
    },
  });

  const pastEv2 = await prisma.event.create({
    data: {
      eventId: '315800222',
      title: 'Wine Country Picnic & Singles Speed Mingling in Livermore Valley',
      description: 'A sunny afternoon tasting local wines and meeting new friends in the vineyard.',
      dateTime: new Date('2026-09-14T13:00:00Z'),
      endTime: new Date('2026-09-14T17:00:00Z'),
      timezone: 'PDT',
      eventType: 'IN_PERSON',
      venueName: 'Concannon Vineyard Lawn',
      venueAddress: '4590 Tesla Rd',
      venueCity: 'Livermore',
      venueState: 'CA',
      status: 'PAST',
      coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80',
      topicsJson: JSON.stringify(['Singles', 'Outdoors', 'Dining Out']),
      groupId: singlesGroup.id,
      hostId: adeline.id,
    },
  });

  // 6. RSVPs & Saved Events
  await prisma.eventRsvp.createMany({
    data: [
      { userId: adeline.id, eventId: ev1.id, status: 'YES', guestsCount: 0 },
      { userId: mainUser.id, eventId: ev1.id, status: 'YES', guestsCount: 0 },
      { userId: sandeep.id, eventId: ev1.id, status: 'YES', guestsCount: 1 },
      { userId: rebecca.id, eventId: ev1.id, status: 'YES', guestsCount: 0 },
      { userId: sarah.id, eventId: ev1.id, status: 'YES', guestsCount: 0 },
      { userId: elena.id, eventId: ev1.id, status: 'CANCELED', guestsCount: 0 },

      { userId: marcus.id, eventId: ev2.id, status: 'YES', guestsCount: 0, optToShareEmail: true },
      { userId: mainUser.id, eventId: ev2.id, status: 'YES', guestsCount: 0, optToShareEmail: true },
      { userId: sandeep.id, eventId: ev2.id, status: 'YES', guestsCount: 0, optToShareEmail: false },

      { userId: elena.id, eventId: ev3.id, status: 'YES', guestsCount: 0 },
      { userId: sandeep.id, eventId: ev3.id, status: 'YES', guestsCount: 0 },
      { userId: sarah.id, eventId: ev4.id, status: 'YES', guestsCount: 0 },
      { userId: sandeep.id, eventId: ev5.id, status: 'YES', guestsCount: 0 },

      { userId: adeline.id, eventId: pastEv1.id, status: 'YES', guestsCount: 0 },
      { userId: mainUser.id, eventId: pastEv1.id, status: 'YES', guestsCount: 0 },
    ],
  });

  await prisma.savedEvent.createMany({
    data: [
      { userId: mainUser.id, eventId: ev3.id },
      { userId: mainUser.id, eventId: ev4.id },
    ],
  });

  // 7. Photo Albums & Photos
  const album1 = await prisma.photoAlbum.create({
    data: {
      albumId: '900101',
      title: 'Rooftop Sunset Singles Mixer @ Charmaine’s',
      groupId: singlesGroup.id,
      eventId: pastEv1.id,
      photosCount: 4,
    },
  });

  const album2 = await prisma.photoAlbum.create({
    data: {
      albumId: '900102',
      title: 'Livermore Vineyard Afternoon Social',
      groupId: singlesGroup.id,
      eventId: pastEv2.id,
      photosCount: 3,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        photoId: '7001',
        albumId: album1.id,
        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&auto=format&fit=crop&q=80',
        caption: 'Icebreaker mingling on the rooftop patio!',
        uploadedById: adeline.id,
      },
      {
        photoId: '7002',
        albumId: album1.id,
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop&q=80',
        caption: 'New friends over sunset cocktails in SF',
        uploadedById: sarah.id,
      },
      {
        photoId: '7003',
        albumId: album1.id,
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80',
        caption: 'Full house at Charmaine’s!',
        uploadedById: adeline.id,
      },
      {
        photoId: '7004',
        albumId: album1.id,
        url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&auto=format&fit=crop&q=80',
        caption: 'Group toast at 8 PM',
        uploadedById: sandeep.id,
      },
      {
        photoId: '7005',
        albumId: album2.id,
        url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=900&auto=format&fit=crop&q=80',
        caption: 'Sunny afternoon in Livermore Wine Country',
        uploadedById: adeline.id,
      },
      {
        photoId: '7006',
        albumId: album2.id,
        url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&auto=format&fit=crop&q=80',
        caption: 'Picnic tables and great company',
        uploadedById: rebecca.id,
      },
    ],
  });

  // 8. Group Discussions & Comments
  const disc1 = await prisma.discussion.create({
    data: {
      groupId: singlesGroup.id,
      authorId: adeline.id,
      title: 'Welcome New Members! Introduce yourself & share your favorite SF neighborhood spot',
      body: 'Hey everyone! We had 180+ new members join Singles Mingle this week. Drop a quick comment below with your name, what you love doing on weekends, and your favorite coffee shop or cocktail lounge in the Bay Area!',
      isPinned: true,
      likesCount: 42,
    },
  });

  const disc2 = await prisma.discussion.create({
    data: {
      groupId: singlesGroup.id,
      authorId: sarah.id,
      title: 'Carpool & BART meetup thread for Sunday’s Bar and Bean Mixer!',
      body: 'For anyone coming from the East Bay or South Bay this Sunday, a group of us are riding BART to Montgomery and taking the 38R out to Divisadero together around 5:30 PM. Reply here if you want to join!',
      isPinned: false,
      likesCount: 19,
    },
  });

  await prisma.discussionComment.createMany({
    data: [
      {
        discussionId: disc1.id,
        authorId: sandeep.id,
        body: 'Hi everyone! I’m Sandeep in Hayes Valley. Huge fan of Sightglass Coffee and weekend hikes in Marin!',
      },
      {
        discussionId: disc1.id,
        authorId: rebecca.id,
        body: 'Hey! I’m Rebecca from Oakland. Love ceramic studio sessions and live jazz at Bird & Beckett.',
      },
      {
        discussionId: disc2.id,
        authorId: mainUser.id,
        body: 'Count me in! See you all at Bar and Bean on Sunday at 6 PM.',
      },
    ],
  });

  // 9. Group Reviews / Feedback Overview
  await prisma.groupReview.createMany({
    data: [
      {
        groupId: singlesGroup.id,
        authorId: sandeep.id,
        eventId: pastEv1.id,
        rating: 5,
        comment: 'Adeline and Sarah are phenomenal hosts! They greeted everyone at the door and made sure nobody was standing alone. Met so many genuine people.',
        tags: JSON.stringify(['Engaging host', 'Welcoming community', 'Expectations met', 'Attend again']),
      },
      {
        groupId: singlesGroup.id,
        authorId: rebecca.id,
        eventId: pastEv1.id,
        rating: 5,
        comment: 'Great venue selection and really friendly crowd. The icebreaker cards made starting conversations super natural.',
        tags: JSON.stringify(['Welcoming community', 'Expectations met']),
      },
      {
        groupId: singlesGroup.id,
        authorId: sarah.id,
        eventId: pastEv2.id,
        rating: 4,
        comment: 'Awesome afternoon in Livermore! Parking filled up fast so definitely arrive 15 minutes early next time.',
        tags: JSON.stringify(['Engaging host', 'Valuable information']),
      },
    ],
  });

  // 10. Connections, Messages, Notifications, Payments, OAuth Apps
  await prisma.connection.createMany({
    data: [
      { requesterId: mainUser.id, addresseeId: adeline.id, status: 'CONNECTED' },
      { requesterId: sandeep.id, addresseeId: mainUser.id, status: 'CONNECTED' },
      { requesterId: rebecca.id, addresseeId: mainUser.id, status: 'PENDING' },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        senderId: adeline.id,
        receiverId: mainUser.id,
        body: 'Welcome to Singles Mingle, wlfjck! Looking forward to seeing you at Bar and Bean this Sunday at 6 PM!',
        isRead: false,
      },
      {
        senderId: mainUser.id,
        receiverId: adeline.id,
        body: 'Thanks Adeline! Just RSVP’d — excited to attend!',
        isRead: true,
      },
      {
        senderId: sandeep.id,
        receiverId: mainUser.id,
        body: 'Hey! Are you also going to the SF AI & LLM Builders hack night on Thursday?',
        isRead: false,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: mainUser.id,
        title: 'RSVP Confirmed: Singles Mingle @ Bar and Bean in SF',
        body: 'You are going on Sunday, Oct 18 at 6:00 PM PDT. Add it to your calendar!',
        link: '/singles-mingle-getting-people-together/events/316287001',
        isRead: false,
      },
      {
        userId: mainUser.id,
        title: 'New Event in San Francisco AI, Agents & LLM Builders',
        body: 'Elena Rostova scheduled "Hands-On Agentic AI, MCP Servers & Multi-Modal LLM Hack Night".',
        link: '/sf-ai-llm-builders/events/316800102',
        isRead: false,
      },
      {
        userId: mainUser.id,
        title: 'Rebecca Lin sent you a connection request',
        body: 'You both belong to Singles Mingle - Getting Singles Together - Bay Area.',
        link: '/friends',
        isRead: true,
      },
    ],
  });

  await prisma.paymentMethod.create({
    data: {
      userId: mainUser.id,
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2028,
      holderName: 'wlfjck',
      country: 'US',
      postalCode: '94102',
      isDefault: true,
    },
  });

  await prisma.paymentTransaction.createMany({
    data: [
      {
        userId: mainUser.id,
        groupId: gamesGroup.id,
        eventId: ev5.id,
        type: 'EVENT_FEE',
        direction: 'MADE',
        description: 'Friday Night Catan, Terraforming Mars & Craft Beer Social',
        amount: 5.0,
        currency: 'USD',
        status: 'PAID',
      },
      {
        userId: mainUser.id,
        groupId: singlesGroup.id,
        type: 'MEMBER_DUES',
        direction: 'MADE',
        description: 'Annual Community Supporter Dues — Singles Mingle Bay Area',
        amount: 15.0,
        currency: 'USD',
        status: 'PAID',
      },
      {
        userId: mainUser.id,
        groupId: aiGroup.id,
        eventId: ev3.id,
        type: 'SPONSORSHIP',
        direction: 'RECEIVED',
        description: 'Community Pizza & Compute Sponsorship',
        amount: 250.0,
        currency: 'USD',
        status: 'PAID',
      },
    ],
  });

  await prisma.oAuthClientApp.create({
    data: {
      userId: mainUser.id,
      name: 'SF Tech Community Calendar Sync',
      websiteUrl: 'https://sf-tech-events.example.com',
      redirectUri: 'https://sf-tech-events.example.com/api/oauth/callback',
      clientId: 'mup_live_98a7bc65d4e3f210',
      clientSecret: 'mup_sec_4f8a2b1c9d0e7f6a5b4c3d2e1f',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
