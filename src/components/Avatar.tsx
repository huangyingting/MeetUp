import Image from 'next/image';

export default function Avatar({ name, image, size = 44 }: { name: string; image?: string | null; size?: number }) {
  return image ? (
    <Image src={image} alt={name} width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span aria-label={name} className="inline-flex items-center justify-center rounded-full bg-[var(--forest)] text-white font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * .32 }}>
      {name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
    </span>
  );
}
