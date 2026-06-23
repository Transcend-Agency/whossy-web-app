import React from 'react'
import {OnboardingProps} from "@/types/onboarding.ts";
import OnboardingPage from "@/components/onboarding/OnboardingPage.tsx";
import Skip from "@/components/onboarding/Skip.tsx";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton.tsx";
import Button from "@/components/ui/Button.tsx";

export const GetPhotoVerified: React.FC<OnboardingProps> = ({advance, goBack}) => {
		return (
				<OnboardingPage>
						<section className="max-h-[560px] overflow-y-scroll">
								<Skip advance={advance}/>
								<div className={`flex flex-col justify-between h-[380px]`}>
										<div className={`grid gap-y-4`}>
												<img src={`/assets/icons/photo-verified.svg`} alt={``}/>
												<h1 className={`text-[30px] font-neue-montreal font-bold`}>Get photo verified</h1>
												<p className={`text-[11px] sm:text-[14px] md:text-[16px] md:leading-[1.2] max-w-[280px] text-[#8A8A8E] leading-[110%]`}>
														We’d like to undergo a photo verification process to confirm you’re the person
														in your photos.
												</p>
										</div>

										<div className="onboarding-page__section-one__buttons ">
												<OnboardingBackButton onClick={goBack}/>
												<Button
														text="Continue"
														onClick={() => {
																advance();
														}}
												/>
										</div>
								</div>
						</section>
				</OnboardingPage>
		)
}
