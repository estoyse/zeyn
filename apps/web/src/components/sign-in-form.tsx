import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Label } from "@shaxsiy-oyin/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { Mail, Lock, LogIn, ChevronRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate({ from: "/" });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">WELCOME BACK</h2>
        <p className="text-gray-500 font-medium text-sm">Enter your credentials to enter the arena</p>
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
                <div className="flex justify-between items-center ml-1">
                   <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</Label>
                   <button type="button" className="text-[10px] font-black uppercase text-blue-500 hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
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
              className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl font-black text-lg shadow-xl shadow-white/5 transition-all active:scale-98 flex items-center justify-center gap-2" 
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  ENTER ARENA <LogIn size={20} />
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
           <span className="bg-transparent px-2 text-gray-500 font-bold">New to the game?</span>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onSwitchToSignUp}
        className="w-full h-14 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 group"
      >
        CREATE AN ACCOUNT <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}
