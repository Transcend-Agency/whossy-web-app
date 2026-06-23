import * as Slider from "@radix-ui/react-slider"
import { motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"
import DashboardSettingsModal, { DashboardSettingsModalProps } from "./DashboardSettingsModal"
import { communication_style, countries, dietary, drinking, education, family_goal, love_language, marital_status, pets, preference, religion, smoking, workout, zodiac } from "@/constants"
import { Oval } from "react-loader-spinner"
import toast from "react-hot-toast"
import DoubleSliderBar from "../ui/DoubleSliderBar"

export const NameSettingsModal: React.FC<DashboardSettingsModalProps & { first_name: string, last_name: string, handleSave: (first_name: string, last_name: string) => void }> = ({ showing, hideModal, first_name, last_name, handleSave }) => {
    const [fullName, setFullName] = useState<{ first_name: string, last_name: string }>({ first_name, last_name })
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setFullName({ first_name, last_name })
    }, [first_name, last_name])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Name" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(fullName.first_name, fullName.last_name); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="">
                <div className="modal__input-group">
                    <label className="modal__input-group__label">First Name</label>
                    <input className="modal__input-group__input" onChange={(e) => setFullName((prev) => ({ ...prev, first_name: e.target.value }))} value={fullName.first_name} />
                </div>
                <div className="modal__input-group">
                    <label className="modal__input-group__label">Last Name</label>
                    <input className="modal__input-group__input" onChange={(e) => setFullName((prev) => ({ ...prev, last_name: e.target.value }))} value={fullName.last_name} />
                </div>
            </div>
        </DashboardSettingsModal>
    )
}

export const GenderSettingsModal: React.FC<DashboardSettingsModalProps & { userGender: string, handleSave: (gender: string) => Promise<void> }> = ({ showing, hideModal, userGender, handleSave }) => {
    const [gender, setGender] = useState(userGender);
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setGender(userGender) }, [userGender]);
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Gender" save={<button className="modal__body__header__save-button" onClick={async () => { setIsLoading(true); await handleSave(gender); setIsLoading(false) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__gender-options">
                <div onClick={() => setGender("Male")} className={`modal__gender-option ${gender == 'Male' && 'modal__gender-option--selected'}`}>Male</div>
                <div onClick={() => setGender("Female")} className={`modal__gender-option ${gender == 'Female' && 'modal__gender-option--selected'}`}>Female</div>
            </div>
        </DashboardSettingsModal>
    )
}

export const AgeRangeModal: React.FC<DashboardSettingsModalProps & { min: number, max: number, handleSave: (range: { min: number, max: number }) => Promise<void> }> = ({ showing, hideModal, min, max, handleSave }) => {
    const [range, setRange] = useState({ min, max });
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        setRange({
            min,
            max
        })
    }, [])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Age Range" save={<button className="modal__body__header__save-button" onClick={async () => { setIsLoading(true); await handleSave(range); setIsLoading(false) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="mb-[24px] text-center">
                {range.min} - {range.max} years old
            </div>
            <DoubleSliderBar trackColor="black" rangeColor="black" thumbColor="black" val={[range.min, range.max]} getValue={(val) => setRange({ min: val[0], max: val[1] })} />
        </DashboardSettingsModal>
    )
}

export const EmailSettingsModal: React.FC<DashboardSettingsModalProps> = ({ showing, hideModal }) => {
    const [email, setEmail] = useState('ronaldosunmu@gmail.com')
    const [isEditable, setIsEditable] = useState(false)
    const inputRef = useRef(null)
    useEffect(() => {
        setIsEditable(false)
    }, [showing])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Email">
            <div className="modal__verified-changeable-input">
                <div className="modal__verified-changeable-input__left">
                    <p>Email</p>
                    <div className="modal__verified-badge">Verified</div>
                </div>
                {!isEditable && <p className="modal__verified-changeable-input__value">{email}</p>}
                {isEditable && <input ref={inputRef} className="modal__verified-changeable-input__input" onChange={(e) => setEmail(e.target.value)} value={email} />}
            </div>
            {/* <AnimatePresence></AnimatePresence> */}
            <motion.p initial={{ opacity: isEditable ? 0 : 1 }} animate={{ opacity: isEditable ? 0 : 1 }} exit={{ opacity: 0 }} className="modal__verified-changeable-input__click-to-edit" onClick={() => { setIsEditable(true); }}>Click to change email</motion.p>
        </DashboardSettingsModal>
    )
}

