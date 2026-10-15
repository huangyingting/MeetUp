import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

const CITIES = [
  { city: 'San Francisco', state: 'CA', country: 'US', display: 'San Francisco, CA', slug: 'us--ca--san-francisco', lat: 37.7749, lon: -122.4194 },
  { city: 'Oakland', state: 'CA', country: 'US', display: 'Oakland, CA', slug: 'us--ca--oakland', lat: 37.8044, lon: -122.2712 },
  { city: 'San Jose', state: 'CA', country: 'US', display: 'San Jose, CA', slug: 'us--ca--san-jose', lat: 37.3382, lon: -121.8863 },
  { city: 'Livermore', state: 'CA', country: 'US', display: 'Livermore, CA', slug: 'us--ca--livermore', lat: 37.6819, lon: -121.768 },
  { city: 'New York', state: 'NY', country: 'US', display: 'New York, NY', slug: 'us--ny--new-york', lat: 40.7128, lon: -74.006 },
  { city: 'Seattle', state: 'WA', country: 'US', display: 'Seattle, WA', slug: 'us--wa--seattle', lat: 47.6062, lon: -122.3321 },
  { city: 'Austin', state: 'TX', country: 'US', display: 'Austin, TX', slug: 'us--tx--austin', lat: 30.2672, lon: -97.7431 },
  { city: 'London', state: '', country: 'GB', display: 'London, United Kingdom', slug: 'gb--london', lat: 51.5072, lon: -0.1276 },
];

