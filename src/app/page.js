import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/chat'); // proxy.js sends unauthenticated users on to /login
}
