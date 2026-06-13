import { FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form";

export type AccountNamesFormData = {
    first_name?: string;
    last_name?: string;
}

export type AccountCountryPhoneData = {
    phone_number?: string;
    country_of_origin?: string;
}

export type AccountGenderData = {
    gender?: string
}

export type VerifyOtpData = {
    code?: string
}

export type FormData = {
    email?: string;
    password?: string;
    confirmPassword?: string;
} & AccountNamesFormData & AccountCountryPhoneData & AccountGenderData & VerifyOtpData;

export type FormFieldProps = {
    type?: string;
    placeholder?: string;
    name: keyof FormData;
    register: UseFormRegister<FormData>;
    error?: FieldError | Merge<FieldError, FieldErrorsImpl<FormData>> | undefined;
    valueAsNumber?: boolean;
};