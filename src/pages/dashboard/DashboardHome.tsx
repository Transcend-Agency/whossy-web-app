import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    const navigate = useNavigate()
    const pushToUserProfile = () => {
        navigate('/dashboard/user-profile')
    }

    useEffect(() => {
        pushToUserProfile()
    })
    return <div></div>
}
export default DashboardHome;