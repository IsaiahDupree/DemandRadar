"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockRuns } from "@/lib/mock-data";
import { FileText, Download, Eye, Share2, Calendar } from "lucide-react";

const mockReports = mockRuns
  .filter((r) => r.status === "complete")
  .map((run) => ({
    id: `report-${run.id}`,
    runId: run.id,
    nicheQuery: run.nicheQuery,
    createdAt: run.finishedAt || new Date(),
    type: "Full Dossier",
    pages: 9,
    exports: ["PDF", "JSON", "CSV"],
  }));

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View, download, and share your market analysis reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockReports.length}</div>
            <p className="text-xs text-muted-foreground">Generated reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Full Dossiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockReports.filter((r) => r.type === "Full Dossier").length}
            </div>
            <p className="text-xs text-muted-foreground">Complete analyses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockReports.length}</div>
            <p className="text-xs text-muted-foreground">Reports generated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            Download or share your completed market analysis reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Exports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{report.nicheQuery}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.pages} pages
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{report.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {report.createdAt.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {report.exports.map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {mockReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.nicheQuery}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.pages} pages
                    </p>
                    <Badge variant="secondary" className="mt-1">{report.type}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {report.createdAt.toLocaleDateString()}
                </div>

                <div className="flex flex-wrap gap-1">
                  {report.exports.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Structure</CardTitle>
          <CardDescription>
            What&apos;s included in a Full Dossier report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Executive Summary", desc: "Opportunity score, top gaps, platform recommendation" },
              { title: "Paid Market Snapshot", desc: "Top advertisers, angles, longest-running ads" },
              { title: "User Sentiment (Reddit)", desc: "Objections, feature requests, pricing friction" },
              { title: "Platform Analysis", desc: "iOS, Android, Web saturation and recommendations" },
              { title: "Gap Opportunities", desc: "Ranked gaps with evidence and recommendations" },
              { title: "Modeled Economics", desc: "CPC, CAC, TAM ranges with sensitivity controls" },
              { title: "Buildability Assessment", desc: "Difficulty, touch level, automation suitability" },
              { title: "UGC Winners Pack", desc: "Top creatives, hooks, scripts, shot lists" },
              { title: "Action Plan", desc: "Quick wins, roadmap, ad concepts, keywords" },
            ].map((section, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <h4 className="font-medium text-sm">{section.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{section.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
