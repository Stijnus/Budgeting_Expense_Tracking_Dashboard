import React from 'react';
import HouseholdDashboard from '../components/HouseholdDashboard';
import HouseholdMembers from '../components/HouseholdMembers';
import InviteMember from '../components/InviteMember';

const HouseholdsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Household Budgeting</h1>
      <HouseholdDashboard />
      <div className="mt-8">
        <HouseholdMembers />
        <InviteMember />
      </div>
    </div>
  );
};

export default HouseholdsPage;
