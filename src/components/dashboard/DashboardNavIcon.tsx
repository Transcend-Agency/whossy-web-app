import { Link } from "react-router-dom"

interface IconProps {
    active?: boolean
}

interface DashboardNavIconProps {
    active?: boolean
    icon: 'explore' | 'swipe-and-match' | 'matches' | 'user-profile' | 'chat'
}

const SwipeAndMatchIcon: React.FC<IconProps> = ({ active }) => {
    return (
        <svg className={`dashboard-layout__top-nav__icon ${active && 'dashboard-layout__top-nav__icon--active'}`} width="21" height="24" viewBox="0 0 21 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.6948 9.00953C17.9619 8.0075 17.1192 7.09068 16.1824 6.27617L16.1624 6.25917C16.1038 6.19351 16.0244 6.15001 15.9376 6.13599C15.8507 6.12197 15.7617 6.13829 15.6855 6.18219L15.6875 6.18119C15.6206 6.21476 15.567 6.26997 15.5354 6.33785C15.5038 6.40573 15.4961 6.48229 15.5135 6.5551V6.5531L15.4995 6.54411C15.9984 7.46289 16.2953 8.55563 16.3033 9.71636V9.71836C16.3113 10.4282 16.2663 10.9251 16.2653 10.9341C16.2493 11.031 16.23 11.1274 16.2074 11.223C16.1484 11.5119 15.7545 12.3637 15.1966 12.1298C14.6387 11.8958 14.6047 11.0011 14.6047 11.0011H14.5967C14.409 7.38611 12.804 3.99083 10.1298 1.55128L10.1188 1.54128L10.1138 1.53628L10.1088 1.53128C9.60102 1.08224 9.05168 0.682529 8.46818 0.337565L8.41819 0.310572C8.36815 0.286392 8.31973 0.259008 8.27322 0.228591L8.27922 0.23159C8.20811 0.186728 8.13317 0.148254 8.05528 0.116617L8.04428 0.112618C7.99429 0.0866245 7.9423 0.0666292 7.88831 0.0426348C7.83557 0.0168963 7.77802 0.002473 7.71938 0.000291011C7.66073 -0.00189098 7.60227 0.00821661 7.54776 0.0299647C7.49325 0.0517128 7.44389 0.0846207 7.40285 0.126575C7.36181 0.16853 7.32999 0.218603 7.30945 0.27358L7.30845 0.27658C7.27941 0.673296 7.34663 1.07116 7.5044 1.43631L7.49841 1.42031C8.15725 3.08492 8.54016 5.01247 8.54016 7.02999C8.54016 8.23171 8.40419 9.40143 8.14825 10.5252L8.16825 10.4202C8.10758 10.6586 7.9903 10.8789 7.82635 11.0624C7.6624 11.2458 7.45662 11.387 7.22647 11.4739L7.21647 11.4769C6.93523 11.5035 6.65315 11.4357 6.41473 11.2842C6.17632 11.1326 5.99514 10.9061 5.89978 10.6401L5.89678 10.6311C5.87079 10.5592 5.8388 10.4922 5.8188 10.4142V10.4002C5.33691 8.6826 5.92778 6.11021 6.34068 4.67654C6.61761 3.61579 5.31592 4.67654 5.31592 4.67654H5.31092C5.05498 4.89249 4.77905 5.13644 4.48911 5.40637V5.39638C4.1222 5.7323 3.63731 6.19819 3.13843 6.73106C2.86849 7.01999 -0.729659 10.9791 0.392077 16.3868C1.50482 20.7918 5.43289 24 10.1098 24C15.1896 24 19.3856 20.2149 20.0315 15.312L20.0365 15.2611C20.0605 15.0621 20.0824 14.8641 20.0924 14.6672C20.0974 14.6052 20.0984 14.5402 20.1014 14.4752C20.1544 12.5393 19.6587 10.6278 18.6718 8.96154L18.6978 9.00953H18.6948Z" />
        </svg>

    )
}

