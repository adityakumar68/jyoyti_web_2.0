const CustomCard = ({ title, value, icon: Icon }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </div>
        <div className="text-2xl font-bold text-gray-800">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    );
  };