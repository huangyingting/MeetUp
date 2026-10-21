import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });
const taxonomy = [
  ['Outdoors', 'outdoors', 'Mountain', ['Hiking', 'Running', 'Cycling']],
  ['Arts & culture', 'arts-culture', 'Palette', ['Photography', 'Art', 'Film']],
  ['Technology', 'technology', 'Code2', ['Software Development', 'Artificial Intelligence', 'Design']],
  ['Food & drink', 'food-drink', 'Coffee', ['Cooking', 'Coffee', 'Food']],
  ['Wellbeing', 'wellbeing', 'Heart', ['Yoga', 'Meditation', 'Fitness']],
  ['Learning', 'learning', 'BookOpen', ['Languages', 'Books', 'Writing']],
  ['Social', 'social', 'Users', ['New in Town', 'Board Games', 'Volunteering']],
  ['Professional', 'professional', 'Briefcase', ['Entrepreneurship', 'Networking', 'Career Development']],
];

try {
  for (const [index, [name, urlkey, icon, topics]] of taxonomy.entries()) {
    const category = await prisma.topicCategory.upsert({
      where: { urlkey },
      update: { name, icon },
      create: { categoryId: index + 1, name, urlkey, icon, color: '#224b3e' },
    });
    for (const topicName of topics) {
      const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.topic.upsert({
        where: { urlkey: slug },
        update: { name: topicName, categoryId: category.id },
        create: {
          topicId: slug,
          name: topicName,
          urlkey: slug,
          description: `Discover communities and events about ${topicName.toLowerCase()}.`,
          followersCount: 0,
          categoryId: category.id,
        },
      });
    }
  }
  console.log('Reference categories and topics are ready. No accounts or activity were created.');
} finally {
  await prisma.$disconnect();
}
