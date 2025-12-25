import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import './App.css'

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverReceiver />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          {/* ... existing routes ... */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App
