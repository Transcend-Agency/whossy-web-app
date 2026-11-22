import React, { useEffect, useState } from "react";
import { Oval } from "react-loader-spinner";
import DoubleSliderBar from "@/components/ui/DoubleSliderBar";
import useAgeFilterStore from "@/store/AgeFilterStore";
import { useAuthStore } from "@/store/UserId";
import { AgeRange, activeAgeRange, startingAgeRange } from "@/utils/ageFilter";
import { notifyError } from "@/utils/notifyError";

const OFF_NOTE = {
	preferences:
		"Turn this on to only see people in a chosen age range when you swipe. You can turn it off anytime here in Preferences.",
	"advanced-search":
		"Turn this on to only see people in a chosen age range, here and when you swipe. It's the same setting as in Preferences, and you can turn it off anytime.",
};
const ON_NOTE =
	"Only people in this age range are shown when you swipe and in Advanced Search. Turn this off anytime to see everyone.";

interface AgeFilterSettingsProps {
	/** Which screen it's on, for the wording of the note. */
	place?: keyof typeof OFF_NOTE;
	/** Called after a change is saved, so the screen can refresh its results. */
	onChange?: () => void;
}

/**
 * The age filter: off by default, with a note saying what it does before
 * anyone switches it on. The same component (and the same saved setting)
 * on Preferences and in Advanced Search, worded like the mobile app.
 */
const AgeFilterSettings: React.FC<AgeFilterSettingsProps> = ({ place = "preferences", onChange }) => {
	const { auth, user } = useAuthStore();
	const uid = auth?.uid;
	const { loaded, load, setEnabled, setRange, ...fields } = useAgeFilterStore();
	const range = activeAgeRange(fields);
	const isOn = range != null;

	const [draft, setDraft] = useState<AgeRange | null>(range);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (uid) load(uid).catch(notifyError("Couldn't load your age filter."));
	}, [uid, load]);

	// Follow the saved range (first load, switching on, another screen's save).
	useEffect(() => setDraft(range), [range?.min, range?.max]); // eslint-disable-line react-hooks/exhaustive-deps

	const toggle = async () => {
		if (!uid || !loaded) return;
		try {
			await setEnabled(uid, !isOn, startingAgeRange(user?.date_of_birth));
			onChange?.();
		} catch (error) {
			notifyError("Couldn't save your age filter. Please try again.")(error);
		}
	};

	const saveRange = async () => {
		if (!uid || !draft) return;
		setSaving(true);
		try {
			await setRange(uid, draft);
			onChange?.();
		} catch (error) {
			notifyError("Couldn't save your age range. Please try again.")(error);
		} finally {
			setSaving(false);
		}
	};

	const rangeChanged = draft != null && range != null && (draft.min !== range.min || draft.max !== range.max);

	return (
		<div className="px-5 pt-4">
			<div className="flex justify-between items-center gap-x-4">
				<p>Filter by age</p>
				<button
					type="button"
					role="switch"
					aria-checked={isOn}
					aria-label="Filter by age"
					disabled={!loaded}
					onClick={toggle}
					className={`settings-page__settings-group__toggle-item__toggle-button ${isOn ? "settings-page__settings-group__toggle-item__toggle-button--active" : ""} ${!loaded ? "opacity-50" : ""}`}
				>
					<span className="settings-page__settings-group__toggle-item__toggle-button__toggle" />
				</button>
			</div>

			{isOn && draft && (
				<div className="mt-4">
					<div className="flex justify-between">
						<div className="flex gap-x-4 items-center">
							<p>Age range</p>
							<div className="bg-white py-2 px-3 rounded-[4px]">{draft.min} - {draft.max}</div>
						</div>
						{rangeChanged && (
							<button className="modal__body__header__save-button" onClick={saveRange} disabled={saving}>
								{!saving ? "Save" : <Oval color="#485FE6" secondaryColor="#485FE6" width={14} height={14} />}
							</button>
						)}
					</div>
					<DoubleSliderBar val={[draft.min, draft.max]} getValue={([min, max]) => setDraft({ min, max })} />
				</div>
			)}

			<p className="text-[1.2rem] text-gray mt-3">{isOn ? ON_NOTE : OFF_NOTE[place]}</p>
		</div>
	);
};

export default AgeFilterSettings;
