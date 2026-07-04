type PublicBackdropProps = {
  image?: string;
  opacity?: number;
  position?: string;
};

export default function PublicBackdrop({
  image = "/brand/produce-pattern.svg",
  opacity = 0.18,
  position = "center",
}: PublicBackdropProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url('${image}')`,
          backgroundPosition: position,
          opacity,
        }}
      />
      <div className="absolute inset-0 bg-[#fbfff8]/68" />
    </div>
  );
}
