import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    vercelOidc(),
    localDev(),
    // Replace with Supabase or Better Auth before opening browser chat in production.
    placeholderAuth(),
  ],
});