const ExploreIcon: React.FC<IconProps> = ({ active }) => {
    return (
        <svg className={`dashboard-layout__top-nav__icon ${active && 'dashboard-layout__top-nav__icon--active'}`} width="25" height="24" viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.8653 17.88C21.3453 17.04 21.7053 16.08 21.7053 15C21.7053 12 19.3053 9.6 16.3053 9.6C13.3053 9.6 10.9053 12 10.9053 15C10.9053 18 13.3053 20.4 16.3053 20.4C17.3853 20.4 18.3453 20.04 19.1853 19.56L23.0253 23.4L24.7053 21.72L20.8653 17.88ZM16.3053 18C14.6253 18 13.3053 16.68 13.3053 15C13.3053 13.32 14.6253 12 16.3053 12C17.9853 12 19.3053 13.32 19.3053 15C19.3053 16.68 17.9853 18 16.3053 18ZM12.1053 21.6V24C5.48129 24 0.105286 18.624 0.105286 12C0.105286 5.376 5.48129 0 12.1053 0C17.9133 0 22.7493 4.128 23.8653 9.6H21.3813C21.007 8.15021 20.2988 6.80806 19.3132 5.68082C18.3277 4.55358 17.0921 3.6725 15.7053 3.108V3.6C15.7053 4.92 14.6253 6 13.3053 6H10.9053V8.4C10.9053 9.06 10.3653 9.6 9.70529 9.6H7.30529V12H9.70529V15.6H8.50529L2.75729 9.852C2.60129 10.548 2.50529 11.256 2.50529 12C2.50529 17.292 6.81329 21.6 12.1053 21.6Z" />
        </svg>

    )
}

const MatchesIcon: React.FC<IconProps> = ({ active }) => {
    return (
        <svg className={`dashboard-layout__top-nav__icon ${active && 'dashboard-layout__top-nav__icon--active'}`} width="23" height="24" viewBox="0 0 23 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.80018 0H12.4748V1.7679C13.3259 1.71574 14.1504 1.76522 14.8912 1.92169C11.7486 3.15868 10.3023 6.33809 10.0656 6.8583L10.0509 6.89039C9.28264 6.77405 8.45085 6.67642 7.66385 6.68378C6.85212 6.75332 6.06512 6.87301 4.76862 7.60317C4.58541 7.73288 4.33935 7.94418 4.00436 8.2678C3.98029 8.24975 3.95421 8.23437 3.92011 8.2123L3.81914 8.14811C3.56611 7.98415 3.30403 7.83458 3.03415 7.70012C2.35481 7.36312 1.52168 7.07627 0.705261 7.07627V4.4826C2.11677 4.4826 3.38653 4.96202 4.25243 5.39196C4.55265 5.54106 4.81609 5.6895 5.03474 5.8219C5.23168 5.40654 5.48479 5.02024 5.78697 4.67383L4.31728 2.36901L6.67158 0.839819L8.02693 2.96611C8.5953 2.67567 9.18853 2.43668 9.79951 2.252L9.80018 0ZM16.9928 5.8112C16.0179 6.2632 15.1741 7.0054 14.4138 8.43496C14.4138 8.43496 12.7262 7.66335 11.3568 7.26216C12.4079 5.13185 13.6302 3.93364 15.4335 3.09783C17.178 2.28877 19.2582 2.08149 21.7308 2.16775L21.6131 5.34916C19.3331 5.27026 18.0259 5.33245 16.9928 5.8112Z" />
            <path d="M5.30755 8.83999C0.451175 13.1715 7.38837 24.0002 12.9388 24.0002C18.4892 24.0002 26.1312 13.1808 20.57 8.22082C20.4543 8.11737 20.3393 8.01306 20.225 7.9079C19.765 7.48665 19.4594 7.20582 18.6109 6.70166C16.9045 6.70166 15.8762 8.40871 15.4081 9.44912C15.3844 9.50111 15.3553 9.55043 15.3212 9.59623L14.2413 12.5984L13.8528 13.9952C13.8117 14.1425 13.8223 14.2995 13.8829 14.4399L14.3376 15.4897L16.6892 15.2169L16.8437 16.5448L14.6311 16.8022L14.7749 18.9091L13.4409 19.0001L13.2618 16.3716L12.656 14.9708C12.4736 14.5495 12.4413 14.0784 12.5644 13.6362L12.5757 13.5947L11.2157 14.2099L10.3264 16.4572L9.08272 15.9651L9.78747 14.1851L7.64112 13.6796L7.94736 12.3778L10.626 13.009L13.0699 11.9024L13.8923 9.61562C11.774 8.62 7.42381 6.95107 5.30688 8.83865" />
        </svg>
    )
}

