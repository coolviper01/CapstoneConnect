'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { User, Briefcase, GraduationCap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type Role = 'Adviser' | 'Student' | 'Teacher';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function RegisterPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleRoleSelect = (selectedRole: Role) => {
    if (selectedRole === 'Student') {
      router.push('/register/student');
      return;
    }
    setRole(selectedRole);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!role || !firestore || !auth) return;
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.name });

      let collectionName: 'advisors' | 'teachers' | '' = '';
      let redirectPath = '/';

      if (role === 'Adviser') {
        collectionName = 'advisors';
        redirectPath = '/dashboard';
      } else if (role === 'Teacher') {
        collectionName = 'teachers';
        redirectPath = '/dashboard';
      }
      
      if (collectionName) {
         const userDocRef = doc(firestore, collectionName, user.uid);
         const userData = {
            id: user.uid,
            name: values.name,
            email: values.email,
         };
         
         // Use setDoc which returns a promise we can catch.
         await setDoc(userDocRef, userData)
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'create',
                    requestResourceData: userData
                }));
                // Re-throw the error to be caught by the outer try-catch block
                throw error;
            });
      }

      toast({
        title: 'Registration Successful!',
        description: `Your ${role} account has been created.`,
      });

      router.push(redirectPath);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              {role
                ? `Enter your details to register as a ${role}.`
                : 'First, select your role.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!role ? (
              <RadioGroup
                onValueChange={(value: Role) => handleRoleSelect(value)}
                className="grid grid-cols-1 gap-4"
              >
                <Label
                  htmlFor="teacher"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="Teacher" id="teacher" className="sr-only" />
                  <User className="mb-3 h-6 w-6" />
                  Teacher
                </Label>
                <Label
                  htmlFor="adviser"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="Adviser" id="adviser" className="sr-only" />
                  <Briefcase className="mb-3 h-6 w-6" />
                  Adviser
                </Label>
                <Label
                  htmlFor="student"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="Student" id="student" className="sr-only" />
                  <GraduationCap className="mb-3 h-6 w-6" />
                  Student
                </Label>
              </RadioGroup>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRole(null)}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Registering...' : `Register as ${role}`}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
