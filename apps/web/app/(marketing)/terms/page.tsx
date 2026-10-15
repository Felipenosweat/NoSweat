import type { Metadata } from "next";
import Link from "next/link";
import {
  ContactEmailLink,
  LegalPage,
  type LegalSection,
} from "@/components/marketing/legal/LegalPage";
import { textLink } from "@/components/marketing/styles";

// Rascunho dos Termos de Uso. Texto em inglês simples; nada de selos, certificações ou
// garantias que a empresa não tem. Revisar com um advogado antes de lançar os planos pagos.

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using No Sweat to build, edit and publish a website for your small business.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <>
        <p>
          No Sweat (“No Sweat,” “we,” “us”) runs nosweatfd.com, an online service that helps small
          businesses in the United States create, edit and publish a website with the help of AI.
        </p>
        <p>
          These Terms of Service (“Terms”) are an agreement between you and No Sweat. By creating an
          account or using the service, you agree to them. If you don’t agree, please don’t use No
          Sweat.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and eligibility",
    content: (
      <>
        <p>
          You must be at least 18 years old and use No Sweat for a business, nonprofit or
          professional purpose. If you sign up on behalf of a company, you confirm that you’re
          allowed to accept these Terms for it.
        </p>
        <ul>
          <li>Give us accurate account information and keep your email address up to date.</li>
          <li>
            Keep your password private. You’re responsible for what happens under your account.
          </li>
          <li>
            Tell us right away if you think someone else has accessed your account without
            permission.
          </li>
        </ul>
        <p>
          You can start building a website before you create an account. Drafts made this way are
          tied to your browser until you sign up.
        </p>
      </>
    ),
  },
  {
    id: "the-service",
    title: "The service",
    content: (
      <>
        <p>
          You describe your business, and our AI picks a template and writes a first draft of your
          website: headline, services, FAQ, colors and fonts. You can then edit the draft, ask the
          AI for changes, and publish it at a nosweatfd.com address or on a domain you own. Messages
          that visitors send through your website’s contact form are saved in your dashboard.
        </p>
        <p>
          <strong>You review and approve everything before it goes live.</strong> A website is only
          published when you choose to publish it, and you’re responsible for what it says.
        </p>
        <p>
          We’re a young product and we keep improving it. Features may be added, changed or removed
          over time. When a change significantly affects how you use a paid plan, we’ll let you know
          in advance.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Truthful content and what you publish",
    content: (
      <>
        <p>
          Your website speaks for your business, so it must be honest. Only publish information that
          is true and that you have the right to use. In particular, do not publish:
        </p>
        <ul>
          <li>Reviews, testimonials or ratings that customers didn’t actually give you.</li>
          <li>Licenses, insurance, certifications, awards or memberships you don’t hold.</li>
          <li>Guarantees, prices or service promises you don’t intend to honor.</li>
          <li>Photos, logos or text you don’t own or have permission to use.</li>
        </ul>
        <p>
          Our templates don’t add badges, star ratings or claims on their own. If something like
          that appears on your website, it should be because you provided it and it’s accurate.
        </p>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Your content and our license to host it",
    content: (
      <>
        <p>
          <strong>You own your content</strong>: your business information, the text and images you
          add, and the website content created for you through the service.
        </p>
        <p>
          To run the service, you give No Sweat a limited, non-exclusive license to store, copy,
          process, display and publish your content, only as needed to host your website, show it to
          you and your visitors, generate and edit it with AI, and keep backups. This license ends
          when your content is deleted from our systems, except for copies we must keep by law or
          that remain briefly in backups.
        </p>
        <p>
          No Sweat owns the platform itself: our software, templates, designs and brand. You may use
          our templates as part of your website on No Sweat, but you may not copy or resell them
          separately.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>You agree not to use No Sweat to:</p>
        <ul>
          <li>Break any law, or help someone else break one.</li>
          <li>Mislead or defraud people, including through false advertising.</li>
          <li>
            Publish content that is hateful, harassing, sexually explicit, violent or that infringes
            someone else’s rights.
          </li>
          <li>Send spam or collect people’s information without a lawful reason.</li>
          <li>
            Distribute malware, attempt to break into our systems or other accounts, or overload the
            service on purpose.
          </li>
          <li>Get around usage limits, for example by creating accounts in bulk.</li>
        </ul>
        <p>
          If we find content or activity that breaks these rules, we may remove the content,
          unpublish the website or suspend the account. When it’s reasonable, we’ll tell you first
          and give you a chance to fix it.
        </p>
      </>
    ),
  },
  {
    id: "custom-domains",
    title: "Custom domains",
    content: (
      <>
        <p>
          You can connect a domain you already own. You keep full ownership of your domain, and you
          remain responsible for registering it, renewing it and paying your domain registrar.
          Domain registration is not included in No Sweat.
        </p>
        <p>
          We show you the DNS records to add. Setting up and maintaining those records at your
          registrar is your responsibility. If they are changed or removed, or your domain expires,
          your website may stop showing on that domain.
        </p>
      </>
    ),
  },
  {
    id: "connected-accounts",
    title: "Connected accounts and scheduled posts",
    content: (
      <>
        <p>
          You can connect an Instagram professional account and schedule posts for your business.
          When you do:
        </p>
        <ul>
          <li>
            <strong>We publish only posts you approve.</strong> Drafts and AI suggestions are never
            published until you approve them.
          </li>
          <li>
            You’re responsible for the content of your posts, including the photos and captions, and
            for following Instagram’s terms and community guidelines. The “Truthful content” rules
            above apply to posts too.
          </li>
          <li>
            AI caption suggestions can be wrong. Review and edit every caption before you approve
            it.
          </li>
          <li>
            We try to publish each post at the time you chose, but timing is best effort. Instagram
            outages, limits or errors can delay a post, and a post that can’t go out within a few
            hours of its time is skipped so you can reschedule it.
          </li>
          <li>
            Scheduled posts pause if your Instagram access expires or is removed, or if your plan
            ends. You can reconnect or renew to continue.
          </li>
          <li>
            You can disconnect your account anytime. See the{" "}
            <Link href="/privacy#connected-social-accounts" className={textLink}>
              Privacy Policy
            </Link>{" "}
            for what we receive from Instagram and how to delete it.
          </li>
        </ul>
        <p>
          No Sweat is not affiliated with, endorsed by or sponsored by Meta Platforms or Instagram.
          Instagram is a trademark of Meta Platforms, Inc.
        </p>
      </>
    ),
  },
  {
    id: "ai-output",
    title: "AI-generated content",
    content: (
      <>
        <p>
          AI writes drafts quickly, but it can make mistakes. It may get details about your business
          wrong, use wording that doesn’t fit, or produce something similar to content elsewhere.
          Please read your website carefully and correct anything that isn’t accurate before you
          publish it.
        </p>
        <p>
          We limit how many AI generations and edits each account can make per day. Limits may
          differ between plans and may change over time.
        </p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees and billing",
    content: (
      <>
        <p>
          <strong>Creating an account and previewing your site are free.</strong> You pay when you
          choose a plan to publish.
        </p>
        <p>
          Before you pay anything, we show you the price, what’s included, how often you’ll be
          billed and how to cancel. You’ll only be charged after you agree to those billing terms.
          Current prices are on the{" "}
          <Link href="/pricing" className={textLink}>
            pricing page
          </Link>
          . If we change a price, we’ll tell you before it applies to your plan.
        </p>
      </>
    ),
  },
  {
    id: "renewal",
    title: "Automatic renewal",
    content: (
      <>
        <p>These renewal rules apply to paid plans:</p>
        <ul>
          <li>
            <strong>Plans renew automatically</strong> at the end of each billing period (every
            month or every year, whichever you chose) at the price shown when you subscribed, until
            you cancel.
          </li>
          <li>
            The monthly Starter and Pro plans include a one-time setup fee on the first bill. Annual
            plans have no setup fee.
          </li>
          <li>
            <strong>For annual plans, we email you a reminder before each renewal</strong>, with the
            amount and the renewal date.
          </li>
          <li>
            <strong>You can cancel anytime</strong> in your account, online, in a few clicks. You
            don’t need to call or email us. Canceling stops the next renewal; you keep your plan
            until the end of the period you already paid for.
          </li>
          <li>
            If a price changes, we’ll tell you by email before it applies to your next renewal.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation and termination",
    content: (
      <>
        <p>
          You can stop using No Sweat at any time. You can delete a website from your dashboard, and
          you can ask us to delete your account by emailing us.
        </p>
        <p>
          We may suspend or close an account that breaks these Terms, puts other people or the
          service at risk, or when we’re required to by law. If we stop offering the service, we’ll
          give you reasonable notice so you can save your content.
        </p>
        <p>
          When an account is closed, its websites are unpublished. Sections of these Terms that by
          their nature should continue (such as ownership, disclaimers and limitation of liability)
          still apply.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <>
        <p>
          We work hard to keep No Sweat running well, but the service is provided “as is” and “as
          available.” To the extent the law allows, we make no warranties, express or implied,
          including warranties of merchantability, fitness for a particular purpose and
          non-infringement.
        </p>
        <p>
          We don’t promise that the service will be uninterrupted or error-free, that AI output will
          be accurate, or that your website will bring you a particular number of visitors,
          customers or sales.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <>
        <p>
          To the extent the law allows, No Sweat will not be liable for indirect, incidental,
          special, consequential or punitive damages, or for lost profits, revenue, data or business
          opportunities, arising from your use of the service.
        </p>
        <p>
          Our total liability for any claim related to the service is limited to the greater of the
          amount you paid us in the 12 months before the claim, or $100.
        </p>
        <p>Some states don’t allow certain limitations, so some of these may not apply to you.</p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    content: (
      <p>
        We may update these Terms as the service grows, especially when paid plans launch. We’ll
        change the “Last updated” date above, and for important changes we’ll notify you by email or
        in your dashboard before they take effect. If you keep using No Sweat after that, the new
        Terms apply.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    content: (
      <p>
        These Terms are governed by the laws of the United States and the state where No Sweat is
        registered, without regard to conflict-of-law rules. Before filing any claim, please contact
        us so we can try to resolve the issue informally.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these Terms? Email us at <ContactEmailLink />.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedIso="2026-10-15"
      updatedLabel="October 15, 2026"
      intro={
        <p>
          The rules for using No Sweat, in plain English. They cover your account, the websites you
          build and publish, and what you and we are each responsible for.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
