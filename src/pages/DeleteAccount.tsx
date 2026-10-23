import PublicPageLayout from '@/components/landing/PublicPageLayout';
import React from 'react';

const DeleteAccount: React.FC = () => {

    return <PublicPageLayout>
        <section className="terms-conditions section-padding px-[2.8rem] sm:px-[4rem]">
            <div className="w-layout-blockcontainer container w-container">
                <div data-w-id="547556ae-59ac-cbdf-43cf-dda5d1a11535" className="section-content-wrapper align-center">
                    <div data-w-id="008484c4-0682-ca17-6e0a-f1312f6a9209" className="review-hero-content-wrapper align-center">
                        <h1 className="hero-title">How to Delete Your Whossy Account</h1>
                        <p className="hero-subtitle terms">Last Updated: 19 Mar, 2025</p>
                    </div>
                    <div className="terms-wrapper">
                        <div className="single-terms">
                            <h4 className="terms-title">Effective Date: 19 Mar, 2025</h4>
                        </div>

                        <div className="single-terms">
                            <h4 className="terms-title">If you wish to delete your Whossy account, follow these steps:</h4>
                            <ol className='terms-content'>
                                <li>Go to <a href="https://whossy.com" className="text-red underline underline-offset-2">whossy.com</a> and log in to your account.</li>
                                <li>Navigate to the <a href="https://whossy.com/user-profile" className="text-red underline underline-offset-2">User Profile tab.</a></li>
                                <li>Click on the Settings icon.</li>
                                <li>Scroll to the bottom of the page and select Delete Account.</li>
                                <li>Confirm your decision, and your account will be permanently deleted.</li>
                            </ol>
                            <p className="terms-content">Once deleted, all your data will be removed from our platform, and this action cannot be undone.
                                If you need further assistance, please contact our support team at <a href="mailto:support@whossy.com" className="text-red underline underline-offset-2">support@whossy.com.</a></p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    </PublicPageLayout>

}
export default DeleteAccount;