import { getChatGPTUser } from "./chatgpt-auth";
import Arcade from "./ui/arcade";
export const dynamic = "force-dynamic";
export default async function Page() {
  let viewer = null;
  try {
    const user = await getChatGPTUser();
    if (user) viewer = { name: user.displayName, email: user.email };
  } catch {}
  return <Arcade viewer={viewer} />;
}
