import Image from "next/image";

type CollageImage = {
  src: string;
  alt: string;
  className: string;
};

type PublicImageCollageProps = {
  images: CollageImage[];
};

export default function PublicImageCollage({images}: PublicImageCollageProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {images.map((image) => (
        <div
          key={`${image.src}-${image.alt}`}
          className={`absolute ${image.className}`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 180px, 360px"
            className="object-contain"
            priority={false}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[#fbfff8]/28" />
    </div>
  );
}