export const PhoneNumberSettingsModal: React.FC<DashboardSettingsModalProps & { phone_number: string, handleSave: (phoneNumber: string) => void }> = ({ showing, hideModal, handleSave, phone_number }) => {
    const [phoneNumber, setPhoneNumber] = useState(phone_number)
    const [isEditable, setIsEditable] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef(null)
    useEffect(() => {
        setIsEditable(false)
    }, [showing])
    useEffect(() => { setPhoneNumber(phone_number) }, [phone_number])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Phone Number" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(phoneNumber); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__verified-changeable-input">
                <div className="modal__verified-changeable-input__left">
                    <p>Phone Number</p>
                    <div className="modal__verified-badge">Verified</div>
                </div>
                {!isEditable && <p className="modal__verified-changeable-input__value">{phoneNumber}</p>}
                {isEditable && <input ref={inputRef} className="modal__verified-changeable-input__input" onChange={(e) => setPhoneNumber(e.target.value)} value={phoneNumber} />}
            </div>
            {/* <AnimatePresence></AnimatePresence> */}
            <motion.p initial={{ opacity: isEditable ? 0 : 1 }} animate={{ opacity: isEditable ? 0 : 1 }} exit={{ opacity: 0 }} className="modal__verified-changeable-input__click-to-edit" onClick={() => { setIsEditable(true) }}>Click to update phone number</motion.p>
        </DashboardSettingsModal>
    )
}

export const RelationshipPreferenceSettingsModal: React.FC<DashboardSettingsModalProps & { userPreference: number, handleSave: (preference: number) => Promise<void> }> = ({ showing, hideModal, userPreference, handleSave }) => {
    const [options] = useState(preference)
    const [selectedOption, setSelectedOption] = useState(options[userPreference]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => { setSelectedOption(options[userPreference]) }, [userPreference])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Relationship Preference" save={<button className="modal__body__header__save-button" onClick={async () => {
            setIsLoading(true);
            await handleSave(options.findIndex(option => option === selectedOption));
            setIsLoading(false)
        }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const LoveLanguageSettingsModal: React.FC<DashboardSettingsModalProps & { userLoveLanguage: number, handleSave: (love_language: number) => void }> = ({ showing, hideModal, userLoveLanguage, handleSave }) => {
    const [options] = useState(love_language)
    const [selectedOption, setSelectedOption] = useState(options[userLoveLanguage])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userLoveLanguage]) }, [userLoveLanguage])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Love Language" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const ZodiacSignSettingsModal: React.FC<DashboardSettingsModalProps & { userZodiac: number, handleSave: (zodiac: number) => void }> = ({ showing, hideModal, userZodiac, handleSave }) => {
    const [options] = useState(zodiac)
    const [selectedOption, setSelectedOption] = useState(options[userZodiac])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userZodiac]) }, [userZodiac])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Zodiac Sign" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const FutureFamilyPlansSettingsModal: React.FC<DashboardSettingsModalProps & { userFamilyGoal: number, handleSave: (family_goal: number) => void }> = ({ showing, hideModal, userFamilyGoal, handleSave }) => {
    const [options] = useState(family_goal)
    const [selectedOption, setSelectedOption] = useState(options[userFamilyGoal])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userFamilyGoal]) }, [userFamilyGoal])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Future Family Plans" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const SmokerStatusSettingsModal: React.FC<DashboardSettingsModalProps & { userSmoke: number, handleSave: (smoke: number) => void }> = ({ showing, hideModal, userSmoke, handleSave }) => {
    const [options] = useState(smoking)
    const [selectedOption, setSelectedOption] = useState(options[userSmoke])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userSmoke]) }, [userSmoke])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Smoker" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const ReligionSettingsModal: React.FC<DashboardSettingsModalProps & { userReligion: number, handleSave: (religion: number) => Promise<void> }> = ({ showing, hideModal, userReligion, handleSave }) => {
    const [options] = useState(religion)
    const [selectedOption, setSelectedOption] = useState(options[userReligion])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userReligion]) }, [userReligion])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Religion" save={<button className="modal__body__header__save-button" onClick={async () => {
            setIsLoading(true);
            await handleSave(options.findIndex(option => option === selectedOption));
            setIsLoading(false)
        }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const DrinkingSettingsModal: React.FC<DashboardSettingsModalProps & { userDrink: number, handleSave: (userDrink: number) => void }> = ({ showing, hideModal, userDrink, handleSave }) => {
    const [options] = useState(drinking)
    const [selectedOption, setSelectedOption] = useState(options[userDrink])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userDrink]) }, [userDrink])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Drinking" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const WorkoutSettingsModal: React.FC<DashboardSettingsModalProps & { userWorkout: number, handleSave: (userWorkout: number) => void }> = ({ showing, hideModal, userWorkout, handleSave }) => {
    const [options] = useState(workout)
    const [selectedOption, setSelectedOption] = useState(options[userWorkout])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userWorkout]) }, [userWorkout])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Workout" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option , i)=> (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const PetsSettingsModal: React.FC<DashboardSettingsModalProps & { userPet: number, handleSave: (pet: number) => void }> = ({ showing, hideModal, userPet, handleSave }) => {
    const [options] = useState(pets)
    const [selectedOption, setSelectedOption] = useState(options[userPet])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userPet]) }, [userPet])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Pets" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const MaritalStatusSettingsModal: React.FC<DashboardSettingsModalProps & { userMaritalStatus: number, handleSave: (marital_status: number) => void }> = ({ showing, hideModal, userMaritalStatus, handleSave }) => {
    const [options] = useState(marital_status)
    const [selectedOption, setSelectedOption] = useState(options[userMaritalStatus])
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => { setSelectedOption(options[userMaritalStatus]) }, [userMaritalStatus])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Marital Status" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const EducationSettingsModal: React.FC<DashboardSettingsModalProps & { userEducation: number, handleSave: (education: number) => void }> = ({ showing, hideModal, userEducation, handleSave }) => {
    const [options] = useState(education)
    const [selectedOption, setSelectedOption] = useState(options[userEducation])
    const [isLoading, setIsloading] = useState(false);

    useEffect(() => { setSelectedOption(options[userEducation]) }, [userEducation])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Education" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsloading(true); setTimeout(() => setIsloading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const HeightSettingsModal: React.FC<DashboardSettingsModalProps & { userHeight: number, handleSave: (height: number) => void }> = ({ showing, hideModal, userHeight, handleSave }) => {
    const [heightInCm, setHeightInCm] = useState<number[]>([userHeight])
    const [isLoading, setIsLoading] = useState(false)
    const cmToFeetAndInches = (cm: number) => {
        // 1 inch = 2.54 cm
        // 1 foot = 12 inches
        const totalInches = cm / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);

        return `${feet}'${inches}"`;
    }
    useEffect(() => { setHeightInCm([userHeight]) }, [userHeight])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Height" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(heightInCm[0]); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__slider-container">
                <div className="modal__slider-container__value">
                    {heightInCm}cm ({cmToFeetAndInches(heightInCm[0])})
                </div>
                <form>
                    <Slider.Root className="SliderRoot" value={heightInCm} onValueChange={(value) => setHeightInCm(value)} defaultValue={[50]} min={55} max={251} step={1}>
                        <Slider.Track className="SliderTrack">
                            <Slider.Range className="SliderRange" />
                        </Slider.Track>
                        <Slider.Thumb className="SliderThumb" aria-label="Volume" />
                    </Slider.Root>
                </form>
            </div>
        </DashboardSettingsModal>
    )
}

