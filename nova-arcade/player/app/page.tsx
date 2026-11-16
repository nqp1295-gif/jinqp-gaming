import { getChatGPTUser } from "./chatgpt-auth";
import Arcade from "./ui/arcade";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user=await getChatGPTUser();
  return <Arcade viewer={user ? {name:user.displayName,email:user.email}:null} />;
}
