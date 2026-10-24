import React from "react";
import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function TermsOfUsePage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="legal-back">← Back</Link>
          <div className="legal-logo">
            <img src="/logo.svg" alt="CBT Nexus" className="legal-logo-img" />
            <span>CBT Nexus</span>
          </div>
        </div>

        <div className="legal-content">
          <h1>Terms of Use</h1>
          <p className="legal-date">Last updated: October 24, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using CBT Nexus (<strong>cbtnexus.com</strong>), you
              agree to be bound by these Terms of Use. If you do not agree, please
              do not use the platform.
            </p>
          </section>

          <section>
            <h2>2. About CBT Nexus</h2>
            <p>
              CBT Nexus is an online Computer-Based Test (CBT) practice platform
              for Nigerian students preparing for WAEC, NECO, and JAMB examinations.
              We provide practice questions, instant corrections, leaderboard rankings,
              practical exercises, and AI-powered study assistance.
            </p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>
              You must be at least 10 years old to use CBT Nexus. Users under 18 should
              have parental awareness of their use of the platform. By registering, you
              confirm that the information you provide is accurate and complete.
            </p>
          </section>

          <section>
            <h2>4. Account Responsibilities</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account password.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>Do not share your account credentials with others.</li>
              <li>Notify us immediately via the Feedback page if you suspect unauthorized access to your account.</li>
            </ul>
          </section>

          <section>
            <h2>5. Subscription & Payments</h2>
            <ul>
              <li>Some features of CBT Nexus require a paid subscription.</li>
              <li>Payments are processed securely through Paystack.</li>
              <li>Subscription plans (monthly or lifetime) grant access to full exam features.</li>
              <li>Fees are non-refundable once a subscription is activated, except in cases of verified billing errors.</li>
              <li>We reserve the right to modify pricing with reasonable notice to users.</li>
            </ul>
          </section>

          <section>
            <h2>6. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Share, redistribute, or resell exam questions or content from the platform.</li>
              <li>Attempt to hack, reverse-engineer, or exploit any part of the platform.</li>
              <li>Use automated bots or scripts to interact with the platform.</li>
              <li>Submit false or misleading information during registration.</li>
              <li>Harass, threaten, or abuse other users or platform staff.</li>
              <li>Attempt to manipulate leaderboard rankings dishonestly.</li>
            </ul>
          </section>

          <section>
            <h2>7. Intellectual Property</h2>
            <p>
              All content on CBT Nexus — including questions, explanations, UI design,
              logos, and code — is the property of CBT Nexus. You may not copy,
              reproduce, or distribute any content without explicit written permission.
            </p>
          </section>

          <section>
            <h2>8. Leaderboard</h2>
            <p>
              The leaderboard ranks JAMB students only. WAEC and NECO scores are
              intentionally excluded. Rankings are calculated based on exam performance
              within the platform and are for motivational purposes only.
            </p>
          </section>

          <section>
            <h2>9. Disclaimer of Warranties</h2>
            <p>
              CBT Nexus is provided "as is" without warranties of any kind. We do not
              guarantee that our practice questions will appear verbatim in any official
              examination. Use of this platform is for practice and preparation purposes
              only.
            </p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>
              CBT Nexus shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the platform, including
              but not limited to exam results, data loss, or service interruptions.
            </p>
          </section>

          <section>
            <h2>11. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these
              Terms of Use without prior notice. Users may also delete their own account
              at any time via the Feedback page.
            </p>
          </section>

          <section>
            <h2>12. Changes to These Terms</h2>
            <p>
              We may update these Terms of Use at any time. Continued use of the
              platform after changes are posted constitutes your acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria.
              Any disputes shall be resolved under Nigerian jurisdiction.
            </p>
          </section>

          <section>
            <h2>14. Contact</h2>
            <p>
              For questions about these Terms, please use the{" "}
              <Link to="/feedback">Feedback page</Link> on the platform.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/privacy">Privacy Policy</Link>
          <span>·</span>
          <Link to="/">Back to CBT Nexus</Link>
        </div>
      </div>
    </div>
  );
}
