import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NovaLogoSvg } from "@/components/NovaLogoSvg";

const Subscription = () => {
  const navigate = useNavigate();
  const [price, setPrice] = useState("20.99");
  const [currency, setCurrency] = useState("$");

  useEffect(() => {
    const loadPrice = () => {
      const storedPrice = localStorage.getItem("subscriptionPrice");
      const storedCurrency = localStorage.getItem("subscriptionCurrency");

      if (storedPrice) setPrice(storedPrice);
      if (storedCurrency) setCurrency(storedCurrency);
    };

    loadPrice();
    window.addEventListener("storage", loadPrice);
    window.addEventListener("price-update", loadPrice);

    return () => {
      window.removeEventListener("storage", loadPrice);
      window.removeEventListener("price-update", loadPrice);
    };
  }, []);

  const handleSubscribe = () => {
    setTimeout(() => {
      navigate("/ai");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link to="/signup">
          <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-foreground transition-colors" />
        </Link>
        <div className="w-5" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 w-full">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-nova-pink/5 to-nova-coral/5 border-b border-gray-100 p-8 flex items-center justify-center">
            <NovaLogoSvg className="h-20 w-auto" />
          </div>

          <div className="border-b border-gray-100 p-8 text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-bold bg-gradient-to-r from-nova-pink to-nova-coral bg-clip-text text-transparent">
                {currency}
                {price}
              </span>
              <span className="text-gray-600 font-medium">/month</span>
            </div>
          </div>

          <div className="p-8 border-b border-gray-100">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nova-pink mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Seamless Workflow Automation
                  </p>
                  <p className="text-xs text-gray-600">
                    Stop managing manual tasks. NOVA integrates with your
                    existing tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nova-coral mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Scalable Business Optimization
                  </p>
                  <p className="text-xs text-gray-600">
                    Create self-improving workflows that grow with your company.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nova-pink mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Intelligent Chat & Lightning Fast
                  </p>
                  <p className="text-xs text-gray-600">
                    Real-time AI processing that keeps up with your thoughts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-nova-pink/5 to-nova-coral/5 p-8">
            <Button
              onClick={handleSubscribe}
              className="w-full h-12 bg-gradient-to-r from-nova-pink to-nova-coral hover:opacity-90 text-white font-semibold text-base rounded-lg transition-all duration-300"
            >
              Subscribe Now
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Cancel anytime. Secure payment powered by PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
