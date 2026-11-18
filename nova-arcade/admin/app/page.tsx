import { getChatGPTUser } from "./chatgpt-auth";
import Control from "./ui/control";
export const dynamic = "force-dynamic";
export default async function Page() {
  let viewer = null;
  try {
    const user = await getChatGPTUser();
    if (user) viewer = { name: user.displayName, email: user.email };
  } catch {}
  return <Control viewer={viewer} />;
}
