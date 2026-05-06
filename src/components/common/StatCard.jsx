const StatCard = ({ label, value, sub, color, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${color || "text-gray-800"}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
};

export default StatCard;