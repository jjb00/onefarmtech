type JsonLd = Record<string, unknown>;

export default function StructuredData({data}: {data: JsonLd | JsonLd[]}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
