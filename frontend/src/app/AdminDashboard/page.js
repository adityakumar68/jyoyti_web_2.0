// app/admin/dashboard/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, totalUsage, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-xl font-semibold mt-1">{value || 0}</h3>
          {totalUsage !== undefined && (
            <p className="text-sm text-gray-400">Total Usage: {totalUsage}</p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

const UserList = ({ users }) => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OCR Usage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency Detection</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object Detection</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USB Camera</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, index) => (
            <tr key={user.uid || index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.fName || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.mobile || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.ocr || '0'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.curridt || '0'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.objdet || '0'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.usbcam || '0'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalColorId: 0,
    totalEditDelete: 0,
    totalEmailUsers: 0,
    totalMobileUsers: 0,
    totalObjDetection: 0,
    totalOCR: 0,
    totalUsbCam: 0,
    totalCurrencyDetection: 0,
    usageStats: {
      ocrUsage: 0,
      currencyDetectionUsage: 0,
      objectDetectionUsage: 0,
      usbCameraUsage: 0
    }
  });

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    verifySession();
  }, []);

  useEffect(() => {
    if (!isVerifying && selectedOrg !== undefined) {
      fetchStats(selectedOrg);
      fetchUsers(selectedOrg);
    }
  }, [selectedOrg, isVerifying]);

  const verifySession = async () => {
    try {
      const response = await fetch('https://jyoti-ai.com/api/org/protected', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      await fetchInitialData();
      setIsVerifying(false);
    } catch (error) {
      console.error('Session verification failed:', error);
      router.push('/OrgLogin');
    }
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchOrganizations(),
        fetchStats(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('https://jyoti-ai.com/api/admin/organizations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchStats = async (orgId = '') => {
    try {
      const url = `https://jyoti-ai.com/api/admin/stats${orgId ? `?orgId=${orgId}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async (orgId = '') => {
    try {
      const url = `https://jyoti-ai.com/api/admin/users${orgId ? `?orgId=${orgId}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Organization Filter */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overall User Statistics and System Usage
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              className="p-2 border rounded-md"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-brown-700">
                {stats.totalUsers} Users
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="OCR Users" 
          value={stats.totalOCR}
          totalUsage={stats.usageStats.ocrUsage}
          icon={<span className="text-green-500">📝</span>}
        />
        
        <StatCard 
          title="Currency Detection Users" 
          value={stats.totalCurrencyDetection}
          totalUsage={stats.usageStats.currencyDetectionUsage}
          icon={<span className="text-green-500">💰</span>}
        />

        <StatCard 
          title="Object Detection Users" 
          value={stats.totalObjDetection}
          totalUsage={stats.usageStats.objectDetectionUsage}
          icon={<span className="text-yellow-500">🔍</span>}
        />
        
        <StatCard 
          title="USB Camera Users" 
          value={stats.totalUsbCam}
          totalUsage={stats.usageStats.usbCameraUsage}
          icon={<span className="text-blue-500">📸</span>}
        />
        
        <StatCard 
          title="Email Users" 
          value={stats.totalEmailUsers}
          icon={<span className="text-red-500">📧</span>}
        />

        <StatCard 
          title="Mobile Users" 
          value={stats.totalMobileUsers}
          icon={<span className="text-blue-500">📱</span>}
        />
      </div>

      {/* User List */}
      <UserList users={users} />
    </div>
  );
}