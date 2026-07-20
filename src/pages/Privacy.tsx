import { Calendar, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Information we collect',
    content: (
      <>
        <p>We collect information needed to provide and secure AI Recaps Maker, including:</p>
        <ul>
          <li>Account information, such as your name, email address, profile image, and authentication identifier.</li>
          <li>Content you submit, including uploaded video or audio, links, recap instructions, and generated results.</li>
          <li>Settings and activity, such as language, recap preferences, processing status, and feature usage.</li>
          <li>Technical information, such as device, browser, IP address, diagnostic logs, and security events.</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Authentication data',
    content: (
      <p>
        When you create an account, we use your email address and authentication identifier to register and
        authenticate you. Password authentication is handled securely by our authentication provider; we do not store
        your password in readable form.
      </p>
    ),
  },
  {
    title: '3. How we use information',
    content: (
      <ul>
        <li>Provide authentication, uploads, AI-assisted processing, recap creation, and account features.</li>
        <li>Maintain, troubleshoot, secure, and improve the service.</li>
        <li>Respond to support requests and send essential service notices.</li>
        <li>Prevent fraud, abuse, copyright violations, and unauthorized access.</li>
        <li>Comply with applicable legal obligations.</li>
      </ul>
    ),
  },
  {
    title: '4. Processing and service providers',
    content: (
      <p>
        We may process information through infrastructure, authentication, storage, AI, and hosting providers such
        as Supabase, Google, and our hosting providers. These providers receive information only as reasonably needed
        to operate their services for us. We do not sell your personal information.
      </p>
    ),
  },
  {
    title: '5. Uploaded content and AI processing',
    content: (
      <p>
        Content submitted for a recap may be stored and transmitted to service providers for processing. AI-generated
        results can be inaccurate and should be reviewed before publication. Do not upload confidential information
        or content you are not authorized to use.
      </p>
    ),
  },
  {
    title: '6. Retention and deletion',
    content: (
      <p>
        We retain account information and submitted content while your account is active and as needed to provide the
        service. Processing logs and backups may remain for a limited period for security, recovery, and legal
        compliance. You may request deletion through the account settings or by contacting us.
      </p>
    ),
  },
  {
    title: '7. Security',
    content: (
      <p>
        We use reasonable technical and organizational safeguards, including encrypted network connections and access
        controls. No internet service is completely secure, so we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: '8. Cookies and local storage',
    content: (
      <p>
        We use cookies or browser storage required for authentication, security, preferences, and core functionality.
        You can restrict these through your browser, but doing so may prevent the service from working correctly.
      </p>
    ),
  },
  {
    title: '9. Your choices and rights',
    content: (
      <p>
        Depending on your location, you may have rights to access, correct, export, restrict, object to, or delete your
        personal information. Contact us to exercise a right. We may verify your identity before completing a request.
      </p>
    ),
  },
  {
    title: "10. Children's privacy",
    content: (
      <p>
        The service is not directed to children under 13, or the minimum digital-consent age required where they live.
        We do not knowingly collect personal information from such children.
      </p>
    ),
  },
  {
    title: '11. Changes and contact',
    content: (
      <p>
        We may update this policy and will change the effective date when we do. For privacy questions or requests,
        email <a href="mailto:contact-us@y-l-b-s-ai-studio-apps.com">contact-us@y-l-b-s-ai-studio-apps.com</a>. You
        can also use our <Link to="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <article className="steampunk-card mx-auto max-w-4xl p-5 sm:p-8 lg:p-10">
        <header className="mb-10 border-b border-white/10 pb-7">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-brass-200 sm:text-4xl">
            <Shield className="h-9 w-9 shrink-0" aria-hidden="true" />
            Privacy Policy
          </h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-brass-400">
            <Calendar className="h-4 w-4" aria-hidden="true" /> Effective July 20, 2026
          </p>
          <p className="mt-5 leading-relaxed text-brass-300">
            This policy explains how AI Recaps Maker collects, uses, shares, and protects information when you use
            making-a-recap-with-ai.com and its recap-processing features.
          </p>
        </header>

        <div className="space-y-8 text-brass-300 [&_a]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brass-200 [&_li]:ml-5 [&_li]:list-disc [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:space-y-2">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
