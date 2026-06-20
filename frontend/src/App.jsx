import React from 'react'
import { motion } from 'framer-motion'
import { Video, Activity, Box, Settings, Play } from 'lucide-react'
import { VideoFeed } from './components/VideoFeed'
import { Scene3D } from './components/Scene3D'

function App() {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      {/* Sidebar / Controls */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 shadow-2xl z-10"
      >
        <div className="flex items-center gap-3 text-2xl font-bold tracking-wider text-blue-400">
          <Activity className="w-8 h-8 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          MoCap Engine
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50 backdrop-blur-sm"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              <Settings className="w-4 h-4" /> System Control
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Tracking</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Auto-Rigging Server</span>
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md border border-green-500/30">Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col relative bg-gray-950">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between z-10"
        >
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Box className="w-4 h-4" /> Workspace / Default Scene
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              <Play className="w-4 h-4" /> Start Capture
            </button>
          </div>
        </motion.header>

        {/* Viewports */}
        <div className="flex-1 p-6 flex gap-6">
          {/* Video / Webcam Feed Component */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] group"
          >
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest z-10 bg-gray-900/60 px-2 py-1 rounded backdrop-blur-sm">
              <Video className="w-4 h-4" /> Input Feed
            </div>

            <VideoFeed />
          </motion.div>

          {/* 3D Canvas Component */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex-[1.5] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] group"
          >
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest z-10 bg-gray-900/60 px-2 py-1 rounded backdrop-blur-sm">
              <Box className="w-4 h-4" /> 3D Viewport
            </div>

            <Scene3D />
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default App