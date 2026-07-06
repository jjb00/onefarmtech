import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default function RedirectToBuyerProfile() {
  // Credit and payment readiness are now managed from the consolidated buyer profile page.
  redirect("/buyer-account/profile");
}