const UserProfileIcon: React.FC<IconProps> = ({ active }) => {
    return (
        <svg className={`dashboard-layout__top-nav__icon ${active && 'dashboard-layout__top-nav__icon--active'}`} width="20" height="24" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.1049 9.6C12.7558 9.6 14.9049 7.45097 14.9049 4.8C14.9049 2.14903 12.7558 0 10.1049 0C7.4539 0 5.30487 2.14903 5.30487 4.8C5.30487 7.45097 7.4539 9.6 10.1049 9.6Z" />
            <path d="M19.7049 18.6002C19.7049 21.5822 19.7049 24.0002 10.1049 24.0002C0.504868 24.0002 0.504868 21.5822 0.504868 18.6002C0.504868 15.6182 4.80327 13.2002 10.1049 13.2002C15.4065 13.2002 19.7049 15.6182 19.7049 18.6002Z" />
        </svg>
    )
}

const ChatIcon: React.FC<IconProps> = ({ active }) => {
    return (
        <svg className={`dashboard-layout__top-nav__icon ${active && 'dashboard-layout__top-nav__icon--active'}`} width="24" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.99998 14C1.99998 20.6276 7.37239 26 14 26C15.92 26 17.7344 25.5488 19.3424 24.7472C19.7672 24.5277 20.2575 24.4709 20.7212 24.5876L23.3924 25.3028C23.6568 25.3734 23.9351 25.3731 24.1994 25.3021C24.4636 25.2311 24.7046 25.0918 24.898 24.8983C25.0914 24.7047 25.2306 24.4637 25.3014 24.1994C25.3722 23.9351 25.3723 23.6567 25.3016 23.3924L24.5876 20.7212C24.4715 20.2578 24.5286 19.7678 24.7484 19.3436C25.5744 17.6836 26.0029 15.8542 26 14C26 7.3724 20.6276 2 14 2C7.37239 2 1.99998 7.3724 1.99998 14ZM19.4 12.9296C19.4 14.5724 17.8172 16.2956 16.3652 17.5304C15.3776 18.3704 14.8832 18.7916 14 18.7916C13.1168 18.7916 12.6224 18.3716 11.6348 17.5304C10.1828 16.2944 8.59999 14.5724 8.59999 12.9296C8.59999 9.7172 11.57 8.5184 14 11C16.43 8.5184 19.4 9.7172 19.4 12.9296Z" />
        </svg>
    )
}

const DashboardNavIcon: React.FC<DashboardNavIconProps> = ({ active, icon }) => {

    return <Link to={`/dashboard/${icon}`}>
        {icon === 'explore' && <ExploreIcon active={active} />}
        {icon === 'matches' && <MatchesIcon active={active} />}
        {icon === 'swipe-and-match' && <SwipeAndMatchIcon active={active} />}
        {icon === 'user-profile' && <UserProfileIcon active={active} />}
        {icon === 'chat' && <ChatIcon active={active} />}
    </Link>

}

export default DashboardNavIcon;