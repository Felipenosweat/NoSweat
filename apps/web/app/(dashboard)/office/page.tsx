import { redirect } from "next/navigation";

// /office sozinho abre as configurações (as abas levam à tabela de preços e à equipe).
export default function OfficePage() {
  redirect("/office/settings");
}
