import PublicPageLayout from '@/components/landing/PublicPageLayout';
import React from 'react';

const DeleteAccount: React.FC = () => {

    return <PublicPageLayout>
        <section className="terms-conditions section-padding px-[2.8rem] sm:px-[4rem]">
            <div className="w-layout-blockcontainer container w-container">
                <div data-w-id="547556ae-59ac-cbdf-43cf-dda5d1a11535" className="section-content-wrapper align-center">
                    <div data-w-id="008484c4-0682-ca17-6e0a-f1312f6a9209" className="review-hero-content-wrapper align-center">
                        <h1 className="hero-title">How to Delete Your Whossy Account</h1>
                        <p className="hero-subtitle terms">Last Updated: 19 Nov, 2026</p>
                    </div>
                    <div className="terms-wrapper">
                        <div className="single-terms">
                            <h4 className="terms-title">Effective Date: 19 Nov, 2026</h4>
                            <p className="terms-content">
                                This page explains how to delete your Whossy account and the data
                                associated with it, whether you use the Whossy app on Android or
                                whossy.com.
                            </p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Delete your account in the Whossy app (Android)</h4>
                            <ol className='terms-content'>
                                <li>Open the Whossy app and sign in.</li>
                                <li>Go to the Profile tab and tap the Settings icon.</li>
                                <li>Tap Delete Account.</li>
                                <li>Confirm when asked. You may be asked to confirm your identity first. If you are told to sign in again, log out, sign in, and repeat the steps.</li>
                            </ol>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Delete your account on the website</h4>
                            <ol className='terms-content'>
                                <li>Go to <a href="https://whossy.com" className="text-red underline underline-offset-2">whossy.com</a> and log in to your account.</li>
                                <li>Navigate to the <a href="https://whossy.com/user-profile" className="text-red underline underline-offset-2">User Profile tab.</a></li>
                                <li>Click on the Settings icon.</li>
                                <li>Scroll to the bottom of the page and select Delete Account.</li>
                                <li>Confirm your decision.</li>
                            </ol>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Can't sign in?</h4>
                            <p className="terms-content">
                                Email <a href="mailto:support@whossy.com" className="text-red underline underline-offset-2">support@whossy.com</a> from
                                the email address on your account, or tell us the phone number you signed up with,
                                and ask for your account to be deleted. We will verify it is you and complete the
                                deletion.
                            </p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">What is deleted</h4>
                            <p className="terms-content">Deletion is immediate and cannot be undone. It permanently removes:</p>
                            <ul className='terms-content'>
                                <li>Your profile, including your name, age, bio, preferences and filters.</li>
                                <li>Your photos and your verification selfie.</li>
                                <li>Your chats and messages, your likes and dislikes, and your matches.</li>
                                <li>Your notifications and in-app activity.</li>
                                <li>Reports you filed about other users.</li>
                                <li>Your sign-in (phone number, email or password), so you can no longer log in.</li>
                            </ul>
                            <p className="terms-content">
                                Any unused credits are removed with your account and are not refunded.
                            </p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">What we keep, and for how long</h4>
                            <ul className='terms-content'>
                                <li>
                                    <strong>Payment records</strong> for credit purchases and subscriptions. We keep these
                                    because we are required to keep financial records. They are kept only for as long as
                                    that obligation lasts and are not used for anything else.
                                </li>
                                <li>
                                    <strong>Reports made against you</strong> by other users. We keep these for safety and
                                    to prevent abuse, and only for as long as needed for that purpose.
                                </li>
                            </ul>
                            <p className="terms-content">
                                Other people's copies of conversations are deleted along with the chat, because the chat
                                itself is removed for both people.
                            </p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Your subscription</h4>
                            <p className="terms-content">
                                Deleting your account does not cancel a subscription billed through Google Play. To stop
                                being charged, cancel it first in the Google Play Store app under Payments and subscriptions
                                &rarr; Subscriptions &rarr; Whossy.
                            </p>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">Questions</h4>
                            <p className="terms-content">
                                Contact <a href="mailto:support@whossy.com" className="text-red underline underline-offset-2">support@whossy.com</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </PublicPageLayout>

}
export default DeleteAccount;