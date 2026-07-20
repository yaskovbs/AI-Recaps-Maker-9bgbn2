import { Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Acceptance of these terms',
    body: 'By accessing or using AI Recaps Maker, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.',
  },
  {
    title: '2. The service',
    body: 'AI Recaps Maker provides tools for uploading or linking content and producing AI-assisted scripts, summaries, audio, and video recaps. Features may change, be limited, or be discontinued as the service develops.',
  },
  {
    title: '3. Accounts',
    body: 'You must provide accurate information, protect your login credentials, and promptly notify us of unauthorized account use. You are responsible for activity conducted through your account. You may not impersonate another person or create an account for unlawful purposes.',
  },
  {
    title: '4. Your content and permissions',
    body: 'You retain your rights in content you submit. You grant us a limited, worldwide license to host, copy, transmit, modify, and process that content only as needed to operate, secure, and improve the service. You represent that you own the content or have all permissions required to upload and process it.',
  },
  {
    title: '5. Copyright and acceptable use',
    body: 'You may not upload or generate unlawful, infringing, deceptive, abusive, harmful, or privacy-violating content; bypass security or usage limits; distribute malware; interfere with the service; scrape it without permission; or use it to violate another person’s rights. We may remove content or restrict accounts when reasonably necessary.',
  },
  {
    title: '6. AI-generated output',
    body: 'AI-generated results may be incomplete, inaccurate, or similar to content generated for others. You are responsible for reviewing output and determining whether it is lawful and suitable before using or publishing it. Output is not professional, legal, medical, or financial advice.',
  },
  {
    title: '7. Third-party services',
    body: 'The service relies on third-party authentication, infrastructure, hosting, storage, and AI services. Their separate terms may apply. We are not responsible for third-party services, content, availability, or changes outside our control.',
  },
  {
    title: '8. Availability and changes',
    body: 'We aim to provide a reliable service but do not guarantee uninterrupted or error-free operation. Processing time depends on file size, demand, network conditions, and third-party systems. We may perform maintenance or change service limits when necessary.',
  },
  {
    title: '9. Suspension and termination',
    body: 'You may stop using the service at any time. We may suspend or terminate access for violations of these terms, security risks, legal requirements, or conduct that could harm users or the service. Provisions that by their nature should survive termination will remain effective.',
  },
  {
    title: '10. Disclaimers',
    body: 'To the extent permitted by law, the service is provided “as is” and “as available,” without warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, or uninterrupted availability. Nothing in these terms excludes rights that cannot legally be excluded.',
  },
  {
    title: '11. Limitation of liability',
    body: 'To the extent permitted by law, AI Recaps Maker and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or loss of data, profits, goodwill, or business arising from your use of the service.',
  },
  {
    title: '12. Changes to these terms',
    body: 'We may update these terms as the service changes. Updated terms become effective when posted, unless a later date is stated. Continued use after an update means you accept the revised terms.',
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <article className="steampunk-card mx-auto max-w-4xl p-5 sm:p-8 lg:p-10">
        <header className="mb-10 border-b border-white/10 pb-7">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-brass-200 sm:text-4xl">
            <FileText className="h-9 w-9 shrink-0" aria-hidden="true" />
            Terms of Service
          </h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-brass-400">
            <Calendar className="h-4 w-4" aria-hidden="true" /> Effective July 20, 2026
          </p>
          <p className="mt-5 leading-relaxed text-brass-300">
            These terms govern your use of AI Recaps Maker at making-a-recap-with-ai.com.
          </p>
        </header>

        <div className="space-y-8 text-brass-300 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brass-200 [&_p]:leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <h2>13. Contact</h2>
            <p>
              Questions about these terms can be sent to{' '}
              <a className="text-cyan-300 underline underline-offset-4" href="mailto:contact-us@y-l-b-s-ai-studio-apps.com">
                contact-us@y-l-b-s-ai-studio-apps.com
              </a>{' '}
              or through our <Link className="text-cyan-300 underline underline-offset-4" to="/contact">contact page</Link>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
