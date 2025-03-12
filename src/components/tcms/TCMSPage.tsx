import React, { useState } from "react";
import TCMSLayout from "./layout/TCMSLayout";
import TCMSHeader from "./layout/TCMSHeader";
import TCMSDashboard from "./dashboard/TCMSDashboard";

const TCMSPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Dashboard" onSearch={handleSearch} />
      <TCMSDashboard />
    </TCMSLayout>
  );
};

export default TCMSPage;