export const WeightSettingsModal: React.FC<DashboardSettingsModalProps & { userWeight: number, handleSave: (weight: number) => void }> = ({ showing, hideModal, userWeight, handleSave }) => {
    const [weightInKg, setWeightInKg] = useState<number[]>([userWeight])
    const [isLoading, setIsLoading] = useState(false)
    const kilogramsToPounds = (kg: number) => {
        const lbs = kg * 2.20462;
        return lbs.toFixed(2); // Rounds to 2 decimal places
    }
    useEffect(() => { setWeightInKg([userWeight]) }, [userWeight])
    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Weight" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(weightInKg[0]); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__slider-container">
                <div className="modal__slider-container__value">
                    {weightInKg}kg ({kilogramsToPounds(weightInKg[0])}lbs)
                </div>
                <form>
                    <Slider.Root className="SliderRoot" value={weightInKg} onValueChange={(value) => setWeightInKg(value)} defaultValue={[50]} min={40} max={250} step={0.5}>
                        <Slider.Track className="SliderTrack">
                            <Slider.Range className="SliderRange" />
                        </Slider.Track>
                        <Slider.Thumb className="SliderThumb" aria-label="Volume" />
                    </Slider.Root>
                </form>
            </div>
        </DashboardSettingsModal>
    )
}

