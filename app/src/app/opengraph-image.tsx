import {ImageResponse} from "next/og";
import {OgImageContent} from "@/lib/ogImageContent";
import {SITE_NAME} from "@/lib/publicSeo";

export const runtime = "edge";
export const alt = `${SITE_NAME} - Fresh produce supply for Nigerian buyers`;
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(<OgImageContent />, size);
}
