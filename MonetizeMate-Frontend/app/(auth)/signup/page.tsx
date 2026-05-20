'use client'

import { useState } from "react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, DollarSign, Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function SignUpPage() {
  const router = useRouter();
  const { signup, signingUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);

  const onLogin = () => {
    router.push('/login');
  };

  const onBackToHome = () => {
    router.push('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    try {
      await signup(formData);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
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
          
          <h1 className="text-2xl text-blue-900 mb-2">Create Your Account</h1>
          <p className="text-blue-600">Start your monetization journey today</p>
        </div>

        {/* Signup Form */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-blue-900">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-blue-900">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="border-blue-200 focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-blue-900">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-start">
              <input type="checkbox" className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 mt-1" required />
              <span className="ml-2 text-sm text-blue-700">
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Privacy Policy
                </a>
              </span>
            </div>

            <Button type="button" onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700" disabled={signingUp}>
              {signingUp ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-600">
              Already have an account?{" "}
              <button
                onClick={!signingUp ? onLogin : undefined}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>

        {/* Demo Notice */}
        <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm text-center">
            <strong>Demo Mode:</strong> Click &quot;Create Account&quot; to explore the platform
          </p>
        </div>
      </div>
    </div>
  );
}
