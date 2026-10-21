export function publicViewer(user: {
  id: string; memberId: string; name: string; city: string;
  state: string; country: string; image: string | null;
} | null) {
  if (!user) return null;
  return {
    id: user.id, memberId: user.memberId, name: user.name,
    city: user.city, state: user.state, country: user.country, image: user.image,
  };
}
