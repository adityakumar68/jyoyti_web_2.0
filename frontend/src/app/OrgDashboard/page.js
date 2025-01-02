

// app/OrgDashboard/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from '@/components/navbar';

// Pincode to State mapping
const pincodeToState = {
    "11": "Delhi",
    "12": "Haryana",
    "13": "Punjab",
    "14": "Punjab",
    "15": "Punjab",
    "16": "Punjab",
    "17": "Himachal Pradesh",
    "18": "Himachal Pradesh",
    "19": "Himachal Pradesh",
    "20": "Uttar Pradesh",
    "21": "Uttar Pradesh",
    "22": "Uttar Pradesh",
    "23": "Uttar Pradesh",
    "24": "Uttar Pradesh",
    "25": "Uttar Pradesh",
    "26": "Uttar Pradesh",
    "27": "Uttar Pradesh",
    "28": "Uttar Pradesh",
    "30": "Rajasthan",
    "31": "Rajasthan",
    "32": "Rajasthan",
    "33": "Rajasthan",
    "34": "Rajasthan",
    "36": "Gujarat",
    "37": "Gujarat",
    "38": "Gujarat",
    "39": "Gujarat",
    "40": "Maharashtra",
    "41": "Maharashtra",
    "42": "Maharashtra",
    "43": "Maharashtra",
    "44": "Maharashtra",
    "45": "Maharashtra",
    "46": "Maharashtra",
    "47": "Maharashtra",
    "48": "Maharashtra",
    "49": "Maharashtra",
    "50": "Telangana",
    "51": "Andhra Pradesh",
    "52": "Andhra Pradesh",
    "53": "Andhra Pradesh",
    "54": "Andhra Pradesh",
    "55": "Andhra Pradesh",
    "56": "Karnataka",
    "57": "Karnataka",
    "58": "Karnataka",
    "59": "Karnataka",
    "60": "Tamil Nadu",
    "61": "Tamil Nadu",
    "62": "Tamil Nadu",
    "63": "Tamil Nadu",
    "64": "Tamil Nadu",
    "65": "Tamil Nadu",
    "66": "Kerala",
    "67": "Kerala",
    "68": "Kerala",
    "69": "Kerala",
    "70": "West Bengal",
    "71": "West Bengal",
    "72": "West Bengal",
    "73": "West Bengal",
    "74": "Odisha",
    "75": "Odisha",
    "76": "Odisha",
    "77": "Odisha",
    "78": "Arunachal Pradesh",
    "79": "Assam",
    "80": "Bihar",
    "81": "Bihar",
    "82": "Bihar",
    "83": "Jharkhand",
    "84": "Jharkhand",
    "85": "Jharkhand",
    "86": "Chhattisgarh",
    "87": "Madhya Pradesh",
    "88": "Madhya Pradesh",
    "90": "Manipur",
    "91": "Nagaland",
    "92": "Mizoram",
    "93": "Tripura",
    "94": "Meghalaya",
    "95": "Sikkim",
    "96": "Jammu and Kashmir",
    "97": "Ladakh",
    "98": "Uttarakhand",
    "99": "Haryana"
  };
  
