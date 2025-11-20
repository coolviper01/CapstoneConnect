
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Hourglass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PendingApprovalPage() {
    const { handleSignOut } = useFirebase();
    const router = useRouter();

    const performSignOut = () => {
        handleSignOut().then(() => {
          router.push('/login');
        });
    };
    
    return (
        <div className="flex flex-col gap-6 items-center justify-center pt-16">
            <Card className="max-w-lg w-full">
                <CardHeader className="items-center text-center">
                    <Hourglass className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl">Registration Pending Approval</CardTitle>
                    <CardDescription>Your account registration has been submitted and is currently waiting for approval from your subject teacher.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Alert>
                        <AlertTitle>What Happens Next?</AlertTitle>
                        <AlertDescription>
                            You will be able to log in and access the student dashboard once your teacher has verified and approved your registration. Please check back later.
                        </AlertDescription>
                    </Alert>
                    <Button variant="outline" className="mt-8" onClick={performSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

    