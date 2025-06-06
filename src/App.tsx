import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { SolanaWalletProvider } from './providers/WalletProvider';
import Navbar from './components/Navbar';
import QuickChat from './components/QuickChat';
import TokenPrice from './components/TokenPrice';
import Footer from './components/Footer';

import Home from './pages/Home';
import Explore from './pages/Explore';
import Categories from './pages/Categories';
import Rankings from './pages/Rankings';
import Create from './pages/Create';
import AgentDetails from './pages/AgentDetails';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Discussions from './pages/Discussions';
import Chat from './pages/Chat';

import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Bots from './pages/admin/Bots';
import Moderation from './pages/admin/Moderation';
import Analytics from './pages/admin/Analytics';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isChatWindow = window.location.pathname === '/chat';

  if (isChatWindow) {
    return <Chat />;
  }

  return (
    <SolanaWalletProvider>
      <div className="flex flex-col min-h-screen bg-black">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/create" element={<Create />} />
            <Route path="/agent/:slug" element={<AgentDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/chat" element={<Chat />} />

            <Route path="/admin" element={<AdminDashboard />}>
              <Route path="users" element={<Users />} />
              <Route path="bots" element={<Bots />} />
              <Route path="moderation" element={<Moderation />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
        </main>

        <QuickChat />
        <TokenPrice />

        <Footer />
      </div>
    </SolanaWalletProvider>
  );
}

export default App;
