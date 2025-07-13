import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Play, Square, Trash2, Eye, Circle, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TestCodeBatch {
  id: string;
  batchName: string;
  term: string;
  class: string;
  section: string;
  subject: string;
  session: string;
  testType: string;
  numQuestions: number;
  timeLimit: number;
  totalCodes: number;
  isActive: boolean;
  createdAt: string;
}

interface TestCode {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

const ManageTestCodeBatches = () => {
  const { profile } = useAuth();
  const [batches, setBatches] = useState<TestCodeBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TestCodeBatch | null>(null);
  const [batchCodes, setBatchCodes] = useState<TestCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodesDialog, setShowCodesDialog] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/test-code-batches', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load test code batches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchCodes = async (batchId: string) => {
    try {
      const response = await fetch(`/api/test-code-batches/${batchId}/codes`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBatchCodes(data);
      }
    } catch (error) {
      console.error('Error fetching batch codes:', error);
      toast({
        title: "Error",
        description: "Failed to load batch codes",
        variant: "destructive"
      });
    }
  };

  const handleActivateBatch = async (batchId: string) => {
    try {
      const response = await fetch(`/api/test-code-batches/${batchId}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch activated successfully"
        });
        fetchBatches();
      }
    } catch (error) {
      console.error('Error activating batch:', error);
      toast({
        title: "Error",
        description: "Failed to activate batch",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateBatch = async (batchId: string) => {
    try {
      const response = await fetch(`/api/test-code-batches/${batchId}/deactivate`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch deactivated successfully"
        });
        fetchBatches();
      }
    } catch (error) {
      console.error('Error deactivating batch:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate batch",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      const response = await fetch(`/api/test-code-batches/${batchId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch deleted successfully"
        });
        fetchBatches();
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive"
      });
    }
  };

  const handleActivateSingleCode = async (codeId: string) => {
    try {
      const response = await fetch(`/api/test-codes/${codeId}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test code activated successfully"
        });
        if (selectedBatch) {
          fetchBatchCodes(selectedBatch.id);
        }
      }
    } catch (error) {
      console.error('Error activating code:', error);
      toast({
        title: "Error",
        description: "Failed to activate test code",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Test code copied to clipboard",
    });
  };

  const copyAllCodes = () => {
    const allCodes = batchCodes.map(code => code.code).join('\n');
    navigator.clipboard.writeText(allCodes);
    toast({
      title: "Copied",
      description: `All ${batchCodes.length} test codes copied to clipboard`,
    });
  };

  const viewBatchCodes = async (batch: TestCodeBatch) => {
    setSelectedBatch(batch);
    await fetchBatchCodes(batch.id);
    setShowCodesDialog(true);
  };

    const handleViewCodes = async (batchId: string) => {
    try {
      const response = await fetch(`/api/test-code-batches/${batchId}/codes`);
      if (response.ok) {
        const codes = await response.json();
        setSelectedBatchCodes(codes);
        setShowCodesDialog(true);
      }
    } catch (error) {
      console.error('Error fetching batch codes:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Test Code Batches</h1>
            <p className="text-gray-600 mt-1">Manage and control test code batches</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Code Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No test code batches found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] sm:w-[80px]">Status</TableHead>
                      <TableHead className="w-[120px] sm:w-[150px]">Batch Name</TableHead>
                      <TableHead className="w-[80px] sm:w-[100px]">Subject</TableHead>
                      <TableHead className="w-[50px] sm:w-[60px]">Class</TableHead>
                      <TableHead className="w-[70px] sm:w-[80px] hidden sm:table-cell">Term</TableHead>
                      <TableHead className="w-[80px] sm:w-[100px] hidden md:table-cell">Session</TableHead>
                      <TableHead className="w-[60px] sm:w-[80px]">Codes</TableHead>
                      <TableHead className="w-[70px] sm:w-[80px] hidden lg:table-cell">Type</TableHead>
                      <TableHead className="w-[70px] sm:w-[80px] hidden xl:table-cell">Created</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Circle 
                              className={`h-3 w-3 ${batch.isActive ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`}
                            />
                            <span className="ml-2 text-sm hidden sm:inline">
                              {batch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{batch.batchName}</TableCell>
                        <TableCell className="capitalize text-sm">{batch.subject}</TableCell>
                        <TableCell className="uppercase text-sm">{batch.class}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{batch.term}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{batch.session}</TableCell>
                        <TableCell className="text-sm">{batch.totalCodes}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={`px-2 py-1 rounded text-xs ${
                            batch.testType === 'EXAM' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {batch.testType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm hidden xl:table-cell">{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewBatchCodes(batch)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            {!batch.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivateBatch(batch.id)}
                                className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeactivateBatch(batch.id)}
                                className="text-orange-600 hover:text-orange-700 h-8 w-8 p-0"
                              >
                                <Square className="h-3 w-3" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this batch? This will permanently delete all test codes in this batch. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBatch(batch.id)}
                                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Codes Dialog */}
        <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-lg">
                  {selectedBatch ? `Codes in "${selectedBatch.batchName}"` : 'Batch Codes'}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllCodes}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Code</TableHead>
                    <TableHead className="min-w-[80px] hidden sm:table-cell">Created</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Circle 
                            className={`h-3 w-3 ${code.isActive ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`}
                          />
                          <span className="ml-2 text-sm hidden sm:inline">
                            {code.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-sm">{code.code}</TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {!code.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateSingleCode(code.id)}
                              className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageTestCodeBatches;