import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LegalPagePublicProps {
  type: 'privacy' | 'terms';
}

export default function LegalPagePublic({
  type
}: LegalPagePublicProps) {
  const isPrivacy = type === 'privacy';
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen font-sans flex flex-col select-text selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Trova Minimal Header containing just the logo linking back to landing page */}
      <header className="h-16 border-b border-zinc-900 bg-black px-6 flex items-center justify-between sticky top-0 z-40 select-none">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <svg viewBox="0 0 48 56" className="w-[18px] h-[21px] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkLegal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkLegal)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="font-display font-extrabold text-lg text-white tracking-tight flex items-center gap-0.5 lowercase">
            trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] ml-1">Escrow</span>
          </span>
        </button>
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500">
          Legal / {isPrivacy ? 'Privacy' : 'Terms'}
        </span>
      </header>

      {/* Scrollable Container with max width 760px centered on the page */}
      <main className="flex-1 max-w-[760px] w-full mx-auto px-6 py-12 flex flex-col gap-8">
        
        {/* Header Details */}
        <div className="flex flex-col gap-3 pb-6 border-b border-zinc-900">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            {isPrivacy ? 'PRIVACY POLICY' : 'TERMS OF ESCROW SERVICE'}
          </h1>
          <p className="text-xs text-zinc-500 font-mono tracking-wider">
            Trova — Last updated: June 1, 2026
          </p>
        </div>

        {/* Content Container with emerald headings and primary text colors */}
        <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-300 font-sans">
          
          {isPrivacy ? (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  INTRODUCTION
                </h2>
                <p>
                  Welcome to Trova. We are a global escrow payment platform that enables secure transactions between buyers and sellers. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at trova.co and all associated applications.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  INFORMATION WE COLLECT
                </h2>
                <div className="flex flex-col gap-3">
                  <p>
                    <strong className="text-white">Information You Provide Directly:</strong> Your name or business name, email address, phone number, and password when you register. Identity and verification documents for KYC compliance including government-issued ID and bank account details. Transaction information including product descriptions, prices, and transaction history. Payment information such as bank account numbers and mobile wallet identifiers. Store information including business profile details, social media handles, and product listings. Communications you send through our dispute resolution system or support chat.
                  </p>
                  <p>
                    <strong className="text-white">Information Collected Automatically:</strong> Pages visited, features used, and interactions with our Service. IP address, browser type, operating system, and device identifiers. Records of all escrow transactions and status changes. Cookies and similar tracking technologies to maintain your session and remember your preferences including your chosen display theme.
                  </p>
                  <p>
                    <strong className="text-white">Information from Third Parties:</strong> We may receive information from payment processors Paystack and Stripe for transaction verification, identity verification services for KYC compliance, and social media platforms if you connect them to your store profile.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  HOW WE USE YOUR INFORMATION
                </h2>
                <p>
                  We use your information to provide and maintain the Service including processing escrow transactions and managing your account. To verify your identity and conduct KYC verification as required by financial regulations. To process payments and release escrow funds to your verified bank account or mobile wallet. To send SMS, email, and in-app notifications about your transactions and account activity. To review evidence submitted during dispute resolution. To detect and prevent fraud, unauthorized access, and money laundering. To meet our obligations under applicable laws including financial regulations and anti-money laundering requirements. To respond to your inquiries and provide customer support.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  HOW WE SHARE YOUR INFORMATION
                </h2>
                <p>
                  We do not sell your personal information to third parties. We share information only in the following circumstances: With other users as needed for transactions — sellers see buyer contact information, buyers see seller business name and verified status, both parties see dispute messages during a dispute. With service providers including Paystack and Stripe for payment processing, Termii for SMS notifications, Supabase for database hosting, and Render for application hosting. All service providers are contractually obligated to protect your information. For legal reasons when required by law, court order, or government authority. In connection with a business transfer such as a merger or acquisition, with prior notice to you.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  DATA RETENTION
                </h2>
                <p>
                  We retain account information for the duration of your account and for 7 years after closure for legal and financial compliance. Transaction records are retained for a minimum of 7 years as required by financial regulations. Dispute records are retained for 5 years after resolution. Support communications are retained for 3 years.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  DATA SECURITY
                </h2>
                <p>
                  All data transmitted between your browser and our servers is encrypted using TLS. Sensitive data including passwords is encrypted at rest. Access to user data is restricted to authorized personnel on a need-to-know basis. Payment card data is processed directly by PCI-DSS compliant payment processors and is never stored on our servers. Despite these measures, no method of electronic storage is 100 percent secure and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  YOUR RIGHTS AND CHOICES
                </h2>
                <p>
                  You have the right to access a copy of the personal information we hold about you. You have the right to request correction of inaccurate information. You have the right to request deletion of your personal information subject to legal retention requirements. You have the right to request that we provide your data in a portable format. To exercise any of these rights contact us at privacy@trova.co. We will respond within 30 days.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  COOKIES
                </h2>
                <p>
                  We use essential cookies required for the Service to function including session and security cookies. We use preference cookies to remember your choices such as display theme. We use analytics cookies to understand how users interact with our Service using anonymized data only. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  CHILDREN'S PRIVACY
                </h2>
                <p>
                  Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe your child has provided us with information please contact privacy@trova.co immediately.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  CONTACT US
                </h2>
                <p>
                  Email: privacy@trova.co — Support: support@trova.co — Address: Trova, Lagos, Nigeria
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  AGREEMENT TO TERMS
                </h2>
                <p>
                  By accessing or using Trova you agree to be bound by these Terms of Escrow Service. These Terms constitute a legally binding agreement between you and Trova. If you are using Trova on behalf of a business you represent that you have authority to bind that entity. If you do not agree to these Terms you must not use our Service.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  DESCRIPTION OF SERVICE
                </h2>
                <p>
                  Trova is an escrow payment platform that facilitates secure transactions between buyers and sellers. Our Service enables sellers to create secure payment links, buyers to pay into a protected escrow account, secure holding of funds until the buyer confirms satisfactory delivery, dispute resolution by Trova mediators, and public store pages for sellers to showcase products and services. Trova is not a bank. We are a technology platform that facilitates escrow transactions. Funds held in escrow are held in trust accounts maintained with our partner financial institutions.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  ELIGIBILITY
                </h2>
                <p>
                  To use Trova you must be at least 18 years of age, have legal capacity to enter into a binding contract in your jurisdiction, not be prohibited from using our Service under applicable law, and provide accurate and complete information when creating your account. We reserve the right to refuse service, terminate accounts, or restrict access to anyone at our sole discretion.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  ACCOUNT REGISTRATION AND VERIFICATION
                </h2>
                <p>
                  When you create an account you must provide accurate, current, and complete information. You are responsible for maintaining accuracy and updating information when it changes. To create escrow payment links and receive payouts, sellers must complete KYC verification by submitting valid government-issued identification, business registration documents where applicable, verified bank account or mobile wallet details, and contact information. You are solely responsible for all activity under your account. You must keep your credentials confidential and notify us immediately at security@trova.co if you suspect unauthorized access. Trova will never ask for your password via email, phone, or chat.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  ESCROW TRANSACTION PROCESS
                </h2>
                <div className="flex flex-col gap-4">
                  <p>
                    <strong className="text-white">Creating an Escrow Link:</strong> Sellers create escrow links by providing product or service name, amount in NGN or USD, transaction type (physical product or digital service), and optionally buyer contact information. By creating an escrow link the seller represents that the product or service is accurately described and they intend to fulfill the transaction in good faith.
                  </p>
                  <p>
                    <strong className="text-white">Buyer Payment:</strong> When a buyer makes payment the funds transfer to a Trova escrow holding account. The funds are not accessible to the seller and the buyer cannot unilaterally reclaim them. The transaction enters the active escrow period.
                  </p>
                  <p>
                    <strong className="text-white">Seller Obligations:</strong> Once a buyer has paid, the seller must ship the physical product promptly and mark it as shipped on the dashboard, or begin work on the agreed service and mark the order as in progress. Sellers must not misrepresent the condition, quality, or specifications of their products or services.
                  </p>
                  <p>
                    <strong className="text-white">Delivery Confirmation and Fund Release:</strong> Funds are released when the buyer clicks Confirm Delivery or Approve Deliverable confirming satisfaction, or when the automatic release period expires where applicable, or when an admin mediator makes a release decision. Once funds are released the transaction is complete and the release is final and irreversible.
                  </p>
                  <p>
                    <strong className="text-white">Service Fees:</strong> Trova charges 2.5 percent of the transaction amount for NGN transactions capped at 2,000 Naira per transaction, and 2.9 percent plus a fixed processing fee for USD transactions. Fees are deducted from the amount released to the seller. We reserve the right to modify fees with 30 days notice.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  DISPUTE RESOLUTION
                </h2>
                <p>
                  A buyer may raise a dispute before confirming delivery if the product was not received, does not match the description, is damaged, or the service does not meet agreed specifications. When a dispute is raised the transaction is immediately frozen and neither party can access the funds. Both parties submit evidence through the dispute chat system within 72 hours. Trova mediators review evidence and make a final binding decision to either release funds to the seller or refund the buyer. Trova's mediation decision is final. By using our Service both parties agree to accept the outcome of our mediation process.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  PROHIBITED ACTIVITIES
                </h2>
                <p>
                  You agree not to use Trova for any transaction involving illegal goods or services. You agree not to create escrow links for products or services you do not intend to deliver or to misrepresent product quality. You agree not to use Trova to disguise the origins of funds obtained illegally. You agree not to create multiple accounts to circumvent limits or impersonate another person. You agree not to manipulate our dispute process, submit false evidence, or harass other users. Violations may result in immediate account suspension, withholding of funds, reporting to authorities, and legal action.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  SELLER RESPONSIBILITIES
                </h2>
                <p>
                  By listing on Trova sellers represent they have legal right to sell the items described, all descriptions are accurate, products will be shipped within the communicated timeframe, services will be performed to the standard described, and they will comply with all applicable laws including consumer protection and tax obligations. Sellers are solely responsible for determining and paying any applicable taxes on their sales.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  BUYER RESPONSIBILITIES
                </h2>
                <p>
                  By using Trova buyers agree to inspect goods or evaluate services before confirming delivery. Once you click Confirm Delivery or Approve Deliverable the transaction is complete and fund release is final and irreversible. You will only raise disputes in good faith when there is a genuine issue. You will provide honest and accurate evidence during dispute resolution.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  LIMITATION OF LIABILITY
                </h2>
                <p>
                  Trova's total liability for any claim will not exceed the greater of fees paid to Trova in the 12 months preceding the claim or 50,000 Naira. Trova is not liable for indirect, incidental, or consequential damages, loss of profits or data, the actions of buyers or sellers, delays in payout caused by banking system delays, or losses from unauthorized access due to your failure to secure your credentials.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  INDEMNIFICATION
                </h2>
                <p>
                  You agree to defend, indemnify, and hold harmless Trova and its personnel from any claims arising from your use of the Service, your violation of these Terms, your violation of applicable law, your transactions with other users, or any content you submit.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  TERMINATION
                </h2>
                <p>
                  You may terminate your account by contacting support@trova.co. All active transactions must be completed or resolved before deletion. We may suspend or terminate your account immediately if you violate these Terms, we detect fraudulent activity, or we are required to do so by law. Upon termination accrued payouts will be processed subject to any investigative holds.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  GOVERNING LAW
                </h2>
                <p>
                  These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  CHANGES TO TERMS
                </h2>
                <p>
                  We may update these Terms at any time. We will notify you of material changes by email, by notice within the Service, and by updating the date at the top of this page. Continued use after the effective date constitutes acceptance.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  CONTACT INFORMATION
                </h2>
                <p>
                  Legal inquiries: legal@trova.co — Support: support@trova.co — Security: security@trova.co — Address: Trova, Lagos, Nigeria
                </p>
              </section>
            </>
          )}

        </div>

        {/* Footer with compliance badge */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
          <span className="text-zinc-500">© {new Date().getFullYear()} Trova. All rights reserved.</span>
          <div className="flex items-center gap-2 text-emerald-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 animate-pulse" />
            <span className="font-semibold text-[11px] font-mono whitespace-nowrap">Statutory Escrow Compliance Verified</span>
          </div>
        </div>

      </main>

    </div>
  );
}
