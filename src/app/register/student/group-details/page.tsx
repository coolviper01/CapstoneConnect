'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject, CapstoneProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject.'),
  block: z.string().min(1, 'Please select your block/section.'),
  groupNumber: z.string().min(1, 'Group number is required.'),
});

export default function StudentGroupDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsAuthReady(true);
      } else {
        router.replace('/register/student');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);
  
  const subjectsQuery = useMemoFirebase(() => collection(firestore, 'subjects'), [firestore]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        subjectId: '',
        block: '',
        groupNumber: '',
    },
  });

  const selectedSubjectId = form.watch('subjectId');
  const selectedSubject = useMemo(() => {
    return subjects?.find(s => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
        setIsLoading(false);
        router.push('/login');
        return;
    }

    try {
        const studentRef = doc(firestore, 'students', user.uid);
        await updateDoc(studentRef, {
            subjectId: values.subjectId,
            block: values.block,
            groupNumber: values.groupNumber,
            status: "Pending Approval",
        });

        const capstoneQuery = query(
            collection(firestore, 'capstoneProjects'),
            where('subjectId', '==', values.subjectId),
            where('block', '==', values.block),
            where('groupNumber', '==', values.groupNumber)
        );
        
        const querySnapshot = await getDocs(capstoneQuery);
        if (!querySnapshot.empty) {
            const projectDoc = querySnapshot.docs[0];
            await updateDoc(projectDoc.ref, {
                studentIds: arrayUnion(user.uid)
            });
        }

        toast({
            title: 'Registration Submitted!',
            description: 'Your registration is now pending approval from your teacher.',
        });

        router.push('/student/pending');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Student Registration (Step 2 of 2)</CardTitle>
            <CardDescription>
              Please provide your subject and group information to submit for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Select Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    {isLoadingSubjects ? <Skeleton className="h-5 w-[250px]" /> : <SelectValue placeholder="Choose your subject..." />}
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingSubjects ? <SelectItem value="loading" disabled>Loading subjects...</SelectItem> : 
                                subjects?.map(subject => (
                                    <SelectItem key={subject.id} value={subject.id}>{subject.name} ({subject.academicYear})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedSubject && (
                    <FormField
                        control={form.control}
                        name="block"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Select Block / Section</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose your block..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedSubject.blocks.map(block => (
                                        <SelectItem key={block} value={block}>{block}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                <FormField
                  control={form.control}
                  name="groupNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading || !selectedSubject}>
                  {isLoading ? 'Saving...' : 'Complete Registration'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
