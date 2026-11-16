import { getChatGPTUser } from "./chatgpt-auth";
import Control from "./ui/control";
export const dynamic="force-dynamic";
export default async function Page(){const user=await getChatGPTUser();return <Control viewer={user?{name:user.displayName,email:user.email}:null}/>;}
