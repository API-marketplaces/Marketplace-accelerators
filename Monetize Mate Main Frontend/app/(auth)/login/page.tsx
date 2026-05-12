'use client'

import { useState } from "react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, DollarSign, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
    const router = useRouter();
    const { login, loggingIn } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const onSignUp = () => {
        router.push('/signup');
    };

    const onBackToHome = () => {
        router.push('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
          await login({ email, password });
          // Go back to where user came from, or dashboard
          const params = new URLSearchParams(window.location.search);
          const redirectTo = params.get('redirectTo') || '/';
          router.push(redirectTo);
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
        }
      };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Button
                        variant="ghost"
                        onClick={onBackToHome}
                        className="absolute top-8 left-8 text-blue-700 hover:bg-blue-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>

                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl text-blue-900">MonetizeMate</span>
                    </div>

                    <h1 className="text-2xl text-blue-900 mb-2">Welcome Back</h1>
                    <p className="text-blue-600">Sign in to your MonetizeMate account</p>
                </div>

                <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-blue-900">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 border-blue-200 focus:border-blue-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-blue-900">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 border-blue-200 focus:border-blue-400"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input type="checkbox" className="rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-blue-700">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loggingIn}>
                            {loggingIn ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-blue-600">
                            Don't have an account?{" "}
                            <button
                                onClick={onSignUp}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    </div>
                </Card>

                <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm text-center">
                        💡 <strong>Demo Mode:</strong> Click "Sign In" with any email to explore the platform
                    </p>
                </div>
            </div>
        </div>
    );
}