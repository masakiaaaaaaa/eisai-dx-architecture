"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Info } from "lucide-react";
import { useRef, useState } from "react";
import Papa from "papaparse";

// Mock Data for UI dev
const MOCK_STUDENTS = [
    { id: 1, name: "Taro Yamada", school: "Shibuya High", grade: "Grade 2" },
    { id: 2, name: "Hanako Suzuki", school: "Harajuku Middle", grade: "Grade 3" },
];

export default function MastersPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "Shift-JIS",
            complete: async (results) => {
                try {
                    const response = await fetch("/api/students/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ students: results.data }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert(`Import completed!\nSuccess: ${data.success}\nFailed: ${data.failed}`);
                    } else {
                        alert("Import failed: " + data.error);
                    }
                } catch (error) {
                    console.error("Import error:", error);
                    alert("An error occurred during import.");
                } finally {
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            },
            error: (error) => {
                console.error("CSV Parse Error:", error);
                alert("Failed to parse CSV file.");
                setUploading(false);
            },
        });
    };

    const openStudentDetails = (student: any) => {
        setSelectedStudent(student);
        setIsDialogOpen(true);
    };

    return (
        <Layout>
            <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Master Management</h2>
                </div>

                <Tabs defaultValue="schools" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="schools">Schools</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="schools" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Schools</CardTitle>
                                <div className="flex space-x-2">
                                    <Button variant="outline">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import CSV
                                    </Button>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add School
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Students</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Shibuya High School</TableCell>
                                            <TableCell>120</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students" className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Info className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Data Sync Guide:</strong>
                                        <br />
                                        Please upload the CSV file exported from <strong>Juku Mane (塾マネ)</strong>.
                                        <br />
                                        Whenever student information changes, please export the latest CSV and upload it here.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Students</CardTitle>
                                <div className="flex space-x-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                    <Button variant="outline" onClick={handleImportClick} disabled={uploading}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {uploading ? "Importing..." : "Import CSV"}
                                    </Button>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Student
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2 mb-4">
                                    <Input placeholder="Search students..." className="max-w-sm" />
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>School</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {MOCK_STUDENTS.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() => openStudentDetails(student)}
                                            >
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.school}</TableCell>
                                                <TableCell>{student.grade}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">Details</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <StudentDetailsDialog
                    student={selectedStudent}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            </div>
        </Layout>
    );
}

function StudentDetailsDialog({ student, open, onOpenChange }: { student: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{student.name}</DialogTitle>
                    <DialogDescription>
                        {student.school} / {student.grade}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="events" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList>
                        <TabsTrigger value="events">Events & Schedule</TabsTrigger>
                        <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="events" className="flex-1 overflow-auto p-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Add New Event</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Event Title</Label>
                                        <Input placeholder="e.g. Eiken Grade 2" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notification Setting</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="When to start notifying?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 week before</SelectItem>
                                            <SelectItem value="2">2 weeks before</SelectItem>
                                            <SelectItem value="3">3 weeks before</SelectItem>
                                            <SelectItem value="4">4 weeks before</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        The student's name will appear in the weekly notification list starting from this period.
                                        <br />
                                        <span className="text-amber-600">Note: Only the student's name will be displayed in the LINE message, not the event title.</span>
                                    </p>
                                </div>
                                <Button className="w-full">Add Event</Button>
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Upcoming Events</h4>
                            <div className="border rounded-md p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-medium">Mid-term Exam</div>
                                    <div className="text-sm text-muted-foreground">2025-10-15</div>
                                </div>
                                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Notifying (2 weeks left)
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="announcements" className="flex-1 overflow-auto p-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Add Announcement</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input placeholder="e.g. Bring textbook" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Detail</Label>
                                    <Input placeholder="Details..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notification Duration</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="How many times?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Next 1 time only</SelectItem>
                                            <SelectItem value="2">Next 2 times</SelectItem>
                                            <SelectItem value="4">Next 4 times</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full">Add Announcement</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
