import type { Metadata } from "next";
import Link from "next/link";
import {
  ContactEmailLink,
  LegalPage,
  type LegalSection,
} from "@/components/marketing/legal/LegalPage";
import { textLink } from "@/components/marketing/styles";

// Rascunho da Política de Privacidade. Só descreve o que a plataforma faz hoje (Supabase,
// Vercel, Anthropic; Stripe quando a cobrança existir; Meta quando o cliente conecta o
// Instagram). Sem selos ou certificações. Revisar com um advogado antes do App Review da Meta.

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What information No Sweat collects, how we use it, who helps us process it, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <p>
          No Sweat (“No Sweat,” “we,” “us”) helps small businesses build and publish websites at
          nosweatfd.com. This policy explains what information we collect, why we collect it, who we
          share it with, and the choices you have.
        </p>
        <p>
          The short version: we collect what we need to run your account and your website, we don’t
          sell your personal information, and you can ask us to delete it.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    content: (
      <>
        <ul>
          <li>
            <strong>Account information.</strong> Your first and last name, date of birth, email
            address and the password you choose (we store passwords only in hashed form through our
            login provider). We ask for your date of birth only to confirm you’re 18 or older.
          </li>
          <li>
            <strong>Business information you enter.</strong> Your business name, description,
            services, location, phone number, hours and anything else you type in to build your
            website.
          </li>
          <li>
            <strong>Website content.</strong> The text, colors, sections and images of your website,
            including saved drafts and earlier versions so you can restore them.
          </li>
          <li>
            <strong>Contact-form submissions.</strong> When visitors to your published website send
            you a message, we store what they submit (for example their name, email or phone number,
            and message) so you can read it in your dashboard.
          </li>
          <li>
            <strong>Email preferences.</strong> Whether you asked to get launch and product news
            from us, and if you unsubscribed.
          </li>
          <li>
            <strong>Cookies and basic usage.</strong> Cookies that keep you logged in, and a guest
            cookie that lets you start building a website before you create an account.
          </li>
          <li>
            <strong>AI usage counters.</strong> How many AI generations and edits your account makes
            each day, so we can apply daily limits.
          </li>
          <li>
            <strong>Hashed IP address.</strong> A one-way hash of your IP address, used to limit
            abuse: applying AI usage limits to people building without an account and limiting how
            many contact-form messages can be sent to a website. We store the hash, not the raw
            address, for this purpose.
          </li>
        </ul>
        <p>
          Our hosting provider may also keep standard server logs (such as IP address, browser type
          and pages requested) for security and reliability.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use information",
    content: (
      <ul>
        <li>To create your account, log you in and keep your account secure.</li>
        <li>To generate, edit, store, publish and host your website.</li>
        <li>To deliver contact-form messages from your visitors to your dashboard.</li>
        <li>If you connect Instagram, to publish the posts you approve at the times you choose.</li>
        <li>To apply usage limits and prevent spam, fraud and abuse.</li>
        <li>To answer your questions and send important notices about your account.</li>
        <li>
          If you opted in, to email you launch and product news. Every one of these emails has an
          unsubscribe link, and unsubscribing doesn’t affect emails about your account.
        </li>
        <li>To fix problems and improve how the service works.</li>
        <li>To comply with the law and enforce our Terms of Service.</li>
      </ul>
    ),
  },
  {
    id: "ai-processing",
    title: "How AI processes your content",
    content: (
      <>
        <p>
          When you generate a website or ask the AI to change it, we send your business description
          and the relevant website content to our AI provider, which returns the generated or edited
          content. We use this only to build and edit your website.
        </p>
        <p>
          Please don’t include sensitive personal information (such as Social Security numbers,
          health or financial details) in your business description or website content.
        </p>
      </>
    ),
  },
  {
    id: "connected-social-accounts",
    title: "Connected social accounts (Instagram)",
    content: (
      <>
        <p>
          You can connect an Instagram professional account so No Sweat can publish posts for your
          business. Connecting is optional. When you connect, Instagram (Meta Platforms) shares this
          information with us, based on the permissions you approve:
        </p>
        <ul>
          <li>Your Instagram account ID and username.</li>
          <li>Your profile picture and account type.</li>
          <li>The permissions you granted to No Sweat.</li>
          <li>The IDs and links of the posts we publish for you.</li>
          <li>An access token that lets us publish on your behalf.</li>
        </ul>
        <p>
          <strong>Why we use it.</strong> Only to publish the posts you approve, at the time you
          choose, and to show you their status in your dashboard. We never publish anything you
          haven’t approved.
        </p>
        <p>
          <strong>How we protect it.</strong> Access tokens are encrypted at rest. We never sell or
          share your Instagram data, and we don’t use it for advertising or to train AI models.
        </p>
        <p>
          <strong>AI captions.</strong> If you ask for caption ideas, we send your business
          information (not your Instagram data or token) to our AI provider, Anthropic. You review
          and edit every caption before it can be published.
        </p>
        <p>
          <strong>How long we keep it.</strong> Your access token is deleted as soon as you
          disconnect the account in No Sweat or remove No Sweat’s access in Instagram. Other data we
          received from Instagram is deleted within 30 days of a deletion request.
        </p>
        <p>
          <strong>How to delete it.</strong> You can do any of these:
        </p>
        <ul>
          <li>
            Disconnect the account on the{" "}
            <Link href="/social" className={textLink}>
              Social
            </Link>{" "}
            page of your dashboard.
          </li>
          <li>
            In Instagram, go to Settings, then <strong>Apps and websites</strong>, and remove No
            Sweat.
          </li>
          <li>
            Email us at <ContactEmailLink /> from the address on your account.
          </li>
        </ul>
        <p>
          Step-by-step instructions, and a way to check the status of a request, are on our{" "}
          <Link href="/data-deletion" className={textLink}>
            data deletion page
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "service-providers",
    title: "Service providers",
    content: (
      <>
        <p>
          We rely on a small number of companies to run No Sweat. They process information on our
          behalf, only to provide their services to us:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong>: database and account login.
          </li>
          <li>
            <strong>Vercel</strong>: website hosting and custom domain connections.
          </li>
          <li>
            <strong>Anthropic</strong>: the AI that writes and edits website content and suggests
            social media captions.
          </li>
          <li>
            <strong>Meta Platforms</strong>: Instagram, if you connect an Instagram account so we
            can publish the posts you approve.
          </li>
          <li>
            <strong>Resend</strong>: sending emails (contact-form notices and, if you opted in,
            launch and product news).
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong>: a security check on sign-up, log-in, password
            reset and confirmation-email resend that tells people apart from bots.
          </li>
          <li>
            <strong>Stripe</strong>: payment processing, once paid plans launch. We won’t see or
            store your full card number.
          </li>
        </ul>
        <p>
          We may also share information if the law requires it, to protect people’s safety or our
          rights, or as part of a merger or sale of the business (in which case this policy would
          continue to apply to your information).
        </p>
      </>
    ),
  },
  {
    id: "no-selling",
    title: "We don’t sell your personal information",
    content: (
      <p>
        We don’t sell your personal information, and we don’t share it for cross-context behavioral
        advertising. We don’t use advertising trackers on nosweatfd.com.
      </p>
    ),
  },
  {
    id: "your-visitors",
    title: "If you contacted a business through its website",
    content: (
      <>
        <p>
          Many small businesses build their websites with No Sweat. If you sent a message through
          the contact form on one of those websites, this section explains what happens to it.
        </p>
        <p>
          <strong>Who receives your message.</strong> The business that owns the website. We show
          your name, email address, phone number and message in that business’s No Sweat dashboard
          and send the business an email notice with the same details. The business decides how to
          reply, may keep your details in its client list, and is responsible for using them
          lawfully, for example only contacting you about the request you sent.
        </p>
        <p>
          <strong>What No Sweat stores, and why.</strong> What you typed in the form, which website
          it was sent to and when, and a one-way hash of your IP address (not the address itself)
          that we use to limit spam. We use this only to deliver your message to the business and to
          protect the form from abuse. We don’t sell it, use it for advertising or add you to our
          mailing lists.
        </p>
        <p>
          <strong>How long we keep it.</strong> While the business’s website and account exist,
          unless the business deletes the website or you ask us to delete your message.
        </p>
        <p>
          <strong>How to ask for deletion.</strong> You can ask the business directly, or email us
          at <ContactEmailLink /> with the website’s address and the email or phone number you used.
          We’ll delete your message from No Sweat and may let the business know. Copies the business
          already made, such as the email notice it received, are controlled by the business.
        </p>
        <p>
          <strong>If you own a No Sweat website,</strong> you’re responsible for using these
          messages lawfully. If one of your visitors asks us about their information, we may refer
          them to you or help you respond.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention and deletion",
    content: (
      <>
        <p>
          We keep your information while your account is active and as long as needed to run the
          service.
        </p>
        <ul>
          <li>
            You can delete a website anytime from your dashboard. This removes it from your account
            and takes it offline.
          </li>
          <li>
            To delete your account and its information, email us from the address on your account.
          </li>
        </ul>
        <p>
          Some information may remain for a limited time in backups or logs, or longer where the law
          requires us to keep it.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        We use reasonable measures to protect your information, such as encrypted connections
        (HTTPS), access controls so each account only sees its own websites and messages, and hashed
        passwords. No system is perfectly secure, so we can’t guarantee absolute security. If we
        learn of a breach that affects your information, we’ll notify you as required by law.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <p>
        No Sweat is for businesses and is not meant for children. You must be 18 or older to create
        an account, and we don’t knowingly collect personal information from children under 13. If
        you believe a child has given us information, contact us and we’ll delete it.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your privacy rights",
    content: (
      <>
        <p>
          Depending on where you live, including California and other states with privacy laws, you
          may have the right to:
        </p>
        <ul>
          <li>Know what personal information we have about you and how we use it.</li>
          <li>Get a copy of it.</li>
          <li>Correct information that is wrong.</li>
          <li>Ask us to delete it.</li>
          <li>Opt out of the sale or sharing of personal information (we don’t do either).</li>
        </ul>
        <p>
          To make a request, email us at <ContactEmailLink /> from the address on your account and
          tell us what you’d like us to do. We may need to confirm your identity before acting on
          it. You can also use an authorized agent. We won’t treat you differently for using these
          rights.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy as No Sweat grows, for example when paid plans launch. We’ll
        change the “Last updated” date above, and for important changes we’ll let you know by email
        or in your dashboard.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about privacy or this policy? Email us at <ContactEmailLink />.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedIso="2026-10-20"
      updatedLabel="October 20, 2026"
      intro={
        <p>
          What we collect when you use No Sweat, why we collect it, and how you can see, change or
          delete it.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
