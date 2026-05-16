import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

interface Props {
  title: string;
  updated: string;
  children: ReactNode;
}

const LegalLayout = ({ title, updated, children }: Props) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-16 md:py-24 max-w-3xl">
        <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: {updated}</p>
        <div className="prose prose-neutral max-w-none space-y-6 text-foreground [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_a]:text-accent [&_a]:underline">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
