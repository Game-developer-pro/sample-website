import React from "react";
import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function PrivacyPolicyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: October 24, 2026</p>

          <section>
            <h2>1. Who We Are</h2>
            <p>
              CBT Nexus (<strong>cbtnexus.com</strong>) is a Nigerian online exam
              preparation platform designed to help students practice for WAEC, NECO,
              and JAMB examinations. When we say "we," "us," or "our," we mean CBT
              Nexus and its operators.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We collect the following information when you use our platform:</p>
            <ul>
              <li><strong>Account Information:</strong> Your first name, last name, email address, and password (stored encrypted) when you register.</li>
              <li><strong>Google Sign-In:</strong> If you sign in with Google, we receive your name, email address, and profile picture from Google.</li>
              <li><strong>Exam Activity:</strong> Questions you attempt, your scores, exam results, and corrections viewed.</li>
              <li><strong>Payment Information:</strong> Subscription status processed securely via Paystack. We do not store your card details.</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, and general interaction data to improve the platform.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account.</li>
              <li>To display your exam results, corrections, and leaderboard ranking.</li>
              <li>To process subscription payments securely via Paystack.</li>
              <li>To improve the platform based on usage patterns.</li>
              <li>To send important account-related notifications (no spam).</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We do <strong>not</strong> sell your personal data. We share information only with:</p>
            <ul>
              <li><strong>Paystack</strong> — for secure payment processing.</li>
              <li><strong>Google</strong> — if you choose to sign in with Google.</li>
              <li><strong>Cloudinary</strong> — for storing images you upload (e.g. profile photos, practical images).</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              Your data is retained for as long as your account is active. You may
              request deletion of your account and associated data at any time by
              contacting us via the Feedback page.
            </p>
          </section>

          <section>
            <h2>6. Security</h2>
            <p>
              We use industry-standard measures including HTTPS encryption, hashed
              passwords, and JWT-based authentication to protect your data. No method
              of transmission over the internet is 100% secure, but we take every
              reasonable precaution.
            </p>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>
              We use browser localStorage to store your authentication token locally
              on your device. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>
              CBT Nexus is intended for students of all ages. We do not knowingly
              collect personal data from children under 13 without parental consent.
              If you believe a child under 13 has submitted personal data without
              consent, please contact us immediately.
            </p>
          </section>

          <section>
            <h2>9. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and data.</li>
              <li>Withdraw consent for data processing.</li>
            </ul>
            <p>To exercise any of these rights, use the Feedback section or contact us directly.</p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be
              posted on this page with an updated date. Continued use of the platform
              after changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out
              through the <Link to="/feedback">Feedback page</Link> on the platform.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/terms">Terms of Use</Link>
          <span>·</span>
          <Link to="/">Back to CBT Nexus</Link>
        </div>
      </div>
    </div>
  );
}
