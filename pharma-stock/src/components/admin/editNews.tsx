import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";

interface NewsItem {
  id: number;
  title_en: string;
  title_ar: string;
  symbol: string;
  price: number;
  published_date: string;
}

interface EditNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editNews: NewsItem | null;
  setEditNews: React.Dispatch<React.SetStateAction<NewsItem | null>>;
  handleEditSubmit: () => void;
}

export function EditNewsModal({
  isOpen,
  onClose,
  editNews,
  setEditNews,
  handleEditSubmit,
}: EditNewsModalProps) {
  if (!editNews) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[white]">
        <DialogHeader>
          <DialogTitle>Edit News</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title_en" className="text-right">
                English Title
              </Label>
              <Textarea
                id="title_en"
                value={editNews.title_en}
                onChange={(e) =>
                  setEditNews({ ...editNews, title_en: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title_ar" className="text-right">
                Arabic Title
              </Label>
              <Textarea
                id="title_ar"
                value={editNews.title_ar}
                onChange={(e) =>
                  setEditNews({ ...editNews, title_ar: e.target.value })
                }
                className="col-span-3"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="default">
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