async function executeOperation(
  op: { operationName?: string; variables?: any; query?: string },
  user: any
) {
  const name = op.operationName || '';
  const vars = op.variables || {};
  const input = vars.input || vars || {};

  // Handle raw GraphiQL playground queries
  if (!name && op.query) {
    const q = op.query;
    const responseData: Record<string, any> = {};

    if (q.includes('self') || (!q.includes('event(') && !q.includes('groups') && !q.includes('events'))) {
      responseData.self = {
        id: user?.memberId,
        memberId: user?.memberId,
        name: user?.name,
        email: user?.email,
        city: user?.city,
        state: user?.state,
        isMeetupPlus: user?.isMeetupPlus,
      };
    }

    if (q.includes('event(') || vars.eventId) {
      const targetId = String(vars.eventId || '316287001');
      const ev =
        (await prisma.event.findUnique({ where: { eventId: targetId }, include: { group: true, host: true } })) ||
        (await prisma.event.findFirst({ include: { group: true, host: true } }));
      responseData.event = ev
        ? {
            id: ev.eventId,
            eventId: ev.eventId,
            title: ev.title,
            description: ev.description,
            dateTime: ev.dateTime.toISOString(),
            eventType: ev.eventType,
            venue: { name: ev.venueName, address: ev.venueAddress, city: ev.venueCity },
            group: { id: ev.group.groupId, name: ev.group.name, urlname: ev.group.urlname },
          }
        : null;
    }

    if (q.includes('events')) {
      const evs = await prisma.event.findMany({ where: { status: 'ACTIVE' }, take: 10, orderBy: { dateTime: 'asc' } });
      responseData.events = evs.map((ev) => ({
        id: ev.eventId,
        eventId: ev.eventId,
        title: ev.title,
        dateTime: ev.dateTime.toISOString(),
        eventType: ev.eventType,
        venueName: ev.venueName,
        venueCity: ev.venueCity,
      }));
    }

    if (q.includes('groups')) {
      const groups = await prisma.group.findMany({ where: { isDraft: false }, take: 10 });
      responseData.groups = groups.map((g) => ({
        id: g.groupId,
        groupId: g.groupId,
        name: g.name,
        urlname: g.urlname,
        membersCount: g.membersCount,
        rating: g.rating,
      }));
    }

    return { data: responseData };
  }

  switch (name) {
    case 'getSelf':
    case 'getForceOnboardingSelfData': {
      const draft = await prisma.group.findFirst({
        where: { organizerId: user.id, isDraft: true },
      });
      const unreadNotifications = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
      const unreadMessages = await prisma.message.count({
        where: { receiverId: user.id, isRead: false },
      });
      return {
        data: {
          self: {
            __typename: 'Member',
            id: user.memberId,
            dbId: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            city: user.city,
            state: user.state,
            country: user.country,
            lat: user.lat,
            lon: user.lon,
            isNew: user.isNew,
            isMeetupPlus: user.isMeetupPlus,
            meetupPlusPlan: user.meetupPlusPlan,
            organizerPlan: user.organizerPlan,
            onboardingCompletedAt: user.onboardingCompletedAt,
            groupDraftCompletedAt: user.groupDraftCompletedAt,
            hasGroupDraft: Boolean(draft || user.groupDraftCompletedAt),
            draftGroup: draft,
            unreadNotifications,
            unreadMessages,
          },
        },
      };
    }

    case 'getMemberActionLastOccurrence': {
      const action = vars.action || input.action;
      let ts = null;
      if (action === 'onboarding_completed') ts = user.onboardingCompletedAt;
      if (action === 'group_draft_completed') ts = user.groupDraftCompletedAt;
      return {
        data: {
          self: {
            id: user.memberId,
            memberActionLastOccurrence: ts ? new Date(ts).toISOString() : null,
          },
        },
      };
    }

    case 'recordMemberAction': {
      const action = input.action;
      const updateData: any = {};
      if (action === 'onboarding_completed') {
        updateData.isNew = false;
        updateData.onboardingCompletedAt = new Date();
      } else if (action === 'group_draft_completed') {
        updateData.groupDraftCompletedAt = new Date();
      }
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
      return {
        data: {
          recordMemberAction: {
            memberAction: {
              action,
              lastOccurrenceTime: new Date().toISOString(),
            },
            self: updated,
          },
        },
      };
    }

    case 'updateMemberData':
    case 'updateAccountSettings': {
      const dataToUpdate: any = {};
      const allowedStringFields = [
        'name',
        'email',
        'bio',
        'city',
        'state',
        'country',
        'birthDate',
        'gender',
        'phone',
        'whatsappPhone',
        'relationshipStatus',
        'industry',
        'whoCanContact',
        'theme',
        'language',
        'timezone',
        'meetupPlusPlan',
        'organizerPlan',
      ];
      for (const f of allowedStringFields) {
        if (input[f] !== undefined) dataToUpdate[f] = input[f];
      }
      const allowedBoolFields = [
        'isNew',
        'showGroups',
        'showInterests',
        'relationshipStatusPublic',
        'sendFewerEmails',
        'turnOffAllEmails',
        'isMeetupPlus',
      ];
      for (const f of allowedBoolFields) {
        if (input[f] !== undefined) dataToUpdate[f] = Boolean(input[f]);
      }
      if (input.lookingFor !== undefined) {
        dataToUpdate.lookingFor = Array.isArray(input.lookingFor)
          ? JSON.stringify(input.lookingFor)
          : String(input.lookingFor);
      }
      if (input.peopleToMeet !== undefined) {
        dataToUpdate.peopleToMeet = Array.isArray(input.peopleToMeet)
          ? JSON.stringify(input.peopleToMeet)
          : String(input.peopleToMeet);
      }
      if (input.hangoutStyles !== undefined) {
        dataToUpdate.hangoutStyles = Array.isArray(input.hangoutStyles)
          ? JSON.stringify(input.hangoutStyles)
          : String(input.hangoutStyles);
      }
      if (input.lifeStages !== undefined) {
        dataToUpdate.lifeStages = Array.isArray(input.lifeStages)
          ? JSON.stringify(input.lifeStages)
          : String(input.lifeStages);
      }
      if (input.emailUpdatesConfig !== undefined) {
        dataToUpdate.emailUpdatesConfig =
          typeof input.emailUpdatesConfig === 'string'
            ? input.emailUpdatesConfig
            : JSON.stringify(input.emailUpdatesConfig);
      }
      if (input.socialLinks !== undefined) {
        dataToUpdate.socialLinks =
          typeof input.socialLinks === 'string'
            ? input.socialLinks
            : JSON.stringify(input.socialLinks);
      }
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
      });
      return { data: { updateMemberData: { member: updatedUser } } };
    }

    case 'findTopics':
    case 'getRecommendedNewTopics': {
      const q = (vars.query || input.query || '').trim().toLowerCase();
      const allTopics = await prisma.topic.findMany({
        include: { category: true },
        orderBy: { followersCount: 'desc' },
      });
      const filtered = q
        ? allTopics.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q)
          )
        : allTopics;
      return {
        data: {
          topics: filtered,
        },
      };
    }

    case 'followTopics': {
      const topicIds: string[] = input.topicIds || [];
      for (const tid of topicIds) {
        const topic = await prisma.topic.findFirst({
          where: { OR: [{ id: tid }, { topicId: tid }, { urlkey: tid }] },
        });
        if (topic) {
          await prisma.userTopic.upsert({
            where: { userId_topicId: { userId: user.id, topicId: topic.id } },
            update: {},
            create: { userId: user.id, topicId: topic.id },
          });
        }
      }
      const updatedTopics = await prisma.userTopic.findMany({
        where: { userId: user.id },
        include: { topic: true },
      });
      return {
        data: {
          followTopics: {
            topics: updatedTopics.map((ut) => ut.topic),
          },
        },
      };
    }

    case 'unfollowTopic': {
      const tid = input.topicId;
      const topic = await prisma.topic.findFirst({
        where: { OR: [{ id: tid }, { topicId: tid }, { urlkey: tid }] },
      });
      if (topic) {
        await prisma.userTopic.deleteMany({
          where: { userId: user.id, topicId: topic.id },
        });
      }
      return { data: { unfollowTopic: { success: true } } };
    }

    case 'getLocationSearch': {
      const q = (vars.query || input.query || '').trim().toLowerCase();
      const matches = q
        ? CITIES.filter((c) => c.display.toLowerCase().includes(q))
        : CITIES;
      return { data: { locations: matches } };
    }

    case 'saveEvent': {
      const targetId = String(input.eventId);
      const ev = await prisma.event.findFirst({
        where: { OR: [{ id: targetId }, { eventId: targetId }] },
      });
      if (ev) {
        await prisma.savedEvent.upsert({
          where: { userId_eventId: { userId: user.id, eventId: ev.id } },
          update: {},
          create: { userId: user.id, eventId: ev.id },
        });
      }
      return { data: { saveEvent: { saved: true, eventId: targetId } } };
    }

    case 'unsaveEvent': {
      const targetId = String(input.eventId);
      const ev = await prisma.event.findFirst({
        where: { OR: [{ id: targetId }, { eventId: targetId }] },
      });
      if (ev) {
        await prisma.savedEvent.deleteMany({
          where: { userId: user.id, eventId: ev.id },
        });
      }
      return { data: { unsaveEvent: { saved: false, eventId: targetId } } };
    }

    case 'rsvpToEvent': {
      const targetId = String(input.eventId);
      const responseStatus = input.response || 'YES';
      const guestsCount = Number(input.guestsCount || 0);
      const optToShareEmail = Boolean(input.optToShareEmail);

      const ev = await prisma.event.findFirst({
        where: { OR: [{ id: targetId }, { eventId: targetId }] },
        include: { group: true },
      });
      if (!ev) return { errors: [{ message: 'Event not found' }] };

      // Auto-join group if RSVPing YES
      if (responseStatus === 'YES') {
        await prisma.groupMembership.upsert({
          where: { userId_groupId: { userId: user.id, groupId: ev.groupId } },
          update: { status: 'ACTIVE' },
          create: {
            userId: user.id,
            groupId: ev.groupId,
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        });
      }

      const rsvp = await prisma.eventRsvp.upsert({
        where: { userId_eventId: { userId: user.id, eventId: ev.id } },
        update: {
          status: responseStatus,
          guestsCount,
          optToShareEmail,
        },
        create: {
          userId: user.id,
          eventId: ev.id,
          status: responseStatus,
          guestsCount,
          optToShareEmail,
        },
      });

      return {
        data: {
          rsvpToEvent: {
            rsvp,
            event: ev,
          },
        },
      };
    }

    case 'joinGroup': {
      const targetId = String(input.groupId || input.urlname);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
      });
      if (!grp) return { errors: [{ message: 'Group not found' }] };
      const membership = await prisma.groupMembership.upsert({
        where: { userId_groupId: { userId: user.id, groupId: grp.id } },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          groupId: grp.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
      return { data: { joinGroup: { membership, group: grp } } };
    }

    case 'leaveGroup': {
      const targetId = String(input.groupId || input.urlname);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
      });
      if (grp) {
        await prisma.groupMembership.deleteMany({
          where: { userId: user.id, groupId: grp.id },
        });
      }
      return { data: { leaveGroup: { success: true } } };
    }

    case 'updateGroupMembership': {
      const targetId = String(input.groupId);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
      });
      if (!grp) return { errors: [{ message: 'Group not found' }] };
      const updatePayload: any = {};
      if (input.groupBio !== undefined) updatePayload.groupBio = input.groupBio;
      if (input.emailNotificationsConfig !== undefined) {
        updatePayload.emailNotificationsConfig =
          typeof input.emailNotificationsConfig === 'string'
            ? input.emailNotificationsConfig
            : JSON.stringify(input.emailNotificationsConfig);
      }
      const updated = await prisma.groupMembership.upsert({
        where: { userId_groupId: { userId: user.id, groupId: grp.id } },
        update: updatePayload,
        create: {
          userId: user.id,
          groupId: grp.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          ...updatePayload,
        },
      });
      return { data: { updateGroupMembership: updated } };
    }

    case 'addGroupPhoto': {
      const targetId = String(input.groupId || input.urlname);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
        include: { photoAlbums: true },
      });
      if (!grp) return { errors: [{ message: 'Group not found' }] };
      let album = grp.photoAlbums[0];
      if (!album) {
        album = await prisma.photoAlbum.create({
          data: {
            albumId: String(Date.now()),
            title: `${grp.name} Community Photos`,
            groupId: grp.id,
            photosCount: 0,
          },
        });
      }
      const photo = await prisma.photo.create({
        data: {
          photoId: String(Date.now()),
          albumId: album.id,
          url:
            input.url ||
            'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&auto=format&fit=crop&q=80',
          caption: input.caption || 'Community meetup moment!',
          uploadedById: user.id,
        },
      });
      await prisma.photoAlbum.update({
        where: { id: album.id },
        data: { photosCount: { increment: 1 } },
      });
      return { data: { addGroupPhoto: photo } };
    }

    case 'createDiscussion': {
      const targetId = String(input.groupId || input.urlname);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
      });
      if (!grp) return { errors: [{ message: 'Group not found' }] };
      const disc = await prisma.discussion.create({
        data: {
          groupId: grp.id,
          authorId: user.id,
          title: input.title || 'Community Discussion',
          body: input.body || '',
          isPinned: false,
          likesCount: 1,
        },
        include: { author: true, comments: { include: { author: true } } },
      });
      return { data: { createDiscussion: disc } };
    }

    case 'addDiscussionComment': {
      const comment = await prisma.discussionComment.create({
        data: {
          discussionId: input.discussionId,
          authorId: user.id,
          body: input.body,
        },
        include: { author: true },
      });
      return { data: { addDiscussionComment: comment } };
    }

    case 'likeDiscussion': {
      const updated = await prisma.discussion.update({
        where: { id: input.discussionId },
        data: { likesCount: { increment: 1 } },
      });
      return { data: { likeDiscussion: updated } };
    }

    case 'donateToGroup': {
      const targetId = String(input.groupId || input.urlname);
      const amount = Number(input.amount || 20);
      const grp = await prisma.group.findFirst({
        where: { OR: [{ id: targetId }, { groupId: targetId }, { urlname: targetId }] },
      });
      if (!grp) return { errors: [{ message: 'Group not found' }] };
      const updated = await prisma.group.update({
        where: { id: grp.id },
        data: { fundraisingRaised: { increment: amount } },
      });
      await prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          groupId: grp.id,
          type: 'MEMBER_DUES',
          direction: 'MADE',
          description: `Pledge Donation to ${grp.name}`,
          amount,
          currency: 'USD',
          status: 'PAID',
        },
      });
      return { data: { donateToGroup: updated } };
    }

    case 'saveGroupDraft': {
      let draft = await prisma.group.findFirst({
        where: { organizerId: user.id, isDraft: true },
      });
      const slug = (input.name || 'san-francisco-new-meetup-group')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!draft) {
        draft = await prisma.group.create({
          data: {
            groupId: '38737586',
            name: input.name || 'San Francisco AI & Cloud Builders Meetup',
            urlname: `${slug}-${Date.now().toString().slice(-4)}`,
            description:
              input.description ||
              'A welcoming community bringing together people who share common passions.',
            city: input.city || user.city || 'San Francisco',
            state: input.state || user.state || 'CA',
            coverImage:
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
            isDraft: true,
            draftStep: Number(input.step || 1),
            organizerId: user.id,
          },
        });
      } else {
        draft = await prisma.group.update({
          where: { id: draft.id },
          data: {
            name: input.name ?? draft.name,
            description: input.description ?? draft.description,
            city: input.city ?? draft.city,
            draftStep: Number(input.step ?? draft.draftStep),
          },
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { groupDraftCompletedAt: new Date() },
      });
      return { data: { saveGroupDraft: draft } };
    }

    case 'generateAiGroupDescription': {
      const groupName = input.name || 'San Francisco Community Meetup';
      const topics = (input.topics || ['Technology', 'Networking']).join(', ');
      const location = input.location || 'San Francisco, CA';
      const generated = `Welcome to ${groupName} in ${location}! We are an inclusive, vibrant community focused on ${topics}. Whether you are a seasoned pro or exploring for the first time, join us for hands-on workshops, lively discussions, social mixers, and real-world connections every month!`;
      return { data: { generateAiGroupDescription: { description: generated } } };
    }

    case 'completeGroupCreation': {
      let draft = await prisma.group.findFirst({
        where: { organizerId: user.id, isDraft: true },
      });
      if (draft) {
        draft = await prisma.group.update({
          where: { id: draft.id },
          data: { isDraft: false, membersCount: 1 },
        });
        await prisma.groupMembership.upsert({
          where: { userId_groupId: { userId: user.id, groupId: draft.id } },
          update: { role: 'ORGANIZER', status: 'ACTIVE' },
          create: { userId: user.id, groupId: draft.id, role: 'ORGANIZER', status: 'ACTIVE' },
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { organizerPlan: input.plan || 'STANDARD_6M', groupDraftCompletedAt: null },
      });
      return { data: { completeGroupCreation: { group: draft } } };
    }

    case 'subscribeMeetupPlus': {
      const plan = input.plan || 'YEARLY';
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { isMeetupPlus: true, meetupPlusPlan: plan },
      });
      await prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          type: 'SUBSCRIPTION_MEETUP_PLUS',
          direction: 'MADE',
          description: `Meetup+ ${plan === 'YEARLY' ? 'Annual Plan (7-Day Free Trial)' : 'Monthly Plan'}`,
          amount: plan === 'YEARLY' ? 129.99 : 14.99,
          currency: 'USD',
          status: 'TRIAL_ACTIVE',
        },
      });
      return { data: { subscribeMeetupPlus: { user: updated } } };
    }

    case 'markNotificationsRead': {
      await prisma.notification.updateMany({
        where: { userId: user.id },
        data: { isRead: true },
      });
      return { data: { markNotificationsRead: { success: true } } };
    }

    case 'sendMessage': {
      const msg = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId: input.receiverId,
          body: input.body,
          isRead: false,
        },
        include: { sender: true, receiver: true },
      });
      return { data: { sendMessage: msg } };
    }

    case 'updateConnection': {
      const conn = await prisma.connection.update({
        where: { id: input.connectionId },
        data: { status: input.status || 'CONNECTED' },
      });
      return { data: { updateConnection: conn } };
    }

    case 'addPaymentMethod': {
      const pm = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          brand: input.brand || 'Mastercard',
          last4: (input.cardNumber || '5555').slice(-4),
          expMonth: Number(input.expMonth || 8),
          expYear: Number(input.expYear || 2029),
          holderName: input.holderName || user.name,
          country: input.country || 'US',
          postalCode: input.postalCode || '94102',
          isDefault: true,
        },
      });
      return { data: { addPaymentMethod: pm } };
    }

    case 'deletePaymentMethod': {
      await prisma.paymentMethod.deleteMany({
        where: { id: input.id, userId: user.id },
      });
      return { data: { deletePaymentMethod: { success: true } } };
    }

    case 'createOAuthApp': {
      const app = await prisma.oAuthClientApp.create({
        data: {
          userId: user.id,
          name: input.name,
          websiteUrl: input.websiteUrl,
          redirectUri: input.redirectUri,
          clientId: `mup_live_${Math.random().toString(36).slice(2, 14)}`,
          clientSecret: `mup_sec_${Math.random().toString(36).slice(2, 18)}`,
        },
      });
      return { data: { createOAuthApp: app } };
    }

    case 'deleteOAuthApp': {
      await prisma.oAuthClientApp.deleteMany({
        where: { id: input.id, userId: user.id },
      });
      return { data: { deleteOAuthApp: { success: true } } };
    }

    case 'submitReport': {
      const rep = await prisma.reportSubmission.create({
        data: {
          reporterId: user.id,
          targetType: input.targetType || 'EVENT',
          targetId: String(input.targetId),
          reason: input.reason,
          details: input.details || '',
        },
      });
      return { data: { submitReport: rep } };
    }

    default:
      return { data: { ok: true, operationName: name } };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveUser(req, res);
  if (!user) {
    return res.status(401).json({ errors: [{ message: 'Unauthenticated' }] });
  }

  const body = req.body;
  if (Array.isArray(body)) {
    const results = [];
    for (const item of body) {
      results.push(await executeOperation(item, user));
    }
    return res.status(200).json(results);
  }

  const result = await executeOperation(body || {}, user);
  return res.status(200).json(result);
}
