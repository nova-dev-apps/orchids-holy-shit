import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverReceiver />
      <BrowserRouter>
        {/* ... existing routes ... */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App