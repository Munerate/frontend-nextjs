"use client";

import React, { useEffect, useState } from "react";
import { Bot, Globe, ShieldCheck, BarChart3, Fingerprint, LayoutTemplate } from "lucide-react";

export default function FlowchartAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl py-12">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          What you get with AI Traffic Lens
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          See exactly how AI agents interact with your site in real-time.
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-10 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-8 sm:grid sm:grid-cols-3 sm:grid-rows-[auto_auto] sm:items-start sm:gap-6 sm:p-12">
        
        {/* Horizontal Connection Line (Desktop) */}
        <div className="absolute left-0 top-[120px] hidden w-full px-[16%] sm:block">
          <svg className="h-2 w-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="4"
              x2="100%"
              y2="4"
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Animated dots moving left to right */}
            {mounted && (
              <>
                <circle cx="0" cy="4" r="3" fill="#3b82f6">
                  <animate attributeName="cx" values="0;100%" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="3s" keyTimes="0;0.1;0.9;1" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="4" r="3" fill="#10b981">
                  <animate attributeName="cx" values="0;100%" dur="3s" begin="0.75s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="0.75s" keyTimes="0;0.1;0.9;1" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="4" r="3" fill="#a855f7">
                  <animate attributeName="cx" values="0;100%" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="1.5s" keyTimes="0;0.1;0.9;1" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="4" r="3" fill="#f59e0b">
                  <animate attributeName="cx" values="0;100%" dur="3s" begin="2.25s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="2.25s" keyTimes="0;0.1;0.9;1" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </svg>
        </div>

        {/* Vertical Connection Line from Lens to Dashboard (Desktop) */}
        <div className="absolute left-1/2 top-[160px] hidden h-[120px] -translate-x-1/2 sm:block">
          <svg className="h-full w-2" preserveAspectRatio="none">
            <line
              x1="4"
              y1="0"
              x2="4"
              y2="100%"
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {mounted && (
              <>
                <circle cx="4" cy="0" r="3" fill="#f59e0b">
                  <animate
                    attributeName="cy"
                    values="0;100%"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="2s"
                    keyTimes="0;0.1;0.9;1"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="4" cy="0" r="3" fill="#ef4444">
                  <animate
                    attributeName="cy"
                    values="0;100%"
                    dur="2s"
                    begin="0.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="2s"
                    begin="0.6s"
                    keyTimes="0;0.1;0.9;1"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="4" cy="0" r="3" fill="#8b5cf6">
                  <animate
                    attributeName="cy"
                    values="0;100%"
                    dur="2s"
                    begin="1.3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="2s"
                    begin="1.3s"
                    keyTimes="0;0.1;0.9;1"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </svg>
        </div>

        {/* Node 1: AI Agents */}
        <div className="order-1 z-10 flex w-full flex-col items-center sm:col-start-1 sm:row-start-1">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <Bot className="h-6 w-6 text-blue-500" />
              <Fingerprint className="h-6 w-6 text-purple-500" />
              <Globe className="h-6 w-6 text-green-500" />
              <Bot className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">AI Agents</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            ChatGPT, Claude, & Web Scrapers
          </p>
        </div>

        {/* Down Arrow for Mobile */}
        <div className="order-2 text-gray-300 sm:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>

        {/* Node 2: Lens Middleware */}
        <div className="order-3 z-10 flex w-full flex-col items-center sm:col-start-2 sm:row-start-1">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-white shadow-lg ring-4 ring-gray-50/50">
            <ShieldCheck className="h-10 w-10" />
            {/* Pulsing ring around the lens */}
            <div className="absolute -inset-2 rounded-2xl border border-black/10 animate-ping"></div>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">Traffic Lens</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Intercepts & identifies bots
          </p>
        </div>

        {/* Down Arrow for Mobile */}
        <div className="order-4 text-gray-300 sm:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>

        {/* Node 3: Your Site */}
        <div className="order-5 z-10 flex w-full flex-col items-center sm:col-start-3 sm:row-start-1">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <LayoutTemplate className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">Your Site</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Receives clean traffic safely
          </p>
        </div>

        {/* Down Arrow for Mobile (Dashboard) */}
        <div className="order-6 text-gray-300 sm:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>

        {/* Node 4: Dashboard */}
        <div className="order-7 z-10 mt-0 flex w-full flex-col items-center sm:col-start-2 sm:row-start-2 sm:mt-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <BarChart3 className="h-10 w-10 text-black" />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">Dashboard</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Get insights & manage access
          </p>
        </div>
      </div>
    </div>
  );
}
