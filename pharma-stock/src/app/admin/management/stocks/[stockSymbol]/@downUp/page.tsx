import React from "react";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { upgradeDownGradeSymbol } from "@/types/adminSchemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ParamsType = { stockSymbol: string };
export default async function UpgradeDownGrade({
  params,
}: {
  params: ParamsType | Promise<ParamsType>;
}) {
  const { stockSymbol } = await params;
  const value = stockSymbol.toUpperCase();
  const type = "symbol";

  let grades: upgradeDownGradeSymbol[] | null = null;
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/stock-management/downgradeUpgrade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_SECRET_KEY || "fallback-secret-key",
        },
        body: JSON.stringify({ value, type }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return (
          <CardContent>
            {" "}
            <h3 className="text-lg font-semibold text-royalBlue my-4 text-center ">
              No grades found for {value}
            </h3>
          </CardContent>
        );
      }

      throw new Error("Failed to fetch symbol grades");
    }

    const data = await response.json();
    // Check if data is an array, if not, try to extract articles from a nested property
    grades = Array.isArray(data) ? data : data.articles || [];

    if (!Array.isArray(grades)) {
      console.error("Unexpected data structure:", grades);
      grades = [];
    }
  } catch (error) {
    console.error("Error:", error);
    return <div>Error fetching price target data.</div>;
  }

  if (!grades || grades.length === 0) {
    return (
      <CardContent>
        {" "}
        <h3 className="text-lg font-semibold text-royalBlue my-4 text-center">
          No Grades found for {value}
        </h3>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>News Title</TableHead>
            <TableHead>New Grade</TableHead>
            <TableHead>Previous Grade</TableHead>
            <TableHead>Grading Company</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Published</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.map((grade, index) => (
            <TableRow
              key={index}
              className="hover:bg-gray-50 transition-colors duration-300"
            >
              <TableCell>
                {grade.action === "upgrade" ? (
                  <ArrowUpCircle
                    className="inline-block mr-1 text-green-500"
                    size={16}
                  />
                ) : grade.action === "downgrade" ? (
                  <ArrowDownCircle
                    className="inline-block mr-1 text-red-500"
                    size={16}
                  />
                ) : (
                  ""
                )}
                {grade.action.charAt(0).toUpperCase() + grade.action.slice(1)}
              </TableCell>
              <TableCell>{grade.newsTitle}</TableCell>

              <TableCell>{grade.newGrade}</TableCell>
              <TableCell>{grade.previousGrade}</TableCell>
              <TableCell>{grade.gradingCompany}</TableCell>
              <TableCell>${grade.priceWhenPosted.toFixed(2)}</TableCell>
              <TableCell>
                <span className="text-xs text-gray-500">
                  {new Date(grade.publishedDate).toLocaleDateString()}
                </span>
                <br />
                <span className="text-xs text-gray-500 italic">
                  {grade.newsPublisher}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  );
}
