import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default function RedirectToBuyerProfile() {
  // Profile updates are now handled from the consolidated buyer profile page.
  redirect("/buyer-account/profile");
}
