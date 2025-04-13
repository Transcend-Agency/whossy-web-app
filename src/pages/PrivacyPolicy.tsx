import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';
import React from 'react';

type PrivacyPolicyProps = {
};

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = () => {

    return <>
        <div className="fixed top-0 w-full z-50">
            <Navbar />
        </div>

        <section className="terms-conditions section-padding mt-[140px] md:mt-[200px]">
            <div className="w-layout-blockcontainer container w-container">
                <div data-w-id="547556ae-59ac-cbdf-43cf-dda5d1a11535" className="section-content-wrapper align-center">
                    <div data-w-id="008484c4-0682-ca17-6e0a-f1312f6a9209" className="review-hero-content-wrapper align-center">
                        <h1 className="hero-title">Privacy Policy</h1>
                        <p className="hero-subtitle terms">Last Updated: 26 Jan, 2025</p>
                    </div>
                    <div className="terms-wrapper">
                        <div className="single-terms">
                            <h4 className="terms-title">Effective Date: 26 Jan, 2025</h4>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Introduction</h4>
                            <p className="terms-content">Welcome to Whossy ("Company", "we", "our", "us"). We are committed to protecting your privacy and ensuring compliance with applicable data protection laws, including the General Data Protection Regulation (GDPR) in Europe and the California Consumer Privacy Act (CCPA) in the United States.</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Information We Collect</h4>
                            <p className="terms-content">We collect the following types of information:</p>
                            <ol className='terms-content'>
                                <li>Personal Information: Name, email address, phone number, postal address, payment details, photographs, and profile information.</li>
                                <li>Technical Information: IP address, browser type, device information, and cookies.</li>
                                <li>Usage Data: Interactions with our app, features used, pages visited, and time spent on the app.</li>
                                <li>Location Data: Precise or approximate location based on your device settings.</li>
                                <li>Third-Party Data: Information received from social media platforms or partners when you choose to link your account.</li>
                            </ol>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">How We Use Your Information</h4>
                            <p className="terms-content">We use your personal data to:</p>
                            <ol className='terms-content'>
                                <li>Provide and improve our services.</li>
                                <li>Facilitate matches and interactions with other users.</li>
                                <li>Respond to inquiries and support requests.</li>
                                <li>Send marketing communications (with your consent).</li>
                                <li>Personalize user experiences and advertisements.</li>
                                <li>Ensure user safety and enforce our terms.</li>
                                <li>Comply with legal obligations and prevent fraud.</li>
                            </ol>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Legal Basis for Processing (GDPR Compliance)</h4>
                            <p className="terms-content">We process personal data based on the following legal grounds:</p>
                            <ol className='terms-content'>
                                <li>Consent: When you have given clear consent to process your personal data.</li>
                                <li>Contractual Necessity: When processing is necessary for the performance of a contract.</li>
                                <li>Legal Obligation: When processing is required to comply with legal obligations.</li>
                                <li>Legitimate Interest: When processing is necessary for our legitimate business interests, such as improving our services and ensuring security.</li>
                            </ol>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Your Rights (GDPR & CCPA Compliance)</h4>
                            <p className="terms-content">Under GDPR and CCPA, you have the following rights:</p>
                            <ol className='terms-content'>
                                <li>Right to Access: Request a copy of your personal data.</li>
                                <li>Right to Rectification: Correct any inaccurate data.</li>
                                <li>Right to Erasure: Request deletion of your data under certain conditions.</li>
                                <li>Right to Restrict Processing: Limit the way we use your data.</li>
                                <li>Right to Data Portability: Receive your data in a commonly used format.</li>
                                <li>Right to Object: Object to data processing for marketing purposes.</li>
                                <li>Right to Non-Discrimination (CCPA): You will not be discriminated against for exercising your rights.</li>
                            </ol>
                            <p className="terms-content">To exercise your rights, please contact us at [Insert Contact Information].</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Data Sharing and Transfers</h4>
                            <p className="terms-content">We do not sell your personal data. However, we may share your data with:</p>
                            <ol className='terms-content'>
                                <li>Other Users: Information you share on your profile will be visible to other users.</li>
                                <li>Service Providers: Vendors assisting with business operations, such as data hosting, analytics, customer support, and payment processing.</li>
                                <li>Affiliates: Within our corporate family for legitimate business purposes.</li>
                                <li>Legal Authorities: If required by law or to protect our rights.</li>
                                <li>Third-Party Partners: For marketing and advertising purposes, with your consent.</li>
                            </ol>
                            <p className="terms-content">For international data transfers, we ensure compliance with GDPR through standard contractual clauses and other appropriate safeguards.</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Data Security</h4>
                            <p className="terms-content">We implement technical and organizational measures to protect your data from unauthorized access, disclosure, alteration, or destruction.</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Data Retention</h4>
                            <p className="terms-content">We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Inactive accounts may be deleted after [Insert Time Period].</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Cookies and Tracking Technologies</h4>
                            <p className="terms-content">We use cookies and similar tracking technologies to enhance your experience. You can manage your cookie preferences through your browser settings.</p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Updates to This Privacy Policy</h4>
                            <p className="terms-content">We may update this policy from time to time. Any changes will be posted on this page with an updated effective date.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        <Footer />

    </>

}
export default PrivacyPolicy;