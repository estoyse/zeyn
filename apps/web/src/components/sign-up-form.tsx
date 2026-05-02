import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Label } from "@shaxsiy-oyin/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { Mail, Lock, User, UserPlus, ChevronLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({ from: "/" });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">JOIN THE ELITE</h2>
        <p className="text-gray-500 font-medium text-sm">Create your profile to start competing</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <div className="space-y-5">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/5 rounded-2xl h-14 pl-12 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500 text-xs font-bold ml-1">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="name@example.com"
                    className="bg-white/5 border-white/5 rounded-2xl h-14 pl-12 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500 text-xs font-bold ml-1">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="bg-white/5 border-white/5 rounded-2xl h-14 pl-12 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500 text-xs font-bold ml-1">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button 
              type="submit" 
              className="w-full h-14 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/10 transition-all active:scale-98 flex items-center justify-center gap-2" 
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  CREATE ACCOUNT <UserPlus size={20} />
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
           <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
           <span className="bg-transparent px-2 text-gray-500 font-bold">Already a member?</span>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onSwitchToSignIn}
        className="w-full h-14 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> BACK TO LOGIN
      </Button>
    </div>
  );
}
