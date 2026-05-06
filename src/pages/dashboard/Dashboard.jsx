import { useAuth } from "../../store/authStore";
import OwnerDashboard from "./owner/OwnerDashboard";
import ConsumerDashboard from "./consumer/ConsumerDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  // Show correct dashboard based on role
  if (user?.role === "consumer") {
    return <ConsumerDashboard />;
  }

  // api_owner and admin see owner dashboard
  return <OwnerDashboard />;
};

export default Dashboard;