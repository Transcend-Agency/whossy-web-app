const Matches = () => {

    return  ( 
    <div className='dashboard-layout__matches-wrapper hidden lg:block'>
        <div className='dashboard-layout__matches-container'>
            <div className='dashboard-layout__matches-container__no-matches'>
                <img src="/assets/images/dashboard/no-matches.png" alt={``} />
                <p className='dashboard-layout__matches-container__no-matches__header'>
                    No match yet ^_^
                </p>
                <p className='dashboard-layout__matches-container__no-matches__subtext'>See who you’ve matched with here 💖</p>
            </div>
        </div>
    </div>)
}
export default Matches;