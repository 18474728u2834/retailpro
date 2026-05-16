import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import discordIcon from "@/assets/discord-icon.svg";

const Login = () => {
  const { user, signInWithDiscord } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-accent flex items-center justify-center mb-3">
            <Bot className="h-6 w-6 text-accent-foreground" />
          </div>
          <CardTitle className="text-2xl">Modmail Dashboard</CardTitle>
          <CardDescription>Sign in with Discord to manage your bot</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={signInWithDiscord}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
            size="lg"
          >
            <img src={discordIcon} alt="" className="h-5 w-5 mr-2" />
            Continue with Discord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
