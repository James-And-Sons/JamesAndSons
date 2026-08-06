import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Concierge | James & Sons",
  description:
    "Reach our luxury illumination customer service and design desks at Peer matha, parav dubey, Aligarh, Uttar Pradesh, India- 202001. Access tickets or launch our live chat help desk.",
};

export default function ContactPage() {
  return (
    <>
      <main style={{ minHeight: "100vh", background: "var(--obsidian)" }}>
        <ContactClient />
      </main>
    </>
  );
}
