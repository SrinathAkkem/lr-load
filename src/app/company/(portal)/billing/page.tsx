"use client";

import { CreditCard, Calendar, Zap } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6" style={{ display: 'none' }}>
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your subscription and billing</p>
      </div>

      <div className="mt-18 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-purple-100 rounded-full">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Billing & Subscriptions Coming Soon
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We&apos;re working on bringing you a seamless billing experience with flexible plans 
            and payment options. This feature will be available in an upcoming release.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-gray-900 mb-1">Flexible Plans</h3>
                <p className="text-xs text-gray-600">Choose a plan that fits your business needs</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-gray-900 mb-1">Usage Tracking</h3>
                <p className="text-xs text-gray-600">Monitor your LR usage and limits</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-gray-900 mb-1">Easy Payments</h3>
                <p className="text-xs text-gray-600">Secure payment options with auto-renewal</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            For enterprise plans or custom requirements, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
