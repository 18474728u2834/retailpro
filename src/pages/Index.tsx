import { getSite } from "@/lib/site";
import RetailProLanding from "./RetailProLanding";
import RetailConnect from "./RetailConnect";
import ModmailLanding from "./ModmailLanding";

const Index = () => {
  const site = getSite();
  if (site === "modmail") return <ModmailLanding />;
  if (site === "retailconnect") return <RetailConnect />;
  return <RetailProLanding />;
};

export default Index;
