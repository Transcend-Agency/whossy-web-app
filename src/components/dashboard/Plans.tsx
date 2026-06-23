const Plans = () => {
  return (
    <div className="flex space-x-4">
      {plans.map((plan, i) => (
        <div
          className={`rounded-[12px] w-[24.7rem] py-[1.6rem] px-[1.2rem]`}
          style={{
            border: `1.5px solid ${plan.color}`,
            color: plan.color,
            background: `linear-gradient(to bottom right, ${plan.shade}, #fff)`,
          }}
          key={i}
        >
          <h1 className="font-bold text-[1.8rem]">{plan.name}</h1>
          <p className="text-[1.6rem] font-semibold flex gap-2 ">
            <span className="flex items-center">$</span>{" "}
            <span className="text-[3.2rem] font-bold flex items-end">
              {plan.price}
            </span>{" "}
            <span className="font-bold text-[1.4rem] flex items-end">
              /month
            </span>
          </p>
          {plan.benefits.map((benefit) => (
            <div>
              <p className="text-[1.4rem] py-[1rem]">{benefit}</p>
              <div
                style={{
                  height: "2px",
                  background: `linear-gradient(to right, ${plan.color}, #fff)`,
                }}
              />
            </div>
          ))}
          <button
            style={{
              // width: "100%",
              marginTop: "2rem",
              padding: "0.8rem",
              borderRadius: "8px",
              color: "white",
              backgroundColor: plan.color,
              fontSize: "1.2rem",
            }}
          >
            See all features
          </button>
        </div>
      ))}
    </div>
  );
};

export default Plans;

const plans = [
  {
    name: "Free Plan",
    price: 0,
    benefits: ["Benefits 1", "Benefits 2", "Benefits 3"],
    color: "#AAAAAA",
    shade: "#F0F0F0",
  },
  {
    name: "Premium Plan",
    price: 30000,
    benefits: ["Benefits 1", "Benefits 2", "Benefits 3"],

    color: "#FF5C00",
    shade: "#FFE2D2",
  },
];
