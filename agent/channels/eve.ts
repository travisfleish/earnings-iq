import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    vercelOidc(),
    localDev(),
    // Public browser chat — replace none() with Supabase/Better Auth when login is added.
    none(),
  ],
});
