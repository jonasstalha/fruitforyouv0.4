import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
// Removed Tooltip import as it might be causing an issue
// import { Tooltip } from "../../components/ui/tooltip";

const ReceptionDashboard = () => {
  const [filters, setFilters] = useState({
    dateRange: "",
    farm: "",
    variety: "",
    status: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const receptionData = [
    { id: 1, date: "2025-05-10", farm: "Farm A", variety: "Hass", status: "Received" },
    { id: 2, date: "2025-05-11", farm: "Farm B", variety: "Fuerte", status: "Pending" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Reception Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow">
        <Input
          type="text"
          name="dateRange"
          placeholder="Date Range"
          value={filters.dateRange}
          onChange={handleFilterChange}
          className="flex-1"
        />
        <Input
          type="text"
          name="farm"
          placeholder="Farm"
          value={filters.farm}
          onChange={handleFilterChange}
          className="flex-1"
        />
        <Input
          type="text"
          name="variety"
          placeholder="Variety"
          value={filters.variety}
          onChange={handleFilterChange}
          className="flex-1"
        />
        <Select
          name="status"
          value={filters.status}
          onValueChange={(value: string) => setFilters({ ...filters, status: value })}
        >
          <option value="">All Status</option>
          <option value="Received">Received</option>
          <option value="Pending">Pending</option>
        </Select>
      </div>

      <Button className="mb-6 bg-blue-600 text-white hover:bg-blue-700">Add New Reception</Button>

      <Table className="bg-white rounded-lg shadow">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Farm</TableHead>
            <TableHead>Variety</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receptionData.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-gray-100">
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.farm}</TableCell>
              <TableCell>{entry.variety}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    entry.status === "Received" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {entry.status}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <Button className="bg-gray-200 hover:bg-gray-300" title="View Details">View</Button>
                </div>
                <div>
                  <Button className="bg-gray-200 hover:bg-gray-300" title="Edit Entry">Edit</Button>
                </div>
                <div>
                  <Button className="bg-gray-200 hover:bg-gray-300" title="Download PDF">Download PDF</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReceptionDashboard;