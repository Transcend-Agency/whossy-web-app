import React from 'react';

type ResetPasswordRequirementParameterProps = {
    text: string;
    criteriaPassed?: boolean
};

const ResetPasswordRequirementParameter: React.FC<ResetPasswordRequirementParameterProps> = ({ text, criteriaPassed }) => {

    return <div className='auth-page__modal__password-requirements__parameter'>
        <svg width="11" height="8" viewBox="0 0 11 8" className={`auth-page__modal__password-requirements__parameter__icon ${!criteriaPassed && 'auth-page__modal__password-requirements__parameter__icon--inactive'}`} xmlns="http://www.w3.org/2000/svg">
            <path d="M8.49111 0.255056C8.66485 0.089653 8.89604 -0.00178848 9.13592 2.65108e-05C9.37579 0.0018415 9.60558 0.0967713 9.77679 0.264784C9.948 0.432797 10.0473 0.660752 10.0536 0.900549C10.0599 1.14034 9.97287 1.37323 9.81077 1.55005L4.88979 7.70436C4.80517 7.79551 4.70304 7.86865 4.58951 7.91942C4.47598 7.97018 4.35338 7.99754 4.22904 7.99984C4.10469 8.00214 3.98116 7.97935 3.86583 7.93282C3.75049 7.88629 3.64573 7.81698 3.55779 7.72903L0.294406 4.46564C0.203526 4.38096 0.130634 4.27884 0.0800769 4.16537C0.0295204 4.05191 0.00233531 3.92942 0.000143954 3.80522C-0.00204741 3.68102 0.0207999 3.55765 0.0673223 3.44248C0.113845 3.3273 0.183089 3.22267 0.270926 3.13483C0.358762 3.047 0.46339 2.97775 0.578568 2.93123C0.693746 2.88471 0.817115 2.86186 0.941315 2.86405C1.06551 2.86624 1.188 2.89343 1.30147 2.94398C1.41493 2.99454 1.51705 3.06743 1.60173 3.15831L4.18433 5.73967L8.46768 0.28219L8.49111 0.255056Z" />
        </svg>
        <span className={`auth-page__modal__password-requirements__parameter__text  ${!criteriaPassed && 'auth-page__modal__password-requirements__parameter__text--inactive'}`}>{text}</span>
    </div>
}
export default ResetPasswordRequirementParameter;