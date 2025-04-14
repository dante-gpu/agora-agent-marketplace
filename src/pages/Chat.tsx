import QuickChat from '../components/QuickChat';

const Chat = () => {
  const agentId = 'f7039c2c-a297-4514-8532-0b80d2a977f9';

  return (
    <div className="h-screen">
      <QuickChat agentId={agentId} />
    </div>
  );
};

export default Chat;