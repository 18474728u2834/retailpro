import LegalLayout from "@/components/LegalLayout";

const Privacy = () => {
  return (
    <LegalLayout title="Privacy Policy" updated="April 19, 2026">
      <p>Your privacy matters to us. This policy explains what information RetailPro collects when you use our Roblox experience and products.</p>

      <h2>1. Information we receive</h2>
      <ul>
        <li><strong>From Roblox:</strong> your Roblox username, user ID and basic account info shared by the platform when you join an experience.</li>
        <li><strong>In-experience activity:</strong> ownership of RetailPro products, settings and gameplay data needed to make features work (e.g. BaseUnit network status, Assistance Point alerts).</li>
        <li><strong>Support requests:</strong> any messages you send us through our Discord server.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide and improve RetailPro features.</li>
        <li>To handle purchases, ownership and entitlements.</li>
        <li>To prevent abuse, exploits and cheating.</li>
        <li>To respond to support requests.</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>We do not sell your data. Information is processed through Roblox's platform and any infrastructure required to run the experience. Roblox's own Privacy Policy also applies to your use of the platform.</p>

      <h2>4. Children</h2>
      <p>RetailPro is used inside Roblox, which is enjoyed by players of all ages. We follow Roblox's policies regarding minors and do not knowingly collect personal information beyond what Roblox provides.</p>

      <h2>5. Data retention</h2>
      <p>We keep gameplay and purchase data only for as long as needed to provide the service and prevent abuse.</p>

      <h2>6. Your choices</h2>
      <p>You can stop using RetailPro at any time by leaving the experience. For questions about your data, contact us on Discord.</p>

      <h2>7. Changes</h2>
      <p>We may update this policy. The "Last updated" date at the top reflects the most recent version.</p>

      <h2>8. Contact</h2>
      <p>Reach us on our <a href="https://discord.gg/v9WuReyWGQ" target="_blank" rel="noopener noreferrer">Discord support server</a>.</p>
    </LegalLayout>
  );
};

export default Privacy;
