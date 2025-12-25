import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import './App.css'

// Check if QueryClientProvider is defined to avoid ReferenceError
if (typeof QueryClientProvider === 'undefined') {
  console.error("QueryClientProvider is undefined! Check @tanstack/react-query installation.");
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HoverReceiver />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<div className="flex items-center justify-center min-h-screen">Welcome to Nova</div>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
