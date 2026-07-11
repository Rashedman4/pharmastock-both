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
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";

interface DailyUpdateItem {
  id: number;
  symbol: string;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  description_en: string;
  description_ar: string;
  published_date: string;
}

interface EditDailyUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editDailyUpdate: DailyUpdateItem | null;
  setEditDailyUpdate: React.Dispatch<React.SetStateAction<DailyUpdateItem | null>>;
  handleEditSubmit: () => void;
}

export function EditDailyUpdateModal({
  isOpen,
  onClose,
  editDailyUpdate,
  setEditDailyUpdate,
  handleEditSubmit,
}: EditDailyUpdateModalProps) {
  if (!editDailyUpdate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[white]">
        <DialogHeader>
          <DialogTitle>Edit Daily Update</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                value={editDailyUpdate.symbol}
                onChange={(e) =>
                  setEditDailyUpdate({
                    ...editDailyUpdate,
                    symbol: e.target.value.toUpperCase(),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subtitle_en" className="text-right">
                English Subtitle
              </Label>
              <Input
                id="subtitle_en"
                value={editDailyUpdate.subtitle_en || ""}
                onChange={(e) =>
                  setEditDailyUpdate({
                    ...editDailyUpdate,
                    subtitle_en: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subtitle_ar" className="text-right">
                Arabic Subtitle
              </Label>
              <Input
                id="subtitle_ar"
                value={editDailyUpdate.subtitle_ar || ""}
                onChange={(e) =>
                  setEditDailyUpdate({
                    ...editDailyUpdate,
                    subtitle_ar: e.target.value,
                  })
                }
                className="col-span-3"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description_en" className="text-right">
                English Description
              </Label>
              <Textarea
                id="description_en"
                value={editDailyUpdate.description_en}
                onChange={(e) =>
                  setEditDailyUpdate({
                    ...editDailyUpdate,
                    description_en: e.target.value,
                  })
                }
                className="col-span-3"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description_ar" className="text-right">
                Arabic Description
              </Label>
              <Textarea
                id="description_ar"
                value={editDailyUpdate.description_ar}
                onChange={(e) =>
                  setEditDailyUpdate({
                    ...editDailyUpdate,
                    description_ar: e.target.value,
                  })
                }
                className="col-span-3"
                rows={5}
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