export const CountrySettingsModal: React.FC<DashboardSettingsModalProps & { preferredCountry: string; handleSave: (country: string) => Promise<void> }> = ({ showing, hideModal, preferredCountry, handleSave }) => {
    // const [options] = useState(education)
    // const [selectedOption, setSelectedOption] = useState('')
    // useEffect(() => {setSelectedOption(options[userEducation])}, [userEducation])

    // const [country, setCountry] = useState<string>(preferredCountry)
    const [isLoading, setIsLoading] = useState(false);


    const [selected, setSelected] = useState(preferredCountry ?? ' ');
    useEffect(() => { setSelected(preferredCountry) }, [preferredCountry])


    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Country of residence" save={<button className="modal__body__header__save-button" onClick={async () => {
            setIsLoading(true);
            await handleSave(selected);
            setIsLoading(false)
        }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            {/* <div className="modal__input-group__image-container">
                <img className="modal__input-group__image" src="/assets/icons/search.svg"/>
                <input className="modal__input-group__input w-full" value={country} onChange={(e) => setCountry(e.target.value)}/>
            </div> */}
            {/* <ReactFlagsSelect className="mx-10 mb-[14rem]" selected={selected} onSelect={(code) => setSelected(code)}/> */}
            <div className="w-full">
                {/* <label htmlFor="country"  className="block text-[1.8rem] font-medium text-gray-700 mb-2"> Select a country</label> */}
                <select id="country" value={selected} onChange={(e) => setSelected(e.target.value)} name="country" className="block w-full border-gray-300 py-4 px-2 rounded-md shadow-sm focus:ring-none focus:border-none text-[1.4rem]" style={{ border: '1px solid #a1a1a1' }}>
                    <option>{selected}</option>
                    {countries.map((country) => (
                        <option key={country.code} value={country.name} >
                            {country.flag}  {country.name}
                        </option>
                    ))}
                </select>
            </div>
            {/* <div className="modal__select-options">
                {options.map(option => (
                    <div onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div> */}
        </DashboardSettingsModal>
    )
}

export const CitySettingsModal: React.FC<DashboardSettingsModalProps & { preferredCity: string; handleSave: (city: string) => void }> = ({ showing, hideModal, preferredCity, handleSave }) => {

    const [city, setCity] = useState<string>(preferredCity)
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setCity(preferredCity) }, [preferredCity])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Country of residence" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(city); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__input-group__image-container">
                {/* <img className="modal__input-group__image" src="/assets/icons/search.svg"/> */}
                <input className="modal__input-group__input w-full" value={city} placeholder="Please enter your city" onChange={(e) => setCity(e.target.value)} />
            </div>
            {/* <div className="modal__select-options">
                {options.map(option => (
                    <div onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div> */}
        </DashboardSettingsModal>
    )
}

export const CommunicationSettingsModal: React.FC<DashboardSettingsModalProps & { userCommunicationStyle: number, handleSave: (communication_style: number) => void }> = ({ showing, hideModal, userCommunicationStyle, handleSave }) => {
    const [options] = useState(communication_style)
    const [selectedOption, setSelectedOption] = useState(options[userCommunicationStyle])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[userCommunicationStyle]) }, [userCommunicationStyle])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Communication Style" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const DietarySettingsModal: React.FC<DashboardSettingsModalProps & { preferredDietary: number, handleSave: (dietary: number) => void }> = ({ showing, hideModal, preferredDietary, handleSave }) => {
    const [options] = useState(dietary)
    const [selectedOption, setSelectedOption] = useState(options[preferredDietary])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setSelectedOption(options[preferredDietary]) }, [preferredDietary])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Dietary" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(options.findIndex(option => option === selectedOption)); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {options.map((option, i) => (
                    <div key={`${option}-${i}`} onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))}
            </div>
        </DashboardSettingsModal>
    )
}

export const BioSettingsModal: React.FC<DashboardSettingsModalProps & { bio: string, handleSave: (bio: string) => void }> = ({ showing, hideModal, bio, handleSave }) => {

    const [value, setValue] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => { setValue(bio) }, [bio])

    return (
        <DashboardSettingsModal showing={showing} hideModal={hideModal} title="Bio" save={<button className="modal__body__header__save-button" onClick={() => { handleSave(value); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000) }}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}>
            <div className="modal__select-options">
                {/* {options.map(option => (
                    <div onClick={() => setSelectedOption(option)} className={`modal__select-options__option ${selectedOption == option && 'modal__select-options__option--selected'}`}>{option}</div>
                ))} */}

                <textarea
                    className="w-full border outline-none text-[1.6rem] resize-none p-2"
                    value={value}
                    onChange={(e) => {
                        if (e.target.value.length <= 500) {
                            setValue(e.target.value);
                        } else {
                            toast.error("You have reached the max length");
                        }
                    }}
                    rows={5}
                />
                <p className="text-[1.6rem] text-[#8A8A8E] mt-2">{value?.length}/500 characters</p>
            </div>
        </DashboardSettingsModal>
    )
}