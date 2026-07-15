import { createClient } from '@base44/sdk';

// Admin panel uses service-role access (no user login required)
export const base44 = createClient({
  appId: "6a5226b5047f5c59d961130e",
});
