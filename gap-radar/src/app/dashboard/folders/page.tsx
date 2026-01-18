"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, Trash2, Edit2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FolderType {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDescription || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create folder');
      }

      const data = await response.json();
      setFolders(prev => [data.folder, ...prev]);
      setNewFolderName("");
      setNewFolderDescription("");
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating folder:', error);
      alert(error.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleEditFolder() {
    if (!editingFolder || !newFolderName.trim()) {
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await fetch(`/api/folders/${editingFolder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDescription || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update folder');
      }

      const data = await response.json();
      setFolders(prev =>
        prev.map(f => (f.id === data.folder.id ? { ...f, ...data.folder } : f))
      );
      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderDescription("");
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating folder:', error);
      alert(error.message || 'Failed to update folder');
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Are you sure you want to delete this folder? All items in it will be removed.')) {
      return;
    }

    setDeletingId(folderId);
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      setFolders(prev => prev.filter(f => f.id !== folderId));
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    } finally {
      setDeletingId(null);
    }
  }

  function openEditDialog(folder: FolderType) {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDescription(folder.description || "");
    setIsEditDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Folders</h1>
          <p className="text-muted-foreground">
            Organize your saved gaps and reports into collections
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-folder-button">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Organize your gaps and reports into custom collections
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Folder Name</Label>
                <Input
                  id="name"
                  placeholder="My Collection"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      handleCreateFolder();
                    }
                  }}
                  data-testid="folder-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this folder for?"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  data-testid="folder-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                data-testid="confirm-create-folder"
              >
                {creatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder name or description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Folder Name</Label>
              <Input
                id="edit-name"
                placeholder="My Collection"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                data-testid="edit-folder-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                placeholder="What's this folder for?"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                data-testid="edit-folder-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleEditFolder}
              disabled={!newFolderName.trim() || creatingFolder}
              data-testid="confirm-edit-folder"
            >
              {creatingFolder ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {folders.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Folder className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No folders yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first folder to start organizing your saved gaps and reports.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="folders-grid">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-testid="folder-card"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg" data-testid="folder-name">
                        {folder.name}
                      </CardTitle>
                    </div>
                    {folder.description && (
                      <CardDescription data-testid="folder-description">
                        {folder.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="folder-menu">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openEditDialog(folder)}
                        data-testid="edit-folder"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        disabled={deletingId === folder.id}
                        className="text-destructive"
                        data-testid="delete-folder"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" data-testid="folder-count">
                    {folder.item_count} {folder.item_count === 1 ? 'item' : 'items'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(folder.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