const StatCard = ({ title, value, totalUsers, icon, bgColor }) => {
  return (
    <div className={`${bgColor} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-white">{value || 0}</h3>
          <p className="text-sm text-white/80 mt-1">{title}</p>
          {totalUsers !== undefined && (
            <p className="text-sm text-white/70 mt-1">Active Users: {totalUsers}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

const UserList = ({ users }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Organization Users</h2>
        <p className="text-gray-600 mt-1">Detailed user activity statistics</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OCR</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ask Jyoti</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Describe</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USB Cam</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.uid || index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.fName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.address || 'N/A'}</div>
                  <div className="text-xs text-gray-400">{user.pincode || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.ocr || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.askJyoti || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.describe || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.color || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.summary || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.documentRead || '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.usbcam || '0'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LocationMap = ({ users }) => {
  const [stateGroups, setStateGroups] = useState({});
  const [hoveredState, setHoveredState] = useState(null);

  const getStateFromPincode = (pincode) => {
    const prefix = pincode.substring(0, 2);
    return pincodeToState[prefix] || "Other";
  };

  useEffect(() => {
    const groups = users.reduce((acc, user) => {
      if (user.pincode) {
        const state = getStateFromPincode(user.pincode);
        acc[state] = (acc[state] || 0) + 1;
      }
      return acc;
    }, {});
    setStateGroups(groups);
  }, [users]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Distribution by State</h2>
          <p className="text-gray-600 mt-1">Geographic distribution of active users</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-blue-600 font-semibold">
            {Object.keys(stateGroups).length} States Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* State List */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">State-wise Distribution</h3>
            <div className="text-sm text-gray-500">Total Users: {users.length}</div>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(stateGroups)
              .sort((a, b) => b[1] - a[1])
              .map(([state, count]) => (
                <div
                  key={state}
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                  className={`transform transition-all duration-200 ${
                    hoveredState === state
                      ? 'scale-102 -translate-y-1'
                      : 'scale-100'
                  }`}
                >
                  <div className={`flex items-center justify-between p-4 rounded-lg ${
                    hoveredState === state
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-white'
                  }`}>
                    <div>
                      <span className={`font-medium ${
                        hoveredState === state ? 'text-white' : 'text-gray-800'
                      }`}>{state}</span>
                      <div className={`text-sm ${
                        hoveredState === state ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {((count / users.length) * 100).toFixed(1)}% coverage
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-1 rounded-full ${
                        hoveredState === state
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {count} users
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        hoveredState === state ? 'bg-white' : 'bg-blue-500'
                      } animate-pulse`} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Stats and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top States Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Top States</h3>
            <div className="space-y-4">
              {Object.entries(stateGroups)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([state, count], index) => (
                  <div key={state} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold">#{index + 1}</span>
                      <span>{state}</span>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {count} users
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Average Users/State</div>
                <div className="text-2xl font-bold text-gray-800">
                  {(Object.values(stateGroups).reduce((a, b) => a + b, 0) / 
                    Object.keys(stateGroups).length).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">States Coverage</div>
                <div className="text-2xl font-bold text-gray-800">
                  {Object.keys(stateGroups).length}/28
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrgDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [stats, setStats] = useState({
    totalOCR: { count: 0, users: 0 },
    totalAskJyoti: { count: 0, users: 0 },
    totalDescribe: { count: 0, users: 0 },
    totalColor: { count: 0, users: 0 },
    totalSummary: { count: 0, users: 0 },
    totalDocument: { count: 0, users: 0 },
    totalUsbCam: { count: 0, users: 0 }
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      const response = await fetch('https://jyoti-ai.com/api/org/protected', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      await fetchOrgData();
      setIsVerifying(false);
    } catch (error) {
      console.error('Session verification failed:', error);
      router.push('/OrgLogin');
    }
  };

  const orgId = params.get('orgId');

  const fetchOrgData = async () => {
    try {
      const statsResponse = await fetch(`https://jyoti-ai.com/api/org/stats?orgId=${orgId}`, {
        credentials: 'include'
      });
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData.stats);
      setOrgName(statsData.orgName);

      const usersResponse = await fetch(`https://jyoti-ai.com/api/org/users?orgId=${orgId}`, {
        credentials: 'include'
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching organization data:', error);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-lg p-8 m-6 border-l-4 border-blue-500">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold">
                <span className="text-gray-800">Welcome to </span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                  {orgName}
                </span>
              </h1>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="flex items-center mt-3 space-x-2">
              <p className="text-gray-600">
                Feature Usage and User Statistics
              </p>
              <div className="h-4 w-[1px] bg-gray-300"></div>
              <p className="text-sm text-blue-600 font-medium">
                Live Dashboard
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm text-gray-500">Last updated</span>
            <span className="text-blue-600 font-medium">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
        <StatCard 
          title="OCR Scans"
          value={stats.totalOCR.count}
          totalUsers={stats.totalOCR.users}
          icon={<span className="text-white text-2xl">📝</span>}
          bgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        
        <StatCard 
          title="Ask Jyoti AI"
          value={stats.totalAskJyoti.count}
          totalUsers={stats.totalAskJyoti.users}
          icon={<span className="text-white text-2xl">🤖</span>}
          bgColor="bg-gradient-to-br from-blue-500 to-cyan-600"
        />

        <StatCard 
          title="Describe Scenes"
          value={stats.totalDescribe.count}
          totalUsers={stats.totalDescribe.users}
          icon={<span className="text-white text-2xl">🎯</span>}
          bgColor="bg-gradient-to-br from-green-500 to-emerald-600"
        />

        <StatCard 
          title="Color Detection"
          value={stats.totalColor.count}
          totalUsers={stats.totalColor.users}
          icon={<span className="text-white text-2xl">🎨</span>}
          bgColor="bg-gradient-to-br from-yellow-500 to-orange-600"
        />

        <StatCard 
          title="Document Reading"
          value={stats.totalDocument.count}
          totalUsers={stats.totalDocument.users}
          icon={<span className="text-white text-2xl">📄</span>}
          bgColor="bg-gradient-to-br from-red-500 to-pink-600"
        />

        <StatCard 
          title="Summaries"
          value={stats.totalSummary.count}
          totalUsers={stats.totalSummary.users}
          icon={<span className="text-white text-2xl">📊</span>}
          bgColor="bg-gradient-to-br from-indigo-500 to-purple-600"
        />

        <StatCard 
          title="USB Camera Usage"
          value={stats.totalUsbCam.count}
          totalUsers={stats.totalUsbCam.users}
          icon={<span className="text-white text-2xl">📸</span>}
          bgColor="bg-gradient-to-br from-pink-500 to-rose-600"
        />
      </div>

      {/* Location Distribution */}
      <div className="px-6 mb-8">
        <LocationMap users={users} />
      </div>

      {/* Users Table */}
      <div className="px-6 mb-8">
        <UserList users={users} />
      </div>
    </div>
  );
}