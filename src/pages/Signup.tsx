import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { NovaLogoSvg } from "@/components/NovaLogoSvg";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();

  const handleSignup = () => {
    if (password !== confirmPassword) {
      return;
    }
    if (!termsChecked) {
      return;
    }
    navigate("/subscription");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-[var(--shadow-card)]">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <NovaLogoSvg className="h-12 w-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Create your account
            </h2>
            <div className="text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-nova-pink hover:text-nova-coral transition-colors font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-border focus:border-nova-pink transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-border focus:border-nova-pink transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 border-border focus:border-nova-pink transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                className="mt-1"
                checked={termsChecked}
                onCheckedChange={(checked) =>
                  setTermsChecked(checked as boolean)
                }
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-nova-pink hover:text-nova-coral transition-colors underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-nova-pink hover:text-nova-coral transition-colors underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <Button
              onClick={handleSignup}
              variant="nova"
              size="lg"
              className="w-full h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all"
              data-testid="button-signup"
            >
              Create account
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Terms and Conditions for Nova</DialogTitle>
              <DialogDescription>
                Effective Date: August 27, 2025
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">1. Nature of Service: The "Human-in-the-Loop" Rule</h3>
                <p>Nova is an AI-powered automation tool. Because AI can make mistakes:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>User Supervision:</strong> You agree to supervise Nova while it is performing actions on your PC.</li>
                  <li><strong>The "Stop" Button:</strong> You are responsible for using the "Stop" button if you observe Nova performing an incorrect or harmful action.</li>
                  <li><strong>Assumption of Risk:</strong> You acknowledge that giving an AI control over your mouse and keyboard carries inherent risks to your local files and software.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Eligibility & Account</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You must be 18 years or older (or the age of majority in your jurisdiction) to use Nova for business purposes.</li>
                  <li>One license (Unique .exe) is for one user. Sharing your unique agent file is a breach of these terms.</li>
                </ul>
              </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Subscriptions & The "No-Refund" Policy</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>The Price:</strong> Nova is a premium service billed at $135 USD per month.</li>
                    <li><strong>Final Sale:</strong> Due to the high cost of AI processing power (API tokens) and the digital nature of the software, all payments are strictly non-refundable.</li>
                    <li><strong>Failed Payments:</strong> If your PayPal subscription fails, Nova’s "Silent Bridge" will immediately disconnect, and your local agent will be locked until payment is resolved.</li>
                  </ul>
                </div>

              <div>
                <h3 className="font-semibold mb-2">4. Prohibited Use</h3>
                <p>You may not use Nova to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Automate illegal activities (hacking, scraping private data, etc.).</li>
                  <li>Bypass security protocols on third-party websites.</li>
                  <li>Create a "bot farm" that violates the terms of service of other platforms (like social media or banking sites).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Intellectual Property</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Nova’s Code:</strong> You may not decompile or reverse-engineer the .exe agent.</li>
                  <li><strong>Your Data:</strong> You own all "Outputs" (the work Nova does for you). Nova does not claim ownership of your spreadsheets, emails, or files.</li>
                </ul>
              </div>

                <div>
                  <h3 className="font-semibold mb-2">6. Limitation of Liability (The "Shield" Clause)</h3>
                  <p className="font-medium uppercase">TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOVA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Loss of data or corrupted files.</li>
                    <li>Software crashes or OS instability.</li>
                    <li>Actions taken by the AI that violate third-party terms of service.</li>
                  </ul>
                  <p className="mt-2"><strong>Maximum Cap:</strong> In any event, Nova’s total liability to you shall not exceed the amount you paid for the current month’s subscription ($135).</p>
                </div>

              <div>
                <h3 className="font-semibold mb-2">7. Governing Law</h3>
                <p>These terms are governed by the laws of [Your Country/State]. Any disputes will be settled via [Arbitration/Local Court].</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Privacy Policy for Nova</DialogTitle>
              <DialogDescription>
                Effective Date: August 27, 2025
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">1. Privacy by Design</h3>
                <p>
                  Nova is built on the principle of Data Minimization. We believe
                  that your desktop is your private space. Our architecture
                  ensures that we only process the minimum information required
                  to execute your requested automations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  2. Confidential Processing (Not "E2EE")
                </h3>
                <p>
                  While data is being analyzed by the AI brain, it is protected
                  by Industry-Standard TLS Encryption in transit.
                </p>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Volatile Memory:</strong> Your screenshots are
                    processed in "volatile memory" (RAM) and are never written
                    to a permanent disk on our servers.
                  </p>
                  <p>
                    <strong>Instant Purge:</strong> Once a coordinate is
                    identified (e.g., "Click the Submit button"), the visual
                    data is instantly deleted from the processing stream.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Zero-Knowledge Intent</h3>
                <p>
                  Nova operates on a Zero-Knowledge Architecture regarding your
                  identity.
                </p>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Anonymized IDs:</strong> We do not link your PC
                    activities to your personal name or email. We use a
                    Randomized User ID to communicate with the AI brain.
                  </p>
                  <p>
                    <strong>No Training:</strong> We use professional-tier API
                    agreements that legally prohibit the AI models from using
                    your data to train future versions of the AI.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Local Sovereignty</h3>
                <p>
                  Because Nova is a Local Agent (.exe), you retain 100% control:
                </p>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Local Execution:</strong> The actual "clicking" and
                    "typing" happen on your machine, not in the cloud.
                  </p>
                  <p>
                    <strong>The Kill-Switch:</strong> You can stop any
                    automation instantly using the "Stop" button or by closing
                    the local application.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. No Data Monetization</h3>
                <p>
                  We are a subscription-based service ($135/mo). You are the
                  customer, not the product. We do not sell, rent, or share your
                  data with advertisers or third-party data brokers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy, please
                  contact us at <strong>nova.platforms.ai@gmail.com</strong>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Signup;
