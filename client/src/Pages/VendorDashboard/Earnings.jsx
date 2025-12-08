import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { FaMoneyBillWave, FaHistory, FaArrowDown } from 'react-icons/fa';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { formatCurrency } from '../../utils/currency';

const VendorEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    iban: '',
    swiftCode: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetchDataFromApi('/api/vendors/dashboard');
      if (response.success) {
        setDashboardData(response.dashboard);
        // Pre-fill bank account if exists
        if (response.dashboard.vendor?.bankAccount) {
          setBankAccount(response.dashboard.vendor.bankAccount);
        }
      } else {
        toast.error(response.error || 'Failed to load earnings');
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const availableBalance = dashboardData?.earnings?.availableBalance || 0;

    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!bankAccount.accountNumber || !bankAccount.bankName) {
      toast.error('Please complete your bank account information');
      return;
    }

    setSubmitting(true);
    try {
      const response = await postData('/api/vendors/withdraw', {
        amount,
        bankAccount
      });

      if (response.success) {
        toast.success('Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        loadDashboard(); // Reload to show updated balance
      } else {
        toast.error(response.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { earnings } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Earnings & Withdrawals</h1>
          <p className="text-gray-600 mt-1">Manage your earnings and withdrawal requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Earnings Summary Cards */}
          <div className="bg-green-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total Earnings</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(earnings.totalEarnings || 0)}</p>
              </div>
              <FaMoneyBillWave className="text-4xl text-white/80" />
            </div>
          </div>

          <div className="bg-blue-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Available Balance</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(earnings.availableBalance || 0)}</p>
              </div>
              <FaArrowDown className="text-4xl text-white/80" />
            </div>
          </div>

          <div className="bg-yellow-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Pending Balance</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(earnings.pendingBalance || 0)}</p>
              </div>
              <FaHistory className="text-4xl text-white/80" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Withdrawal</h2>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <TextField
                fullWidth
                label="Withdrawal Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                helperText={`Available: ${formatCurrency(earnings.availableBalance || 0)}`}
                required
                inputProps={{ min: 0.01, max: earnings.availableBalance || 0, step: 0.01 }}
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Bank Account Information</h3>
                
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={bankAccount.accountHolderName}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  required
                  className="mb-3"
                />

                <TextField
                  fullWidth
                  label="Account Number"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                  required
                  className="mb-3"
                />

                <TextField
                  fullWidth
                  label="Bank Name"
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                  required
                  className="mb-3"
                />

                <TextField
                  fullWidth
                  label="Routing Number (Optional)"
                  value={bankAccount.routingNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, routingNumber: e.target.value }))}
                  className="mb-3"
                />

                <TextField
                  fullWidth
                  label="IBAN (Optional)"
                  value={bankAccount.iban}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, iban: e.target.value }))}
                  className="mb-3"
                />

                <TextField
                  fullWidth
                  label="SWIFT Code (Optional)"
                  value={bankAccount.swiftCode}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, swiftCode: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || earnings.availableBalance <= 0}
                sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' }, mt: 3 }}
              >
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </form>
          </div>

          {/* Earnings Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Breakdown</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Total Earnings</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(earnings.totalEarnings || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Available for Withdrawal</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(earnings.availableBalance || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Pending (Processing)</span>
                <span className="text-base font-medium text-yellow-600">
                  {formatCurrency(earnings.pendingBalance || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <span className="text-gray-600">Total Withdrawn</span>
                <span className="text-base font-medium text-gray-700">
                  {formatCurrency(earnings.withdrawnAmount || 0)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Pending balance will be moved to available balance once orders are completed and processed. 
                Withdrawals are typically processed within 3-5 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;

