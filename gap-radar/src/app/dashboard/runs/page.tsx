"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { mockRuns } from "@/lib/mock-data";
import { Play, MoreVertical, Eye, Download, Trash2, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

function getStatusIcon(status: string) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "running":
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Complete</Badge>;
    case "running":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0">Running</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Queued</Badge>;
  }
}

function formatDuration(start?: Date, end?: Date) {
  if (!start) return "—";
  const endTime = end || new Date();
  const diff = endTime.getTime() - start.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

const ITEMS_PER_PAGE = 10;

export default function RunsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(mockRuns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRuns = mockRuns.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analysis Runs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage your market analysis runs
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/new-run">
            <Play className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Runs</CardTitle>
          <CardDescription>
            {mockRuns.length} total runs • {mockRuns.filter(r => r.status === 'complete').length} completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Niche Query</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <div>
                          <p className="font-medium">{run.nicheQuery}</p>
                          <p className="text-xs text-muted-foreground">
                            {run.seedTerms.slice(0, 3).join(", ")}
                            {run.seedTerms.length > 3 && ` +${run.seedTerms.length - 3} more`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </TableCell>
                    <TableCell>
                      {run.status === "complete" && run.scores ? (
                        <div className="flex items-center gap-2">
                          <Progress value={run.scores.opportunity} className="w-16 h-2" />
                          <span className="text-sm font-medium">{run.scores.opportunity}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {run.status === "complete" && run.scores ? (
                        <span className="font-medium">{Math.round(run.scores.confidence * 100)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.startedAt?.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/runs/${run.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedRuns.map((run) => (
              <Card key={run.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(run.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{run.nicheQuery}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {run.seedTerms.slice(0, 2).join(", ")}
                          {run.seedTerms.length > 2 && ` +${run.seedTerms.length - 2}`}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/runs/${run.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Report
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(run.status)}
                    </div>
                    {run.status === "complete" && run.scores && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Opportunity</span>
                          <div className="flex items-center gap-2">
                            <Progress value={run.scores.opportunity} className="w-16 h-2" />
                            <span className="font-medium">{run.scores.opportunity}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-medium">{Math.round(run.scores.confidence * 100)}%</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{formatDuration(run.startedAt, run.finishedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Started</span>
                      <span>{run.startedAt?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis between gaps
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          size="default"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
